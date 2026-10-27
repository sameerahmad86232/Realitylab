/*! @license
MIT License

Copyright (c) 2026 Quanfei Zhang

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

MIT License

Copyright (c) 2026 Aihua96

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
// Viewer loading/framing/disposal adapted from Text23D (MIT, Quanfei Zhang).
// Assembly/clipping approach informed by CAD Showcase Studio (MIT, Aihua96).
// Full notices: docs/licenses/Text23D-MIT.txt and CAD-Showcase-Studio-MIT.txt.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import { buildScanConcept } from "./scanConcept";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { validateCadBytes, CAD_TRIANGLE_LIMIT } from "./cadFiles";

function disposeObject(object) {
  const geometries = new Set(),
    materials = new Set(),
    textures = new Set();
  object?.traverse((child) => {
    if (child.geometry) geometries.add(child.geometry);
    for (const mat of child.material
      ? Array.isArray(child.material)
        ? child.material
        : [child.material]
      : []) {
      materials.add(mat);
      for (const value of Object.values(mat))
        if (value?.isTexture) textures.add(value);
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
  textures.forEach((t) => t.dispose());
}
const corners = (box) =>
  [...Array(8)].map(
    (_, i) =>
      new THREE.Vector3(
        i & 1 ? box.max.x : box.min.x,
        i & 2 ? box.max.y : box.min.y,
        i & 4 ? box.max.z : box.min.z,
      ),
  );
export function createCadViewer(host, { onSelect, onFailure }) {
  let dead = false,
    lost = false,
    parts = [],
    extent = 1,
    selection = null,
    explode = 0,
    section = { axis: "off", amount: 0.5 },
    sourceName = "";
  const canvas = document.createElement("canvas");
  canvas.setAttribute(
    "aria-label",
    "Interactive 3D model viewport. Drag to orbit; camera buttons also work with a keyboard.",
  );
  canvas.setAttribute("role", "img");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: "low-power",
    });
  } catch {
    onFailure();
    return {
      dispose() {},
      async load() {
        throw Error("3D rendering is unavailable in this browser.");
      },
    };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.localClippingEnabled = true;
  host.appendChild(canvas);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f2f6ef");
  const camera = new THREE.PerspectiveCamera(38, 1, 0.01, 10000);
  camera.position.set(7, 5, 8);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = false;
  scene.add(new THREE.HemisphereLight("#ffffff", "#9caa90", 2.6));
  const key = new THREE.DirectionalLight("#fff9e9", 3);
  key.position.set(3, 7, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight("#dce9ff", 1.8);
  fill.position.set(-5, 3, -2);
  scene.add(fill);
  const root = new THREE.Group();
  scene.add(root);
  const grid = new THREE.GridHelper(12, 24, "#b2bea6", "#d7dfcf");
  grid.material.transparent = true;
  grid.material.opacity = 0.45;
  scene.add(grid);
  // Keep the same planes on every material. Only constants change.
  const planes = [
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e15),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 1e15),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e15),
  ];
  function render() {
    if (!dead && !lost) {
      renderer.render(scene, camera);
      canvas.dataset.engine = "webgl";
    }
  }
  function bounds() {
    const box = new THREE.Box3();
    for (const p of parts) box.union(p.box.clone().translate(p.mesh.position));
    return box;
  }
  function currentCorners(filterClip = true) {
    const points = [];
    for (const p of parts) {
      const box = p.box.clone().translate(p.mesh.position);
      if (filterClip && section.axis !== "off") {
        const axis = section.axis,
          index = ["x", "y", "z"].indexOf(axis),
          cut = planes[index].constant;
        if (box.min[axis] > cut) continue;
        box.max[axis] = Math.min(box.max[axis], cut);
      }
      points.push(...corners(box));
    }
    return points;
  }
  function frame() {
    let points = currentCorners();
    if (!points.length) points = currentCorners(false);
    if (!points.length) return;
    const box = new THREE.Box3().setFromPoints(points),
      center = box.getCenter(new THREE.Vector3());
    const direction = camera.position.clone().sub(controls.target).normalize();
    if (direction.lengthSq() < 0.1) direction.set(1, 0.75, 1).normalize();
    const right = new THREE.Vector3()
        .crossVectors(camera.up, direction)
        .normalize(),
      up = new THREE.Vector3().crossVectors(direction, right).normalize();
    const tanY = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)),
      tanX = tanY * camera.aspect;
    let distance = extent * 0.05;
    for (const point of points) {
      const relative = point.clone().sub(center),
        depth = relative.dot(direction);
      distance = Math.max(
        distance,
        depth + Math.abs(relative.dot(right)) / tanX,
        depth + Math.abs(relative.dot(up)) / tanY,
      );
    }
    distance *= 1.18;
    camera.position.copy(center).addScaledVector(direction, distance);
    camera.near = Math.max(extent / 10000, 1e-7);
    camera.far = Math.max(distance * 20, extent * 100);
    camera.updateProjectionMatrix();
    controls.target.copy(center);
    controls.minDistance = extent * 0.1;
    controls.maxDistance = extent * 30;
    controls.update();
    render();
  }
  function updateClip() {
    for (const plane of planes) plane.constant = 1e15;
    if (section.axis !== "off" && parts.length) {
      const box = bounds(),
        axis = section.axis,
        index = ["x", "y", "z"].indexOf(axis);
      planes[index].constant = THREE.MathUtils.lerp(
        box.min[axis],
        box.max[axis],
        section.amount,
      );
    }
    render();
  }
  function clear() {
    for (const p of parts) {
      root.remove(p.mesh);
      disposeObject(p.mesh);
    }
    parts = [];
  }
  function accept(object, name) {
    if (dead) {
      disposeObject(object);
      return null;
    }
    const next = [];
    object.updateMatrixWorld(true);
    let total = 0;
    try {
      object.traverse((child) => {
        if (!child.isMesh) return;
        if (next.length >= 128)
          throw Error("Use a model with at most 128 mesh parts.");
        const geometry = child.geometry.clone();
        geometry.applyMatrix4(child.matrixWorld);
        const positions = geometry.getAttribute("position");
        if (!positions?.count) {
          geometry.dispose();
          return;
        }
        total += (geometry.index?.count || positions.count) / 3;
        if (total > CAD_TRIANGLE_LIMIT) {
          geometry.dispose();
          throw Error(
            "Simplify to at most 500,000 triangles, including repeated instances.",
          );
        }
        for (let i = 0; i < positions.count; i++)
          for (const axis of ["X", "Y", "Z"]) {
            const value = positions["get" + axis](i);
            if (!Number.isFinite(value) || Math.abs(value) > 1e12) {
              geometry.dispose();
              throw Error("The mesh contains invalid coordinates.");
            }
          }
        if (geometry.index) {
          for (const index of geometry.index.array)
            if (index < 0 || index >= positions.count) {
              geometry.dispose();
              throw Error("The mesh contains an invalid triangle index.");
            }
        }
        geometry.computeVertexNormals();
        geometry.computeBoundingBox();
        const material = new THREE.MeshStandardMaterial({
          color:
            object.userData.scanConcept && child.material?.color
              ? child.material.color.clone()
              : next.length % 2
                ? "#c0c8b5"
                : "#879b85",
          metalness: 0.38,
          roughness: 0.47,
          side: THREE.DoubleSide,
          clippingPlanes: planes,
        });
        const mesh = new THREE.Mesh(geometry, material);
        next.push({
          id: `mesh-${next.length + 1}`,
          name: (child.name || `Part ${next.length + 1}`).slice(0, 120),
          mesh,
          triangles: Math.floor((geometry.index?.count || positions.count) / 3),
        });
      });
      if (!next.length) throw Error("No triangle meshes were found.");
      const full = new THREE.Box3();
      for (const p of next) full.union(p.mesh.geometry.boundingBox);
      const size = full.getSize(new THREE.Vector3());
      if (
        ![size.x, size.y, size.z].every(Number.isFinite) ||
        Math.max(size.x, size.y, size.z) <= 0
      )
        throw Error("The mesh has no usable bounds.");
      clear();
      const center = full.getCenter(new THREE.Vector3());
      extent = Math.max(size.x, size.y, size.z);
      parts = next;
      sourceName = name;
      selection = null;
      explode = 0;
      section = { axis: "off", amount: 0.5 };
      for (const [index, p] of parts.entries()) {
        p.mesh.geometry.translate(-center.x, -center.y, -center.z);
        p.mesh.geometry.computeBoundingBox();
        p.box = p.mesh.geometry.boundingBox.clone();
        p.direction = p.box.getCenter(new THREE.Vector3()).normalize();
        if (p.direction.lengthSq() < 0.01)
          p.direction.set(index % 2 ? 1 : -1, 1, 0).normalize();
        root.add(p.mesh);
      }
      grid.scale.setScalar(extent / 4);
      grid.position.y = -size.y / 2 - extent * 0.025;
      updateClip();
      camera.position.set(extent, extent * 0.75, extent);
      controls.target.set(0, 0, 0);
      frame();
      return inspection();
    } catch (e) {
      for (const p of next) if (!parts.includes(p)) disposeObject(p.mesh);
      throw e;
    } finally {
      disposeObject(object);
    }
  }
  function inspection() {
    const size = parts.length
      ? new THREE.Box3()
          .union(parts.reduce((b, p) => b.union(p.box), new THREE.Box3()))
          .getSize(new THREE.Vector3())
      : new THREE.Vector3();
    return {
      name: sourceName,
      partCount: parts.length,
      triangles: parts.reduce((n, p) => n + p.triangles, 0),
      bounds: [size.x, size.y, size.z],
      units:
        "File coordinates; physical units must be verified with the model author.",
      parts: parts.map((p) => ({
        id: p.id,
        name: p.name,
        triangles: p.triangles,
        bounds: p.box.getSize(new THREE.Vector3()).toArray(),
        position: p.mesh.position.toArray(),
        wireframe: p.mesh.material.wireframe,
        opacity: p.mesh.material.opacity,
      })),
      view: {
        explode,
        section: { ...section },
        gpuClipPlanes: planes.map((p) => ({
          normal: p.normal.toArray(),
          constant: p.constant,
        })),
      },
      notice:
        "Neutral mesh preview. Visual separation and open sections are not assembly instructions or validated CAD. No photo-to-3D reconstruction has occurred.",
    };
  }
  function resize() {
    if (dead || lost) return;
    const rect = host.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    camera.aspect = rect.width / rect.height;
    camera.updateProjectionMatrix();
    renderer.setSize(rect.width, rect.height, false);
    frame();
    render();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  controls.addEventListener("change", render);
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let down = null;
  function pointerDown(e) {
    down = { x: e.clientX, y: e.clientY };
  }
  function pick(e) {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster
      .intersectObjects(parts.map((p) => p.mesh))
      .find((h) =>
        planes.every((plane) => plane.distanceToPoint(h.point) >= 0),
      );
    if (hit) onSelect(parts.find((p) => p.mesh === hit.object)?.id);
  }
  function contextLost(e) {
    e.preventDefault();
    lost = true;
    canvas.dataset.engine = "fallback";
    onFailure();
  }
  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointerup", pick);
  resize();
  return {
    async load(buffer, name) {
      const { format } = validateCadBytes(buffer, name);
      let object;
      if (format === "glb")
        object = (await new GLTFLoader().parseAsync(buffer, "")).scene;
      else {
        const geometry = new STLLoader().parse(buffer);
        geometry.rotateX(-Math.PI / 2);
        object = new THREE.Mesh(geometry);
        object.name = name.replace(/\.stl$/i, "");
      }
      return accept(object, name);
    },
    concept(model) {
      return accept(
        buildScanConcept(model),
        model.objectName || "Approximate scanned object",
      );
    },
    async exportMesh(format = "glb") {
      const copy = new THREE.Group();
      copy.name = sourceName;
      copy.userData.notice =
        "Approximate or imported geometry; verify units and dimensions independently.";
      for (const p of parts) {
        const mat = p.mesh.material.clone();
        mat.transparent = false;
        mat.opacity = 1;
        mat.depthWrite = true;
        mat.emissive.set("#000000");
        mat.wireframe = false;
        const mesh = new THREE.Mesh(p.mesh.geometry.clone(), mat);
        mesh.name = p.name;
        mesh.position.copy(p.mesh.position);
        copy.add(mesh);
      }
      copy.updateMatrixWorld(true);
      try {
        if (format === "stl")
          return new STLExporter().parse(copy, { binary: true });
        return await new GLTFExporter().parseAsync(copy, { binary: true });
      } finally {
        disposeObject(copy);
      }
    },
    example() {
      const shape = new THREE.Shape();
      shape.moveTo(-20, -20);
      shape.lineTo(20, -20);
      shape.lineTo(20, 20);
      shape.lineTo(-20, 20);
      shape.closePath();
      const hole = new THREE.Path();
      hole.absarc(0, 0, 5, 0, Math.PI * 2, true);
      shape.holes.push(hole);
      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 40,
        bevelEnabled: false,
        curveSegments: 48,
      });
      geometry.translate(0, 0, -20);
      geometry.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geometry);
      mesh.name = "Cube with through-hole";
      return accept(mesh, "Text23D cube study (browser mesh adaptation)");
    },
    setWireframe(value) {
      parts.forEach((p) => {
        p.mesh.material.wireframe = value;
      });
      render();
    },
    setExplode(value) {
      explode = value;
      parts.forEach((p) =>
        p.mesh.position.copy(p.direction).multiplyScalar(extent * 0.75 * value),
      );
      updateClip();
      frame();
    },
    setSection(axis, amount) {
      section = { axis, amount };
      updateClip();
      frame();
    },
    select(id) {
      selection = id;
      parts.forEach((p) => {
        const mat = p.mesh.material;
        mat.transparent = Boolean(selection && selection !== p.id);
        mat.opacity = selection && selection !== p.id ? 0.22 : 1;
        mat.depthWrite = !mat.transparent;
        mat.emissive.set(selection === p.id ? "#263a23" : "#000000");
        mat.emissiveIntensity = 0.3;
      });
      render();
    },
    setView(view) {
      camera.up.set(0, 1, 0);
      const target = controls.target.clone();
      camera.position
        .copy(target)
        .add(
          view === "top"
            ? new THREE.Vector3(0.001, extent, 0)
            : view === "front"
              ? new THREE.Vector3(0, 0, extent)
              : new THREE.Vector3(extent, extent * 0.75, extent),
        );
      controls.update();
      frame();
    },
    fit: frame,
    zoom(direction) {
      camera.position
        .sub(controls.target)
        .multiplyScalar(direction === "in" ? 0.85 : 1.18)
        .clampLength(extent * 0.1, extent * 30)
        .add(controls.target);
      controls.update();
      render();
    },
    still() {
      render();
      canvas.toBlob((blob) => {
        if (!blob || dead) return;
        const url = URL.createObjectURL(blob),
          a = document.createElement("a");
        a.href = url;
        a.download = "realitylab-model-inspection.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    },
    inspection,
    dispose() {
      dead = true;
      observer.disconnect();
      controls.removeEventListener("change", render);
      controls.dispose();
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointerup", pick);
      clear();
      disposeObject(grid);
      renderer.dispose();
      canvas.remove();
    },
  };
}

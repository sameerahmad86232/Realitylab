import * as THREE from "three";
const primitives = new Set([
  "box",
  "ellipsoid",
  "cylinder",
  "cone",
  "torus",
  "capsule",
  "tube",
]);
function geometryFor(part) {
  let geometry;
  switch (part.primitive) {
    case "ellipsoid":
      geometry = new THREE.SphereGeometry(0.5, 32, 20);
      break;
    case "cylinder":
      geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);
      break;
    case "cone":
      geometry = new THREE.ConeGeometry(0.5, 1, 32);
      break;
    case "torus":
      geometry = new THREE.TorusGeometry(0.35, 0.15, 16, 48);
      break;
    case "capsule":
      geometry = new THREE.CapsuleGeometry(0.25, 0.5, 8, 20);
      break;
    case "tube": {
      const shape = new THREE.Shape();
      shape.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(0, 0, 0.5 * (part.innerRatio ?? 0.6), 0, Math.PI * 2, true);
      shape.holes.push(hole);
      geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 1,
        bevelEnabled: false,
        curveSegments: 40,
      });
      geometry.translate(0, 0, -0.5);
      geometry.rotateX(-Math.PI / 2);
      break;
    }
    default:
      geometry = new THREE.BoxGeometry(1, 1, 1);
  }
  geometry.computeBoundingBox();
  const center = geometry.boundingBox.getCenter(new THREE.Vector3()),
    size = geometry.boundingBox.getSize(new THREE.Vector3());
  geometry.translate(-center.x, -center.y, -center.z);
  geometry.scale(1 / size.x, 1 / size.y, 1 / size.z);
  return geometry;
}
export function buildScanConcept(model) {
  if (!model?.parts?.length || model.parts.length > 12)
    throw Error("No usable scan-specific 3D concept was supplied.");
  const group = new THREE.Group();
  group.name = model.objectName || "Approximate scanned object";
  group.userData.scanConcept = true;
  group.userData.notice =
    "Approximate component model. Relative units, inferred depth, not reconstructed CAD.";
  for (const part of model.parts) {
    if (
      !primitives.has(part.primitive) ||
      part.size?.length !== 3 ||
      part.position?.length !== 3 ||
      part.rotation?.length !== 3 ||
      !part.size?.every((n) => Number.isFinite(n) && n >= 0.02 && n <= 4) ||
      !part.position?.every((n) => Number.isFinite(n) && Math.abs(n) <= 2) ||
      !part.rotation?.every(
        (n) => Number.isFinite(n) && Math.abs(n) <= Math.PI * 2,
      )
    )
      throw Error("The proposed concept contains invalid geometry parameters.");
  }
  for (const part of model.parts) {
    const geometry = geometryFor(part),
      material = new THREE.MeshStandardMaterial({
        color: /^#[0-9a-f]{6}$/i.test(part.color) ? part.color : "#879b85",
        roughness: 0.65,
        metalness: 0.07,
      });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = part.name || part.observationId;
    mesh.position.fromArray(part.position);
    mesh.scale.fromArray(part.size);
    mesh.rotation.set(...part.rotation);
    mesh.userData.observationId = part.observationId;
    group.add(mesh);
  }
  return group;
}

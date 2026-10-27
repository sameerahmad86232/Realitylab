# Open-source integrations

## React Flow / xyflow

- Repository: https://github.com/xyflow/xyflow
- Package: `@xyflow/react`, installed and integrity-pinned by frontend/package-lock.json.
- License: MIT, copyright webkid GmbH. Retained in docs/licenses/React-Flow-MIT.txt. React Flow's normal attribution remains visible.
- Use: interactive component graph, drag/zoom controls, keyboard-accessible nodes, relationship editing and map navigation.
- Scope: the library renders and edits graphs; it does not recognize images, reconstruct hidden geometry, prove relationships or generate CAD. Meta model observations and user corrections supply graph data. No pre-existing example application is presented as RealityLab's new contribution.

Other existing third-party packages remain declared in package manifests. Generated car assets and locally bundled fonts are documented separately. No unlicensed GitHub source or dataset was copied into the application.

## Dagre

- Repository: https://github.com/dagrejs/dagre
- Package: `@dagrejs/dagre`, integrity-pinned in the frontend lockfile.
- License: MIT; retained in docs/licenses/Dagre-MIT.txt.
- Use: initial directed component-graph layout and the Arrange control. User-dragged positions override automatic layout. Layout is schematic; geometric placement is not a physical measurement or proof of connection.

## Three.js and Loböle design reference

- Three.js: https://github.com/mrdoob/three.js, MIT, notice retained in docs/licenses/Three-MIT.txt. Used for RealityLab's original browser-rendered gear study, camera controls and environment lighting. Loaded only when the studio approaches the viewport.
- Design reference: https://github.com/eliasaronson/lobole at commit `db51a02d3e6adb3ee8c98a36a0ad5cae43c4f780`. Loböle is a native CAD application under AGPL-3.0-or-later. Its native application source, shaders and UI code have not been copied or linked into RealityLab. The browser scene and interface are original implementations.
- Reused asset: `assets/hdri/brown_photostudio_02_2k.hdr` from that repository, explicitly separately identified as Poly Haven CC0 in its assets/hdri/README.md. Bundled at frontend/public/environments/brown_photostudio_02_2k.hdr. Original source: https://polyhaven.com/a/brown_photostudio_02. See docs/licenses/Poly-Haven-HDRI-CC0.md.
- Scope: a visually interactive, illustrative material study, not photo-to-CAD reconstruction, a validated involute gear design or a manufacturing simulation. Motion starts only on request and pauses offscreen. Direct lights and a no-WebGL explanation provide fallbacks.

## Field Guide typography

The selected design direction uses locally bundled Newsreader and DM Sans
variable fonts from Fontsource. Both use the SIL Open Font License; notices are
retained in docs/licenses/Newsreader-OFL.txt and docs/licenses/DM-Sans-OFL.txt.
These are open fonts chosen for the design direction, not copies of proprietary
Tiempos, Lyon or Founders Grotesk typefaces depicted as references in the concept.

## Camera and model inspector integrations

### Text23D — MIT

Source: https://github.com/zqf3229294/Text23D at
`d7bb5fe6b5126c0ac720b084fc4ebe6f80a344ee`.
The Three.js GLB/STL loading, scene framing and disposal approach in
`frontend/src/lib/createCadViewer.js` is adapted from its Angular model viewer,
with an original React interface, local-file preflight checks and per-part
frustum fitting. The cube study is a browser mesh adaptation of its
`cad-runner/examples/cube_with_hole.py` (side 40, through-hole diameter 10).
That original script is also provided as a download. The original MIT license
and NOTICE are retained in docs/licenses/Text23D-MIT.txt and Text23D-NOTICE.txt.
The Python/FastAPI generation service, mock provider and CadQuery/FreeCAD runners
are not deployed or executed by RealityLab. Compatibility is for exported static
GLB/STL meshes, not a claim that the complete Text23D platform is installed.

### CAD Showcase Studio — MIT

Source: https://github.com/Aihua96/cad-showcase-studio at
`c6c280e06bce50fdb8d82c49998846f7951fba49`.
The model inspector applies its separate-part, stable clipping-plane, actual
per-part corner framing, non-zooming selection and GPU-parameter validation
patterns. `scripts/vendor/cad_showcase_glb_stats.py` reuses its measured GLB
statistics script. Its CLI bounds use accessor MIN/MAX metadata with world transforms;
the browser inspector measures decoded geometry. A local correction composes glTF transforms as T × R × S;
an automated test checks non-uniform scale plus translation. Full MIT notice is
retained in docs/licenses/CAD-Showcase-Studio-MIT.txt.
This is the viewer/mesh-statistics subset of the skill's workflow. No A2 drawing,
CAD interference certification, geometry-kernel measurement or narration/video
pipeline is claimed. Imported geometry is not rebuilt from a photograph.

### PiCar — BSD 3-Clause reference geometry

Source: https://github.com/xz-group/PiCar at
`414180d3d7bc3ced0a64aa5efb412ea23c0b6005`.
Included asset: `hw/obsolete/chassis/stl_files/Chassis.stl`, served unchanged as
`frontend/public/models/picar-reference-chassis.stl`. Its 10,750 triangles are
measured from the mesh. The source path explicitly identifies an obsolete
design; it is a reference asset, not a build-ready or validated robot plan.
The root BSD notice is retained in docs/licenses/PiCar-BSD-3-Clause.txt. The
license's separate AVRfix LGPL notice is retained for completeness; no AVRfix
code is used. PiCar's ROS/device-control stack and camera stream service are not
installed. RealityLab's browser camera is an original getUserMedia implementation
and does not connect to a Raspberry Pi or control a motor.

### Loböle

The previously integrated, separately CC0 Poly Haven environment map remains in
the illustrative lighting studio. The native AGPL app source is not copied or
linked. See the earlier Loböle section for its asset provenance and scope.

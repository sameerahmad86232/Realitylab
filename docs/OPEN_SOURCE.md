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

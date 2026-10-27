# Camera capture and model inspection

## Take a photo

In **Object explorer**, choose **Take a photo** and grant browser camera access.
The live preview is local and requests video only, without microphone access.
Switch camera if needed, capture a frame, then **Retake photo** or **Use this
photo**. Keeping a photo adds a JPEG to the existing three-image upload flow;
it does not send the image for analysis automatically. Review the provider-sharing
consent and explicitly choose **Analyze my photos** to call the configured model.
Frames are capped at a 1600-pixel longest edge and use the same server-side image
validation/normalization as file uploads. No continuous video stream is uploaded.

Camera access requires HTTPS or localhost. Permission denial, a missing/busy
camera, or an unsupported browser shows recovery guidance and a native device
photo input (`capture=environment`). That is a browser hint; desktop browsers may
open a file picker. Whether front/rear switching finds a different physical lens
depends on the available device cameras. Capture, close, Escape, retake and late
permission responses all stop superseded media tracks. Photos and notes still
live only in the current browser tab until exported.

## Inspect an existing model

Choose **3D model inspector**. Open a static, self-contained, untextured `.glb`
or `.stl`, up to 20 MB and 500,000 triangles. STEP must first be tessellated/exported
by a CAD tool. Text23D's GLB/STL exports fit this workflow; its server and CAD
kernel are not installed here. The browser does not execute Python scripts or
arbitrary model-generation code.

- Select a mesh in the part list or click it in the viewport. Other meshes fade;
  selection does not move the camera.
- Drag to orbit or use camera presets and zoom/reset buttons.
- Toggle wireframe, or separate an assembly that has multiple existing mesh nodes.
  A single merged STL cannot automatically be split into semantic components.
- Section along viewer X, Y or Z. Planes remain attached to materials and update
  against current exploded bounds. Cuts are open surfaces with no filled caps.
- Export a PNG or mesh inspection JSON. Bounds/triangle counts come from loaded
  geometry. Model coordinates are not independently verified physical units.

The Text23D cube is an explicitly labeled browser mesh adaptation, with its
original CadQuery script available for download. The PiCar option loads an actual
BSD-licensed obsolete reference chassis STL. There is no connected vehicle,
Raspberry Pi stream, autonomous driving or motor control. No model-viewing action
calls an AI provider, and imported model bytes are not uploaded to the server.
Textures and external GLB resources are rejected before loading; animation,
skinning and compressed/instanced geometry are outside the supported subset.

This is not photo-to-CAD reconstruction, a STEP/FCStd editor, a manufacturing
validation tool, or an inference of hidden geometry from a camera view. Photos
continue through the separate Meta-backed evidence workflow.

## Verification

```bash
npm test
npm run build
npm run test:camera-cad
npm run test:browser
```

`npm test` now includes the model preflight, PiCar STL and adapted GLB statistics
checks. Python 3 (standard library only) is needed for the statistics test and CLI.
The camera/model browser check uses Chromium's synthetic camera, not a real
person/device, and one explicitly injected test-only provider response. It checks
capture/review/retake/switching, stream cleanup, permission denial, late permission
resolution, upload capacity and the consent gate. It also checks actual imported
geometry, model bounds, multipart separation, material wireframe/opacity and
clipping-plane values consumed by the renderer, reset, PNG/JSON downloads,
external-resource rejection and responsive layouts. No real AI credits or robot
hardware are used. Real-device camera testing remains useful across target phones.

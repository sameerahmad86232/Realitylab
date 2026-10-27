# RealityLab — blueprint for a working hackathon product

> Implementation status (October 27, 2026): secure Baseten inference, broad object exploration, editable component maps, evidence reviews/follow-up notes, deterministic gear/lever/pulley tools and JSON/Markdown/SVG/PDF exports are implemented. Six real photo requests are recorded in GENERAL_OBJECT_VALIDATION.md with known scope/identity errors. The 3D studio is illustrative. Public hosting and a real physical mechanism experiment remain outstanding. See DEPLOYMENT.md and DEMO_SCRIPT.md.

## 1. The product to build

**See a mechanism. Understand its parts. Predict what happens. Test it in the real world.**

Keep the current premium automotive presentation. Make the working product a mechanism exploration studio, with a hand-powered gear assembly as the first fully supported physical experiment.

The car remains an explicitly labeled original design study. Its generated images are not evidence of a real vehicle's hidden engineering. A user may explore exterior car features, but the app must not return the car sample for unrelated uploads or claim manufacture-ready plans.

This plan implements the stronger workflow recommended in HACKATHON_REQUIREMENTS.md. It supersedes the initial generic photo-analysis MVP in IMPLEMENTATION_BLUEPRINT.md.

## 2. Current implementation versus required work

| Capability | Implemented behavior | Remaining verification |
| --- | --- | --- |
| Presentation | Responsive car showcase, bundled fonts, atmosphere and interactive material study | Wider device coverage |
| Upload | JPEG/PNG/WebP decoding, orientation, resizing, limits, metadata removal and provider consent | User photos across more capture conditions |
| Generate | Actual Baseten Meta model calls and strict validated structured output | Unfamiliar object accuracy; no universal recognition claim |
| Diagram | Input-specific image markers and editable React Flow relationship map | Manual evidence review of individual connections |
| Evidence review | Per-component self-reported status/notes, original model claim retention and follow-up notebook | Independent physical verification |
| Predictions | Confirmed external gear-pair, ideal lever and ideal pulley solvers | Applicability and measured inputs |
| Experiments | User-reported measured turns/direction compared with declared tolerance | A real physical experiment for the demo |
| Export | Photo-free JSON by default, readable Markdown, annotated SVG and browser print/PDF | Review a final submission artifact |
| Hosting | Production Node service, Render Blueprint and read-only smoke checker | Connected hosting account, key configured on host and assigned public HTTPS URL |

A static HTML download cannot run a secure server-side AI workflow by itself.

## 3. First supported demonstration

Use two externally meshing hand-cranked gears on a visible tabletop assembly. Prepare a second gear pair for a fresh-input demonstration.

1. Photograph the actual mechanism.
2. The model suggests the gears, their locations and a contact relationship.
3. The user corrects the markers and confirms the tooth counts. Do not rely on an image model to count teeth accurately without checking.
4. The user selects driver, follower, clockwise/counterclockwise convention, and input turns.
5. The app computes expected direction and output turns.
6. The app asks the user to turn the driver and record the follower's measured turns and direction.
7. The app compares predicted and measured motion. It reports agreement within the stated tolerance or an unresolved discrepancy.
8. The user changes a gear/input and repeats the experiment.
9. Export includes images only when explicitly requested, plus inputs, calculations, observations and model provenance.

Example: a confirmed 12-tooth driver and 24-tooth follower predict **half an output turn in the opposite direction for one input turn**.

## 4. Technology and architecture

Retain React 18 + Vite + Tailwind and the existing visual components.

Add a Node backend with Express, multipart handling, Sharp for image normalization, and Zod for request/model-output validation. Share schemas and deterministic mechanism code between API and tests. Keep the model behind a provider adapter.

```text
Browser / React
  |-- Images + optional object context
  v
Same-origin Node API
  |-- Validate, decode, orient, resize, strip metadata
  |-- Apply concurrency / upload / request limits
  v
Eligible Meta vision model through configured provider
  |-- Structured observations and hypotheses
  v
Schema validation + supported mechanism detection
  |-- Unknowns / user confirmation where needed
  v
Editable component graph in browser
  |-- Confirmed inputs -> deterministic server tools
  v
Prediction -> physical measurement -> comparison -> report
```

Do not add accounts, a database, a queue service or cloud storage for the first demo. Keep the exploration in browser session state and process uploads in memory. Add optional local history only after a deliberate retention/deletion UI exists.

Production serves the frontend and `/api` on one origin. Development uses Vite's API proxy. An API key must never appear in frontend JavaScript, VITE_ variables, logs or exported reports.

## 5. Meta and Baseten integration

The user reports $100 Baseten credits and $150 Meta Model API credits. Credit availability does not establish that a key, model entitlement or image endpoint is configured.

Before writing the provider request:

- Open the official provider documentation and confirm exact endpoint, authentication, image format, model ID, response schema and current limits.
- Use an eligible Meta model from the supplied hackathon guide.
- The guide names `meta-models/muse-spark-open-1026` for the Baseten hackathon route; this is not yet independently verified.
- Verify the chosen model supports image input. Do not assume an endpoint is OpenAI-compatible.
- Make one real authenticated image request and retain a sanitized result for validation.

Recommended first integration: one verified provider and one eligible image-capable model. Use the second provider only after the primary workflow works; failover must be explicit, use an eligible model, and preserve accurate provenance. Optional SAM segmentation is a later enhancement, not a prerequisite for a gear experiment.

Backend configuration:

```text
AI_PROVIDER=baseten                 # proposed first route; confirm docs
AI_BASE_URL=<verified official URL>
AI_MODEL=<verified eligible model>
AI_API_KEY=<secure backend binding; never entered in chat>
PORT=3001
APP_ORIGIN=<deployed HTTPS origin>
```

`AI_BASE_URL` is administrator configuration, never an arbitrary request parameter. Allow the provider's exact HTTPS hostname in cloud settings after selection. Check existing secure bindings before declaring another secret requirement.

## 6. Application screens

**Home:** retain the car visuals, specimen viewer, shader and premium typography. Label Sample and Live paths separately.

**Capture:** one to three images, object context, optional ruler/reference measurement, preview, removal and data-sharing disclosure.

**Discover:** uploaded-image annotations, component cards, visible/inferred filters, evidence, editable labels and unknowns. The diagram uses the actual submitted image, never a generic car drawing for every object.

**Confirm:** supported mechanism type, tooth counts, gear contacts, driver/follower and a clear distinction between model suggestions and user-confirmed values.

**Predict:** equation, supplied inputs, units, direction convention, expected motion and limits. No invented torque, efficiency, battery ratings or dimensions.

**Test:** simple hand-powered experiment, input turns, measured output turns and direction, optional observation notes. Two still frames cannot establish how many complete rotations occurred.

**Compare:** expected versus observed values, tolerance, residual, agreement or discrepancy. Let the user revise inputs and run another experiment.

**Report:** evidence, confirmed inputs, calculated values, measurements, limitations, provider/model identity, tool trace and export controls.

Unsupported objects still receive a supported exterior observation result with an explicit message that physical prediction is unavailable. They must not receive a fabricated experiment or sample fallback.

## 7. API endpoints

| Method/path | Purpose | Important validation |
| --- | --- | --- |
| GET `/api/health` | Runtime and configuration status | No credentials; distinguish configured from live-verified |
| POST `/api/analyze` | Images -> structured observation result | 1–3 images, actual decoded formats, byte/pixel limits, provider timeout |
| POST `/api/predict` | Confirmed graph -> computed motion | Supported topology, positive integer teeth, finite nonzero input turns, complete references |
| POST `/api/compare` | Graph + inputs + measurement -> recomputed comparison | Recompute prediction; reject zero denominators and invalid measurements |

Use multipart form data for images and JSON for numerical endpoints. Recommended starting limits: 5 MB per image, 15 MB combined, 20 megapixels decoded per image, 1,000 characters of context, at most 30 components. Enforce limits at proxy and application levels.

Normalize orientation, strip metadata, and resize images to the provider's verified requirements. Annotation coordinates refer to the normalized image. Return normalized image dimensions and enough orientation information for the browser to align markers correctly.

Error semantics: 400 bad request, 413 too large, 415 unsupported image, 422 unsupported mechanism or invalid analysis, 429 rate/concurrency limited, 502 upstream/invalid model response, 503 missing configuration, 504 timeout. Do not expose credential-bearing upstream responses.

## 8. Shared data contract

```ts
type Point = { x: number; y: number }; // normalized [0,1]
type Observation = {
  id: string;
  imageId: string;
  name: string;
  marker: Point;
  evidence: string;
  source: 'model-suggested' | 'user-confirmed';
};
type Hypothesis = {
  id: string;
  name: string;
  basis: string;
  verificationNeeded: string;
};
type Gear = {
  id: string;
  observationId: string;
  toothCount: number | null;
  toothCountSource: 'unknown' | 'model-suggested' | 'user-confirmed';
};
type Analysis = {
  schemaVersion: '1.0';
  id: string;
  mode: 'live' | 'sample';
  objectName: string;
  observations: Observation[];
  hypotheses: Hypothesis[];
  unknowns: string[];
  mechanism: {
    type: 'external-gear-pair' | 'unsupported';
    gears: Gear[];
    contacts: { from: string; to: string }[];
  };
  provenance: { provider: string; model: string; analyzedAt: string };
};
```

Implement runtime validation, not just TypeScript declarations. Bound strings/arrays and validate every reference. Server-generate IDs. Treat text embedded in images and all model responses as untrusted content. Render text safely; never execute provider HTML, JavaScript or arbitrary SVG.

## 9. Deterministic mechanism tools

Version one supports exactly one externally meshing gear pair; reject unsupported topologies clearly. Extend to idlers/compound trains only after tested graph support exists.

```text
signed_ratio = -driver_teeth / follower_teeth
predicted_output_turns = input_turns * signed_ratio
residual = measured_output_turns - predicted_output_turns
absolute_error = abs(residual)
within_tolerance = absolute_error <= declared_absolute_tolerance
```

Use signed turns with an explicit clockwise convention from a specified viewpoint. A negative ratio means opposite rotation. Display the tolerance and measurement source before declaring agreement. Do not use relative error when the predicted value is zero.

The model proposes the mechanism and explains observations. Code performs calculations. Missing or uncertain inputs require confirmation. Record tool names, validated inputs, outputs, version and timestamps as an inspectable trace rather than hidden model reasoning.

## 10. Failure handling and spending

- Never substitute a sample after a failed live request.
- Preserve uploaded photos and context after retryable failures.
- Cancel using AbortController and release request buffers on disconnect/timeout.
- Set bounded analysis duration and provider output limits from verified docs.
- Start with one provider call per submitted analysis; model repair attempts must be bounded and visible in operational metrics.
- Reuse the current validated analysis for numerical what-if changes; these must not incur another model request.
- Require an explicit user action for another live analysis.
- Record usage when the provider supplies it; report cost only with verified pricing.
- Configure provider spending controls where available. A notification is not necessarily a hard cap. Do not assume either credit balance guarantees free continued usage.
- Rate/concurrency-limit public endpoints. In-memory controls alone do not coordinate multiple replicas; add shared controls or deployment-level limits before scaling.

## 11. Implementation file map

```text
Realitylab/
  frontend/src/
    App.jsx                              # separate sample/live paths
    components/ShaderAtmosphere.jsx       # retain existing effects
    components/UploadZone.jsx             # upload + disclosure + limits
    components/ResultsSection.jsx         # route to generic live/sample views
    features/exploration/
      CapturePanel.jsx
      ImageAnnotations.jsx
      ComponentEditor.jsx
      PredictionPanel.jsx
      ExperimentPanel.jsx
      ComparisonPanel.jsx
      ReportPanel.jsx
      explorationReducer.js
    lib/api.js                           # typed requests, abort, safe errors
    lib/exportReport.js                  # JSON, application-generated SVG
  server/src/
    app.js
    routes/health.js
    routes/analyze.js
    routes/predict.js
    routes/compare.js
    providers/index.js
    providers/baseten.js                  # implement only against verified docs
    services/normalizeImage.js
    services/analyzeMechanism.js
    services/requestLimits.js
  shared/
    schemas.js
    gearMath.js
    comparison.js
  tests/
    api/
    mechanism/
    browser/
```

This is proposed structure; these backend/live-workflow files do not exist yet.

## 12. Build sequence and acceptance gates

| Milestone | Deliverable | Evidence needed |
| --- | --- | --- |
| 1. Provider proof | Verified docs/config, one real eligible-model image request | Sanitized result and exact model provenance |
| 2. Live capture | Backend upload validation and generic analysis screen | Real object-specific result; invalid images rejected |
| 3. Evidence editor | Image markers, component correction and confirmed inputs | Corrections update the graph; unrelated input never returns car sample |
| 4. Prediction | Validated gear-pair math and prediction panel | 12:24 -> -0.5; 24:12 -> -2; malformed graphs rejected |
| 5. Physical test | Measurement entry, comparison and revision loop | Recorded real experiment; disagreement remains visible |
| 6. Export | JSON/SVG and print report | Current data, provenance, units and limitations preserved |
| 7. Public release | HTTPS hosting, secure key, abuse controls | Live upload -> prediction -> test -> export from public URL |
| 8. Submission | Public repo, contribution record and three-minute video | All links anonymously accessible; event work identified |

Do not spend the remaining build window adding more visual effects before milestones 1–5 work.

## 13. Test plan

- Valid JPEG/PNG/WebP; EXIF rotation; marker alignment; corrupt files; MIME spoofing; byte and pixel limits; empty and excessive uploads.
- Missing key; provider auth rejection; timeout; 429; invalid JSON; invalid coordinates; unknown component references; oversized output.
- Gear-pair math, direction convention, zero/negative/noninteger tooth counts, absent confirmation, disconnected contacts, unsupported topology.
- Measurement tolerance, incomplete observations, repeated tests, revised inputs, and mismatch reporting.
- Provider test fixtures clearly separated from one real authenticated integration test.
- Browser: sample/live separation, upload removal, loading/retry/cancel, keyboard markers, field editing, comparison, downloads and mobile overflow.
- Shader fallback and reduced motion remain usable; no secrets in client bundles, logs or exports.
- Manual demo with two actual gear arrangements, including one not used while tuning the prompt.

## 14. Deployment and submission

Deploy frontend and API together on a Node-capable HTTPS host. Configure the actual public origin, backend secret, provider URL/model, upload limits and trusted proxy behavior. Verify allowed network access and one real provider operation after deployment. Never expose the key in the downloadable standalone demo.

Keep the generated car images as disclosed presentation assets. They are not evidence of using eligible Meta models in the functional app. Document model use and work completed during the event separately.

From the supplied guide: public repo, maximum four participants, one representative, accessible three-minute demo video, and clearly identified new work. Deadline: November 4, 2026 at 9 PM EST = **November 5, 7:30 AM IST**; confirm on the submission platform and submit earlier.

## 15. Definition of done

A new user opens the public URL, uploads a fresh mechanism photo, gets an actual eligible-Meta-model result, corrects evidence, predicts motion, performs a real test, sees an honest comparison, and downloads a reproducible report. Failures remain explicit. The car sample stays a separate concept experience.

**Current status:** visual demo prepared; live provider integration, backend, prediction/measurement tools and public deployment are not implemented or verified. Reported credits are available prerequisites, not a completed integration.

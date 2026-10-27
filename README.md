# RealityLab

A general object exploration studio: **observe → map → correct → test supported models → export**. Image analysis covers broad everyday-object categories, including vehicles, electronics, appliances, furniture, tools and natural objects. Recognition may be uncertain. Numerical predictions are limited to explicit ideal models with user-confirmed inputs; the app does not promise exact internals, universal recognition or automatic CAD. The landing page uses the Luminous Studio design: a live pearlescent WebGL shader, translucent object framing, DM Sans/Newsreader typography, and original AI-generated object studies. Motion is pausable, honors reduced-motion preferences and falls back to a CSS gradient when WebGL is unavailable. The car concept remains a separate labeled sample in the studio.

## Run

Node 24.5+ is required; Node 24.19 is validated here. The API startup enables Node’s environment-proxy routing and system certificate store, preserving TLS verification for proxy-backed secrets.

```bash
npm ci
npm --prefix frontend ci
npm run dev
```

Run these commands from the repository root. The dev runner starts the API on port 3001 and Vite on port 5173. Use `PORT` and `FRONTEND_PORT` to override those ports. The frontend proxies `/api` to the selected API port. Each cloud task already has an isolated checkout; do not create a worktree for ordinary setup.

For a production instance:

```bash
npm run build
npm start
```

The Node server serves `frontend/dist` and `/api` on the same origin. Configure `APP_ORIGIN` to the real HTTPS origin in production. A public deployment is not created by these commands.

## Working without AI

Open **Object explorer**, then choose **Open manual gear experiment** or **Load gear example**, enter a real pair's tooth counts or click **Load gear example**, explicitly confirm the counts and direct external contact, and compute a prediction. Record actual output turns and direction from the same side. Compare against a declared tolerance. Changing setup inputs invalidates the previous result and clears the measurement.

A 12-tooth driver meshing with a 24-tooth follower predicts half an output turn in the opposite direction for one input turn. Numerical examples are not physical measurements. The gear drawing is symbolic, not a tooth-accurate manufacturing drawing.

JSON, annotated SVG, and browser print/PDF exports are available. JSON excludes source photos by default; embedded normalized photos require opt-in. No projects or images are persisted on the server. Model output is rendered as text; SVG is built from application-owned primitives with escaped labels.

## General object exploration and component maps

Upload a clear object photo and optional context. The model returns a category, recognition status, visible components, suggested functions, explicit relationships, hypotheses, unknowns and useful non-invasive follow-up observations. The API rejects blank/no-object results with 422 rather than fabricating a map. Unsupported numerical prediction does not mean the object cannot be explored.

The interactive component editor uses [React Flow from xyflow/xyflow](https://github.com/xyflow/xyflow), MIT licensed, with attribution retained in docs/licenses/React-Flow-MIT.txt and normal UI attribution left visible. Nodes can be dragged/selected and connections added or removed. Each edge records its basis, visible/hypothesis status and model/user origin. Internal hypotheses remain visually distinct and are not automatically connected as though observed. Graph positions are schematic, not dimensions. The graph is lazy-loaded after analysis. MIT-licensed Dagre (https://github.com/dagrejs/dagre) supplies automatic relationship layout; Arrange resets user layout without implying physical dimensions.

Edit image markers, component labels, visible evidence and suggested functions. Corrections are labeled `user-edited`; they are not automatic verification. Add visible relationships only with a basis. Download the map as application-generated, escaped SVG; JSON retains relationships, graph layout, provenance and optional images.

The **Manual physics bench** supports ideal static levers and pulleys, in addition to the separate external gear-pair experiment. Lever calculations need load force and perpendicular moment arms. Pulley calculations need load force, supporting rope strands and desired lift. Inputs/units must be confirmed. Outputs explicitly state ideal assumptions; no strength, electrical safety, torque, efficiency or manufacture-ready CAD is inferred from photographs.

## Baseten live image analysis

The participant's Baseten welcome email specifies an OpenAI-compatible API and these defaults:

- Endpoint: `https://inference.baseten.co/v1/chat/completions`
- Model: `meta-models/muse-spark-open-1026`
- Authentication: Bearer key, compatible with the email's OpenAI SDK example.

Configure **BASETEN_API_KEY** securely in cloud environment settings or your local ignored `.env`. Do not put credentials in source code, frontend `VITE_` variables, chat, or reports. `.env.example` contains only non-secret defaults. `AI_API_KEY` takes precedence if configured; avoid leaving an obsolete override set. Restart the server after changing key bindings or local environment values.

The provider adapter allows explicit administrator overrides for `AI_PROVIDER`, `AI_ENDPOINT`, `AI_MODEL`, `AI_PROTOCOL=chat-completions`, and `AI_AUTH_SCHEME=bearer|api-key`. Non-HTTPS endpoints and embedded URL credentials are rejected. Configuration is not proof of usable credits or successful authentication. Check `/api/health`: `configured` means settings are present; `liveVerified` becomes true only after a validated provider result succeeds during this server process. The user must claim/manage their own credits and set provider spending controls.

**Live validation:** on October 27, 2026, a real request through the running API succeeded with the securely injected Baseten key and exact hackathon model. The generated car input produced eight observations and three hypotheses, correctly classified as unsupported for gear prediction. See docs/LIVE_VALIDATION.md. This does not validate a physical gear experiment. Automated provider and live-UI tests still use isolated fixtures and do not consume credits.

### Live flow

1. Upload one to three JPEG/PNG/WebP images, each at most 5 MB and 20 megapixels.
2. Read and accept the provider-sharing disclosure, then analyze.
3. The server verifies decoded format, orientation, pixel limits and metadata removal; normalized JPEGs are sent to the provider.
4. Inspect the normalized image, select numbered markers, edit labels or move markers by clicking the image or editing X/Y coordinates.
5. Review visible evidence, internal hypotheses and unknowns separately. Confirm suggested tooth counts yourself.
6. Objects without a supported numerical model still receive useful object-specific observations, relationships, roles and follow-up steps. Manual physics tools remain separate.
7. Provider errors never silently substitute the car sample. Input photos are preserved after a retryable failure. Cancel aborts the request.

The server uses in-memory processing, upload/request limits, analysis concurrency limits, a bounded provider timeout/output, validation and sanitized errors. In-memory rate limits are per server process; use shared deployment-level controls before multiple replicas. Only explicitly trusted proxy configuration should determine client IP.

## API

- `GET /api/health`: readiness, missing requirements and capabilities, without credential values.
- `POST /api/analyze`: multipart `images`, `context`, `consent=true`.
- `POST /api/predict`: confirmed driver/follower counts, external-gear-pair type, input turns/direction.
- `POST /api/tools/predict`: confirmed measurements for ideal lever or pulley models.
- `POST /api/compare`: setup plus measured output turns/direction and absolute tolerance. The server recomputes the prediction.

Gear endpoints validate positive integer tooth counts, finite numerical inputs and explicit confirmations. The additional physics endpoint validates model-specific units, positive ranges and confirmations. Zero measured motion is a valid observation, not a passing result. Torque, efficiency, hidden internals, exact dimensions and roadworthy/flightworthy construction are outside the implemented prediction scope.

## Verification

```bash
npm test
npm run build
CHROMIUM_PATH=/usr/lib/chromium/chromium npm run test:browser
```

`npm test` exercises numerical boundaries, decoding, consent, size/pixel limits, EXIF normalization, invalid model data, missing configuration, timeout, origin checks, report escaping and Baseten request serialization. Provider fixtures are test-only and injected into `createApp`; there is no production environment flag that replaces live failures with fixture data.

Browser checks use a local installed Chromium and two isolated test servers. They also exercise four broad object categories with explicitly injected fixtures, graph relationship editing/zoom/map export, corrected component roles, ideal lever/pulley calculations and responsive layouts. They cover the real manual HTTP workflow and a fixture-only analysis workflow: confirmations, agreement/discrepancy, stale-state invalidation, sample separation, annotations, exports and responsive layouts. Set `BROWSER_ARTIFACT_DIR` to choose the screenshots/report output directory; default `/tmp/realitylab-browser-check`.

Existing unused template components have legacy lint errors. Changed active components are checked separately; tests do not suppress those errors. The old standalone HTML download is a presentation preview and cannot provide the full secure server-side workflow.

## Assets and event scope

See [generated image provenance](docs/IMAGE_ASSETS.md), [font licenses](docs/licenses), [working-app plan](docs/WORKING_APP_BLUEPRINT.md), and [hackathon requirements](docs/HACKATHON_REQUIREMENTS.md). Generated car images are presentation assets, not evidence of a Meta model integration or verified vehicle internals. Preserve event contribution history and identify pre-existing work before submission.

See [generalization validation](docs/GENERAL_OBJECT_VALIDATION.md) for real model checks and their limits.

### Interactive material studio

The landing page includes an original browser-native Three.js gear study inspired by
Loböle's studio viewport. Orbit the assembly, choose camera presets and material
finishes, toggle grid/edges, preview motion, or save a PNG still. It is illustrative
geometry, not reconstruction from an uploaded photo or manufacturing-ready CAD.
The scene is lazy-loaded near the viewport; motion is opt-in and pauses offscreen.
A separately licensed CC0 Poly Haven HDR environment supplies studio reflections.
See [open-source credits](docs/OPEN_SOURCE.md) for source and license details.

### Evidence review and deployment

Review each suggested component, add your own evidence notes, and record follow-up
observations. Editing a component resets its prior review while preserving the
original model suggestion. Notes are self-reported and live only in the current
browser tab until exported. The **Readable report** downloads Markdown alongside
the existing JSON/SVG/PDF options. SVG exports for general objects omit the gear
illustration when photos are excluded.

Six real public-photo requests and their limitations are documented in
[general object validation](docs/GENERAL_OBJECT_VALIDATION.md). Repeat only with
explicit `npm run validate:photos -- --live`; this consumes provider credits.

A Render Blueprint is included in `render.yaml`. See the [deployment guide](docs/DEPLOYMENT.md)
for connecting a hosting account and securely configuring the Baseten key on that
host. The app is not publicly deployed by adding this file. After deployment,
`npm run smoke -- https://YOUR-SERVICE.onrender.com` checks the production HTTP
flow without an AI call. See the [three-minute demo script](docs/DEMO_SCRIPT.md)
for a submission sequence and the distinction between pre-existing and event work.

### Shader verification

After `npm run build`, run `npm run test:shader` with an installed Chromium
(or set `CHROMIUM_PATH`). It checks actual animated rendering, stable pause,
reduced-motion defaults, no-WebGL fallback and desktop/mobile layouts against
an isolated keyless app. It makes no AI requests.

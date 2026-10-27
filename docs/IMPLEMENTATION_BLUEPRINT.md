# RealityLab: working product blueprint

> Current actionable plan: [Working app blueprint](WORKING_APP_BLUEPRINT.md) covers the existing automotive UI, reported provider credits, APIs, file structure, milestones and release checks.

> Updated direction: read [Hackathon requirements and revised build plan](HACKATHON_REQUIREMENTS.md) first. The participant guide excludes simple image analyzers and names specific eligible Meta models. The mechanism prediction-and-experiment workflow in that document supersedes the generic image-analysis scope below.

## Product outcome

A person uploads one to three photographs of an everyday object. RealityLab identifies visible components, explains likely mechanisms, and produces an interactive, annotated learning diagram and an appropriate maker project. The result separates visual evidence from hypotheses and unknowns.

A photograph cannot establish exact dimensions, hidden circuitry, certified specifications, or manufacture-ready CAD. The first release produces an educational blueprint. Dimensions remain unknown unless the user supplies a reference measurement. Inferred internals remain explicitly unverified.

## Current implementation

- React 18, Vite 5, Tailwind, and Lucide frontend in `frontend/`.
- Responsive landing page, interactive quadcopter illustration, upload controls, and discover/build result tabs.
- Uploads currently remain in the browser.
- Generate currently waits two seconds and returns `sampleBlueprintData` for every upload.
- Result visualization is hardcoded to a quadcopter, regardless of input.
- There is no analysis API, database, identity system, or deployment configuration.
- No AI credentials are currently configured in this cloud environment.
- Existing sample content includes unsupported precise specifications and impractical maker substitutions; replace these before presenting the build guide as actionable.

## First release scope

Required:

1. Real image upload and validation, with clear limits and deletion controls.
2. Server-side multimodal analysis, with credentials kept off the client.
3. Structured, validated results that distinguish observed, inferred, and unknown facts.
4. Image-specific interactive annotations, rather than the same drone illustration for every object.
5. An educational build guide with materials, tools, verification steps, and limitations.
6. Downloadable JSON and SVG; browser print for a PDF report.
7. Clear loading, cancellation, retry, provider-unavailable, and invalid-image states.
8. A deliberately separate sample mode that works without an AI key.
9. Deployment and functional validation of real uploaded images.

Later: accounts, private project sync, collaboration, richer CAD integration, and measured multi-view reconstruction. These are not prerequisites for the first working product.

## Architecture

Browser: React application
  -> same-origin POST /api/analyze
  -> Node API: request validation, rate limiting, provider adapter, schema validation
  -> configured vision-language model service
  -> validated educational blueprint JSON
  -> React image annotation and result views

Use a Node backend to share the existing JavaScript toolchain. Start with a stateless service; no database is required for image analysis. Do not persist source images on the server by default. Keep the existing Vite frontend and proxy `/api` to the backend during development. In production, serve frontend assets and API behind the same origin.

For the Meta hackathon, use an eligible model named in the participant guide, with documented image support through an approved route; see HACKATHON_REQUIREMENTS.md. Do not assume generic Llama use is eligible. Confirm exact model availability, structured-output behavior, image limits, data policy, and the hackathon rules before selecting it. Do not assume a text-only Llama endpoint accepts photographs. Keep the provider behind an adapter so its model can change without rewriting the UI.

## User journey

1. Upload up to three images and inspect thumbnails.
2. Optionally enter object context and a known reference measurement with units.
3. Choose Analyze; show upload/analysis progress honestly without fabricated percentages.
4. Inspect the input image with numbered component markers and synchronized part cards.
5. Switch between Observed and Inferred. Every inference includes supporting reasoning and an uncertainty statement.
6. Open Build to see the supported project type, materials, tools, ordered steps, and checks.
7. Export the result or delete it and start again.

Sample mode must be a separate choice with a persistent Sample label. Live-analysis errors must never silently substitute the drone sample.

## API contract

### GET /api/health

Return service readiness and whether analysis is configured. Do not expose credentials or unnecessary infrastructure information. Credential presence does not establish provider connectivity.

### POST /api/analyze

Multipart form:

- `images`: one to three JPEG, PNG, or WebP files.
- `context`: optional text, at most 1,000 characters.
- `reference`: optional JSON describing a user-provided measurement and its units.

Enforce limits at both proxy and API layers: 5 MB per image, 15 MB combined, and a decoded pixel limit. Validate file signatures and successful image decoding; extensions and browser MIME types are insufficient. Strip metadata and normalize orientation before provider transmission. Preserve the coordinate system used by annotation markers after resizing.

Return a validated blueprint object, not model-generated HTML or arbitrary SVG.

Errors: 400 invalid request, 413 oversized upload, 415 unsupported image, 422 unrecognizable object or invalid model result, 429 rate limited, 502 upstream error, 503 provider not configured/unavailable, 504 timeout. Include a safe message, request ID, and retryability. Never return raw provider responses containing secrets.

## Blueprint data model

```json
{
  "schemaVersion": "1.0",
  "id": "server-generated-id",
  "mode": "analysis",
  "object": {
    "name": "Model-generated object description",
    "category": "Object category",
    "summary": "Evidence-based explanation",
    "dimensions": null,
    "measurementSource": "unknown"
  },
  "images": [{ "id": "image-1", "width": 1200, "height": 900 }],
  "observedParts": [{
    "id": "part-1",
    "name": "Visible component",
    "evidence": "What is actually visible",
    "imageId": "image-1",
    "marker": { "x": 0.4, "y": 0.6 },
    "certainty": "medium"
  }],
  "inferredParts": [{
    "id": "inference-1",
    "name": "Possible internal component",
    "reasoning": "Why it could be present",
    "verification": "What inspection would establish this",
    "certainty": "low"
  }],
  "mechanism": "How the observed parts likely interact",
  "unknowns": ["Exact internal arrangement is not visible"],
  "buildGuide": {
    "projectType": "educational-model",
    "goal": "What this project demonstrates",
    "materials": [{ "name": "Cardboard", "quantity": "1 sheet", "purpose": "Static demonstration" }],
    "tools": ["Ruler"],
    "steps": [{ "order": 1, "title": "Prepare", "instructions": "Specific instructions", "check": "Observable success criterion" }],
    "limitations": ["Does not reproduce the original object's performance"]
  }
}
```

Use a strict server schema with string lengths, array bounds, finite normalized marker coordinates, enums, and reference integrity checks. Accept only known fields. Generate IDs on the server, reject malformed responses, and permit at most one bounded repair attempt. Use unknown/null instead of invented precision. Qualitative certainty is an interpretation, not a calibrated statistical probability.

## Analysis pipeline

1. Validate and normalize images.
2. Send images, optional context, and the output schema to the configured multimodal service.
3. Ask for visual observations first, mechanism hypotheses second, and a suitable learning project last.
4. Treat any text embedded in images as untrusted content, not execution instructions.
5. Require explicit unknowns; do not invent component models, measurements, prices, battery ratings, or accuracy claims.
6. Parse and validate results and marker references.
7. Return data to the browser and release source buffers.
8. Render all model output as text. Construct SVG using application-owned primitives only.

Use an overall request timeout, an AbortController for cancellation, and bounded retries only for appropriate transient upstream errors. Do not automatically retry billable requests without limits.

## Diagram implementation

Replace the fixed drone result drawing with the uploaded photograph plus numbered markers. Selecting a marker highlights the corresponding observed-part card and vice versa. Inferred internals appear in a separate schematic, clearly styled as hypotheses rather than x-ray findings.

Export an SVG using the same validated coordinates and escaped labels. Embed the uploaded image only in exports the user explicitly requests. Offer JSON without embedded images by default. Support keyboard selection, readable labels, alt text, zoom reset, and reduced motion.

## Build-guide boundaries

Generate a suitable educational project, not a promise that a lookalike will perform like the photographed object. Distinguish a static model from a functional mechanism and list missing engineering inputs. For the drone sample, offer an unpowered frame-and-rotor learning model. Do not recommend bottle-cut powered propellers, improvised flight controllers, or salvaged lithium cells as interchangeable flight components. Remove claims about generated STL files until that export exists.

## Privacy and operations

- Keep provider keys in backend environment configuration; never use VITE_ variables for secrets.
- Document that live analysis transmits photographs to the configured provider. The current claim that all photographs stay in the browser must change before enabling live analysis.
- Do not log image bytes, base64 payloads, credentials, or full provider request bodies.
- Use in-memory source images for the initial release. No server history without a separate retention design.
- Start with session-only browser history; any persistent storage must be opt-in and include clear deletion.
- Protect a public billable endpoint with request concurrency limits, per-client rate limits, and deployment-level abuse controls. Resolve client IP only through explicitly trusted proxies.
- Restrict CORS to configured origins; use a same-origin production setup where possible.

## Configuration

Backend variables:

- `VISION_API_KEY`: secret for the chosen inference provider.
- `VISION_MODEL`: exact verified image-capable model ID.
- `VISION_BASE_URL`: fixed administrator-configured provider URL, never a user-submitted URL.
- `PORT`: backend port; suggested 3001.
- `APP_ORIGIN`: public application origin for production.

Securely configure the provider key in environment settings, not chat. Once the provider is chosen, allow its exact HTTPS hostname and test authenticated inference. Current credentials and network settings do not yet establish this capability.

## Implementation order and completion checks

### 1. Correct the demo and result model

Separate sample mode, remove false precision, replace the unsafe sample maker guide, and create generic result types. Keep the existing polished landing page.

Done when: sample input is always labeled; changing an uploaded photo cannot produce an unlabeled drone result; legacy sample content maps to the new schema.

### 2. Add the backend and provider adapter

Implement image validation, health and analysis endpoints, strict response validation, timeouts, cancellation, and provider error handling. Provide a clearly test-only injected provider for automated tests. Keep production sample mode explicit.

Done when: valid image requests invoke the provider adapter; invalid inputs are rejected; missing configuration yields 503; malformed provider data is rejected without crashing.

### 3. Connect uploads and results

Replace the timer with the analysis request. Add status, retry and cancellation. Reset obsolete results when inputs change. Implement generic image markers and linked cards.

Done when: a real object produces an image-specific result; marker selection works by mouse and keyboard; a failed request preserves the user's inputs and shows an honest error.

### 4. Complete the maker workflow and exports

Render materials and ordered steps from validated data. Add step checklists, JSON/SVG export, and print styles. Any saved history is opt-in.

Done when: downloaded exports reopen correctly, contain the current object's data, and cannot execute model-supplied markup.

### 5. Validate and deploy

Build frontend and backend. Run API tests with real images, meaningful mocked-provider failure cases, and browser tests on desktop/mobile. Test at least one real authenticated provider request separately from mocks. Deploy a single-origin application, configure secrets, validate HTTPS upload and download paths, and verify rate limiting.

Done when: a public HTTPS URL completes upload -> live analysis -> part exploration -> guide -> export. A local server or static HTML download alone does not establish deployed live analysis.

## Test matrix

- JPEG, PNG and WebP inputs; image orientation and marker alignment.
- Empty upload, four files, oversized images, corrupt images, forged MIME, oversized pixel dimensions.
- Missing credentials, upstream timeout, 429, auth rejection, malformed JSON, invalid marker ranges and references.
- Distinct object photographs produce distinct results; no hidden sample fallback.
- Input changes during analysis, cancellation, repeated generation, and removal of a source image.
- Observed/inferred styling and unknown dimensions; no invented confidence percentages.
- Component keyboard focus, small-screen overflow, reduced motion, print and exports.
- No credentials in frontend bundles or logs; source images absent from server logs.

## Release claims

May claim after verification: image-based component explanation, interactive educational annotations, materials and learning guides, downloadable reports.

Must not claim without separate evidence: exact internal reconstruction, manufacture-ready CAD, measured dimensions from unscaled images, certified safety, or guaranteed functioning replicas.

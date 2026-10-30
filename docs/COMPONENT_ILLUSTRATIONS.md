# AI component illustrations

The reverse-engineering workbench can request one explanatory image for a selected component. Generation never starts automatically: the button states that it creates an AI concept and uses a protected paid endpoint.

Configure these server-only environment values and restart the service:

- `META_API_KEY`
- `META_IMAGE_MODEL` using the current Muse Image identifier shown in the participant dashboard
- optionally `META_API_BASE_URL` (defaults to `https://api.meta.ai/v1`)

The endpoint shares private access, same-origin checks, concurrency controls, and the durable hourly inference quota. If the shared quota is required but unavailable, it fails closed. Keys and provider error bodies never reach the browser.

Each prompt is grounded in the analyzed object name, component name, likely role, evidence status, and material candidates. Output is labeled “AI concept · not source evidence.” It does not establish shape, scale, dimensions, fit, materials, internals, or manufacturability. Source-photo details remain available before generation, and inferred parts remain explicitly identified.

Images live only in the current browser state. They are not inserted into the source analysis, project schema, or evidence exports. Regeneration is a new paid request.

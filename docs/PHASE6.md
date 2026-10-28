# Phase 6 · Build & Learn, diagram lab and blueprint refinement

## Model-powered learning

From a real scan, users can explicitly consent to sending its structured analysis to Baseten for a separate paper/cardboard learning analogue or a scoped follow-up question. No photos are resent. `POST /api/learn` validates request, source UUID, output schema and source-component references. Both scan and learning routes validate the exact frontend envelope before responding, including token metadata, preserving the response-contract fix.

Lessons have 3–7 steps with observations, an allowed materials list, possible household alternatives, model-estimated duration, safety notes and limitations. Materials are restricted to paper, cardboard, pencil, thread, adhesive tape and paper straw. The real scanned object must remain untouched. This feature does not claim to reconstruct or build the actual object. Question answers cannot contain assembly steps. Certain hazardous requests are routed locally to observation-only responses without an inference call; the model prompt also rejects unsupported or hazardous instruction requests. These are conservative constraints, not certified safety review.

Source evidence and user questions are untrusted data. Invalid guides are rejected without a sample substitute. The route shares scan concurrency, rate and hourly inference limits; timeout, cancellation and late-response protection apply. Cancellation does not guarantee reversal of already incurred provider usage. In-memory step completion, up to five follow-ups, and photo-free learning JSON export are available. Results/progress are not persisted across refresh or leaving the result screen.

## Circuit and functional diagrams

- **Scanned parts / functional** uses only validated source components and deduplicated model associations. It is not an electrical netlist, pinout or recovered wiring diagram, even for photographed electronics.
- **Example circuit / LED** is a separate app-authored educational schematic with battery, resistor, switch and LED symbols. It is not inferred from the scan. Toggle the switch to illustrate continuity and ideal current: `(3 V − 2 V) / 330 Ω ≈ 3.0 mA`; an open switch gives zero current. The assumed LED drop and values are illustrative; real parts behave differently. The simulator does not instruct users to energize or modify the scanned device.
- Both sheets export valid photo-free SVG. Expanded views, keyboard-operable switch and controls, mobile horizontal scrolling, and explicit evidence captions are provided. No model call is needed for diagram rendering or simulation.

## Blueprint presentation

The existing source-grounded blueprint now has a richer gradient drawing field, stronger typography, a more visible source-photo guide, refined controls and an expanded viewing mode. Existing classic/paper styles, zoom, source switching, filtered scope, annotation provenance and photo-free default downloads remain. User opt-in is still required to embed a prepared photo in a shared SVG. A result-section navigator makes parts, blueprint, diagrams and learning easy to reach.

## Verification

- Existing 14 scan API tests still pass after extracting a shared Meta completion adapter.
- Seven learning/circuit tests cover the exact public envelope, consent and references, invalid material output, local hazardous-question routing, question/step separation, timeouts, current calculation and SVG escaping.
- Browser tests invoke the actual learning server handler with a mocked upstream model, rendering its response unchanged in React. They exercise consent, lesson completion, scoped answers, local refusals, cancellation, export, circuit toggles, expanded drawings, mobile layouts and accessibility.
- The actual scan-handler/frontend regression, blueprint regression, twelve exploration/blueprint unit tests, production build, TypeScript and diff checks pass.
- A real Meta learning request through the local HTTP endpoint returned a five-step paper hinge model for the recorded CC0 mouse analysis, in about 10 seconds (4,365 reported tokens). The exact validated response is recorded separately in execution artifacts. This demonstrates integration, not guaranteed lesson accuracy or physical prototype verification.

Public release checks identify Phase 6 and validate the new route. Provider verification flags reset on redeploy until a new successful scan, as documented for previous phases.

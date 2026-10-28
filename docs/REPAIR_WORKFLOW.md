# Discover → report a problem → repair assessment

Discover & repair replaces the live scan’s study-model/build guide. The experiment bench, 3D concepts and CAD inspector remain available separately. The curated car sample no longer offers a craft build checklist; it directs users to scan a real object before requesting repair guidance.

## Working flow

1. Scan/upload 1–3 views of an object and consent to Meta image analysis. Review its parts, explanations and evidence; correct mistakes.
2. Tap **Something's wrong** or the **Repair guide** tab.
3. Describe a symptom **or** add a problem photo. Up to two additional problem/detail photos can accompany the original scan views. Live camera capture and native-device capture fallback are supported, with local review before sending.
4. Consent to send the original views, listed parts, description and new photos. **Assess the problem** makes a genuine provider request; it never substitutes a canned example.
5. The model selects a **part to check** only from the existing parts list, states its evidence and possible alternatives, and either:
   - returns one follow-up question/photo instruction with **no repair steps** while uncertain;
   - returns a supported low-risk suggestion with **3–5 repair steps**, each including an observation check and a stop condition;
   - routes a hazardous or unsupported repair to qualified service, without DIY steps.
6. Add the requested angle and/or answer the follow-up, then reassess. The previous question and assessment summary travel with the new evidence; earlier conclusions are not treated as ground truth. Suspect-part buttons highlight the corresponding component in Discover. Returning to Repair preserves the case form and added photos.
7. Download a photo-free repair report, or use the existing exploration JSON/Markdown exports to retain the assessment history. The latest ten assessments across cases are retained in the current scan. Start a different problem to clear the current case form. These discovery sessions remain in browser memory until exported; the Bench project save format is a separate workflow.

Changing symptoms, answers or problem photos hides old repair steps until reassessment. Editing the part context cancels pending repair requests and makes the earlier guide stale; exports identify historical input changes where known. New scans get separate assessment state. Cancellation preserves selected photos and problem text. Problem photos are never copied into the report or stored on the app server.

## Boundaries

A “supported” assessment means enough evidence for a cautious low-risk suggestion, not an independently verified fault diagnosis. Exact hidden internals, damage extent, part compatibility, torque values and safe operating condition cannot be established from a photo alone. If the faulty part is absent from the original list, request another scan/view instead of inventing a new part identifier.

High-risk reported symptoms such as smoke, sparks, gas leaks, swollen batteries, braking or steering faults trigger a conservative service recommendation without spending an inference call. This is keyword-based precautionary routing, not a diagnosis; other hazards still rely on model interpretation and human review. Model instructions restrict guides to low-risk external/user-serviceable actions and exclude hazardous electrical/pressure/battery/vehicle/structural interventions. Schema validation cannot prove that every generated sentence is correct or safe. The user must stop if a check fails or a situation differs from the described low-risk case.

## Engineering and verification

`POST /api/repair` accepts a bounded multipart request: original scan context/IDs, symptoms, previous question, consent, 1–3 original photos and up to 2 detail photos. All photos are decoded, MIME-checked, orientation-normalized, metadata-stripped and resized before inference using the same normalization as discovery. The model receives original versus problem-photo IDs explicitly. Both component references and photo references are validated; invented IDs, malformed output and 0–2 step “guides” are rejected. Upload limits, timeouts, two-request inference concurrency, rate limits and abort propagation apply. Provider reasoning traces and credentials are never returned.

Unit/API tests cover multi-round follow-up, image-only input, part/photo references, step counts, unsafe routing, malformed photos, absent consent, provider failure, timeouts and escaped exports. `npm run test:repair` uses clearly labeled injected fixtures to exercise the actual UI/API path, highlighting, stale guides, cancellation, new cases, photo-free downloads, four viewport widths and optional axe-core checks (`AXE_PATH=/path/to/axe.min.js`). Fixtures do not establish real diagnosis or repair accuracy.

A real Baseten call was also made with an attributed real public mouse photograph and an **explicitly hypothetical sticky-scroll-wheel symptom**. It returned HTTP 200 in 10.69 seconds, selected the existing “Red scroll wheel” part and produced four external-cleaning steps. It explicitly stated that no defect had been verified in the photo. This validates provider integration and the repair schema, not a physical fault diagnosis or successful repair. Sanitized result and source attribution: [validation/REPAIR_LIVE_RESULT.json](validation/REPAIR_LIVE_RESULT.json).

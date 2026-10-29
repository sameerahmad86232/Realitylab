# Submission draft — RealityLab

**Suggested problem statement:** Build for Your World. Choose Indie Developer versus Startup from the team's actual eligibility.

**Pitch:** RealityLab helps curious makers connect the visible parts of an everyday object to how it works. Meta vision and reasoning turn photographs into an evidence-linked investigation: component roles, conceptual blueprints, typical construction and a separate hands-on proposal. Users can inspect the evidence and challenge hidden-part hypotheses.

**Impact:** Curious makers and learners often recognize an object without understanding its behavior. RealityLab links component roles and working principles back to source photos and makes uncertainty visible. Actual learning outcomes and demand still need user evaluation.

**Meta tooling:** Server-side vision inference through Baseten using `meta-models/muse-spark-open-1026` produces schema-validated parts, hypotheses and principles. A separate text-only request creates a constrained paper/cardboard analogue or answers scan-grounded questions. No substitute model is silently used.

**Observation loop:** Separate craft steps expose an optional journal comparing the model’s predicted observation with the user’s actual matching/different/unclear result. Reports bind to the exact lesson, stay in tab memory and export with provenance. User reports are not independent validation; no physical test or measured learning improvement has been established.

**Technical execution:** Browser/server image normalization, explicit consent, server-only credentials, bounded inputs, cancellation/timeouts, shared inference limits, strict JSON and HTTP-envelope validation, linked photo/map/blueprint exploration, local marker adjustments, controlled SVG generation, photo-free exports by default, responsive accessible controls and WebGL fallback.

**Product:** https://realitylab.onrender.com

**Project brief and evidence:** https://realitylab.onrender.com/project

**Recorded tour:** https://realitylab.onrender.com/?demo=1 (explicitly recorded; no new inference on opening)

**Code for the deployed implementation:** https://github.com/sameerahmad86232/Realitylab/tree/codex/realitylab-live-explorer

**Review:** https://github.com/sameerahmad86232/Realitylab/pull/1. The repository default `main` currently contains the older Vite implementation; do not submit the root URL alone as the location of the current code.

**Video and contributors:** Add the actual three-minute public video URL, contributor names and representative before submission. See DEMO_SCRIPT.md. Nothing has been submitted automatically.

**Original work:** The previous application was intentionally removed; the current Next.js implementation was developed during the hackathon on October 28, 2026. Earlier history remains in Git. Identify current features/commits in the demo rather than representing all repository history as new. Dependencies, fonts and CC0 photos are credited. No external reconstruction repository is represented as our work.

**Limits:** Not universal image-to-CAD, recovered hidden wiring, diagnosis or a manufacturing plan. The procedural 3D fan is prepared geometry. Blueprints are conceptual and not to scale; the LED circuit is separate and app-authored. Generated content can be wrong. Recorded examples are labeled. Physical mobile tests, broader evaluation and production-grade abuse controls remain outstanding.

Before submission, verify repository/video visibility, contributor list, eligibility and deadline against the organizer's current dashboard.

See `JUDGING_READINESS.md` for rubric evidence and remaining human validation. The excluded-project examples make a generic image-analyzer or education-chatbot framing weak; demonstrate the linked engineering investigation and verify eligibility with the organizer.

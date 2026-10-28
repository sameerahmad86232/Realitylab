# Submission draft — RealityLab

**Suggested problem statement:** Build for Your World. Choose Indie Developer versus Startup from the team's actual eligibility.

**Pitch:** RealityLab turns everyday-object photographs into an inspectable engineering explanation, separating visible evidence from inferred mechanisms and connecting parts to conceptual diagrams and paper learning activities.

**Impact:** Curious makers and learners often recognize an object without understanding its behavior. RealityLab links component roles and working principles back to source photos and makes uncertainty visible. Actual learning outcomes and demand still need user evaluation.

**Meta tooling:** Server-side vision inference through Baseten using `meta-models/muse-spark-open-1026` produces schema-validated parts, hypotheses and principles. A separate text-only request creates a constrained paper/cardboard analogue or answers scan-grounded questions. No substitute model is silently used.

**Technical execution:** Browser/server image normalization, explicit consent, server-only credentials, bounded inputs, cancellation/timeouts, shared inference limits, strict JSON and HTTP-envelope validation, linked photo/map/blueprint exploration, local marker adjustments, controlled SVG generation, photo-free exports by default, responsive accessible controls and WebGL fallback.

**Product:** https://realitylab.onrender.com

**Code:** https://github.com/sameerahmad86232/Realitylab

**Video and contributors:** Add the actual three-minute public video URL, contributor names and representative before submission. See DEMO_SCRIPT.md. Nothing has been submitted automatically.

**Original work:** The previous application was intentionally removed; the current Next.js implementation was developed during the hackathon on October 28, 2026. Earlier history remains in Git. Identify current features/commits in the demo rather than representing all repository history as new. Dependencies, fonts and CC0 photos are credited. No external reconstruction repository is represented as our work.

**Limits:** Not universal image-to-CAD, recovered hidden wiring, diagnosis or a manufacturing plan. The procedural 3D fan is prepared geometry. Blueprints are conceptual and not to scale; the LED circuit is separate and app-authored. Generated content can be wrong. Recorded examples are labeled. Physical mobile tests, broader evaluation and production-grade abuse controls remain outstanding.

Before submission, verify repository/video visibility, contributor list, eligibility and deadline against the organizer's current dashboard.

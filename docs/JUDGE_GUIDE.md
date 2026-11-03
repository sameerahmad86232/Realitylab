# RealityLab — judge's guide

**Meta Global AI Developer Hackathon 2026** · Indie Developer · Build for Your World

**Try the product:** https://realitylab-fix-anything.vercel.app  
**Inspect the project brief:** https://realitylab-fix-anything.vercel.app/project  
**Recorded walkthrough:** https://realitylab-fix-anything.vercel.app/?demo=1  
**Demo video:** final MP4 exported; viewing URL to be added before submission  
**Repository:** https://github.com/sameerahmad86232/Realitylab

## The one-sentence challenge

*Can an everyday-object photo become a useful, inspectable explanation and cautious next-action plan—without pretending that a vision model has physically verified a hidden fault?*

RealityLab is designed around that distinction. It separates visible evidence from inferred internal parts, supports a conceptual engineering diagram, and withholds DIY instructions when safety or evidence is insufficient.

## Zero-credit walkthrough — about 90 seconds

The following route uses **labeled, previously recorded real model responses**. It works without consuming new AI credits and should remain available when the hourly live-analysis quota has been exhausted.

1. **Open the homepage** and select **See it in action**, or visit the [recorded tour](https://realitylab-fix-anything.vercel.app/?demo=1). The interface identifies this as a recorded run, not a fresh inference.
2. **Choose an example** such as the desk fan or bicycle. Notice the difference between photographed components and parts inferred from a typical object's operation.
3. **Open the source evidence** for a component. Trace it through the photo inspector, relationship map, and conceptual blueprint. Hidden components should not pretend to have observed photo coordinates.
4. **Read the cautious repair report:** possible cause, uncertainty, independent safety assessment, first thing to check, and up to three low-risk inspection steps where appropriate. Hazardous or ambiguous cases should instead request evidence or recommend a professional.
5. **Inspect a step's checkpoint** and stop condition. The optional image button requests an additional paid illustration; it is not needed to evaluate the core flow.
6. **Explore the construction/learning area** and export a blueprint or project file. Distinguish the proposed cardboard analogue and any user-entered report from a physically validated result.

## Live-photo walkthrough — optional, budgeted

A fresh photo scan genuinely calls the Meta Muse Spark model through Baseten. It can be slower than recorded examples and may be blocked temporarily by the shared hourly budget.

1. Use a safe, non-powered household object that is visually clear; avoid mains electricity, gas, dangerous tools, high-pressure equipment, medical devices, or vehicle-critical parts.
2. In **Scan your own object**, provide a JPEG or PNG and optional symptom/model description. The app validates and normalizes the photo locally and again server-side.
3. Review the photos and **explicitly consent** to inference.
4. Press the analysis button. The running-stage UI reflects real validation, normalization, quota, inference and safety milestones. If a genuine provider error occurs, the app reports it; it does not substitute a canned result.
5. Examine the risk/uncertainty labels, source-linked parts and the inspection guidance (when permitted). Judge the output as a *model proposal*, not a measured finding.

**Limitations of the public live demo:** the shared inference quota is intentionally low to control costs; a 429 or 503 may reflect capacity or provider controls rather than a nonfunctional frontend. For evaluation without spending, use the recorded flow. Provider latency is variable: a previously measured successful request took 17.84 seconds server-side, including about 17.43 seconds on the external model. Subsequent code changes target shorter outputs; a 10-second guarantee has **not** been established.

## What to examine technically

| Claim | Evidence |
| --- | --- |
| Real Meta model in the scan path | `lib/server/provider.ts` pins `meta-models/muse-spark-open-1026` via Baseten and validates provider responses. |
| One bounded initial inference | `lib/server/scan.ts` and `lib/server/orchestrator.ts` enforce a single model call per scan and return stage metadata. |
| Independent safety veto | `applySafetyGate` in `lib/server/orchestrator.ts` can remove steps/tools for risky cases even if the model proposed them. |
| Evidence-aware data contract | `lib/analysis.ts` validates component IDs, photo references, observed/inferred position boundaries and repair status. |
| Privacy and consent | `lib/photos.ts`, `components/CapturePanel.tsx` and `lib/server/scan.ts` control photo preparation, explicit submission and server-side validation. |
| Operational budgeting | `lib/server/limits.ts` reserves an atomic shared Upstash quota; `/api/health` exposes non-secret readiness indicators. |
| Responsive evidence UI | `components/LiveResults.tsx`, `components/RepairAssessment.tsx` and `app/result-cinematic.css` present the investigation and low-risk guidance. |
| No fabricated live fallbacks | `lib/scan-stream.ts`, the API tests and browser tests reject incomplete/invalid responses and preserve errors. |

## A fair evaluation

**What works:** photo capture, model-backed analysis, traceable components, conceptual diagrams, cautious inspection plans, recorded demonstrations, optional generated concept art, exported investigation files and automatic tests.

**What has not been demonstrated:** universal fault-identification accuracy, successfully repaired physical objects, reliable hidden geometry reconstruction, verified measurements, physical construction results across users, or broad device and accessibility validation. Optional concept art is illustrative; it is not observed repair evidence. **SAM 3.1 segmentation is not implemented in the current app.**

**Human judgment is central:** stop conditions and hazard referrals are not optional. An AI suggestion is never a safety certification.

## If something appears wrong

- **Public scan says rate limited:** use a recorded sample; the shared hourly quota may be exhausted.
- **Model request fails:** check the network and provider status. Never describe an old sample as a fresh result.
- **Camera unavailable:** choose an image file instead; mobile camera hardware support depends on browser permissions.
- **Blueprint differs from the physical object:** that is an explicit limitation; the diagram is an educational representation, not inferred CAD.
- **Optional illustration fails:** inspect the text and photo-linked evidence; illustration is not required for the core workflow.

## Replication / engineering checks

From the repository root with Node.js 24.19+:

```bash
npm ci
npm run build
npm run typecheck
npm test
npm run test:scan-http
npm run eval:recorded
```

GitHub Actions also runs fixture-based browser, capture, export, security and accessibility-related checks without real paid inference. A success in CI establishes program behavior against those fixtures, not physical repair correctness.

For security boundaries and a more detailed request diagram, see [ARCHITECTURE.md](ARCHITECTURE.md). For ready-to-paste submission wording, see [HACKATHON_SUBMISSION.md](HACKATHON_SUBMISSION.md).
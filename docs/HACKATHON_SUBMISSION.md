# RealityLab — Meta Global AI Developer Hackathon submission copy

**Status:** Draft prepared for the creator to paste into the **official participant submission portal**. This document does **not** mean the project has been submitted. Confirm any required fields, video formats, licenses, and team information in the official dashboard and accepted-participant rules.

**Official event:** https://dev.meta.ai/events/global-hackathon  
**Track:** Indie Developer  
**Theme:** Build for Your World  
**Officially published submission deadline:** **November 4, 2026 at 9:00 PM ET** (**November 5, 2026 at 7:30 AM IST**), subject to organizer changes. Prioritize a completed submission and confirmation before adding more features.

## Project title

**RealityLab AI — See the problem. Understand the evidence. Take the next safe step.**

## Tagline / short description

RealityLab turns photos of everyday objects into evidence-linked AI investigations: visible parts, possible faults, safety checks, and cautious step-by-step guidance when inspection is appropriate.

## Project overview — ready to paste

Everyday objects are all around us, but when something stops working, it is difficult to tell what a photograph actually proves, what is only a guess, and which actions are safe. RealityLab is an AI-powered visual troubleshooting prototype built around that gap.

A user uploads one to three photos of a physical object, describes a symptom, and explicitly approves AI processing. Meta Muse Spark vision and reasoning analyze the images through Baseten and produce a structured report: object identity, observed components, inferred mechanisms, possible causes, uncertainty, and the evidence supporting each explanation. The user can follow a component from the original photo to a relationship map and a clearly labeled conceptual blueprint.

A separate safety gate then decides whether the app can show a limited low-risk inspection path, needs more evidence, or should advise professional help. Supported paths include up to three steps, tools, observable checkpoints, common mistakes and stop conditions. Optional before/after feedback keeps the user's observations separate from a verified physical outcome.

RealityLab also includes recorded demonstrations that use no new credits, optional conceptual component/step illustrations generated through Meta's image API, locally exported case files, and a separate educational build-and-learn experience.

The result is not a confirmed diagnosis or an automatic repair: it is a more transparent, inspectable starting point for understanding a physical problem.

## What makes the implementation technically interesting?

- **Real multimodal model path:** `meta-models/muse-spark-open-1026` via Baseten with images and context; no fallback to fabricated outputs after a failed paid call.
- **Evidence boundaries:** Zod validation distinguishes observed components from inferred ones; hidden parts cannot claim photographed positions.
- **Safety-first control:** independent deterministic rules can veto the model's proposed instructions for hazardous or uncertain conditions. This is defense in depth, not validated safety certification.
- **Bounded, streaming orchestration:** one initial model call, progress events, request cancellation, timeouts, bounded images/output and typed response validation.
- **Deployable architecture:** Next.js frontend and API routes on Vercel, shared request reservations in Upstash Redis, server-side AI credentials, and recorded examples that can be evaluated offline.
- **Inspectability:** photo-linked components, interactive map, conceptual blueprint, local annotations, optional consented image generation and project export.

## How Meta AI is used

The main analysis uses the Meta Muse Spark model via Baseten's inference endpoint. A system instruction asks for structured visual evidence, cautious hypotheses and repair triage. The backend validates the JSON and independently applies safety rules before a result is shown.

When enabled and explicitly requested, a separate Meta image model generates illustrative component or step artwork. These pictures are not treated as photos, verified repairs, physical measurements, or reconstructed geometry.

**Do not claim** that SAM 3.1 or an independently executing 13-agent swarm is implemented. The current request uses one combined vision/reasoning model with logical reasoning roles and separately implemented code checks.

## Problem, impact and audience

The audience is curious makers, students, repair learners and people looking for a safer first inspection of ordinary household objects. Instead of blindly trusting a model's explanation, they can check source-linked evidence, read the model's uncertainty and see why a repair step may be withheld.

This is a plausible user benefit, **not a measured impact or user-research result**. Broader physical testing and meaningful user studies remain to be done.

## Built with

Next.js, React, TypeScript, Node.js, Sharp, Zod, Three.js, Lucide, Vercel, Upstash Redis, Baseten, Meta Muse Spark vision model, and optional Meta image API.

## Submitted links — verify before pressing Submit

| Portal field | Value / action |
| --- | --- |
| Live project | https://realitylab-fix-anything.vercel.app |
| Project brief | https://realitylab-fix-anything.vercel.app/project |
| Recorded zero-credit demo | https://realitylab-fix-anything.vercel.app/?demo=1 |
| Source code | https://github.com/sameerahmad86232/Realitylab |
| README | https://github.com/sameerahmad86232/Realitylab#readme |
| Judge guide | https://github.com/sameerahmad86232/Realitylab/blob/main/docs/JUDGE_GUIDE.md |
| Architecture | https://github.com/sameerahmad86232/Realitylab/blob/main/docs/ARCHITECTURE.md |
| Video | [RealityLab submission demo on Google Drive](https://drive.google.com/file/d/1jgVVoAhj1mMxrH_i_uhe8pl4if4mOCLC/view?usp=drivesdk) — **verify anyone-with-link viewing and the portal's supported formats** |
| Team / eligibility | **ACTION REQUIRED — enter actual approved participant/team details** |
| Screenshots, if requested by portal | **ACTION REQUIRED — upload screenshots from the actual app, not speculative mockups** |

## Video upload and verification

The final MP4 has been uploaded to [Google Drive](https://drive.google.com/file/d/1jgVVoAhj1mMxrH_i_uhe8pl4if4mOCLC/view?usp=drivesdk). **Its anonymous viewing access has not been independently verified.** Set **General access → Anyone with the link → Viewer**, test playback in an incognito/private window without a Google login, and verify that the official Meta submission portal accepts Google Drive links. If the portal requires a different host, upload the same video there and replace the link before submitting.

Before submission, watch the full video on another device. Confirm that it matches the current product, differentiates recorded examples from actual live inference, and identifies edits or skipped waiting periods where applicable. Ensure any background music, photos and footage are authorized for this use.

## A final five-minute judge check

1. Open the live homepage and recorded tour in a **fresh incognito window**.
2. Open the project brief, repository, README, and judge guide without a signed-in GitHub session.
3. Inspect `/api/health` for readiness without interpreting it as proof of diagnostic accuracy.
4. Confirm that at least one complete recorded case opens even when hourly live credits are temporarily exhausted.
5. Verify the exported video's **published URL**, playback, audio and description.
6. Confirm that only actually implemented Meta tooling is claimed in both the portal and video.
7. Paste the text/links into the portal, inspect its preview, and **submit**. Save the final confirmation.

## Known limitations worth stating to judges

RealityLab does not perform physical repairs, guarantee fault diagnosis, measure unseen parts, generate engineering-accurate CAD or independently validate a user-reported outcome. Blueprints and optional illustrations are conceptual. The safety gate is conservative but imperfect; users must avoid hazardous interventions and obtain qualified help where appropriate. Response latency varies with provider load, and a 10-second scan SLA has not been demonstrated. Public shared quota and provider billing controls limit available live requests.

## Suggested closing statement

RealityLab's contribution is not to make AI sound certain about a broken object. It is to make the model's visual reasoning **inspectable**, its limits **visible**, and the next action **appropriately cautious**.
# RealityLab — ordered remediation phases

The numbered issues below refer to the 32-item audit in the conversation. They are work items, not claims that code can establish demand, physical correctness or eligibility. Complete and review each phase before treating its outcome as established. A software deliverable and a real-world evidence gate have separate status.

## Phase 1 — one user, one useful task

**Status:** implemented in software; validation hypothesis still unproven.

**Primary user:** a maker preparing a hands-on engineering demonstration.

**Task:** use a familiar object to explain one visible principle, prepare a source-linked conceptual drawing, and explore a separate craft study whose actual result can be recorded.

**Changes:** landing page makes the audience/task explicit; a three-step mission connects evidence, drawing and observation; capture offers motion, stability and shape questions that fill the editable context; broader object-family prompts are secondary and labeled exploratory; project pitch and study protocol use the same task. No AI request starts when selecting a question.

**Exit checks:** task is visible on home/capture/project, selected question reaches the existing context field, users can edit/clear it, broader prompts remain available, no added inference, keyboard/mobile/accessibility checks pass. Protocol and empty data template exist. These checks establish implementation, not demand.

**Audit mapping:** 1, 2, 3, 5, 19, 20, 23. Narrowing the promise addresses scope/positioning; it does not create reconstruction, demonstrate differentiation or obtain organizer approval. Problem validation continues in Phase 3.

## Phase 2 — recognition and evidence evaluation

**Status:** software workflow implemented; independent held-out and human review evidence pending.

Create a versioned evaluation manifest, separate curated examples from held-out cases, and provide a repeatable runner/review workflow. Include familiar/unfamiliar objects, difficult lighting, clutter, crop/occlusion and multi-view comparisons. Record request failures, identity correctness, observed/inferred mistakes, marker placement and token/latency data. Human labels must be explicit and independent of the model; unknown labels stay unknown. Preserve failed cases and denominators. Paid evaluation is opt-in and bounded; do not silently spend credits or claim fixtures establish accuracy.

**Exit evidence:** machine-readable results, manual-review rubric, representative cases with provenance, and clearly reported counts/limits. A harness alone does not close recognition reliability.

**Audit mapping:** 7, 8, 9, 10, 11, 12, 13, 14, 15.

## Phase 3 — real activities and user outcomes

**Status:** app-authored procedure and blank worksheet implemented; physical/user participation still required.

Choose one low-complexity separate craft activity and make the source/prediction/actual-result loop demonstrable. Build it physically, document failures and revise it. Use the Phase 1 moderator script with intended users, record actual preparation time and task outcomes, and compare against their existing workflow without inventing a control result. Retain photos/video only with the participant's agreement. Do not promote generated or self-reported content to independently verified evidence.

**Exit evidence:** an actual artifact, reproducible materials/steps, recorded trial conditions and outcomes, and real user feedback. No automated script can substitute for these.

**Audit mapping:** 3, 4, 16, 17, 18, 32. Demand and learning benefit require further study even after a small pilot.

## Phase 4 — stronger, bounded Meta reasoning

**Status:** observation-follow-up software implemented; independent correctness/quality evidence pending.

Improve the evidence-to-reasoning loop around actual failures: source-grounded questions, explicit assumptions and consistency checks, and deliberate use of additional views when needed. Any new verification pass must show its cost and limitations. An LLM checking another answer is not independent mechanical validation. Prefer demonstrable quality gains over extra agents, models or calls for their own sake.

**Exit evidence:** before/after evaluation on the same held-out cases, preserved failures, exact model/provider provenance, measured token/latency tradeoffs.

**Audit mapping:** 6, with follow-up work on 10–13 and 16–18.

## Phase 5 — a simpler, recoverable project workflow

**Status:** planned.

Make the primary path photo → evidence → explanation/drawing → separate experiment obvious. Keep unrelated example circuits secondary. Provide validated save/restore for investigations, clear photo-inclusion controls, versioned exports and intelligible recovery. Avoid saving photos silently. Revisit the prepared 3D asset if it still creates the wrong expectation.

**Exit evidence:** users can complete the task without touring every panel; exported work can be restored with schema/reference checks; mobile layout and recovery tests pass.

**Audit mapping:** 21, 22, 23, 27.

## Phase 6 — latency, availability and spending controls

**Status:** planned; durable infrastructure may require configuration.

Measure the full user-visible workflow, distinguish upload/provider/render time, and optimize only demonstrated bottlenecks. Add a durable shared quota/usage store and appropriate access controls before broad promotion. Configure provider spend controls through supported settings. Do not describe a per-process counter, ephemeral local disk or arbitrary request count as a guaranteed dollar cap. Test restarts, concurrent users and provider failure recovery.

**Exit evidence:** measured workflow timings and failure behavior, quotas persisting across restart, explicit storage/configuration requirements and verified deployment behavior. No guaranteed uptime or latency claim without evidence.

**Audit mapping:** 24, 25, 26.

## Phase 7 — physical devices and accessibility

**Status:** planned; real hardware/assistive-technology participation required.

Test actual iOS Safari/Android cameras, weak GPU/WebGL fallback, keyboard-only navigation, reduced motion and screen readers. Document device/browser versions and observed defects, fix reproducible issues and repeat affected checks. Simulated camera and axe results remain separate from hardware/human findings.

**Exit evidence:** completed device/assistive-technology matrix with actual observations and remaining limits.

**Audit mapping:** 28, 29.

## Phase 8 — source alignment and submission

**Status:** planned; source links corrected already.

Review the current implementation against the older default branch, resolve the repository review mismatch through an explicit reviewed change, and verify the deployed SHA/source link. Rehearse one useful end-to-end story, record the actual three-minute narrated video, identify original hackathon contributions, verify contributors/track/eligibility/deadline and public links, then prepare submission. Recorded responses must stay labeled and a real inference wait/cut must be disclosed.

**Exit evidence:** reviewable current code, matching live deployment, actual public video and complete submission fields. Eligibility and final submission outcomes cannot be asserted by code.

**Audit mapping:** 1, 30, 31, 32.

## Tracking rule

Mark each item separately as implemented, automatically checked, manually reviewed, or physically/user tested. Do not call all 32 issues “fixed” because eight documents, a better pitch or a test harness exist. None of the planned evidence has been fabricated or collected automatically.

### Phase 2 execution note

The software, offline baseline and first four-request controlled run are implemented and automatically checked. The controlled run yielded three valid envelopes and one no-object rejection, with zero automatic retries. See `evaluation/runs/controlled-2026-10-29/report.json`. Human correctness review and independent held-out coverage remain pending; Phase 2 is not evidence-complete.

### Phase 4 software note

`OBSERVATION_REASONING.md` describes the explicit full-report attachment and structured Meta review. Drafting is local; sending is one consented learning request. Stale attachments block sending, source/lesson/step references are checked, and model hypotheses remain unverified. No held-out accuracy or physical success gain has been established.

### Phase 4 integration note

Two explicit hypothetical requests passed the live observation-review contract before/after a prompt adjustment. `evaluation/observation-reasoning/comparison.json` verifies identical request content and retains limitations in both answers. No accuracy or general quality gain is established; residual material-language overconfidence and independent review remain open. The Phase 3 physical results remain empty.

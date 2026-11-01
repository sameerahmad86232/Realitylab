# FixCore orchestration foundation

Each scan now has request-local case state, a typed stage event contract, and an execution trace in `meta.orchestration`. No case database or server photo persistence is introduced.

The actual stages are upload/access/consent validation, image normalization, existing shared quota reservation, combined evidence/diagnosis/plan inference, independent deterministic safety rules, and final result validation. Manual retrieval and follow-up checkpoint review now run as separate user-requested stages with their own traces. The initial scan skips them until an exact model/source URL or after photo is provided. Stage completion does not mean that a physical fault or repair has been verified.

## Cost and safety controls

- One model request per scan, no automatic paid retries.
- Up to three photos and 500 context characters; existing pixel, file, body, and normalization limits remain enforced. The provider entry point also rejects oversized normalized payloads.
- Model output capped at 6,000 tokens. This is an output cap, not a promise about total multimodal input tokens, dollar spend, or optional illustration charges.
- Existing production private-access, shared quota, concurrency, provider-spending-cap, and 80-second timeout checks remain in place.
- Safety code can escalate a model's low-risk answer to professional referral or ask for more evidence. It cannot loosen the model's restrictions. Hazardous object/symptom and action patterns strip tools and procedural steps. These conservative rules are defense in depth and require category evaluation; they are not a complete safety classifier or an independently validated diagnosis.
- Optional illustrations remain explicit separate requests under their existing controls.

## Transport and UI

`POST /api/scan` keeps its JSON contract for existing clients. With `Accept: application/x-ndjson`, it streams typed `stage` frames followed by one `result` or `error` frame. Streaming responses use HTTP 200 after headers begin; clients must inspect terminal error frames for application status.

The capture screen renders actual queued/running/completed/skipped/failed stage events. Final results retain timings, budget use, rule decisions and the case ID. Recorded older results have no trace and say so. The previous fixed checkmarks for all eight logical roles were removed.

Browser cancellation and stream disconnection propagate to provider inference. Cancellation cannot reverse usage already incurred. Interrupted or inconsistent streams cannot produce successful results. Traces contain stage metadata and fixed reason codes, not photos or user symptom text. Logs use the same photo-free trace; existing provider token totals remain in scan metadata/logs.

## Validation

Run `npm run test:orchestration`, `npm run test:api`, `npm run typecheck`, and `npm run build`. Orchestration tests use mocked provider responses and cover safety vetoes, case transitions, budgets, live streamed progress before inference completes, consent rejection, disconnect cleanup, and fragmented/truncated streams. No paid provider calls are required.

Manual acceptance: upload a JPEG/PNG, give consent, analyze, observe the real running stage, inspect the final trace, then repeat and cancel during inference. Use a staging provider key and approved spending cap for live-model evaluation. Actual diagnosis correctness, model latency, and hosting proxy streaming need live environment validation.


## Manual lookup and follow-up review

`POST /api/research` takes `{sourceCaseId, model, url}`. It retrieves HTML or plain-text documentation from ten exact vendor hosts, follows at most three validated redirects, rejects credentials/nonstandard ports/query strings, reads at most 1 MiB and returns a source URL/title/date and an excerpt of at most 160 words. It labels whether the supplied model text was found; this is not proof that a manual applies to the photographed object. HTML scripts and navigation are removed. It uses no model call and does not feed retrieved text into repair generation. PDF extraction and automatic manual discovery are not implemented.

`POST /api/verify` takes consent, a bounded JSON source analysis/case/step/report, one before photo and one after photo in multipart form. Both are normalized and stripped of source metadata again. Only an existing low-risk inspection checkpoint is accepted. The deterministic gate runs on the source and new report; hazardous cases are referred without inference. Otherwise one additional Baseten call (1,400 output tokens maximum) compares visible evidence with the checkpoint. Results distinguish consistent, inconsistent, inconclusive and professional-help. The UI never marks the repair as successful or safe and never auto-completes a step.

Both endpoints enforce same-origin requests, existing access policy, bounded bodies, shared process throttling/concurrency, timeout and cancellation. Verification also reserves the existing durable paid quota and provider cap gate. No before/after photo is persisted. The source analysis is a browser-supplied model interpretation, not a signed or independently verified record. Each follow-up has its own request ID and preserves the source case ID; budgets apply per request rather than a durable lifetime cap across repeated follow-ups.

Validation includes `npm run test:followup` for redirect/URL boundaries, bounded source excerpts, unsupported PDF rejection, missing-model labeling, consent/evidence gates, zero-call hazard referral, normalized before/after payloads, output limits, quota exhaustion, and invalid model comparisons. Live-model and browser acceptance findings are recorded separately rather than inferred from mocked tests.

## Acceptance evidence — 1 November 2026

- 30 targeted scan/orchestration/follow-up tests passed with mocked providers; the complete unit/API/learning/security command and recorded evaluation also passed after aligning legacy access assertions with the existing public-access policy.
- A production-mode HTTP smoke test confirmed that unavailable durable quota still blocks paid inference. No provider call was made by that check.
- A real Microsoft support HTML page was retrieved through `retrieveManual`; its title, URL, model-text match and 160-word excerpt were returned.
- The existing deployed revision `497edd2` was exercised in the cloud browser using the repository's public CC0 mouse photo and an explicitly passive-inspection request. The live Baseten response identified a Lenovo wired optical mouse, returned an evidence-gated request for more photos, and displayed 15.5 seconds total wait and 4,893 tokens (request `21d260d7-45db-450f-b03a-866191c8fb3b`). This verifies the deployed provider path, not the still-pending deployment of the new research/review endpoints or general diagnosis accuracy.
- The browser CI suite includes an actual-handler-to-client acceptance test for scan → manual lookup → follow-up consent → inconclusive photo comparison, with mocked model responses and no paid calls. Its run status must be read separately; merely adding the test does not establish that browser CI passed.

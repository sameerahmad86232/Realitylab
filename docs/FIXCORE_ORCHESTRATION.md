# FixCore orchestration foundation

Each scan now has request-local case state, a typed stage event contract, and an execution trace in `meta.orchestration`. No case database or server photo persistence is introduced.

The actual stages are upload/access/consent validation, image normalization, existing shared quota reservation, combined evidence/diagnosis/plan inference, independent deterministic safety rules, and final result validation. Manual retrieval and follow-up repair verification are explicitly skipped because those services are not connected. Stage completion does not mean that a physical fault or repair has been verified.

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

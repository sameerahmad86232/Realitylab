# Recognition and evidence evaluation — Phase 2

This is an evaluation workflow, not proof of recognition accuracy. It currently contains five curated examples, one known failure and five related controlled challenges. There are **zero independently held-out objects and zero independent human correctness reviews**.

## Case provenance

`manifest.json` is versioned. Each case records its split, source, license, reference identity, input transformation and any historical response. CC0 source photos are credited in the manifest and `public/demos/manifest.json`. The cropped double-beard screwdriver is Andrew Pertsev's [CC0 photograph](https://commons.wikimedia.org/wiki/File:Screwdriver_-_Double_beard.jpg), retained with its original recorded uncertain response. That is a documented identity failure despite a valid JSON envelope. Source-file labels are references, not expert ground truth.

Controlled darkening, cropping and rotation are deterministic image-processing conditions. `fan-context-pair` submits the full photo plus a crop of that same photo; it is **not a second physical angle**. `blank-scene` is a generated solid canvas with no object. These related inputs must not be counted as independent new-object coverage. Add genuinely unseen, appropriately licensed objects before making broader claims; freeze the cases and prompt before evaluation and retain failures.

## Commands

From the repository root, Node 24.19+:

```sh
# No network or AI spending; validate historical envelopes, prepare challenge inputs.
npm run eval:recorded

# No network or AI spending; inspect exactly what would be uploaded.
npm run eval:plan

# Paid: explicit opt-in, at most four scan requests, zero automatic retries.
# A request limit is NOT a guaranteed dollar cap.
npm run eval:live -- --live --limit 4 --cases bicycle-dark,fan-crop,fan-context-pair,blank-scene
```

Live mode verifies the target's configured model, sends only to the deployed app or localhost, and preserves per-case results/errors. Changing a filename or receiving HTTP 200 does not establish correct recognition. A no-object 422 is reported separately from arbitrary service errors. Missing/invalid responses, timeouts and unexecuted cases remain visible; no example is substituted. A failed technical expectation exits nonzero, while all artifacts are retained. If the initial health check fails, `setup-failure.json` records that no scans were sent. If a process is interrupted, previously finished per-case files remain; the final summary may not exist and provider work may still consume credits.

Outputs default to a fresh `/tmp/artifacts/evaluation/…` directory; `--out` must name a new directory. Each report includes the manifest hash, uploaded-image/bundle hashes, payload hashes, model/request provenance, HTTP statuses, client times, server times when returned, server release/revision when available, request count and retry count. The local prompt-file hash is not proof of the remote prompt. Historical original upload bytes/prompt versions were not captured; their image/response pairing is declared provenance, not a cryptographically proven original request.

## Human review

Open the saved prepared image(s) and original payload. A human reviewer should compare the image and, where necessary, the actual object or reliable documentation. Do not have the model assign its own correctness label. Leave unknown facts `not-reviewed` or `uncertain`.

The generated `review-template.json` and repository `reviews.json` intentionally have empty review arrays. To add an actual review, use `reviewSchema` in `lib/evaluation.ts`: case ID, exact input-bundle/payload hashes from the report, pseudonymous reviewer ID, `reviewer_type: human`, actual timestamp, identity rating, optional per-part ratings and substantive notes. The human marker is a declaration, not authenticated proof of a reviewer. Do not invent a reviewer or populate fixtures as real evidence.

Rubric:

- **Identity:** does the main object identification match the object? Avoid scoring an uncertain descriptive answer as a correct exact identity.
- **Part identity:** is the named feature present and correctly characterized? A generic functional statement alone is insufficient evidence.
- **Evidence label:** does an “observed” claim correspond to visible evidence? Are hidden internals kept inferred? Unknowns remain unknown.
- **Marker:** is the approximate point actually on the named feature in the referenced view? Mark hidden/unlocated features not applicable. Do not force every feature to have a marker.
- **Materials/functions:** photograph-only composition and hidden-function claims generally remain unverified; explain specific concerns in notes.

Apply annotations without new AI calls:

```sh
node scripts/evaluate.mjs --mode review \
  --report /tmp/artifacts/evaluation/RUN/report.json \
  --reviews /path/to/actual-human-reviews.json \
  --out /tmp/reviewed-report.json
```

Review mode checks saved-image and payload digests. Stale bindings, invented part references and duplicate case reviews are excluded from counts. The first version accepts one unambiguous review per case; disagreements should be adjudicated and documented rather than silently averaged. Correctness counts always show the reviewed denominator and outstanding cases. `accuracy_claim` remains null: this small, nonrepresentative suite does not establish population accuracy.

## Remaining gate

The software can reproducibly capture outputs and support review. It has not supplied independent human labels, a representative held-out dataset, physical mechanism validation or measured learning benefit. Those remain open Phase 2/3 evidence requirements.

## Recorded controlled run — 29 October 2026

[`runs/controlled-2026-10-29/report.json`](runs/controlled-2026-10-29/report.json) captures exactly four live requests against release `evaluation-workflow-v18`, revision `c4562141bb7eca6e1a17b2e1d2754351aea4844e`, with no retries. Three returned valid analysis envelopes (darkened bicycle, cropped fan, full fan plus the same crop); the synthetic blank returned the expected no-object 422. The saved prepared images allow hash-bound review. The rotated-mouse condition was not executed. These cases reuse known objects and are not an independent accuracy benchmark.

The model identified the three object-containing inputs as bicycle/fan variants; that is a description of the output, not a human correctness rating. Parts, materials, markers and principles remain unreviewed. Known usage totals 13,897 tokens for three successful envelopes; usage for the no-object response was not returned and is unknown, not zero. Server processing for the three successful envelopes ranged from 12.66s to 20.798s. A separate health request exceeded a 20s timeout while the evaluation health check and all four scan requests completed; its cause is unknown. No uptime or latency improvement is claimed.

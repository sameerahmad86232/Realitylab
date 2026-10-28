# Phase 3 · Real Meta object analysis

## What ships

`POST /api/scan` accepts 1–3 JPEG/PNG multipart `images`, `consent=true`, and optional `context` (500 characters). `BASETEN_API_KEY` stays on the server. The integration uses the participant-confirmed `https://inference.baseten.co/v1/chat/completions` route and exact eligible Meta model `meta-models/muse-spark-open-1026`. No other provider or curated sample is silently substituted.

The client prepares photos; the server independently checks payload size, format, dimensions and animation, strips metadata again, and sends JPEG data URLs. Reasoning is requested as JSON through a strict system prompt, then validated with Zod. Component IDs, relationships, photo references, evidence labels and final metadata are checked. Inferred parts cannot claim photographed positions. Confidence labels are uncalibrated model judgments. No medical diagnosis, hazardous construction, repair instructions, exact measurements, faithful 3D reconstruction or verified material composition are promised.

The result screen shows actual submitted photos, model-suggested component markers, observed/inferred explanations, likely principles, uncertainty and next observations. Select a component to open its detail and source photo. JSON export contains analysis/provenance without photo bytes or local URLs. New scan clears the draft; editing/removing photos invalidates the old result. The prepared 3D fan remains a separately labeled sample. Conceptual SVG generation for live scans is Phase 5, not represented by the sample SVG.

## Reliability and privacy

- Same-origin submission and explicit consent required. No cross-origin CORS access is enabled.
- 5 MB per photo / 20 MP, bounded ~15 MB total multipart body; normalized longest edge 1600px.
- Two concurrent requests, six attempts per IP/minute, fifty inference attempts per process/hour. No automatic paid retries.
- 80-second server timeout / 90-second client timeout, cancellation propagation and stale-response protection. Client disconnect cancellation is best effort; provider billing can still occur for started work.
- In-memory limits reset on restart and are per process. They are a demo guard, not a distributed quota or guaranteed spending cap. Set actual provider billing controls separately.
- No server photo persistence or image logging. Logs contain request ID, latency, status/stage, model and token count only. Provider retention policies apply. Client drafts/results stay in memory, not localStorage.
- `/api/health` distinguishes key configuration from a successful validated call in the current process. Redeployment resets `liveVerified`.
- Token counts use provider-reported usage. Dollar costs are not guessed without verified pricing.

## Validation

`npm run test:api` tests real image normalization plus mocked provider responses: consent/origin/key validation, response/schema errors, references, auth, throttling, no-object output, timeouts, cancellation and oversized/corrupt inputs. `npm run test:live-ui` uses explicitly test-only fixtures for response errors/retry, cancellation, stale responses, actual-photo UI, inference labels, export, mobile, accessibility and draft lifecycle. `test:capture` and `test:browser` keep Phase 1/2 regression checks. All browser suites intercept `/api/scan` and incur no inference charges.

A real direct provider check identified five mouse components. A separate full local HTTP round trip returned six components in approximately 10.5 seconds. These demonstrate working transport and validated output, not broad accuracy or calibrated confidence. The initial HTTP integration failed before inference; replacing an incompatible Request clone fixed the framework boundary. The recorded successful HTTP response is in `LIVE_VALIDATION.json`. Public Render verification is recorded separately in execution artifacts after deployment.

Live test photo: [ComputerMouseCloseup.jpg](https://commons.wikimedia.org/wiki/File:ComputerMouseCloseup.jpg), Raysonho @ Open Grid Scheduler / Grid Engine, CC0. It is used only for testing and is not a substitute for uploaded photos.

Opt-in real call (consumes credits, exactly one request, no retry):

```sh
node --use-env-proxy --use-system-ca scripts/validate-live.mjs --live
```

Set `VALIDATE_ORIGIN` to the deployed app to test its server. The script writes source attribution and a photo-free response under `/tmp/artifacts/phase-3/`; the downloaded public test photo is a separate local file.

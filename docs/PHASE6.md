# Phase 6 · Measured availability and usage controls

RealityLab now reports the timing and usage it can actually observe. New scan responses separate request upload/read, image normalization, shared-quota lookup and Meta-provider inference. The result page shows those server segments, the provider-reported token count, and the browser’s full wait from pressing **Analyze object** until a validated response is ready. Unknown token usage stays unknown; the app does not infer dollar cost from tokens.

## Two quota layers

The existing in-process controls still bound concurrency, per-minute traffic and hourly inference requests. They reset whenever a Render process restarts and therefore are not a durable billing cap.

An optional Upstash Redis REST integration adds an atomic shared hourly reservation across processes and restarts. Configure these server-only values:

```text
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=secret
INFERENCE_REQUESTS_PER_HOUR=50
DURABLE_QUOTA_REQUIRED=true
```

Use `DURABLE_QUOTA_REQUIRED=true` only after testing the store. In required mode, a missing or unavailable store pauses inference with a 503 instead of spending without a shared reservation. When false, a store outage falls back to the process counter and the health/UI status says the durable limit is not enforced. The reservation is one atomic Redis script; concurrent app instances cannot both claim the final slot.

Successful requests also make a best-effort write of request-kind and provider-reported token totals to an expiring hourly usage record without delaying the user response. This record is observational. It is not a dollar ledger and is not used to claim a billing cap.

## Health and provider controls

`/api/health` exposes non-secret capacity status: active requests, process usage and reset behavior, shared-quota state/remaining count, and whether the owner has marked a provider-side spend cap as verified. It never returns store URLs or tokens.

Set `PROVIDER_SPEND_CAP_VERIFIED=true` only after confirming a supported limit in the Baseten billing dashboard. RealityLab cannot inspect that dashboard and does not automatically establish a dollar cap. The current Render service remains usable with restartable counters while shared-store and provider-cap status are visibly unverified.

## Validation and remaining work

Unit checks cover configurable process limits, missing shared storage, atomic reservations, shared rejection, optional fallback and required fail-closed behavior. Existing concurrency tests remain. Browser checks cover the visible availability statement and timing panel without paid calls.

This phase does not add user accounts or per-user entitlements. Broad public promotion still needs an actual shared store, a verified provider billing cap, restart/concurrency deployment checks, and an access policy appropriate to the event.

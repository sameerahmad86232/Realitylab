# RealityLab Fix Studio — hackathon MVP

**Entry point:** `/fix` (linked from home). The existing object explorer remains unchanged.

## User journey
1. Upload 1–2 photos (JPEG/PNG, 5 MB per file) and describe a concrete problem (12–600 characters).
2. Explicitly consent before a paid call is made. The client POSTs a multipart form to `/api/repair`. The server enforces image limits, normalizes photos with Sharp, and calls the Meta Muse Spark model through the existing Baseten provider.
3. The model is asked for a strict JSON repair plan. The server validates it with Zod and applies an additional deterministic safety filter for dangerous symptoms. The separate Fix Studio results screen renders hypothesized causes, step navigation, expected outcomes, stop conditions, and final checks.
4. Each **live** step can optionally request one Meta-generated *concept illustration* through the existing `/api/component-image` endpoint. No image call occurs automatically. Returned images are never treated as measurements or evidence.
5. The no-credit **ready-made example** demonstrates the complete UI, openly labeled as an example. It does not imply live inference. Its illustrations are intentionally not enabled.

## Server environment checklist
- `BASETEN_API_KEY` — required for live repair analysis. Model: `meta-models/muse-spark-open-1026`.
- `PROVIDER_SPEND_CAP_VERIFIED=true` — required by the existing provider implementation in production **only after independently confirming the actual provider spending cap**. Do not set this without verification.
- `REALITYLAB_ACCESS_CODE` (at least 16 chars) and `REALITYLAB_SESSION_SECRET` (at least 32 chars) — required for the existing private access gate in production. Unlock at `/access`.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` — durable request quotas are mandatory in production under the existing limits policy.
- `META_API_KEY` and `META_IMAGE_MODEL` — optional **direct Meta image generation**; the chosen model and `/images/generations` compatibility must be verified in the participant dashboard. The UI clearly reports if the service is not configured; no illustration is fabricated.
- `APP_ORIGIN` — optional origin restriction; can default to `RENDER_EXTERNAL_URL`.

Never put these secrets in client code, GitHub, screenshots, or demo recordings.

## Validate before judging
```sh
npm ci
npm run typecheck
npm run test:repair
npm test
npm run build
npm run dev
```
Open `http://localhost:3000/fix`. Check the sample first (no credits). Then with valid provider configuration and authorization, upload a well-lit photo of a simple, safe everyday object, enter a problem, give consent, and verify the live plan and image generation **separately**. Use the `/api/health` endpoint to check available provider/quota configuration without exposing credentials. For a public demo, access-code restrictions must be handled intentionally, never bypassed.

## Three-minute presentation
- **00:00–00:25:** The problem — generic instructions cannot understand the object in front of the user.
- **00:25–01:00:** Photo and symptom submission (show consent and transparent safety limits).
- **01:00–01:45:** Step navigator, possible causes, tools and checkboxes. Explicitly distinguish hypotheses from evidence.
- **01:45–02:20:** Generate one optional AI concept visual for a step, only if image API is confirmed configured.
- **02:20–03:00:** Show risk escalation and print guide. Explain what is implemented versus still experimental.

## Honest limits
No measured geometry, reliable autonomous diagnosis, certified repair, 3D reconstruction, image-grounded fault verification or automatic fix is claimed. Generated concept art can misrepresent shapes. The example is a prepared fixture. Production API keys, quota store and spend cap must actually be configured; checked-in code alone does not make paid features live. No live provider calls are made in the automated tests.

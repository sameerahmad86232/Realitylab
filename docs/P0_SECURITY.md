# P0 · Paid inference access and spending safeguards

The public demo and recorded examples remain free to view. Production paid inference now has three independent gates:

1. **Private preview session:** configure `REALITYLAB_ACCESS_CODE` (a non-public 16+ character strong random secret) and a distinct `REALITYLAB_SESSION_SECRET` (32+ characters). Visit `/access` to receive an eight-hour signed HttpOnly, Secure, SameSite=Strict session cookie. Both `/api/scan` and `/api/learn` reject requests without a session. Do not reuse the Baseten key as an access code. Rotate either secret if compromised; rotating the session key invalidates cookies. This is owner/invite-only shared access, not full user accounts.
2. **Durable shared request quota:** configure `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `INFERENCE_REQUESTS_PER_HOUR` (suggest 5 for private previews), and test the store. In production, requests now fail closed if the store is missing or unavailable, regardless of `DURABLE_QUOTA_REQUIRED=false`; the process-local rate limit remains defense-in-depth. The store prevents multiple workers consuming the same hourly count but does not cap currency cost or prevent charges from already-started requests.
3. **Provider billing cap acknowledgment:** verify a real provider-side spending cap (and its enforcement behavior) in your Baseten billing dashboard, then set `PROVIDER_SPEND_CAP_VERIFIED=true`. Production inference is paused until the flag is set. This environment variable is an operator attestation, **not** an API-driven verification or guarantee of a hard monetary cap. If Baseten does not provide a hard cap, do not mark it verified; use provider-specific controls or keep live inference disabled.

Order: configure private secrets; provision and test shared quota; confirm provider billing limit; only then enable public live demo access. Never commit secrets. `/api/health` exposes non-secret gate status.

Local development and fixture-based CI can run without private access secrets; deploying in production with missing secrets fails closed. Run `npm run test:security` for gate checks. Production session rejection is deliberate; it is not an outage. For a public hackathon video use recorded examples when live requests are paused.

## Real HTTP production smoke check

Run `npm run build && npm run test:prod-security` to start an isolated production-mode Next.js server on localhost with **test-only** private-access credentials. The test verifies `/access`, valid and invalid sessions, cookie security attributes, login throttling, unauthenticated scan/learn rejection, and authenticated scan fail-closed behavior when durable Redis is absent. It makes no external model calls and does not use actual production secrets. GitHub CI runs this after the unit/build suite.

This is a test of the server logic, **not** confirmation that the live Render credentials, reverse proxy, branch selection, billing settings, or any provider account are configured. Those still require deployment-level verification.

The private form endpoint validates POST Origin against `APP_ORIGIN` (or Render's `RENDER_EXTERNAL_URL`) rather than an internal reverse-proxy URL. Set `APP_ORIGIN` to the **exact public HTTPS origin** if using a custom domain. The redirect target is likewise restricted to the configured origin; do not trust unvalidated forwarding headers.

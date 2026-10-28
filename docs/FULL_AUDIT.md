# Full website audit — October 28, 2026

Scope: current RealityLab Next.js application, public Render deployment, camera/upload flow, Meta/Baseten handlers, recorded examples, evidence views, blueprint and construction exports, learning, responsive layout, accessibility, browser lifecycle, dependencies and deployment checks. This is a source-and-browser audit, not a certification, penetration test, accuracy benchmark or physical-device test.

## Findings fixed

| Area | Reproduced problem / gap | Change |
| --- | --- | --- |
| Navigation | Screens changed only in React state; browser history did not represent them. | Hash routes now preserve Back/Forward navigation and browser-memory photo drafts. Direct links restore their screen; missing tab-only results recover into capture. |
| Keyboard access | Screen changes left focus on disappearing controls; fragment navigation could interfere with the current view. | Focus moves to main content, titles update per screen, How it works uses one navigation entry, and Skip to content retains the current exploration. |
| Inference budget | Two scans admitted at 49 attempts could both await normalization and then exceed 50. | A shared synchronous reservation runs immediately before inference. Concurrent regression returns one success and one 429, with exactly 50 attempts. This is still a process-local limit, not a billing guarantee. |
| Rendering efficiency | Fan frames continued while paused, hidden or off-screen; the background shader also ran off-screen. | Demand-driven rendering, viewport/visibility gating and reduced-motion handling stop unnecessary drawing; interactions and explode transitions still redraw. Browser instrumentation verifies drawing stops after viewport observation settles; the test waits for that event instead of assuming a fixed notification delay. |
| Graphics recovery | Failed module/setup work and lost WebGL contexts could leave unusable controls or resources. | Errors are caught, registered resources and listeners are released, and context loss switches to the static fallback with unavailable controls disabled. |
| Image compatibility | Photo guides required ImageBitmap even though image uploads had a fallback. | Shared decoding supports HTML images when ImageBitmap is absent or rejects the image; temporary URLs and bitmaps are released. |
| Responsiveness | Edge tracing ran as one long synchronous batch. | Bounded processing yields every 64 rows and checks cancellation between batches. This reduces blocking; it is not a measured phone-performance claim. |
| Response and discovery | Generic headers, no social preview metadata, sitemap or crawler rules. | Added nosniff, frame protection, referrer policy, camera-only permission policy, opener isolation, share metadata, canonical homepage, sitemap and crawler rules. Crawler rules are not access control. |
| Error recovery | Default unknown-page view lacked an application recovery path. | Branded 404 with a home link and a rendering-error retry/home screen. No raw server error details are shown. |

## Coverage and evidence

| Area | Verification / limits |
| --- | --- |
| Build and types | Production compilation and TypeScript checks. |
| Server and model contracts | 38 API/unit/learning tests: normalization, actual serialized response, strict schemas, malformed output, incorrect references, consent/origin checks, provider errors, timeouts, cancellation, concurrency and budget reservation. Provider responses are fixtures; no paid calls in these tests. |
| Capture and camera | Browser tests validate signatures, size/pixel bounds, mixed batches, orientation/normalization, main-view ordering, draft clearing/preservation, consent reset, simulated camera review/retake/use and permission recovery. Actual hardware is not simulated by these checks. |
| Results and maps | Observed/inferred scope, selected part synchronization, filtering/search, source views, local annotation and immutable model exports. |
| Blueprints | Themes, zoom, source guide, local edge study, expanded views, keyboard callouts, XML escaping and default photo-free SVGs; explicit source-image embedding and source-change opt-in reset. |
| Build dossiers | Assembly references, construction SVG safety, practical steps/materials, source links, completion, scoped questions, cancellation, recorded provenance and tab-memory reuse without another inference request. |
| Graphics | Orbit/explode/pause, reduced motion, unavailable WebGL, simulated context loss and draw-call instrumentation while paused/off-screen. Software Chromium rendering is not a low-power GPU benchmark. |
| Visual assets | Artwork and source images load, generated art remains labeled as illustration, and workflow controls work by keyboard. |
| Mobile and accessibility | Automated Chromium checks at 320/390/1440 widths, modal/focus behavior and axe checks over the tested screens, including the 404. This is not a full screen-reader audit. |
| HTTP and discovery | Expected response headers, genuine HTTP 404, social image metadata, robots.txt and sitemap.xml. |
| Production dependencies | `npm audit --omit=dev --json` reported zero known production vulnerabilities at audit time. This does not prove absence of undisclosed vulnerabilities. |
| Secrets and privacy | No .env files tracked; a current-tracked-file scan found no matches for the checked credential patterns. No secret values were read or printed. User photos are normalized before transmission, learning does not resend photos, exports exclude photos by default, and drafts remain in tab memory. Provider policies still apply. This was not a complete historical secret audit. |
| Deployment | Changes are pushed through the existing GitHub-to-Render deployment. Public health, recorded gallery and browser flows are checked after release. Local regression details are written to `/tmp/artifacts/full-audit`. |

Eight browser suites cover design, capture, actual handler serialization, exploration, blueprints, learning, recorded examples and audit regressions. The dedicated audit suite additionally checks history, skip links, keyboard focus, missing-result recovery, draw-call stopping, decoding fallback, context loss and HTTP/discovery behavior. CI runs these suites without inference credentials.

## Remaining limits

- Real iOS Safari and Android cameras, VoiceOver/TalkBack and low-end graphics hardware need hands-on testing.
- Generated build proposals are not physically tested. The earlier mechanically inconsistent proposal and ambiguous cropped-tool identification remain documented in ENGINEERING_DOSSIER.md. Model schema validity does not establish factual or physical correctness.
- Blueprints remain conceptual and not to scale; the product does not reconstruct universal CAD, verify materials or recover hidden wiring. Static generated artwork is not scan evidence.
- Inference limits and drafts are not durable across server/tab restarts. There is no authentication or distributed abuse-control service; provider spend limits and production load testing are still needed before a broad campaign.
- Render cold starts, external provider outages and credit balances can affect availability. Cancellation is best-effort once a provider starts work.

No new paid Meta/Baseten inference or Modal GPU job was needed for this audit. Existing recorded results were used for public UI verification.

## Subsequent follow-up

The [mobile and output resilience pass](RESILIENCE_AUDIT.md) adds phone navigation, offline request controls, preview-status corrections and long-label/export checks. The expanded validation now includes 40 API/unit/learning checks and nine browser suites.

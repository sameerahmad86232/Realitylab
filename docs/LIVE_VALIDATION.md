# Live Baseten validation

Verified October 27, 2026 using the existing secure `BASETEN_API_KEY` binding. No key value was printed or written to repository files.

- Model: `meta-models/muse-spark-open-1026`.
- Provider: Baseten, via the configured OpenAI-compatible chat-completions endpoint.
- Read-only authenticated model listing: HTTP 200.
- Application request: `/api/analyze` through Vite's local API proxy, HTTP 200.
- Input: the app's original AI-generated car concept asset, disclosed as such in the request.
- Result: 8 visible observations, 3 hypotheses; supported prediction type `unsupported`, as expected for a car exterior image.
- The response passed the application's strict schema, image-reference and observation-reference validation.
- Current app process health recorded `configured: true` and `liveVerified: true` after success. Verification resets on restart.

The first request failed because native Node fetch did not use the environment's HTTPS proxy. Enable `--use-env-proxy --use-system-ca` for the API process; the development runner and production start script now do so. Node 24.5+ is required. TLS verification remains enabled. The proxy-enabled read-only check and subsequent image request succeeded.

This verifies real model inference and response handling. It does not establish correct physical gear identification, accurate tooth counting, a measured physical experiment, manufacture-ready reconstruction, public deployment, or future provider availability. Those remain separate validation steps. Existing automated tests use isolated fixtures and are not represented as real inference.

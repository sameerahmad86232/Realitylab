# RealityLab Bench — working experiment loop

RealityLab Bench is available in the Experiment bench tab. Discover & repair is now the default workspace. It supports **two external gears in direct mesh, an ideal static lever, or an ideal pulley system**. Broad object exploration, approximate 3D concepts and local CAD inspection remain available in separate tabs. This is an AI-assisted experiment workflow; it does not autonomously conduct physical experiments.

## Use it

1. Open **Experiment bench**. Give the project a title.
2. Optionally choose **Scan a mechanism**, upload or capture 1–3 views, consent to photo analysis and analyze. Choose **Use these observations in Bench** to carry the photo descriptions into the experiment. Numerical inputs are never automatically confirmed from the scan.
3. Choose the applicable mechanism and enter measured inputs with the displayed units. Confirm counts, units and applicability. **Load numerical example** provides sample inputs only; it does not represent a physical test.
4. **Predict behavior** runs a deterministic server calculator. Read the model assumptions.
5. Perform a small passive tabletop observation yourself. Enter the measured output turns/direction or effort force, absolute tolerance and notes. Confirm that this is your recorded measurement, then **Compare & record trial**.
6. Read the discrepancy or agreement and deterministic next checks. Optionally consent to **Ask Meta to investigate**. Meta receives the setup, server-computed result, notes and optional photo descriptions, not photo bytes in this step. Its next-action category is checked against the deterministic comparison; incompatible results are rejected.
7. Choose **Use this check for next trial**, perform that observation, change one input if justified, reconfirm and repeat. Every recorded trial retains its own setup, measurement, notes and photo-description context. A saved investigation retains its model provenance and input notes. Earlier trials are not rewritten when the next setup changes.
8. **Save on device** stores an explicit, photo-free local snapshot. **Restore saved** restores it; current setup confirmation must be repeated. **Export JSON / Import JSON** transfer validated versioned projects. **Export experiment report** produces Markdown with trial calculations, assumptions to check and saved AI suggestions. Imports are user-supplied records, not authenticated evidence of physical experiments or provider provenance.

New/Import/Restore replaces the current workspace. Export first if needed. The device save is one local snapshot, not an account or server backup. Up to 25 trials are retained per project; start a new experiment after exporting a full record. Notes and photo descriptions may still be sensitive even though photo bytes are omitted.

## Models and comparison

- Gears: output turns = signed input turns × (−driver teeth / follower teeth), viewed from the same side. Wrong measured direction is a discrepancy, even when magnitude agrees.
- Lever: ideal effort = load force × load moment arm / effort moment arm. Moment arms must be perpendicular distances from the fulcrum to the force line, in meters; forces are in newtons.
- Pulley: ideal effort = load force / supporting strands; rope pull = lift × supporting strands. Count only rope segments directly supporting the moving load.

Comparison uses an absolute tolerance in the output unit, with a small floating-point roundoff allowance. Agreement applies to the reported measurement and tolerance; it does not prove the assumptions or verify safety. A discrepancy does not uniquely establish friction, miscounting or any other cause.

The deterministic tools work without an API key. AI investigation fails honestly when configuration, schema, network, timeout or action-consistency checks fail. It shares the inference concurrency/rate limits with photo analysis. User cancellation aborts the request. There is no automatic paid retry.

## Verification

- Unit/API cases cover all three equations, wrong gear direction, tolerance boundaries, invalid/unconfirmed inputs, mixed-model portable projects, incompatible AI actions, missing configuration and timeouts.
- `npm run test:bench` exercises photo handoff, three-model comparison, explicit AI consent, trial history, saved investigations, JSON/Markdown downloads, device save/reload, corrupt/valid imports, and responsive layouts. It uses injected fixtures and no credits. `AXE_PATH=/path/to/axe.min.js` includes axe-core WCAG checks.
- One actual request through the configured Baseten `meta-models/muse-spark-open-1026` route returned HTTP 200 in 8.766 seconds. The lever inputs and 1.2 N observation were **synthetic integration-test data**, explicitly labeled in the prompt. The returned review suggested checking the setup and explicitly rejected treating the input as a verified physical experiment. The sanitized final response is in `BENCH_LIVE_RESULT.json`; no reasoning trace, credential or photo bytes are included.

## What still requires external proof

A real physical experiment and representative user evaluation have not been conducted by the assistant. Public Render deployment/cold starts have not been verified. A daily monetary quota is not implemented; use provider spend controls for a public demo. This workflow improves the substantive project scope but does not establish hackathon eligibility or competitive ranking. It does not add faithful arbitrary-object reconstruction, hidden-part discovery or verified functional manufacturing plans.

### Real-object preparation and hosted validation

A scan can now request an applicability/measurement plan **before** numerical
inputs are available. Suggested models are accepted explicitly and leave all
numerical fields blank. Uncertain or unsupported results never provide an
executable numerical setup. Built-in measurement guides explain what to count
or measure for each supported model. See [REAL_WORLD_USE.md](REAL_WORLD_USE.md)
for actual hosted photo validation and Modal access status.

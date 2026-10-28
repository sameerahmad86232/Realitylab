# Using RealityLab with real objects

Public app: https://realitylab.onrender.com

## Verified hosted behavior

On October 28, 2026, the public HTTPS app passed the HTTP smoke check: page, health, deterministic numerical tool and foreign-origin rejection. Its Baseten analysis configuration was present. A subsequent **actual hosted image request**, using the attributed real clothespin photograph below, returned HTTP 200 in 24.119 seconds, object name “Wooden spring clothespin,” eight suggested observations and four approximate component shapes. The hosted health endpoint then reported `liveVerified: true` for that process. These timings are individual observations, not latency guarantees.

Source: [Clothespin&Co.jpg](https://commons.wikimedia.org/wiki/File:Clothespin%26Co.jpg), Marmotoons, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/). It depicts a pile of real spring clothespins. The model scoped its description to a representative top-center pin; individual markers, connections and shapes still require review. The photo is not bundled in this repository. The photo-free final response is in [validation/PUBLIC_REAL_PHOTO.json](validation/PUBLIC_REAL_PHOTO.json).

A second genuine Meta call tested the new preparation endpoint with these descriptions. It returned HTTP 200 in 5.19 seconds and correctly declined the ideal lever model: a clothespin’s unmeasured torsion spring is outside that solver. It did not invent numerical measurements. This call used the current local server; the final hosted preparation check is recorded separately after deployment. See [validation/REAL_PHOTO_PREPARATION.json](validation/REAL_PHOTO_PREPARATION.json).

## Real-use flow

1. Start **Experiment bench → Scan a mechanism**. Use clear photos of one small passive mechanism. Capture a whole view, a second angle and the relevant joint/detail; do not expose private labels or other people's information unintentionally.
2. Consent to analysis, then inspect the photo-linked observations. Correct errors. **Use these observations in Bench** carries descriptions, not independently verified measurements.
3. Optionally consent to **Plan measurements from this scan**. Meta suggests whether our gear, static-lever or pulley model applies. Ambiguous/unsupported objects must remain unmodeled. Preparation uses the descriptions rather than rechecking the original image, so it can inherit description errors.
4. If appropriate, **Use suggested model** selects a model with blank numerical fields. Open **How to collect real measurements**. Obtain the listed counts, distances and forces yourself. Meter inputs are distances in meters; force inputs are newtons. Counts and dimensions are not inferred from an uncalibrated photograph.
5. Confirm only after checking the inputs and model applicability. Predict, conduct the small passive observation, record your measured output and a justified tolerance, and compare.
6. Ask Meta to investigate a discrepancy, choose a check, change one variable at a time and repeat. Save/export the experiment record. The app does not independently verify that you performed the experiment.

No physical experiment was conducted by the assistant. The earlier numerical validation used synthetic values and remains labeled as such. A real photograph plus a valid response does not establish physical reconstruction accuracy, a spring constant, strength, safety, or the truth of every component claim.

## Modal GPU credits

The current working app uses the existing Baseten Meta endpoint. The deterministic physics tools require no GPU. Installing a Modal client or possessing credits does not deploy an inference service.

Modal client 1.6.3 has been prepared in `/workspace/.venv-modal`. Required secure access names are `MODAL_TOKEN_ID` and `MODAL_TOKEN_SECRET`, scoped to `api.modal.com` in the environment configuration draft. No token value is committed. The credential pasted into chat must be revoked and replaced through secure settings; it was not used or written into a Modal profile. Saving the configuration draft does not apply credentials or publish the environment.

Before GPU deployment, verify authenticated Modal access, choose a documented eligible Meta model/weight source and compatible GPU/serving configuration, verify its license/access, and use a protected endpoint with container limits and scale-to-zero behavior. The Baseten model identifier is a provider route, not a verified Hugging Face repository ID. The official Modal vLLM example currently demonstrates a different model; do not copy that model into a Meta hackathon submission and assume eligibility.

A separately evaluated reconstruction model could use GPU credits later, while Meta remains responsible for the evidence/experiment workflow. Reconstruction of exterior appearance would still not identify all internal parts or verify a functional engineering plan. GPU work has not been deployed or charged by this task; the current blocker is securely configured replacement credentials.

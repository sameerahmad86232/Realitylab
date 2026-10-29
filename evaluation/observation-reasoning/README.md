# Phase 4 — hypothetical observation-review probes

These are **software integration scenarios, not physical trials or independent correctness reviews**. They do not contribute to recognition accuracy or the Phase 3 physical-results file.

## First deployed probe

`before/` preserves the complete hypothetical request, actual Meta response and verification record against revision `3d57f5f2c2ae7d9a2b041f2e9c5d6817f3ce8b69`. The single request returned HTTP 200, a structurally valid review and matching lesson/step references. Client time was 13.387s; returned usage was 5,072 tokens. There were no automatic retries.

The response recognized that no physical trial occurred and questioned the flatness prediction. An assistant reading the output also identified two limitations:

- It described the real fan's cast construction too confidently, although the request only supplied unverified source analysis and a proposed craft lesson.
- One hypothesis invoked a simulation misinterpreting the model, although the request described a hypothetical software probe, not a physical simulation.

These are assistant observations, not human accuracy labels or an expert mechanical review. The response is retained unchanged. The prompt was then strengthened to keep text-only source analysis/candidate materials tentative, distinguish hypothetical examples from actual simulations, and prefer non-destructive checks rather than changes designed to force a prediction.

## Same-input comparison

The validation script supports an explicit `--request` replay of this saved hypothetical request. Each invocation with `--live` makes at most one learning call. Repeating a test after a prompt change is a separate documented experiment, not a hidden automatic retry. A second result should be retained alongside the first, with its deployed revision and usage. Even improved wording on this one known scenario would not establish an accuracy or physical-reasoning gain on independent held-out cases.

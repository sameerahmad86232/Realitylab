# RealityLab: hackathon requirements and revised build plan

Source: participant guide pasted by the user in this conversation. Event links and current provider documentation were not supplied as URLs; model capabilities, API schemas, eligibility, and organizer interpretations still require confirmation against official resources. This document does not establish organizer approval.

## Decision

Target **Push the Frontier**, with the Indie Developer track appropriate if entering as a solo developer rather than an eligible startup. RealityLab should help a person understand and test a physical mechanism, beyond describing photographs.

Proposed pitch:

> RealityLab turns a tabletop mechanism into a testable engineering model. It identifies visible components, makes an explicit motion prediction, guides a controlled experiment, and compares observed motion against that prediction.

The guide lists Simple Image Analyzers and simple AI for Education Chatbots as anti-projects. The present website and sample output do not establish a competitive or compliant project. Adding an agent label or extra model calls does not resolve that concern. The differentiated contribution must be implemented and demonstrated. Organizers retain eligibility discretion.

## Focused demo: a hand-cranked gear mechanism

Use one simple, non-powered, externally visible gear assembly as the primary real-world target. It gives clear component boundaries, motion, and measurable behavior. Prepare a second gear arrangement for a held-out demonstration. Avoid expanding into arbitrary object reconstruction before this workflow works.

User workflow:

1. Photograph the mechanism and, optionally, a ruler. Mark or correct the two gear centers and tooth counts.
2. Obtain an evidence-linked diagram of visible gears, axles, and contact relationships. Separate model suggestions from user-confirmed observations.
3. Predict output rotation direction and ratio from explicit inputs, using deterministic geometry/gear tools.
4. Receive an experiment: rotate the input gear a known number of turns and record the output turns and direction.
5. Enter measured turns, or upload before/after evidence when useful. Do not infer complete revolutions from two still frames.
6. Compute the expected and observed ratios, report the residual and assumptions, and explain disagreements such as counting error, slippage, or an incorrect contact graph.
7. Change a gear/input condition, regenerate the prediction, and rerun the test.
8. Export an evidence report containing observations, assumptions, equations, measurements, model provenance, and unresolved discrepancies.

A successful demo includes a real experiment and a comparison, not an animation presented as measurement. A discrepancy must be reported rather than forced into a passing result.

## Model use: revise the earlier Llama recommendation

The supplied guide names Muse Spark series, Muse Wonder, Muse Image, Muse Voice Transcribe, SAM 3.1, Muse Glimmer, and Muse Spark Open. Use an explicitly eligible model and verify its documented input/output support. Generic Llama use should not be assumed sufficient under this guide.

Recommended minimum:

- One eligible, documented vision-capable Meta model for component hypotheses and evidence-linked mechanism reasoning.
- Deterministic tools for graph validation, ratio calculation, measurement comparison, and report generation.
- Optional SAM 3.1 integration for component masks only after confirming API access and documented behavior. Ship real masks with editable corrections; do not substitute invented segmentation.

Potential open-weight route: the participant guide specifically instructs Baseten users to use `meta-models/muse-spark-open-1026`, rather than the model identifier in generic docs. This identifier is taken from the guide, not independently verified. Confirm availability, endpoint schema, image support, and authentication before implementation.

Do not build around an invented Meta endpoint or assume OpenAI-compatible requests without checking the provider documentation. Record the exact provider/model ID in the generated report. Clearly label mocked provider tests and sample data.

## A bounded agent workflow

Implement one orchestrator with explicit state transitions and typed tool calls; a team of autonomous agents is unnecessary for this scope.

States:

`capture -> inspect -> confirm inputs -> predict -> experiment -> compare -> revise/report`

Tools:

- `validate_component_graph`: verify gear references, contacts, and supported topology.
- `compute_gear_ratio`: calculate supported gear trains from confirmed tooth counts.
- `create_experiment`: produce a bounded, measurable hand-powered test.
- `compare_measurement`: compare expected and measured rotation values with stated tolerances.
- `export_evidence_report`: produce JSON, SVG, and printable report.

For two external meshing gears:

- Signed angular velocity ratio: `omega_out / omega_in = -N_in / N_out`.
- Predicted output turns: `turns_out = -turns_in * N_in / N_out`.
- A negative sign denotes opposite rotation under the chosen coordinate convention.
- Multiple simple external meshes multiply signed ratios; compound trains require explicit shared-shaft relationships.
- Absolute dimensions, torque, efficiency, and strength do not follow from tooth count alone.

The model explains and chooses supported tools. Deterministic code computes the quantities. If critical inputs are unknown, request confirmation instead of fabricating them. Store an inspectable tool trace; do not expose hidden model reasoning.

## Required changes to the existing application

1. Keep the polished frontend; change the primary CTA to Start a mechanism experiment.
2. Add a real server-side provider adapter and upload API from IMPLEMENTATION_BLUEPRINT.md.
3. Replace the fixed drone result with an image-linked component graph and editable observations.
4. Add tooth counts, contact graph, input direction, input turns, and measurement-source fields.
5. Add prediction, experiment, observed result, and comparison panels.
6. Add persistent per-run evidence and provenance in downloadable reports. Keep images in memory unless the user explicitly chooses storage.
7. Replace the current unsafe drone build substitutions with a static educational sample, or retire the drone demo from the submission path.
8. Change the current privacy text before live analysis: images will be sent to the configured inference provider.
9. Remove unsupported confidence percentages, exact inferred specifications, and claims about unavailable CAD/STL generation.
10. Keep sample mode visually separate and never silently use it after an API failure.

## Acceptance tests for the demo

- Same gear pair with 12 and 24 confirmed teeth, one input turn: predict -0.5 output turns.
- Swapping the driver/follower predicts -2 output turns per input turn.
- Adding an idler changes direction as appropriate without changing the magnitude of the overall simple-train ratio.
- Invalid tooth counts, disconnected graphs, and unsupported topologies produce actionable errors.
- Missing measurements remain unknown; no false physical validation.
- Measured discrepancy produces a discrepancy report, not a fabricated success.
- A second physical arrangement runs through the same live pipeline.
- Provider failure yields an honest retryable error with inputs preserved.
- Desktop/mobile UI, report exports, and API validation pass.
- At least one recorded real authenticated eligible-Meta-model run is distinguished from mocked automated tests.

## Judging alignment

| Criterion | Weight | Demonstrable evidence |
| --- | --- | --- |
| Impact | 30% | A specific maker/repair use case and a person using the result to understand or fix a mechanism |
| Meta AI tooling | 25% | Eligible model interpreting real evidence and guiding the next test; actual segmentation if implemented |
| Technical depth/execution | 20% | Typed outputs, editable graph, deterministic calculations, evidence trace, uncertainty and failure handling |
| Demo | 25% | One complete live physical experiment, a changed configuration, and a clear comparison/report |

The first eligibility gate also requires fit to the theme and reasonable use of eligible Meta tooling. Optimize for a complete, reliable mechanism workflow before adding optional model features.

## Rules and submission checklist

- Public repository; verify anonymous accessibility before submitting. Do not publish secrets.
- Maximum four participants; solo allowed. List everyone who contributed.
- One submission per team/startup, made by its designated representative.
- Three-minute demo video with a publicly accessible link.
- Clearly identify code, functionality, and features built during the event. Preserve commit history and provide a contribution table separating pre-existing code, event work, and third-party assets.
- The guide gives a building period of October 27–November 4. Do not present earlier work as built during that period. Ask organizers if the October 26 kickoff creates uncertainty for any specific contribution.
- Use only assets, data, code, and models that the team has rights to use; document licenses and attribution.
- Verify repository link, video link, live app, participant list, model use, and track selection on the actual submission form.
- Do not claim a bonus category solely because a provider/model is configured; demonstrate the qualifying implementation.

## Dates in India Standard Time

Converted from the guide's Eastern Time dates for 2026. Eastern daylight time applies in October; Eastern standard time applies after November 1.

| Event | India time |
| --- | --- |
| Kickoff, October 26 at noon ET | October 26, 9:30 PM IST |
| Agents 101, October 27 noon–1 PM ET | October 27, 9:30–10:30 PM IST |
| Agents 102, October 28 noon–1 PM ET | October 28, 9:30–10:30 PM IST |
| Fireworks session, October 30 noon–1 PM ET | October 30, 9:30–10:30 PM IST |
| Weekday office hours, 10–11 AM ET during October | 7:30–8:30 PM IST |
| Weekday office hours, 10–11 AM ET during November building days | 8:30–9:30 PM IST |
| Submission and Meta credit-claim deadline, November 4 at 9 PM EST | **November 5, 7:30 AM IST** |
| Closing ceremony, November 9 at noon ET | November 9, 10:30 PM IST |

Use the actual submission platform to confirm the deadline. Set a personal submission target of November 4, 10 PM IST, leaving several hours for upload or access problems.

## Suggested delivery schedule

- October 27: confirm eligible model/docs/access; freeze the gear demo; record the repository baseline and contribution scope.
- October 28: upload API, provider integration, schema and error paths; first real model call.
- October 29: image-linked editable graph and deterministic gear tools.
- October 30: prediction -> physical experiment -> comparison loop.
- October 31: second mechanism configuration, failed-prediction handling, and evidence report.
- November 1: complete live hosted workflow, rate limits, privacy and security checks.
- November 2: browser/API testing, measured evaluation cases, fix major failure paths.
- November 3: record three-minute video, prepare public README, contributor list and new-work table.
- November 4: rehearse, verify every public link, submit before the personal target; keep margin before the official deadline.

## Three-minute demo outline

- 0:00–0:20: show the mechanism and a concrete question: If I change this gear, what will happen?
- 0:20–0:55: upload a fresh image; show Meta-derived components, evidence, and user correction.
- 0:55–1:25: show the tool-computed prediction and experiment.
- 1:25–2:05: perform and enter the physical measurement; compare it with the prediction.
- 2:05–2:35: change the arrangement and show the updated result or honest discrepancy.
- 2:35–3:00: export the evidence report; state Meta model use, impact, and exactly what was built during the event.

## Credits and external prerequisites

Meta credits: the guide offers $150 per accepted participant, claimed individually through the official form. A payment method is required by the guide. A spend-limit notification is not necessarily a hard spending cap; inspect the provider's actual controls. Do not enter payment information or claim credits on another participant's behalf.

Partner credits are discretionary: Baseten up to $100 for selected participants, Modal $100 for the first 1,000 qualifying participants, Fireworks $25 for selected teams. Do not assume receipt or availability.

Before live integration, the participant must provide access to official API documentation and configure a usable provider credential securely. No credential values should be sent in chat. The app can be implemented and tested with isolated provider fixtures while this is pending, but live model behavior remains unverified.

## Prize details from the guide

Indie: $150k / $100k / $75k / $50k / $25k. Startups: $250k / $150k / $75k / $50k / $25k. Bonus awards: $20k Most Viral, $10k Meta Open Weight, $10k Community Vote, $5k Agentic Use-Case, $5k Creative Build. These sum to the stated $1m overall pool.

Best open-weight build requires eligible Muse Glimmer or Muse Spark Open use verified by the infrastructure partner. Best creative build specifically mentions Muse Image or Muse Wonder. Best agentic use-case depends on meaningful autonomy and task completion, not branding. Viral/community awards have separate social/gallery actions and deadlines; consult the actual platform instructions before participating.

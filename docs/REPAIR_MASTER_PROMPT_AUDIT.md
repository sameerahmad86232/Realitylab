# RealityLab repair master prompt — repository progress audit

Audited 1 November 2026 against the 18-page UI/UX blueprint and the supplied “world-class 3D WebGL website” specification. This is an implementation audit, not a claim that repair outcomes are validated.

## Executive finding

The current product is a tested **object understanding and reverse-engineering workspace**. It is not yet the blueprint’s **visual fault diagnosis and guided repair assistant**. The deployed experience has strong upload handling, evidence boundaries, conceptual blueprints, component exploration, a procedural Three.js scene, recovery, accessibility, and protected Meta inference. Its core schema and model prompt explicitly prohibit diagnosis and repair instructions, so the principal repair journey cannot exist without an intentional product/schema/safety redesign.

Estimated completion against the supplied repair specification:

- **Production engineering foundation:** about 70% reusable.
- **Visual landing-page specification:** about 35% represented.
- **Repair product journey:** about 30% represented after the first triage contract/UI pass.
- **Full specification overall:** about 35% complete.

These percentages are directional scope estimates, not test coverage or quality scores.

## Requirement matrix

| Area | Status | Repository evidence | Material gap |
| --- | --- | --- | --- |
| Camera/upload | Strong partial | `CapturePanel`, `CameraCapture`, normalization, consent, error recovery, three views | JPG/PNG only; no paste, WEBP/HEIC path, crop/rotate, language selection, or repair-specific symptom/model fields |
| Meta vision analysis | Working foundation | Baseten `meta-models/muse-spark-open-1026`, strict JSON/Zod, real recorded results | Output describes objects/components/principles; it does not produce faults, suspected causes, risk tier, tools, repair checkpoints, or resolved-state verification |
| Visual grounding | Partial | Approximate source-photo markers and user corrections | No SAM 3.1 segmentation, mask overlay, suspected-damage region, or proof-of-perception orchestration |
| Uncertainty | Strong | Observed/inferred split, no-object handling, limitations and explicit unverified labels | No repair-specific low-confidence branch comparing plausible causes |
| Safety | Strong software foundation | Safety notes, hazardous-question refusal, structured low/medium/high risk, stop conditions, professional-help and more-evidence branches | Policies still require category-specific evaluation and human review |
| Guided repair | Early implementation | Optional validated repair assessment supports a possible cause, first check, tools, up to three steps and checkpoints | No real held-out repair correctness evidence; recorded examples predate this contract |
| After preview | Early infrastructure | Protected per-component concept-image endpoint; optional Modal adapter is being prepared | No before/after repaired-object preview, comparison slider, or follow-up-photo verification; production image provider is not verified/configured |
| Reverse engineering | Strong | Blueprint-first results, component workbench, source/recreate decisions, diagrams and exports | This is useful but differs from the PDF’s primary repair task |
| Hero 3D | Partial | Real Three.js procedural fan, PBR materials, orbit/explode controls, demand-driven rendering and fallback | Requested object is an exploded electric motor; no bearing fault narrative, anchored annotations, diagnostic plane, fault Fresnel shader, or cinematic assembly sequence |
| WebGL shaders | Partial | Genuine lightweight procedural background fragment shader | Only one atmosphere-style shader; requested scan and component fault shaders are absent |
| Motion system | Limited | CSS transitions, requestAnimationFrame, reduced motion, visibility/intersection pausing | No GSAP/ScrollTrigger/Lenis, word splitting, section timelines, intro scale reveal, or cinematic scroll story |
| Repair studio | Not implemented | Component/blueprint/relationship exploration can be reused | No step-linked 3D repair camera states, progress sequence, power-isolation gate, Previous/Next repair controls |
| Three-panel accordion | Missing | None | Entire See/Understand/Fix interaction is absent |
| Global impact | Missing | Honest claims discipline exists | No sourced impact story, sphere, cards, citations, or trajectories |
| Final CTA/footer | Basic | Existing closing section and footer | Requested immersive engineering environment and footer animation are absent |
| Mobile/accessibility | Strong automated foundation | 320/390 checks, camera recovery, Axe, keyboard, forced colors, reduced motion, 44px safeguards | Actual iOS/Android, VoiceOver/TalkBack and low-power hardware remain untested |
| Performance/resilience | Strong | Pixel-ratio cap, offscreen GPU pause, resource disposal, cancellation, offline/error paths | The requested larger motor scene and extra shaders would need a new performance budget |
| 13-agent architecture | Not implemented | One scan prompt and one learning prompt share Muse Spark Open | Agent names are proposed roles only; there is no master-agent orchestration, SAM, web search, verification agent, or specialist routing |
| Standalone `index.html` | Not implemented by design | Production Next.js/React server application with protected API routes | A local-only single file cannot securely hold provider keys, private sessions, quotas, server image normalization, durable state, or Render API behavior |

## Conflicts that need one explicit decision

1. **Product:** repository = maker education/reverse engineering; PDF = repair diagnosis. The model prompt currently says “no diagnosis … repair.” Repair cannot be added as a visual reskin.
2. **Architecture:** master prompt demands one local `index.html`; the working app requires a server for secrets and safety controls. Keep Next.js for the real product. A standalone HTML file could only be an explicitly labeled visual prototype.
3. **Art direction:** master prompt specifies warm-white/orange/blue; PDF page 14 specifies a dark violet/cyan system. Use the master prompt’s light engineering lab for public marketing and reserve dark technical surfaces for inspection canvases.
4. **Scope:** the master prompt asks for broad repair categories including electrical appliances and plants. Risk policies differ sharply. Start with one low-risk category rather than presenting universal repair capability.
5. **Models:** the listed 13 “agents” are roles, not distinct models. Multiple calls do not create correctness. Add a role only when its output contract and evaluation demonstrate value.

## Recommended build order

### P0 — make one repair journey real (software contract implemented; evidence pending)

The versioned response now supports suspected causes, evidence, risk tier, stop conditions, required tools, three inspection/action steps, checkpoints, missing evidence, and professional-help guidance. Next choose a low-risk initial domain such as a bicycle mechanical issue or a non-pressurized household fitting, then add held-out evaluation and human review before promoting instructions.

### P1 — prove perception

Integrate SAM only for explicit suspected regions, preserve the original image, and expose an overlay toggle. Ask for another view when grounding or diagnosis is weak. A mask is model output, not proof that the cause is correct.

### P2 — rebuild the primary UX around the PDF

Make camera/upload the dominant first action. Implement Show → Locate → Understand → Act → Preview with progressive safe disclosure. Keep the existing blueprint/reverse-engineering workspace as an advanced secondary mode.

### P3 — create the motor-led visual system

Replace the prepared fan hero with a reusable motor assembly scene. Add diagnostic scan and restrained fault-rim shaders, anchored labels, reduced-motion/static fallbacks, and measured GPU budgets. Use native animation first; add GSAP only where a coordinated timeline materially improves the story.

### P4 — optional image preview and verification

Generate a labeled illustration only after safe structured guidance exists. Add before/after comparison without implying success. Follow-up-photo review must say “appears consistent/inconsistent/insufficient evidence,” never “fixed.”

### P5 — supporting storytelling

Add the accordion, sourced impact section, final CTA, and submission video after the core repair journey passes real scenario tests. Do not spend the remaining sprint implementing a decorative globe before the fault-to-safe-action path works.

## Acceptance gate

Do not describe RealityLab as a repair diagnosis platform until three distinct, allowed scenarios produce: a grounded suspected region, cautious possible cause, correct risk branch, usable three-step guidance, preserved failure state, and explicit human review. The existing recorded fan/bicycle/compass examples do not establish repair correctness.

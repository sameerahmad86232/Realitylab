# RealityLab — product and hackathon audit

## Assessment

The biggest obstacle is proof of usefulness and correctness, not typography. This is a polished prototype with real Meta integration. It is not yet a validated engineering tool, a universal object reconstruction system or a proven learning product. A stronger-looking site alone will not settle the hackathon guide's exclusion of generic image analyzers and education chatbots. Eligibility is the organizer's decision.

## Findings, ordered by importance

| Finding | Why it holds the project back | Action |
| --- | --- | --- |
| No demonstrated user outcome | A long feature list does not show that a maker completed a useful task or learned something correctly. | Focus the story on one source-linked investigation. Added per-step predicted-versus-actual observation journals. Still need actual participant feedback and physical artifacts. |
| Proposed builds can be physically wrong | A first real proposal was mechanically inconsistent. Schema validation checks structure, not mechanics. | Keep original object untouched; label proposals untested. Changed “See it work” to “Test the prediction.” User reports retain matching/different/unclear outcomes and actual notes, never automatic success. Real builds still need testing. |
| Broad recognition claims exceed evidence | Five curated records do not establish all-object support; a cropped screwdriver failed. | Keep documented failures public. Uncertain results now prominently request another look and expose the suggested next view and edit-photo action without automatic requests. Broader evaluation remains necessary. |
| May look like a generic image analyzer | The excluded-project examples make this a real positioning and originality risk. | Demonstrate the linked photo → evidence → conceptual drawing → grounded construction → tested observation workflow. Do not claim the new journal alone guarantees novelty or qualification. |
| Illustrative graphics can overpromise | Prepared 3D geometry and 2D edge studies can be mistaken for recovered 3D/CAD. | Existing prepared/recorded/conceptual labels remain. No dimensions, hidden wiring or physical-performance claims. Real reconstruction has not been implemented. |
| Presentation has substantial depth but a long path | Many panels and optional examples can distract from the central benefit. | Four-chapter tour and direct links; practical observation editors are collapsed per step. Demonstrate one object in the three-minute video, not every panel. |
| Latency and service availability affect live demos | Saved scans took 13–21 seconds server-side; a second dossier adds another call. Cold starts and provider errors remain possible. | Keep recorded tour explicit, errors honest, cancel/retry and drafts intact. Local journals/graphics require no model calls. No latency reduction or guaranteed availability is claimed. |
| Abuse controls are process-local | Rate/concurrency gates reset on restarts and do not provide a durable billing cap. | Do not claim production readiness. Durable shared quotas/auth and provider billing controls remain necessary before a large public launch. |

## Implemented enhancement: observation journal

Each practical step can record an outcome (`not-tested`, `matched`, `different`, `unclear`) and up to 600 characters describing the actual observation. Nothing is prefilled. An observation counts as logged only when the outcome is stated and actual notes are nonempty. Completion checkboxes remain separate progress tracking.

Reports bind to the exact lesson request ID and step index, not just the scanned object. Regenerating a dossier clears the old step-specific journal with an advance replacement notice; exporting first keeps it. Reopening the same recorded dossier preserves the existing journal. Drafts and reports are kept in the bounded six-scan tab-memory cache and clear on refresh. No photo, server persistence, inference request or third-party transmission is added by writing a report.

The learning export includes user reports, timestamps, report/draft status and the original model prediction, with an explicit self-report limitation. Draft notes are exported too. Wrong-lesson, invalid or nonexistent-step records are excluded. A reported match does not establish independent verification, prove the original object's function or support an accuracy percentage.

## Validation and remaining evidence

Unit checks cover false-success prevention, lesson/step binding and preserving failures/drafts in exports. The learning browser test exercises an uncertain scan, predicted/actual notes, failure export, tab-navigation retention, layout and accessibility. These tests use fixtures; they do not constitute a physical experiment or validate model reasoning.

Next human proof: try one separate craft proposal, record the actual failure/success honestly, get intended-user feedback on one concrete task, test physical mobile hardware, record the three-minute public demo, and verify eligibility/submission requirements. No testimonials, physical results, measured impact or final video have been fabricated.

Meta usage is real but still consists primarily of a vision request and grounded text requests. There is no autonomous verification agent, physical measurement pipeline or model fine-tuning. Do not claim those capabilities. The journal makes failures inspectable; it does not automatically correct them or turn self-reports into ground truth. More AI calls alone would not establish technical depth or usefulness.

Visual review caught nested cards squeezing the observation editor on small phones despite passing page-overflow checks. Mobile step cards now stack the progress control above the full-width content; the browser test additionally requires at least 180px of journal width at the tested screen sizes.

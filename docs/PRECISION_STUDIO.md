# Precision Studio implementation

The approved white-and-cobalt design is implemented in the actual React website.
The active theme is `frontend/src/precision-studio.css`, loaded after the existing
feature foundations. Legacy styles remain as structural fallbacks for the CAD,
manual physics, camera and report features; this is not a complete CSS deletion
or migration of those feature foundations.

## What changed

- Self-hosted Geist variable typography, graphite text, cobalt actions, pale-blue
  selection/evidence surfaces, consistent borders and compact control spacing.
- New original transparent coffee-grinder illustration, product labels and subtle
  blue shader light, with reduced-motion and no-WebGL behavior retained.
- Homepage composition follows the approved concept: header, product hero, concise
  feature strip, real upload workspace, clearly illustrative repair example,
  compact three-step process, object gallery, FAQ, final scan action and footer.
- Discover is the first studio tab; experiment/CAD/sample tools are secondary.
  Their underlying functions and explicit sample labels remain available.
- The empty workspace illustration is labeled as an example. Actual analysis
  replaces it with the user's own object context. It is not an inference fallback.
- Ordinary completed scans place results first and collapse capture controls.
  **Edit scan photos** restores the original form without erasing the report.
  Gear-pair setup workflows remain visible for their confirmed numerical inputs.
- Desktop repair uses source, symptom/evidence and assessment columns. The source
  shows the actual scan and clickable part list; narrow layouts stack them.
  Empty/uncertain/guide/service states are all real states, never simultaneous
  fabricated results. Camera, consent, follow-up, highlighting and report exports
  retain their existing behavior.
- Viewer background/grid and selected-part illumination use the new cool palette;
  source component colors and geometry are preserved.

## Validation

The production build, frontend lint, 71 unit/API tests, and general browser,
scan, camera/CAD, repair, Bench, shader and four-width UI audit suites passed.
The audit checks keyboard navigation, readable form sizing, image loading,
overflow and uncaught page errors. axe-core checks were run on tested states;
this is not a complete accessibility certification or physical-device test.
The lazy-image audit now explicitly loads/decode-checks images before evaluating
missing-image failures, rather than treating offscreen pending lazy loads as
broken assets. No assertions about actually missing images were removed.

Screenshots and design checks use local builds and injected or recorded results.
No new physical repair or reconstruction accuracy is claimed by this redesign.
No API keys, account data, fake testimonials or performance statistics were added.

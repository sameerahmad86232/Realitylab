# Phase 5 · Recoverable investigation projects

RealityLab now has one visible path through a result: **evidence → drawing → experiment**. The source-grounded functional diagram remains available, while the unrelated app-authored LED circuit is behind an optional control.

## Save and restore

**Save project** downloads a versioned `realitylab-investigation` JSON file. It can contain the validated model response, recorded-example attribution, current component/view, local marker corrections, generated lesson, follow-up answers, checked steps and user-reported observation journal. **Open project** validates the complete file before replacing the current workspace.

References are checked across the file: selected and adjusted parts must exist in the scan; adjustments must belong to observed parts and real source views; lessons and answers must match the scan request; observation and completion indices must match the retained lesson. Unknown versions, extra fields, malformed images and broken references are rejected rather than partly restored.

## Photo privacy

Source photos are excluded by default. The project records only view IDs and dimensions, then displays a clear “photo omitted” surface after restore. It never substitutes another image or suggests that original photo evidence remains inspectable.

The user can explicitly enable **Embed photos in project file** before downloading. Only prepared JPEG/PNG data up to the bounded size and pixel count is embedded. The importer checks the declared type, file signature, decode result and dimensions. Project files stay on the user’s device; save/open makes no model request and the app does not silently persist them.

## Scope and evidence

This is browser file portability, not an account, cloud project store or collaboration system. Unsent question text and a currently attached but unsent observation draft are not exported. A restored model result and user journal remain unverified evidence.

`npm run test:recovery` performs a real browser download and reopen, retains the recorded lesson and view, verifies photo-free recovery, exercises explicit photo inclusion, rejects a broken component reference, and checks mobile width and accessibility. Unit tests cover schema and cross-reference rejection. These checks establish software behavior, not that intended users find the workflow easier.

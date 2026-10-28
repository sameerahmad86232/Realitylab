# Phase 5 · Conceptual SVG blueprints

Each live scan now has a Blueprint view, generated locally from validated components and source-photo positions. It adds no inference requests. It is a labeled **photo-marker schematic**, not object-outline reconstruction, measured engineering geometry, hidden-interior visualization or production CAD.

## What the drawing represents

- Visible components with a model-suggested or locally adjusted marker in the chosen source photo receive numbered symbols and callouts. Photo aspect ratio is preserved; no dimensions are inferred.
- Observed components in other photos are listed separately with their source view. Selecting one switches to its actual view; locations are never projected between viewpoints.
- Observed components without a reliable marker stay explicitly unlocated. Inferred components are labeled hypotheses with no photo location; they are not drawn inside an imagined object.
- Solid leader lines connect a label to its photo position only. They do not depict physical connections. The separately available relationship map continues to label model associations as unverified.
- Current evidence filters/search define the exported scope. Counts, source-view identity and a persistent **NOT TO SCALE** badge travel with the SVG. Local marker corrections remain labeled as user-adjusted.

The schematic uses fixed symbolic markers, labels and a source-photo reference area. No template for a different object is substituted, and no approximate outline is passed off as a reconstructed shape. This conservative representation works with the evidence already supplied by the model; more detailed geometry would require suitable additional inputs and validation.

## Interaction and export

Classic-blue and paper styles, source-view selection, fit/100/150/200% zoom, keyboard-operable callouts and linked inspector selection are included. The drawing scrolls within its panel on mobile. Model text is escaped inside a controlled SVG generator; arbitrary AI-generated SVG is never executed.

SVG downloads are self-contained, use portable fonts, include provenance/limitations, and exclude photos by default. The optional **Include source photo in SVG download** checkbox explicitly embeds the prepared image in the shared file. Changing source view clears this opt-in. Image embedding accepts prepared JPEG/PNG data only, not external links or SVG payloads. An optional source-photo guide is shown behind on-screen callouts. This does not opt into photo embedding in the download; screen guidance and shared-file privacy are separate controls. The app makes no upload to generate either form of SVG.

The original analysis JSON export remains separate and photo-free. Blueprint metadata records scope, source view, marker provenance, provider/model, request ID and whether a photo was embedded. Selection and styling are presentation choices, not extra evidence.

## Verification

`npm run test:unit` includes seven blueprint cases plus five exploration cases: source-view projection, aspect ratio, local edits, unlocated/inferred parts, empty/maximum scope, bounded layout, photo-free exports, XML escaping and safe explicit image inclusion.

`npm run test:blueprint` verifies keyboard selection/focus, source switching, zoom, both styles, valid standalone SVG XML, opt-in photo inclusion/reset, filter scope, user-correction provenance, 320/390/1440 layouts and accessibility. The exploration regression suite checks the established Phase 4 interactions. Browser requests use fixtures and do not incur provider credits.

Build, TypeScript and public Render deployment checks identify the new release separately from process-local provider verification. The unchanged live scan API continues using the confirmed Baseten Meta model; redeployment resets its process-local `liveVerified` state until the next successful scan.

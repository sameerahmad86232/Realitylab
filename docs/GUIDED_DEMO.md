# Guided product showcase

The homepage's “See it in action” action opens a four-chapter, full-screen tour of an actual recorded Meta scan and its recorded construction dossier. It is a fast route through the working product, with no autoplay, timed promises or new inference on opening.

1. Source: actual CC0 fan photograph, model identification and summary, component/principle counts and recorded processing time.
2. Evidence: selectable real component observations versus inferred internals; only observed components receive a model-suggested photo marker.
3. Blueprint: a source-positioned detail view with photo/edge overlays. Edge tracing happens locally. The tour crops the complete technical sheet to its main photo/callout area and explicitly lists inferred internals outside it; the full workspace/export remains uncropped.
4. Construction: selectable stages from the recorded Meta dossier, materials for the separate proposed craft model, and an action opening the full workspace. A recorded lesson is reused in tab memory without overwriting an existing generated lesson.

“Scan your own object” leads to the actual capture/consent workflow. The status bar always identifies the tour as recorded and says no new AI request is running. Model names, original dates, source attribution and recorded latency are available. Counts describe this single example; they are not accuracy or user-impact metrics. Construction is conceptual and the craft activity remains physically untested. The prepared 3D fan is separately available from “Explore sample.”

The modal uses native focus containment, Escape dismissal, focus restoration, reduced-motion behavior, responsive scroll regions, explicit retry/error states, and cancellation on unmount. The background fan and shader suspend rendering while the tour is open. The tour is dynamically loaded, uses existing assets and bounded local image processing, and makes no additional model call.

`npm run test:theater` verifies four chapters, observations/inference markers, photo/edge overlays, construction-stage controls, cached workspace handoff, 320/390/1440 bounds, accessibility, reduced motion, graphics pause, failed-asset retry, Escape/focus restoration and the real capture handoff. The suite asserts zero inference requests and can run against the public origin using the verified Node HTTPS transport.

For judging, combine the tour with a genuinely fresh scan and describe the recording accurately. A clearer demo path helps evaluators inspect the work; it cannot guarantee hackathon selection. The official three-minute submission video still needs recording/narration and a public link.

# Phase 4 · Interactive component exploration

Live scan results now offer linked photo and relationship-map views. Selecting a part from a marker, inspector, map, association, or working-principle chip keeps the detail selection and its source photo synchronized. Search covers names, roles, evidence and possible materials. Observed/inferred filters update the list, markers and map together, with a recoverable empty state. A hidden target selected through a relationship or principle clears conflicting filters.

## Evidence boundaries

The existing response supplies component IDs and connection IDs, not relationship-specific visual evidence. The map therefore treats every edge as an **unverified model association**, with dashed undirected lines. Reciprocal pairs are deduplicated, invalid/self targets are ignored defensively, and no missing associations are invented. Nodes can be observed in a photo without their relationships being verified. The layout is conceptual and not spatial/to scale. Inferred components have no photo location.

## Marker corrections

An observed component's marker can be adjusted by clicking/tapping its source photo or by focusing the placement surface and using arrow keys (Shift for larger steps). Coordinates remain normalized within the image. A live text label announces the image-relative position. Restore model placement removes the adjustment, including restoring no marker if the model originally provided none.

Corrections stay in the current result's browser memory and incur no inference calls. They change placement only, not identity, evidence, confidence or material claims. JSON export leaves the model analysis untouched and adds a separately labeled `userAnnotations.markerAdjustments` sidecar. Photo bytes and browser-local URLs remain excluded. Refreshing or starting a new scan clears the result and its annotations.

## Accessibility and small screens

Map nodes are real buttons with selected state. Tab focuses controls; arrow keys move focus between graph nodes and Enter selects. The map can scroll horizontally without widening the page, and selected nodes are centered within that viewport. Photo/list/detail/principle controls remain available independently of the map. Reduced-motion preferences are respected. Group labels, live selection status and marker-coordinate text support nonvisual exploration.

## Verification

- Five unit tests cover reciprocal deduplication, no invented relationships, evidence/search filtering, deterministic bounded layouts and coordinate clamping.
- `npm run test:exploration` checks map/photo/detail synchronization, keyboard navigation, filters, empty-state recovery, mouse/keyboard corrections, reset, immutable export, principle links, desktop/390px/320px layouts and accessibility.
- `npm run test:live-ui` retains the Phase 3 scan/error/cancellation/export regression checks.
- Production build, TypeScript and diff checks pass.
- Tests and visual review use explicit fixtures plus replay of the previously recorded real mouse response. No extra paid model requests are required for this phase.

Public deployment is verified through the Render release marker and public assets. `/api/health` will reset its process-local `liveVerified` flag on redeployment until a user completes a new successful scan; this is distinct from whether the existing provider configuration is ready.

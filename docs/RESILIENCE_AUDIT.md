# Follow-up audit: mobile and output resilience

## Fixes

- Added an accessible compact navigation disclosure on phones up to 420 pixels. It exposes home, new scan, the prepared sample, the current result and How it works. It closes on navigation, Escape, focus leaving the control and outside pointer interaction. The camera action retains an accessible name when its text is hidden to make room on narrow screens.
- Added a browser-connectivity notice. New scan/learning requests are disabled while the browser reports offline; photo preparation, retained drafts, existing diagrams and photo-free downloads remain local. Reconnection enables requests without automatically sending anything. Browser connectivity is advisory and does not establish provider availability.
- Replaced character-count truncation with conservative width-aware SVG wrapping. Wide Latin labels and multilingual strings are bounded, compact cards use an explicit ellipsis with full text retained in accessible titles, and construction references wrap without silently losing the final components. Construction sheets grow to accommodate their text. A shared DOM-independent wrapper avoids repeated whole-line measurements.
- Capped map-card labels at two lines while keeping complete names in accessibility labels, hover text and the selected-part inspector.
- Corrected long model-text layout in the inspector and material cards so unbroken names do not widen the page.
- Separated recorded-preview loading/cancellation messages from actual inference. Canceling a recorded preview now correctly states that no AI request was made.

## Validation

The new browser suite (`npm run test:resilience`) checks 320-pixel menu navigation and Escape, offline draft retention, disabled AI actions and zero automatic requests, reconnection, local downloads, maximum-length wide labels at 320/390/1440 widths, actual SVG text bounding boxes, accessibility and recorded-preview cancellation. Synthetic scan responses are clearly test fixtures; no live inference is used. Added unit checks cover conservative SVG width bounds and preservation of all construction references.

The production build, TypeScript and 40 API/unit/learning checks are part of validation. CI additionally runs nine browser suites. Regression artifacts are written to `/tmp/artifacts/resilience`.

## Limits

This does not add a service worker or promise first-load offline operation. Uncached recorded examples and source images can still require a connection. Existing data and tab drafts are not persisted across refresh/close. SVG widths use conservative font estimates plus browser regression checks, not universal font shaping; unusual fonts or scripts still need visual review. Actual iOS/Android devices, screen readers and physical model builds remain manual checks. Object recognition coverage and inference capabilities are unchanged by this update.

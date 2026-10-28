# RealityLab · Liquid Gallery

A fresh Next.js + TypeScript implementation of the selected Liquid Gallery design.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:3000. Production: `npm run build && npm start`.

## Phase 1 scope

- Responsive white/silver landing page, self-hosted Geist, blue accents.
- Original procedural Three.js desk fan with orbit, zoom, explode and pause controls.
- Lightweight WebGL ribbon shader with pause and reduced-motion support.
- JPEG/PNG picker, drag/drop, previews, deletion, camera capture and permission recovery.
- Prepared sample explorer, selectable parts, observed/inferred distinctions, interactive conceptual SVG and SVG download.
- Uploads remain browser-local, are never presented as analyzed, and are cleared on close. No keys, external model calls, storage or AI costs in this phase.

The fan is an illustrative handcrafted model, not reconstructed from photos or accurate product CAD. The bicycle and clock collection entries are labeled planned. Live AI integration is Phase 3; pressing Analyze explains this and does not send photos. The earlier app was intentionally removed; no old application code was reused.

## Checks

`npm run build`, `npm run typecheck`, `npm run test:browser` (Chromium required; set CHROMIUM_PATH if necessary).

Design inspiration: the user-approved Liquid Gallery concept. Visuals are procedural geometry/CSS; no third-party object models or stock photos are included. Geist is distributed under its bundled SIL Open Font License. Next.js, React, Three.js and Lucide retain their respective dependency licenses.

## Render deployment

`render.yaml` defines the Next.js web service, `npm ci --include=dev && npm run build`, `npm start`, and `/api/health`. Next.js automatically uses Render's `PORT` variable. No AI secret is required for this design phase.

The minimal `frontend/package.json` and lockfile are deployment compatibility only: the previously configured Render build command runs `npm --prefix frontend ci`. They contain no old frontend application. New services should use the simpler build command above.

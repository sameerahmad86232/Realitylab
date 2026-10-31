# RealityLab — Fix Anything. See It Fixed.

Hackathon build | Indie track | 31 October 2026

This branch changes the homepage from the original object-exploration gallery to a repair-first visual troubleshooting studio. The original work remains in Git history. New experience: / and /fix.

## Implemented

- Responsive dark industrial homepage with animated Three.js + GLSL WebGL orb, scanning reticles and reduced-motion support.
- One-photo upload, drag/drop, paste, camera picker, optional note and English/Hindi/Urdu response selection.
- Six clearly labeled illustrative example walkthroughs, no paid calls.
- POST /api/fix — server-only Meta Model API: Muse Spark 1.3 visual understanding, then SAM 3.1 object segmentation, 3-step guidance, Muse Image 1.0 photo editing into a possible after-state.
- Before/after slider, SAM object bounding box, safety flags, action checklist and copy guide.
- Voice recording is converted in browser to PCM 24kHz mono WAV and sent to Muse Voice Transcribe at /api/fix/transcribe.
- Sharp validates and normalizes the photo. The app does not save user photos. Photos are sent to Meta when the user clicks Find my fix.

## Enable live AI

1. Open the realitylab-fix-anything project in Vercel.
2. In Settings → Environment Variables add encrypted MODEL_API_KEY for Preview (also Production if launching). Do not paste keys in public files.
3. Redeploy the latest branch. Test with a clear low-risk object and separately a dangerous scenario.
4. Use the new Vercel project — it is separate from the old Render / Baseten deployment.

No key produces an explicit HTTP 503; the app never invents a live AI response.

## Important limitations (must be honest in submission)

- Cloud build completed but the live Meta pipeline has NOT been end-to-end tested on this Vercel project without its API key.
- SAM 3.1 produces pixel masks, but the current UI only parses and displays its real bounding box. Add the official @meta-sam/parser and mask rasterization to complete mask overlays.
- Four separate model calls may take more than the proposed 10 seconds. Benchmark real calls before promising response time.
- Rate limit is best-effort process-memory only. A shared store and billing limit are needed before public scaling.
- Model image edit is illustrative, not evidence that repair works. Hidden defects and cost savings are unverified.
- Meta's evaluated voice-language list includes Hindi but does not list Urdu or Kashmiri. Output language and voice input support are not equivalent.
- Real-device testing and physical repair evaluations remain outstanding.

## Files

- app/fix/page.tsx: UI, WebGL shader and interaction.
- app/fix/studio.css: visual styling and responsive layouts.
- app/api/fix/route.ts: validation, diagnosis, SAM and image edit.
- app/api/fix/transcribe/route.ts: voice.
- app/page.tsx: new homepage entry.

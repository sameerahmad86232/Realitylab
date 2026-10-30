# Phase 7 device and accessibility matrix

Automated browser emulation is useful for finding layout and semantic defects, but it does not establish that physical cameras, low-power GPUs, VoiceOver or TalkBack work. Record real checks below without converting an untested row into a pass.

## Evidence status

| Environment | Input / assistive technology | Status | Evidence and defects |
| --- | --- | --- | --- |
| Chromium, desktop CI | Keyboard, reduced motion, forced colors, Axe | Automatically checked | `npm run test:devices`; fixture-only, no provider call |
| Chromium, emulated iPhone viewport | Touch-size and responsive layout | Automatically checked | Browser emulation only; this is not iOS Safari |
| Chromium, emulated Android viewport | Touch-size and responsive layout | Automatically checked | Browser emulation only; this is not Android hardware |
| iPhone / iOS Safari | Rear camera, upload, rotate, retake, VoiceOver | Not physically tested | Record model, iOS/Safari versions, date and observations |
| Android / Chrome | Rear camera, upload, rotate, retake, TalkBack | Not physically tested | Record model, Android/Chrome versions, date and observations |
| Low-power device | 3D scene, WebGL loss/fallback, temperature and responsiveness | Not physically tested | Record device, browser, duration and observed frame/input behavior |
| Desktop screen reader | Navigation, dialogs, status/error announcements, results | Not tested with a human | Record AT/browser versions, task and defects |

## Real-device script

1. Open the deployed SHA and record device, operating-system and browser versions.
2. Navigate by keyboard or the active screen reader from the skip link through “Scan object.” Confirm visible focus and meaningful names.
3. Open the live camera, deny permission once, recover, switch camera when available, take a photo, retake it and accept it. Confirm the camera indicator turns off during review and after closing.
4. Select two library photos and one camera photo. Confirm previews, review dialogs, removal and the three-photo limit remain usable at 200% browser zoom and portrait orientation.
5. Enable reduced motion. Confirm decorative motion stops and the prepared 3D model remains understandable through its text and controls.
6. Complete the recorded sample path without a provider call. Check headings, evidence labels, drawing controls, saved-project recovery and error/status announcements.
7. Record every defect, exact reproduction steps and whether the repeat check passed after a fix. Photos or video require the tester’s agreement.

## Exit rule

Phase 7 can be called software-complete after automated safeguards pass. It remains evidence-incomplete until the physical iOS, Android, low-power GPU and assistive-technology rows contain actual observations. Blank rows are not passes.

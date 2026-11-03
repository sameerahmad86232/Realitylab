# RealityLab — judging readiness

**Current guide:** [JUDGE_GUIDE.md](JUDGE_GUIDE.md)  
**Submission materials:** [HACKATHON_SUBMISSION.md](HACKATHON_SUBMISSION.md)  
**Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md)

The live Next.js app and Node.js APIs are hosted on **[Vercel](https://realitylab-fix-anything.vercel.app)**, not Render. The [recorded, zero-credit tour](https://realitylab-fix-anything.vercel.app/?demo=1) and [project brief](https://realitylab-fix-anything.vercel.app/project) are useful judge entry points.

## Software evidence

- Source code and a setup guide are available on the public GitHub `main` branch.
- One live Meta Muse Spark model inference per initial scan, through Baseten, with strict response validation.
- An independent safety gate can withhold risky or unsupported procedural steps.
- Photo-linked component views, conceptual diagrams, recorded runs, and optional consented follow-up tools are available.
- Shared quota controls help bound public demo use; they do not verify provider dollar spending.
- Automated GitHub CI validates build, TypeScript, security behavior, staged transport, recorded evaluation and browser interactions without paid inference.

## Remaining human submission tasks

1. Verify that the [final MP4 on Google Drive](https://drive.google.com/file/d/1jgVVoAhj1mMxrH_i_uhe8pl4if4mOCLC/view?usp=drivesdk) plays in an incognito/private window without signing in, and that the event portal accepts Drive links.
2. Paste the video URL into the official submission portal; the README and submission documents already include the Drive link.
3. Verify the actual submission form requirements, track, contributors, eligibility and licensing.
4. If requested, provide genuine screenshots from the deployed app.
5. Confirm every public link and **submit** before the organizer's deadline. Retain the final confirmation.

**Truthful demonstration boundaries:** Live model latency varies; 10-second performance has not been established. Repair success, physical test outcomes, recognition accuracy and real CAD reconstruction are not guaranteed. SAM 3.1 is not currently integrated. Recorded examples are clearly identified.

No final submission has been sent by this repository change.

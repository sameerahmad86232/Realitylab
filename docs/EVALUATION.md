# Exploratory evaluation — October 28, 2026

Three single-view CC0 photographs were manually inspected, sent once each to the deployed scan endpoint, and saved unchanged after HTTP success and strict frontend-schema validation. These are curated examples, not a random sample or an accuracy benchmark. No automatic retries were used.

| Photo | Model identification | Parts | Server latency | Tokens |
| --- | --- | --- | --- | --- |
| fan | Vintage GE Table Electric Fan | 6 | 15.45s | 4506 |
| bicycle | Weathered Utility Bicycle | 7 | 15.34s | 4297 |
| compass | Brass Hinged Pocket Compass | 6 | 15.66s | 4772 |

All three returned valid envelopes. Manual review found the main object identities relevant. Fan motor internals are labeled inferred; bicycle hidden bearings and condition remain unknown; compass accuracy and internal pivot construction remain unknown. Outputs retain original model language: the compass “rotating bezel” and fan medallion's securing role are not verified by a still image. Some marker locations are approximate and overlap. The fan and compass responses contain no component association edges, so their map does not invent connections. Material candidates are hypotheses. These are concrete model limitations, not corrected ground truth.

The original images, response timestamps, request IDs and token counts are in `public/demos`. Photo source attribution is in `sources.json`; the Commons filename “Clock unsplash.jpg” actually depicts a compass. Opening saved examples performs no inference. Build & Learn requires fresh consent and makes a new request.

Next evaluation: diverse unseen objects, poor lighting/occlusion, multi-view consistency, empty/ambiguous scenes, marker placement scoring by people, evidence-label error rate and measured learning usefulness. Do not extrapolate production accuracy from these three examples.

## Additional examples and failures

The gallery also includes recorded furniture (5 parts, 21.376s) and mouse (5 parts, 13.189s) responses. Both main identities were relevant in manual review, but their labels, materials and details are unverified model claims. The five successful records are curated examples, not a denominator for accuracy. A cropped screwdriver was not correctly identified; a first fan craft proposal was mechanically inconsistent and was rejected. See `ENGINEERING_DOSSIER.md` for that evaluation and prompt revision. The revised fan activity remains physically untested.

`/project` derives the displayed counts and timings directly from all five saved response files at build time and links their JSON/source credits. A dedicated browser check compares every displayed metric to those files, checks accessible/mobile layouts and the handoffs into the actual demo, gallery and capture workflow without inference calls.

## Phase 2 controlled run — October 29, 2026

The versioned evaluation suite now includes historical successes and the known screwdriver failure, plus explicitly related controlled conditions. Four fresh, bounded requests were executed without retries: darkened bicycle, cropped fan, full fan plus that crop, and a synthetic blank. Three returned valid envelopes; the blank returned the expected no-object 422. See `evaluation/runs/controlled-2026-10-29/report.json` for source revision, hashes, payloads, timing and usage. These conditions do not expand independent object coverage; no human correctness reviews or accuracy claim were added.

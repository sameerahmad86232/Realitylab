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

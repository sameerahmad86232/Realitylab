# Broad object exploration

## Implemented scope

The API no longer frames every image as a gear mechanism. It validates broad categories (`vehicle`, `electronics`, `appliance`, `furniture`, `tool`, `mechanism`, `natural`, `other`, `unclear`), recognition status, visible components, suggested functions, evidence-backed or explicitly hypothetical relationships, unknowns and non-invasive next observations. `mechanism.type` describes only the numerical gear solver's applicability. Generic objects can be explored without a supported numerical model.

A no-object result returns 422; unknown or unclear identities are not silently assigned a sample. Data references, normalized coordinates, relationship endpoints, duplicate connections, enums and limits are validated before rendering. The server reassigns all component and relationship IDs. User label/evidence/function/marker corrections are labeled user-edited. Manual count/measurement confirmations remain distinct.

## Open-source integration

React Flow (`@xyflow/react`) from https://github.com/xyflow/xyflow is used as a lazy-loaded graph editor. MIT license and attribution are retained; see OPEN_SOURCE.md. This provides interaction and rendering, not vision, segmentation, physical verification or 3D reconstruction. MIT-licensed Dagre supplies automatic relationship layout and Arrange; manual node positions remain editable. Unverified internal hypotheses are hidden by default and can be included explicitly in the map/SVG. The graph keeps observations and internal hypotheses distinct, supports relationship basis/status/origin review, and exports escaped application-owned SVG.

## Numerical models

- External meshing gear pair: confirmed counts and input turns predict signed output turns; user-reported physical measurements can be compared with a declared tolerance.
- Ideal static lever: confirmed perpendicular moment arms and load force determine ideal effort and mechanical advantage.
- Ideal pulley: confirmed supporting strands and load force determine ideal effort; desired lift determines ideal rope pull.

These are bounded analytical tools, not a universal simulator or a structural/electrical safety assessment. They do not infer measured quantities from images.

## Automated verification

The unit/API suite includes broad category schemas, legacy defaults, uncertain/no-object handling, invalid/duplicate/self-referential graph edges, ID remapping, model-specific numerical validation, lever/pulley equations and escaped graph exports. Browser fixtures test furniture, electronics, appliances and natural objects; these fixtures are injected and are not represented as real model results.

## Real provider checks

Using the existing secure Baseten binding and exact `meta-models/muse-spark-open-1026` model, two real API requests were made with original vector illustrations authored as test fixtures:

- Chair illustration: HTTP 200, furniture category, identified as an illustrated wooden slat-back chair; 8 visible components, 8 relationships, 3 next observations; no gear prediction invented.
- Potted plant illustration: HTTP 200, natural category, identified as an illustrated potted plant; 6 components and 4 relationships; no gear prediction invented.

The SVG test sources are in tests/fixtures. They are illustrations, not photographs or physical experiments. These successes demonstrate that the actual provider and new schema handle two non-gear categories; they do not establish universal object recognition or performance on every real-world photo. Previous live validation also inspected the generated car concept; see LIVE_VALIDATION.md.

## Remaining evaluation

Use user-supplied, clearly photographed real objects across more categories, especially unfamiliar items, occlusion, clutter, multiple views and low light. Check annotation placement and relationship accuracy manually. Real physics experiments remain necessary before claiming empirically verified behavior. Do not market the feature as automatic manufacture-ready blueprint/CAD generation.

## Real photographs — October 27, 2026

Six actual requests through the secure Baseten binding succeeded with the exact
hackathon model. These used Commons photographs rather than the earlier vector
illustrations. The source pages, authors, licenses and request contexts are in
`tests/fixtures/real-photo-sources.json`; photo-free outputs are retained in
`docs/REAL_PHOTO_RESULTS.json`.

| Input | Initial result | Refinement / human review |
| --- | --- | --- |
| Wired Lenovo mouse, CC0, Raysonho | Identified, electronics, 6 components / 3 relationships, 10.3 s | Visible housing, red wheel, cable and brand correspond to the photo. Internal button attachment was marked hypothetical. |
| Blue desk fan, public domain, Couch-scratching-cats | Identified, appliance, 7 components / 6 relationships, 16.2 s | Grille, stand and cord are visible. Blade count, exact materials and pivot details remain unverified. |
| Cafe chairs/table, CC0, Kullatan Kin | Identified furniture scene, 8 components / 4 relationships, 12.5 s | Initial map included the wall and floor, demonstrating a scope failure. After requesting only the central chair and tightening the prompt, a real rerun returned that chair, 7 components / 5 relationships, 19.3 s. Occluded joints still need another view. |
| Double-beard screwdriver tip, CC0, Andrew Pertsev | Uncertain, tool, 4 components / 3 relationships, 10.9 s | Initial title speculated about a punch despite the source identity. After prompt refinement, a real rerun used a descriptive geometric title, remained uncertain and returned 6 components / 3 relationships in 18.0 s. This is not successful exact identification. |

The prompt now scopes analysis to the requested/primary object and asks for
shape-based descriptive titles when identity is uncertain. All six responses
kept gear prediction unsupported. A successful HTTP/schema check does not prove
the individual relationships or marker positions are correct. Human inspection
was visual and limited; this small, selected set is not an accuracy score.

To repeat an explicit paid evaluation with the current prompt:

```bash
npm run validate:photos -- --live
```

This downloads the four attributed public photographs and makes **four real
provider calls**. It is not part of automated tests. Without `--live`, no calls
are made. Output omits image bytes and is saved under `/tmp` by default. Source
URLs may change; download failures stop before analyzing that input.

One remaining semantic issue in the refined chair response: an observation named
"Right-side legs - occluded" described mainly expected hidden structure. Schema
validation cannot establish image truth. That claim should be disputed or marked
as needing another view, rather than accepted as visibly confirmed. The review
notebook and graph now surface those user flags; this test is deliberately
retained as a known limitation rather than omitted from the evidence.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  updateObservation,
  withReview,
  makeExplorationMarkdown,
} from "../frontend/src/lib/evidenceReview.js";
import { makeReportSvg } from "../frontend/src/lib/exportReport.js";
const part = {
  id: "a",
  imageId: "image-1",
  name: "Original shell",
  marker: { x: 0.2, y: 0.3 },
  evidence: "Visible rounded cover",
  function: "May enclose components",
  source: "model-suggested",
};
const analysis = {
  objectName: "Computer mouse",
  category: "electronics",
  recognition: "identified",
  summary: "Visible exterior only.",
  provenance: { provider: "fixture", model: "fixture-only" },
  images: [
    {
      id: "image-1",
      width: 100,
      height: 100,
      dataUrl: "data:image/jpeg;base64,PRIVATE-PHOTO",
    },
  ],
  observations: [part],
  relationships: [],
  hypotheses: [],
  unknowns: ["Hidden circuit"],
  nextSteps: ["View the underside."],
};
test("edits preserve the initial model claim and reset a stale self-reported review", () => {
  const reviewed = withReview(part, {
    status: "consistent",
    notes: "Saw the cover from the side.",
  });
  const edited = updateObservation(reviewed, { name: "Corrected shell" });
  assert.equal(edited.review.status, "pending");
  assert.equal(edited.review.notes, reviewed.review.notes);
  assert.equal(edited.modelSuggestion.name, "Original shell");
  assert.equal(edited.source, "user-edited");
  const again = updateObservation(edited, { evidence: "New evidence" });
  assert.deepEqual(again.modelSuggestion, edited.modelSuggestion);
  assert.equal(part.name, "Original shell");
  assert.equal(reviewed.source, "model-suggested");
});
test("readable report carries original claims, corrections and notes without exporting photos or active markup", () => {
  const edited = withReview(
    updateObservation(part, {
      name: "<script>alert(1)</script> [link](https://example.com)",
    }),
    { status: "disputed", notes: "![tracker](https://example.com)" },
  );
  const report = makeExplorationMarkdown({
    exportedAt: "2026-10-27",
    analysis: {
      ...analysis,
      observations: [edited],
      followUpNotes: {
        0: { status: "recorded", notes: "Underside has a label." },
      },
    },
  });
  assert(report.includes("Original model label: Original shell"));
  assert(report.includes("I disagree with this suggestion"));
  assert(report.includes("Underside has a label."));
  assert(report.includes("Observation recorded"));
  assert(!report.includes("PRIVATE-PHOTO"));
  assert(!report.includes("<script>"));
  assert(!report.includes("![tracker]("));
  assert(!report.includes("Computed gear prediction"));
  assert(report.includes("Hidden circuit"));
});
test("generic object SVG with photo opt-out never fabricates a gear drawing", () => {
  const svg = makeReportSvg({ analysis });
  assert(svg.includes("Original shell"));
  assert(svg.includes("source photos omitted"));
  assert(!svg.includes("Symbolic gear pair"));
  assert(!svg.includes("PRIVATE-PHOTO"));
  assert(!svg.includes("<circle"));
  assert(makeReportSvg({}).includes("Symbolic gear pair"));
  assert(
    makeReportSvg({ analysis, includeImages: true }).includes("PRIVATE-PHOTO"),
  );
});

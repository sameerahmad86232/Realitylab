import test from "node:test";
import assert from "node:assert/strict";
import {
  repairResultSchema,
  validateRepairResult,
  repairRequestSchema,
  repairHazard,
  repairMarkdown,
} from "../shared/repair.js";
import { source, request, repairFixture } from "./helpers/repairFixture.js";
test("repair guides require 3–5 steps, evidence and an existing suspected part; uncertainty requires one follow-up and no guide", () => {
  assert.equal(
    validateRepairResult(repairFixture(), source, ["scan-1"]).steps.length,
    3,
  );
  assert.equal(
    repairResultSchema.parse(repairFixture(source, "needs-more-evidence")).steps
      .length,
    0,
  );
  for (const raw of [
    { ...repairFixture(), steps: repairFixture().steps.slice(0, 2) },
    { ...repairFixture(), suspectedPartId: null },
    { ...repairFixture(), confidence: "uncertain" },
    { ...repairFixture(), evidence: [] },
    { ...repairFixture(source, "needs-more-evidence"), followUp: null },
    {
      ...repairFixture(source, "needs-more-evidence"),
      steps: repairFixture().steps,
    },
    { ...repairFixture(), suspectedPartId: "invented" },
    {
      ...repairFixture(),
      evidence: [
        {
          observationId: "knob",
          imageId: "fabricated-photo",
          basis: "bad reference",
        },
      ],
    },
  ])
    assert.throws(() => validateRepairResult(raw, source, ["scan-1"]));
});
test("repair input enforces consent, unique parts and compatible previous candidate", () => {
  assert.equal(repairRequestSchema.parse(request).source.parts.length, 2);
  for (const raw of [
    { ...request, consent: false },
    {
      ...request,
      source: { ...source, parts: [source.parts[0], source.parts[0]] },
    },
    {
      ...request,
      previous: {
        status: "needs-more-evidence",
        summary: "test",
        suspectedPartId: "absent",
        followUp: null,
      },
    },
  ])
    assert.throws(() => repairRequestSchema.parse(raw));
});
test("reported hazards route to professional help without DIY steps or an invented fault; negated smoke does not trigger the shortcut", () => {
  for (const text of [
    "The battery is swollen",
    "Swollen battery",
    "Sparks come from the plug",
    "My brakes squeal",
    "A burning smell",
    "The steering is jammed",
  ]) {
    const r = repairHazard(text);
    assert.equal(r.status, "professional-help");
    assert.deepEqual(r.steps, []);
    assert.equal(r.suspectedPartId, null);
  }
  assert.equal(
    repairHazard("There is no smoke, just a loose outer knob."),
    null,
  );
});
test("photo-free repair Markdown preserves evidence, follow-up and instructions while escaping active source text", () => {
  const record = {
    source: { ...source, objectName: "<script>alert(1)</script>" },
    assessment: repairFixture(),
    problem: "![remote](https://bad.example/x)",
    answer: "",
    problemPhotoCount: 1,
    provenance: {
      provider: "TEST",
      model: "fixture",
      assessedAt: "2026-10-28T00:00:00Z",
    },
  };
  const md = repairMarkdown(record);
  assert(md.includes("Exterior handle knob"));
  assert(md.includes("Stop if:"));
  assert(!md.includes("<script>"));
  assert(!md.includes("![remote]("));
  assert(!md.includes("data:image"));
});

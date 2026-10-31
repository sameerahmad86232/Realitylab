import { test } from "node:test";
import assert from "node:assert/strict";
import { sampleRepairPlan, repairPlanSchema, enforceSafetyBoundary } from "../lib/repair.ts";

test("sample repair guide conforms to the strict model contract", () => {
  assert.equal(repairPlanSchema.safeParse(sampleRepairPlan).success, true);
  assert.equal(sampleRepairPlan.steps.length, 4);
});
test("rejects duplicate step IDs and invented evidence types", () => {
  const duplicate = structuredClone(sampleRepairPlan);
  duplicate.steps[1].id = "step-1";
  assert.equal(repairPlanSchema.safeParse(duplicate).success, false);
  const wrongEvidence = structuredClone(sampleRepairPlan);
  (wrongEvidence.possible_causes[0] as { evidence: string }).evidence = "definite";
  assert.equal(repairPlanSchema.safeParse(wrongEvidence).success, false);
});
test("dangerous symptom never gets procedural instructions", () => {
  const original = {...sampleRepairPlan, risk: "low" as const};
  const guarded = enforceSafetyBoundary(original, "My lithium battery is swollen and smoking");
  assert.equal(guarded.risk, "professional");
  assert.equal(guarded.steps.length, 2);
  assert.match(guarded.steps[0].instruction, /do not/i);
  assert.equal(repairPlanSchema.safeParse(guarded).success, true);
});
test("safe everyday reports retain their original useful steps", () => {
  const original = {...sampleRepairPlan, risk: "caution" as const};
  assert.equal(enforceSafetyBoundary(original, "The chair leg is wobbly"), original);
});

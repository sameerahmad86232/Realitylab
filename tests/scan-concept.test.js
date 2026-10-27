import { test } from "node:test";
import assert from "node:assert/strict";
import { modelAnalysisSchema } from "../shared/schemas.js";
import { buildScanConcept } from "../frontend/src/lib/scanConcept.js";
import { scanFixture } from "./helpers/scanFixture.js";
for (const category of [
  "furniture",
  "electronics",
  "appliance",
  "tool",
  "natural",
  "vehicle",
  "mechanism",
  "other",
  "unclear",
])
  test(`${category} scans create their own validated component geometry, operation and study guide`, () => {
    const source = scanFixture(category),
      result = modelAnalysisSchema.parse(source);
    const group = buildScanConcept({
      objectName: result.objectName,
      parts: result.spatialModel.parts.map((p) => ({
        ...p,
        name: result.observations.find((o) => o.id === p.observationId).name,
      })),
    });
    assert.equal(group.children.length, source.observations.length);
    assert(group.userData.scanConcept);
    assert.equal(result.recreationGuide.scope, "unpowered-study-model");
    assert.equal(result.operation.steps.length, 1);
    for (const mesh of group.children) {
      mesh.geometry.computeBoundingBox();
      assert(mesh.geometry.attributes.position.count > 0);
      assert(mesh.geometry.boundingBox.min.toArray().every(Number.isFinite));
      assert.equal(mesh.scale.toArray().length, 3);
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
  });
test("spatial concepts reject absent/duplicate component references, invalid transforms, executable shape kinds and false manufacturing scope", () => {
  const copy = () => structuredClone(scanFixture());
  let fixture = copy();
  fixture.spatialModel.parts[0].observationId = "missing";
  assert.throws(() => modelAnalysisSchema.parse(fixture));
  fixture = copy();
  fixture.spatialModel.parts[1].observationId =
    fixture.spatialModel.parts[0].observationId;
  assert.throws(() => modelAnalysisSchema.parse(fixture));
  for (const patch of [
    { size: [0, 1, 1] },
    { position: [100, 0, 0] },
    { rotation: [99, 0, 0] },
    { primitive: "python" },
    { color: "url(https://example.com)" },
  ]) {
    fixture = copy();
    Object.assign(fixture.spatialModel.parts[0], patch);
    assert.throws(() => modelAnalysisSchema.parse(fixture));
  }
  fixture = copy();
  fixture.operation.steps[0].observationIds = ["missing"];
  assert.throws(() => modelAnalysisSchema.parse(fixture));
  fixture = copy();
  fixture.recreationGuide.scope = "manufacturing-ready";
  assert.throws(() => modelAnalysisSchema.parse(fixture));
});
test("old responses can omit concepts and do not receive an unrelated gear model", () => {
  const source = scanFixture("natural");
  delete source.spatialModel;
  delete source.operation;
  delete source.recreationGuide;
  const result = modelAnalysisSchema.parse(source);
  assert.equal(result.spatialModel, null);
  assert.equal(result.operation, null);
  assert.equal(result.recreationGuide, null);
});

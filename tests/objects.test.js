import test from "node:test";
import assert from "node:assert/strict";
import { modelAnalysisSchema } from "../shared/schemas.js";
import { predictPhysicsTool } from "../shared/physicsTools.js";
import {
  describeObjectGraph,
  makeObjectGraphSvg,
} from "../frontend/src/lib/objectGraph.js";
const object = (category = "furniture") => ({
  objectName: "Test chair",
  summary: "A visible seat and support.",
  category,
  recognition: "identified",
  observations: [
    {
      id: "seat",
      imageId: "image-1",
      name: "Seat",
      marker: { x: 0.5, y: 0.4 },
      evidence: "Visible horizontal surface.",
      function: "May support a seated person.",
    },
    {
      id: "support",
      imageId: "image-1",
      name: "Leg",
      marker: { x: 0.5, y: 0.8 },
      evidence: "Visible support beneath the seat.",
    },
  ],
  relationships: [
    {
      source: "support",
      target: "seat",
      relation: "supports",
      basis: "Visible connection.",
      certainty: "visible",
    },
  ],
  hypotheses: [],
  unknowns: ["Material strength is not established."],
  nextSteps: ["Take another angle of the joint."],
  mechanism: { type: "unsupported", gears: [] },
});
test("many object categories support useful observations without fabricating a gear model", () => {
  for (const category of [
    "vehicle",
    "electronics",
    "appliance",
    "furniture",
    "tool",
    "mechanism",
    "natural",
    "other",
    "unclear",
  ]) {
    const result = modelAnalysisSchema.parse(object(category));
    assert.equal(result.category, category);
    assert.equal(
      result.observations[0].function,
      "May support a seated person.",
    );
    assert.equal(result.relationships.length, 1);
    assert.equal(result.mechanism.type, "unsupported");
  }
});
test("uncertain identities and explicit no-object responses can be represented honestly", () => {
  const uncertain = { ...object("unclear"), recognition: "uncertain" };
  assert.equal(modelAnalysisSchema.parse(uncertain).recognition, "uncertain");
  const empty = {
    ...object("unclear"),
    recognition: "no-object",
    observations: [],
    relationships: [],
  };
  assert.equal(modelAnalysisSchema.parse(empty).observations.length, 0);
  assert.throws(() =>
    modelAnalysisSchema.parse({ ...empty, recognition: "identified" }),
  );
});
test("relationship endpoints, duplicates, self-links, enums and output bounds are validated", () => {
  for (const change of [
    (a) => {
      a.relationships[0].source = "missing";
    },
    (a) => {
      a.relationships[0].target = "support";
    },
    (a) => {
      a.relationships.push({ ...a.relationships[0] });
    },
    (a) => {
      a.relationships[0].certainty = "certain";
    },
    (a) => {
      a.category = "diagnosis";
    },
    (a) => {
      a.nextSteps = Array(7).fill("Too many steps");
    },
  ]) {
    const value = object();
    change(value);
    assert.throws(() => modelAnalysisSchema.parse(value));
  }
});
test("legacy validated analysis receives safe defaults instead of fabricated relationships", () => {
  const value = object();
  delete value.category;
  delete value.recognition;
  delete value.relationships;
  delete value.nextSteps;
  const result = modelAnalysisSchema.parse(value);
  assert.equal(result.category, "other");
  assert.deepEqual(result.relationships, []);
  assert.deepEqual(result.nextSteps, []);
});
test("ideal lever calculation uses user-confirmed perpendicular moment arms", () => {
  const r = predictPhysicsTool({
    tool: "lever",
    loadNewtons: 100,
    effortArmMeters: 0.5,
    loadArmMeters: 0.1,
    confirmed: true,
  });
  assert.equal(r.effortNewtons, 20);
  assert.equal(r.mechanicalAdvantage, 5);
});
test("ideal pulley computes force and required rope displacement", () => {
  const r = predictPhysicsTool({
    tool: "pulley",
    loadNewtons: 100,
    supportingStrands: 4,
    liftMeters: 0.5,
    confirmed: true,
  });
  assert.equal(r.effortNewtons, 25);
  assert.equal(r.pullMeters, 2);
  assert.equal(r.mechanicalAdvantage, 4);
});
test("physics tools reject unconfirmed, invalid, nonfinite and incompatible measurements", () => {
  for (const value of [
    {
      tool: "lever",
      loadNewtons: 100,
      effortArmMeters: 0,
      loadArmMeters: 0.1,
      confirmed: true,
    },
    {
      tool: "pulley",
      loadNewtons: 100,
      supportingStrands: 1.5,
      liftMeters: 0.5,
      confirmed: true,
    },
    {
      tool: "pulley",
      loadNewtons: 100,
      supportingStrands: 4,
      liftMeters: Infinity,
      confirmed: true,
    },
    {
      tool: "lever",
      loadNewtons: 100,
      effortArmMeters: 0.5,
      loadArmMeters: 0.1,
      confirmed: false,
    },
    { tool: "unknown", loadNewtons: 100, confirmed: true },
  ])
    assert.throws(() => predictPhysicsTool(value));
});
test("component graph preserves corrected layout, separates hypotheses and escapes export labels", () => {
  const analysis = {
    ...object(),
    relationships: [
      {
        id: "r1",
        source: "support",
        target: "seat",
        relation: "supports",
        certainty: "visible",
        basis: "test",
        origin: "model-suggested",
      },
    ],
    graphLayout: { seat: { x: 110, y: 210 } },
    hypotheses: [{ id: "h1", name: "Possible <script>hidden part</script>" }],
  };
  const graph = describeObjectGraph(analysis);
  assert.deepEqual(graph.nodes.find((n) => n.id === "seat").position, {
    x: 110,
    y: 210,
  });
  assert.equal(graph.nodes.find((n) => n.id === "hyp-h1").kind, "hypothesis");
  assert.ok(
    describeObjectGraph(analysis, { includeHypotheses: false }).nodes.every(
      (n) => n.kind === "observation",
    ),
  );
  assert.ok(
    !makeObjectGraphSvg(analysis, { includeHypotheses: false }).includes(
      "&lt;script&gt;",
    ),
  );
  const svg = makeObjectGraphSvg(analysis);
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(!svg.includes("<script>"));
  assert.ok(svg.includes("supports"));
  assert.ok(svg.includes("hypotheses"));
});

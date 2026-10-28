import test from "node:test";
import assert from "node:assert/strict";
import {
  evaluateBench,
  benchProjectSchema,
  benchMarkdown,
} from "../shared/bench.js";
const gear = {
  mechanismType: "external-gear-pair",
  driver: { teeth: 12, confirmed: true },
  follower: { teeth: 24, confirmed: true },
  inputTurns: 1,
  inputDirection: "clockwise",
};
const lever = {
  tool: "lever",
  loadNewtons: 2,
  effortArmMeters: 0.2,
  loadArmMeters: 0.1,
  confirmed: true,
};
const pulley = {
  tool: "pulley",
  loadNewtons: 2,
  supportingStrands: 2,
  liftMeters: 0.1,
  confirmed: true,
};
const measure = (value, tolerance = 0.05, direction) => ({
  value,
  tolerance,
  confirmed: true,
  ...(direction ? { direction } : {}),
});
test("all Bench models compare real reported values, signed gear direction and exact tolerance boundaries", () => {
  assert.equal(evaluateBench({ setup: gear }).expected, 0.5);
  assert.equal(
    evaluateBench({
      setup: gear,
      measurement: measure(0.5, 0.01, "counterclockwise"),
    }).comparison.withinTolerance,
    true,
  );
  assert.equal(
    evaluateBench({ setup: gear, measurement: measure(0.5, 0.01, "clockwise") })
      .comparison.withinTolerance,
    false,
  );
  for (const setup of [lever, pulley]) {
    assert.equal(evaluateBench({ setup }).expected, 1);
    assert.equal(
      evaluateBench({ setup, measurement: measure(1.05) }).comparison
        .withinTolerance,
      true,
    );
    assert.equal(
      evaluateBench({ setup, measurement: measure(1.2) }).comparison
        .withinTolerance,
      false,
    );
  }
  assert.equal(evaluateBench({ setup: pulley }).prediction.pullMeters, 0.2);
});
test("Bench rejects unconfirmed, missing, nonfinite, fractional count and invalid measured direction inputs", () => {
  for (const input of [
    { setup: { ...lever, confirmed: false } },
    { setup: { ...lever, loadNewtons: NaN } },
    { setup: { ...pulley, supportingStrands: 1.2 } },
    { setup: gear, measurement: measure(0.5) },
    { setup: lever, measurement: { value: 1, tolerance: 0, confirmed: false } },
    { setup: gear, measurement: measure(0.5, 101, "clockwise") },
  ])
    assert.throws(() => evaluateBench(input));
});
test("portable projects preserve mixed-model trial evidence, recompute reports and reject unsafe or future formats", () => {
  const p = {
    schemaVersion: "realitylab-bench-1",
    title: "Real report",
    model: "lever",
    draft: {
      driver: "",
      follower: "",
      inputTurns: "1",
      inputDirection: "clockwise",
      load: "2",
      effortArm: ".2",
      loadArm: ".1",
      strands: "",
      lift: "",
    },
    source: null,
    trials: [
      {
        id: "c4068b39-4221-4c17-b9c5-19955d6c431e",
        recordedAt: "2026-10-28T12:00:00.000Z",
        setup: lever,
        measurement: measure(1.2),
        notes: "Unpowered tabletop trial.",
      },
    ],
  };
  assert.deepEqual(benchProjectSchema.parse(JSON.parse(JSON.stringify(p))), p);
  assert.match(benchMarkdown(p), /Result: discrepancy/);
  assert.throws(() =>
    benchProjectSchema.parse({ ...p, schemaVersion: "future" }),
  );
  assert.throws(() =>
    benchProjectSchema.parse({ ...p, trials: [...p.trials, ...p.trials] }),
  );
  assert.throws(() =>
    benchProjectSchema.parse({ ...p, image: "data:image/png;base64,..." }),
  );
});

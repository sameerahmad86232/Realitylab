import test from "node:test";
import assert from "node:assert/strict";
import { predict, compare } from "../shared/gearMath.js";
import { escapeXml, makeReportSvg } from "../frontend/src/lib/exportReport.js";
const setup = {
  mechanismType: "external-gear-pair",
  driver: { teeth: 12, confirmed: true },
  follower: { teeth: 24, confirmed: true },
  inputTurns: 1,
  inputDirection: "clockwise",
};
test("12:24 pair predicts half a turn in the opposite direction", () => {
  const p = predict(setup);
  assert.equal(p.signedRatio, -0.5);
  assert.equal(p.outputTurns, 0.5);
  assert.equal(p.outputDirection, "counterclockwise");
});
test("swapped driver/follower and input direction change result", () => {
  const p = predict({
    ...setup,
    driver: { teeth: 24, confirmed: true },
    follower: { teeth: 12, confirmed: true },
    inputDirection: "counterclockwise",
  });
  assert.equal(p.signedOutputTurns, 2);
  assert.equal(p.outputDirection, "clockwise");
});
test("unsupported mechanisms and unconfirmed or invalid counts are rejected", () => {
  for (const body of [
    { ...setup, mechanismType: "compound-train" },
    { ...setup, driver: { teeth: 0, confirmed: true } },
    { ...setup, driver: { teeth: 1.2, confirmed: true } },
    { ...setup, driver: { teeth: 12, confirmed: false } },
    { ...setup, inputTurns: 0 },
    { ...setup, inputTurns: Infinity },
  ])
    assert.throws(() => predict(body));
});
test("comparison recomputes prediction and reports agreement, including exact decimal tolerance boundary", () => {
  const result = compare({
    setup,
    measurement: {
      outputTurns: 0.55,
      outputDirection: "counterclockwise",
      tolerance: 0.05,
    },
  });
  assert.equal(result.withinTolerance, true);
  assert.equal(result.prediction.signedOutputTurns, -0.5);
});
test("wrong direction and zero observed movement remain honest discrepancies", () => {
  for (const outputTurns of [0, 0.5]) {
    const result = compare({
      setup,
      measurement: {
        outputTurns,
        outputDirection: "clockwise",
        tolerance: 0.01,
      },
    });
    assert.equal(result.status, "discrepancy");
    assert.ok(result.absoluteErrorTurns >= 0.5);
  }
});
test("measurement validation rejects negative turns/tolerance and trusting a supplied prediction", () => {
  assert.throws(() =>
    compare({
      setup,
      measurement: {
        outputTurns: -1,
        outputDirection: "clockwise",
        tolerance: 0.1,
      },
    }),
  );
  assert.throws(() =>
    compare({
      setup,
      measurement: {
        outputTurns: 1,
        outputDirection: "clockwise",
        tolerance: -0.1,
      },
    }),
  );
  assert.throws(() =>
    compare({
      setup,
      prediction: { outputTurns: 99 },
      measurement: {
        outputTurns: 1,
        outputDirection: "clockwise",
        tolerance: 0.1,
      },
    }),
  );
});
test("SVG export escapes untrusted labels and omits photos unless requested", () => {
  assert.equal(escapeXml('<script>"&'), "&lt;script&gt;&quot;&amp;");
  const analysis = {
    objectName: "<script>alert(1)</script>",
    observations: [],
    images: [
      {
        id: "image-1",
        dataUrl: "data:image/jpeg;base64,abc",
        width: 100,
        height: 100,
      },
    ],
  };
  const svg = makeReportSvg({ analysis, prediction: predict(setup) });
  assert.ok(!svg.includes("<script>"));
  assert.ok(!svg.includes("base64"));
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.ok(
    makeReportSvg({ analysis, includeImages: true }).includes(
      "data:image/jpeg;base64,abc",
    ),
  );
});

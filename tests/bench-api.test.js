import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/src/app.js";
const setup = {
  tool: "lever",
  loadNewtons: 2,
  effortArmMeters: 0.2,
  loadArmMeters: 0.1,
  confirmed: true,
};
const measurement = { value: 1.2, tolerance: 0.05, confirmed: true };
const review = {
  summary: "Check the reported moment arms before inferring friction.",
  recommendedAction: "review-setup",
  hypotheses: [
    {
      title: "Moment-arm measurement",
      basis: "Perpendicular distances have not been independently checked.",
      nextCheck:
        "Repeat the perpendicular-distance measurement on the same passive setup.",
    },
  ],
  limitations: ["This is a suggested check, not a confirmed cause."],
};
async function start(t, provider, timeoutMs = 1000) {
  const s = createApp({ provider, rateLimitEnabled: false, timeoutMs }).listen(
    0,
    "127.0.0.1",
  );
  await new Promise((r) => s.once("listening", r));
  t.after(() => new Promise((r) => s.close(r)));
  return async (path, body) => {
    const r = await fetch(
      `http://127.0.0.1:${s.address().port}/api/bench/${path}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    return { status: r.status, data: await r.json() };
  };
}
test("Bench prediction/comparison is keyless; Meta receives independently computed discrepancy and consent is enforced", async (t) => {
  let calls = 0;
  const post = await start(t, {
    configured: true,
    provider: "TEST",
    model: "test",
    planExperiment: async ({ experiment }) => {
      calls++;
      assert.equal(experiment.result.expected, 1);
      assert.equal(experiment.result.comparison.withinTolerance, false);
      return review;
    },
  });
  assert.equal((await post("evaluate", { setup, measurement })).status, 200);
  assert.equal(
    (await post("review", { setup, measurement, consent: false })).status,
    400,
  );
  assert.equal(calls, 0);
  const r = await post("review", { setup, measurement, consent: true });
  assert.equal(r.status, 200);
  assert.equal(calls, 1);
  assert.equal(r.data.result.expected, 1);
  assert.equal(r.data.review.recommendedAction, "review-setup");
});
test("invalid AI and action incompatible with deterministic result are rejected without fabricated fallback", async (t) => {
  for (const output of [
    { bad: "shape" },
    { ...review, recommendedAction: "record-agreement" },
  ]) {
    const post = await start(t, {
      configured: true,
      planExperiment: async () => output,
    });
    assert.equal(
      (await post("review", { setup, measurement, consent: true })).status,
      502,
    );
  }
});
test("missing AI remains a usable keyless bench; hung AI times out", async (t) => {
  const manual = await start(t, { configured: false });
  assert.equal((await manual("evaluate", { setup })).status, 200);
  assert.equal((await manual("review", { setup, consent: true })).status, 503);
  const hung = await start(
    t,
    { configured: true, planExperiment: async () => new Promise(() => {}) },
    30,
  );
  assert.equal((await hung("review", { setup, consent: true })).status, 504);
});

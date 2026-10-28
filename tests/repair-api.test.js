import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { createApp } from "../server/src/app.js";
import { request, repairFixture } from "./helpers/repairFixture.js";
const image = await sharp({
  create: { width: 40, height: 30, channels: 3, background: "#aaaaaa" },
})
  .png()
  .toBuffer();
async function start(t, provider, timeoutMs = 1000) {
  const server = createApp({
    provider,
    timeoutMs,
    rateLimitEnabled: false,
  }).listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  t.after(() => new Promise((r) => server.close(r)));
  return async (
    input = request,
    files = [{ bytes: image, type: "image/png" }],
  ) => {
    const form = new FormData();
    form.append("request", JSON.stringify(input));
    for (const f of files)
      form.append("images", new Blob([f.bytes], { type: f.type }), "photo.png");
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}/api/repair`,
      { method: "POST", body: form },
    );
    return { status: response.status, data: await response.json() };
  };
}
test("repair normalizes original/detail photos, keeps IDs, carries the previous question and returns photo-free records", async (t) => {
  let calls = 0;
  const post = await start(t, {
    configured: true,
    provider: "TEST",
    model: "fixture",
    assessRepair: async ({ request: r, images }) => {
      calls++;
      assert.equal(images[0].id, "scan-1");
      assert(
        images.every((i) => i.dataUrl.startsWith("data:image/jpeg;base64,")),
      );
      if (calls === 2) {
        assert.equal(images[1].id, "problem-1");
        assert(r.previous.followUp);
        assert.equal(r.answer, "The screw looks loose.");
        return repairFixture(r.source);
      }
      return repairFixture(r.source, "needs-more-evidence");
    },
  });
  const first = await post();
  assert.equal(first.status, 200);
  assert.equal(first.data.assessment.status, "needs-more-evidence");
  assert(!JSON.stringify(first.data).includes("data:image"));
  const a = first.data.assessment;
  const second = await post(
    {
      ...request,
      answer: "The screw looks loose.",
      previous: {
        status: a.status,
        summary: a.summary,
        suspectedPartId: a.suspectedPartId,
        followUp: a.followUp,
      },
    },
    [
      { bytes: image, type: "image/png" },
      { bytes: image, type: "image/png" },
    ],
  );
  assert.equal(second.status, 200);
  assert.equal(second.data.assessment.steps.length, 3);
  assert.equal(second.data.problemPhotoCount, 1);
});
test("text or photo evidence is required; forged images, wrong counts and absent consent never invoke AI", async (t) => {
  let calls = 0;
  const post = await start(t, {
    configured: true,
    assessRepair: async () => {
      calls++;
      return repairFixture();
    },
  });
  assert.equal((await post({ ...request, consent: false })).status, 400);
  assert.equal((await post({ ...request, problem: "" })).status, 400);
  assert.equal((await post({ ...request, originalImageCount: 3 })).status, 400);
  assert.equal(
    (
      await post(request, [
        { bytes: Buffer.from("not an image"), type: "image/png" },
      ])
    ).status,
    415,
  );
  assert.equal(
    (await post(request, [{ bytes: image, type: "image/jpeg" }])).status,
    415,
  );
  assert.equal(calls, 0);
  assert.equal(
    (
      await post({ ...request, problem: "" }, [
        { bytes: image, type: "image/png" },
        { bytes: image, type: "image/png" },
      ])
    ).status,
    200,
  );
});
test("repair rejects invented components and inappropriate guide lengths without sample fallback", async (t) => {
  for (const raw of [
    { ...repairFixture(), suspectedPartId: "absent" },
    { ...repairFixture(), steps: [] },
  ]) {
    const post = await start(t, {
      configured: true,
      assessRepair: async () => raw,
    });
    const r = await post();
    assert.equal(r.status, 502);
    assert(!r.data.assessment);
  }
});
test("hazard path does not spend inference credits; missing provider and timeouts fail honestly", async (t) => {
  let calls = 0;
  const post = await start(t, {
    configured: false,
    assessRepair: async () => calls++,
  });
  const hazard = await post({ ...request, problem: "The battery is swollen." });
  assert.equal(hazard.status, 200);
  assert.equal(hazard.data.assessment.status, "professional-help");
  assert.deepEqual(hazard.data.assessment.steps, []);
  assert.equal(calls, 0);
  assert.equal((await post()).status, 503);
  const hung = await start(
    t,
    { configured: true, assessRepair: async () => new Promise(() => {}) },
    40,
  );
  assert.equal((await hung()).status, 504);
});

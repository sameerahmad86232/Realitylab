import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { createApp } from "../server/src/app.js";
import { providerFromEnvironment } from "../server/src/provider.js";
const fixture = {
  objectName: "Two external gears",
  summary: "Two visible, directly meshing gears on a table.",
  observations: [
    {
      id: "a",
      imageId: "image-1",
      name: "Driver gear",
      marker: { x: 0.3, y: 0.5 },
      evidence: "Visible tooth ring contacts the follower.",
    },
    {
      id: "b",
      imageId: "image-1",
      name: "Follower gear",
      marker: { x: 0.7, y: 0.5 },
      evidence: "Visible second gear in direct contact.",
    },
  ],
  hypotheses: [],
  unknowns: ["Exact tooth counts need user confirmation."],
  mechanism: {
    type: "external-gear-pair",
    gears: [
      { observationId: "a", toothCount: 12 },
      { observationId: "b", toothCount: 24 },
    ],
  },
};
async function serve(t, options = {}) {
  const server = createApp({ rateLimitEnabled: false, ...options }).listen(
    0,
    "127.0.0.1",
  );
  await new Promise((r) => server.once("listening", r));
  t.after(
    () =>
      new Promise((r) => {
        server.closeAllConnections();
        server.close(r);
      }),
  );
  return `http://127.0.0.1:${server.address().port}`;
}
async function image() {
  return sharp({
    create: { width: 48, height: 32, channels: 3, background: "#7d9a61" },
  })
    .png()
    .toBuffer();
}
function form(
  bytes,
  {
    mime = "image/png",
    consent = true,
    count = 1,
    context = "Test mechanism",
  } = {},
) {
  const f = new FormData();
  for (let i = 0; i < count; i++)
    f.append("images", new Blob([bytes], { type: mime }), `test-${i}.png`);
  f.append("consent", String(consent));
  f.append("context", context);
  return f;
}
const provider = (analyze) => ({
  configured: true,
  provider: "test-only-fixture",
  model: "not-a-live-model",
  analyze,
});
test("health and missing provider produce honest readiness and 503", async (t) => {
  const url = await serve(t, {
    provider: { configured: false, missing: ["BASETEN_API_KEY"] },
  });
  const h = await fetch(url + "/api/health").then((r) => r.json());
  assert.equal(h.analysis.configured, false);
  assert.equal(h.analysis.liveVerified, false);
  const r = await fetch(url + "/api/analyze", { method: "POST" });
  assert.equal(r.status, 503);
  assert.match((await r.json()).error.message, /not configured/);
});
test("manual prediction and comparison work without any AI key", async (t) => {
  const url = await serve(t, { provider: { configured: false } });
  const setup = {
    mechanismType: "external-gear-pair",
    driver: { teeth: 12, confirmed: true },
    follower: { teeth: 24, confirmed: true },
    inputTurns: 1,
    inputDirection: "clockwise",
  };
  const p = await fetch(url + "/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(setup),
  }).then((r) => r.json());
  assert.equal(p.signedOutputTurns, -0.5);
  const c = await fetch(url + "/api/compare", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      setup,
      measurement: {
        outputTurns: 0.5,
        outputDirection: "counterclockwise",
        tolerance: 0.01,
      },
    }),
  }).then((r) => r.json());
  assert.equal(c.withinTolerance, true);
  const invalid = await fetch(url + "/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...setup, driver: { teeth: 12, confirmed: false } }),
  });
  assert.equal(invalid.status, 400);
});
test("real image decoding normalizes payload and server assigns observation IDs", async (t) => {
  let submitted;
  const url = await serve(t, {
    provider: provider(async (data) => {
      submitted = data;
      return structuredClone(fixture);
    }),
  });
  const r = await fetch(url + "/api/analyze", {
    method: "POST",
    body: form(await image()),
  });
  assert.equal(r.status, 200);
  const a = await r.json();
  assert.match(submitted.images[0].dataUrl, /^data:image\/jpeg;base64,/);
  assert.equal(a.images[0].width, 48);
  assert.equal(a.mode, "live");
  assert.equal(a.provenance.provider, "test-only-fixture");
  assert.match(a.observations[0].id, /^obs-/);
  assert.equal(a.mechanism.gears[0].observationId, a.observations[0].id);
  assert.equal(a.mechanism.gears[0].toothCountSource, "model-suggested");
  assert.equal(a.observations[0].source, "model-suggested");
});
test("consent, corrupt files, forged MIME, empty upload and excessive files are rejected before inference", async (t) => {
  let calls = 0;
  const url = await serve(t, {
    provider: provider(async () => {
      calls++;
      return fixture;
    }),
  });
  const bytes = await image();
  for (const [body, status] of [
    [form(bytes, { consent: false }), 400],
    [form(Buffer.from("not an image")), 415],
    [form(bytes, { mime: "image/jpeg" }), 415],
    [form(bytes, { count: 0 }), 400],
    [form(bytes, { count: 4 }), 400],
  ]) {
    const r = await fetch(url + "/api/analyze", { method: "POST", body });
    assert.equal(r.status, status);
  }
  assert.equal(calls, 0);
});
test("oversized file is rejected with 413", async (t) => {
  const url = await serve(t, { provider: provider(async () => fixture) });
  const r = await fetch(url + "/api/analyze", {
    method: "POST",
    body: form(Buffer.alloc(5 * 1024 * 1024 + 1)),
  });
  assert.equal(r.status, 413);
});
test("decoded pixel limit rejects oversized images", async (t) => {
  const url = await serve(t, { provider: provider(async () => fixture) });
  const huge = await sharp({
    create: { width: 5000, height: 4001, channels: 3, background: "#000" },
  })
    .png()
    .toBuffer();
  const r = await fetch(url + "/api/analyze", {
    method: "POST",
    body: form(huge),
  });
  assert.equal(r.status, 415);
});
test("rotation is normalized and metadata is not copied to returned JPEG", async (t) => {
  const url = await serve(t, {
    provider: provider(async () => structuredClone(fixture)),
  });
  const rotated = await sharp({
    create: { width: 80, height: 40, channels: 3, background: "#abc" },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const r = await fetch(url + "/api/analyze", {
    method: "POST",
    body: form(rotated, { mime: "image/jpeg" }),
  });
  const a = await r.json();
  assert.equal(a.images[0].width, 40);
  assert.equal(a.images[0].height, 80);
  const meta = await sharp(
    Buffer.from(a.images[0].dataUrl.split(",")[1], "base64"),
  ).metadata();
  assert.equal(meta.orientation, undefined);
  assert.equal(meta.exif, undefined);
});
test("invalid model schema and absent image references fail without sample fallback", async (t) => {
  for (const change of [
    (a) => {
      a.observations[0].marker.x = 2;
    },
    (a) => {
      a.observations[0].imageId = "image-9";
    },
    (a) => {
      a.mechanism.gears[0].observationId = "absent";
    },
    (a) => {
      a.observations[1].id = "a";
    },
  ]) {
    const invalid = structuredClone(fixture);
    change(invalid);
    const url = await serve(t, { provider: provider(async () => invalid) });
    const r = await fetch(url + "/api/analyze", {
      method: "POST",
      body: form(await image()),
    });
    assert.equal(r.status, 502);
    const body = await r.json();
    assert.ok(body.error);
    assert.equal(body.mode, undefined);
  }
});
test("unsupported objects receive observations but no fabricated gear prediction", async (t) => {
  const unsupported = {
    ...structuredClone(fixture),
    objectName: "A plain box",
    mechanism: { type: "unsupported", gears: [] },
  };
  const url = await serve(t, { provider: provider(async () => unsupported) });
  const r = await fetch(url + "/api/analyze", {
    method: "POST",
    body: form(await image()),
  });
  const a = await r.json();
  assert.equal(r.status, 200);
  assert.equal(a.mechanism.type, "unsupported");
  assert.deepEqual(a.mechanism.gears, []);
});
test("hung provider times out and frees the concurrency slot", async (t) => {
  const url = await serve(t, {
    provider: provider(() => new Promise(() => {})),
    timeoutMs: 80,
  });
  const r = await fetch(url + "/api/analyze", {
    method: "POST",
    body: form(await image()),
  });
  assert.equal(r.status, 504);
  const next = await fetch(url + "/api/analyze", {
    method: "POST",
    body: form(await image()),
  });
  assert.equal(next.status, 504);
});
test("untrusted browser origins are rejected", async (t) => {
  const url = await serve(t);
  const r = await fetch(url + "/api/predict", {
    method: "POST",
    headers: {
      Origin: "https://untrusted.example",
      "Content-Type": "application/json",
    },
    body: "{}",
  });
  assert.equal(r.status, 403);
});
test("vendor email defaults select exact hackathon model but missing key is not configured", () => {
  const noKey = providerFromEnvironment({});
  assert.equal(noKey.configured, false);
  const p = providerFromEnvironment({
    BASETEN_API_KEY: "unit-test-only-not-a-real-key",
  });
  assert.equal(p.configured, true);
  assert.equal(p.model, "meta-models/muse-spark-open-1026");
  assert.equal(p.provider, "baseten");
  assert.equal(
    providerFromEnvironment({
      BASETEN_API_KEY: "test",
      AI_ENDPOINT: "http://bad.example",
    }).configured,
    false,
  );
});

test("aborting an analysis propagates cancellation to its provider", async (t) => {
  let started,
    wasAborted = false;
  const ready = new Promise((r) => {
    started = r;
  });
  const url = await serve(t, {
    provider: provider(
      ({ signal }) =>
        new Promise((resolve, reject) => {
          started();
          signal.addEventListener(
            "abort",
            () => {
              wasAborted = true;
              reject(Error("cancelled"));
            },
            { once: true },
          );
        }),
    ),
  });
  const ac = new AbortController();
  const request = fetch(url + "/api/analyze", {
    method: "POST",
    body: form(await image()),
    signal: ac.signal,
  });
  await ready;
  ac.abort();
  await assert.rejects(request);
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(wasAborted, true);
});
test("analysis concurrency is bounded to two active requests", async (t) => {
  let calls = 0,
    resolveStart,
    release;
  const started = new Promise((r) => {
    resolveStart = r;
  });
  const gate = new Promise((r) => {
    release = r;
  });
  const url = await serve(t, {
    provider: provider(async () => {
      calls++;
      if (calls === 2) resolveStart();
      await gate;
      return structuredClone(fixture);
    }),
  });
  const bytes = await image();
  const requests = [
    fetch(url + "/api/analyze", { method: "POST", body: form(bytes) }),
    fetch(url + "/api/analyze", { method: "POST", body: form(bytes) }),
  ];
  try {
    await started;
    const third = await fetch(url + "/api/analyze", {
      method: "POST",
      body: form(bytes),
    });
    assert.equal(third.status, 429);
    assert.equal(calls, 2);
  } finally {
    release();
  }
  for (const r of await Promise.all(requests)) {
    assert.equal(r.status, 200);
    await r.json();
  }
});

test("general object output remaps relationship endpoints and returns roles and next steps", async (t) => {
  const general = {
    ...structuredClone(fixture),
    objectName: "Office chair",
    category: "furniture",
    recognition: "identified",
    observations: fixture.observations.map((o, i) => ({
      ...o,
      function: i ? "Supports the seat" : "Supports a person",
    })),
    relationships: [
      {
        source: "a",
        target: "b",
        relation: "connected-to",
        basis: "Visible joint",
        certainty: "visible",
      },
    ],
    nextSteps: ["Inspect the joint from another angle."],
    mechanism: { type: "unsupported", gears: [] },
  };
  const url = await serve(t, { provider: provider(async () => general) });
  const r = await fetch(url + "/api/analyze", {
    method: "POST",
    body: form(await image()),
  });
  assert.equal(r.status, 200);
  const a = await r.json();
  assert.equal(a.category, "furniture");
  assert.equal(a.relationships[0].source, a.observations[0].id);
  assert.equal(a.relationships[0].target, a.observations[1].id);
  assert.equal(a.relationships[0].origin, "model-suggested");
  assert.equal(a.nextSteps.length, 1);
  assert.equal(a.observations[0].function, "Supports a person");
});
test("no-object recognition returns 422, not a fabricated component map", async (t) => {
  const empty = {
    ...structuredClone(fixture),
    category: "unclear",
    recognition: "no-object",
    observations: [],
    hypotheses: [],
    relationships: [],
    mechanism: { type: "unsupported", gears: [] },
  };
  const url = await serve(t, { provider: provider(async () => empty) });
  const r = await fetch(url + "/api/analyze", {
    method: "POST",
    body: form(await image()),
  });
  assert.equal(r.status, 422);
  assert.match((await r.json()).error.message, /No clear object/);
});
test("manual physics API works without a provider and enforces confirmation", async (t) => {
  const url = await serve(t, { provider: { configured: false } });
  for (const [body, force] of [
    [
      {
        tool: "lever",
        loadNewtons: 100,
        effortArmMeters: 0.5,
        loadArmMeters: 0.1,
        confirmed: true,
      },
      20,
    ],
    [
      {
        tool: "pulley",
        loadNewtons: 100,
        supportingStrands: 4,
        liftMeters: 0.5,
        confirmed: true,
      },
      25,
    ],
  ]) {
    const r = await fetch(url + "/api/tools/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).effortNewtons, force);
  }
  const invalid = await fetch(url + "/api/tools/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tool: "lever",
      loadNewtons: 100,
      effortArmMeters: 0.5,
      loadArmMeters: 0.1,
      confirmed: false,
    }),
  });
  assert.equal(invalid.status, 400);
});

test("Render HTTPS origin works behind a proxy and explicit custom origin takes precedence", async (t) => {
  const oldRender = process.env.RENDER_EXTERNAL_URL;
  const oldOrigin = process.env.APP_ORIGIN;
  delete process.env.APP_ORIGIN;
  process.env.RENDER_EXTERNAL_URL = "https://realitylab-example.onrender.com";
  let url;
  try {
    url = await serve(t, { provider: { configured: false } });
    process.env.APP_ORIGIN = "https://custom.example";
    const custom = await serve(t, { provider: { configured: false } });
    assert.equal(
      (
        await fetch(url + "/api/health", {
          headers: { Origin: "https://realitylab-example.onrender.com" },
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await fetch(custom + "/api/health", {
          headers: { Origin: "https://custom.example" },
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await fetch(custom + "/api/health", {
          headers: { Origin: "https://realitylab-example.onrender.com" },
        })
      ).status,
      403,
    );
  } finally {
    if (oldRender === undefined) delete process.env.RENDER_EXTERNAL_URL;
    else process.env.RENDER_EXTERNAL_URL = oldRender;
    if (oldOrigin === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = oldOrigin;
  }
});

test("scan concepts and operation steps receive remapped component IDs from the same analysis", async (t) => {
  const { scanFixture } = await import("./helpers/scanFixture.js");
  const url = await serve(t, {
    provider: {
      configured: true,
      provider: "TEST-FIXTURE",
      model: "fixture",
      analyze: async () => scanFixture("electronics"),
    },
  });
  const response = await fetch(url + "/api/analyze", {
    method: "POST",
    body: form(await image()),
  });
  assert.equal(response.status, 200);
  const result = await response.json();
  const ids = new Set(result.observations.map((o) => o.id));
  assert(
    result.spatialModel.parts.every(
      (p) => ids.has(p.observationId) && p.source === "model-suggested",
    ),
  );
  assert(
    result.operation.steps.every((step) =>
      step.observationIds.every((id) => ids.has(id)),
    ),
  );
  assert.equal(result.recreationGuide.scope, "unpowered-study-model");
  assert.equal(result.mechanism.type, "unsupported");
});

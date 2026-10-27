import assert from "node:assert/strict";

const supplied = process.argv[2];
if (!supplied)
  throw Error("Usage: npm run smoke -- https://YOUR-SERVICE.onrender.com");
const base = new URL(supplied);
if (
  !["http:", "https:"].includes(base.protocol) ||
  base.username ||
  base.password ||
  base.search ||
  base.hash ||
  base.pathname !== "/"
)
  throw Error(
    "Supply the app origin only, without credentials, path, query or fragment.",
  );
async function get(path, options = {}) {
  return fetch(new URL(path, base), {
    ...options,
    signal: AbortSignal.timeout(30000),
  });
}
const home = await get("/");
assert.equal(home.status, 200, "Home page must respond");
assert.match(await home.text(), /RealityLab/, "Expected RealityLab page");
const response = await get("/api/health");
assert.equal(response.status, 200, "Health endpoint must respond");
const health = await response.json();
assert.equal(health.status, "ok");
assert(health.capabilities.includes("general-object-exploration"));
const prediction = await get("/api/tools/predict", {
  method: "POST",
  headers: { "Content-Type": "application/json", Origin: base.origin },
  body: JSON.stringify({
    tool: "pulley",
    loadNewtons: 80,
    supportingStrands: 4,
    liftMeters: 0.5,
    confirmed: true,
  }),
});
assert.equal(prediction.status, 200, "Same-origin manual tool must work");
const foreign = await get("/api/health", {
  headers: { Origin: "https://untrusted.example" },
});
assert.equal(foreign.status, 403, "Foreign browser origin must be rejected");
console.log(
  JSON.stringify(
    {
      origin: base.origin,
      page: "ok",
      health: "ok",
      sameOriginTool: "ok",
      foreignOriginRejected: true,
      analysisConfigured: health.analysis.configured,
      liveVerified: health.analysis.liveVerified,
      aiCallsMade: 0,
    },
    null,
    2,
  ),
);

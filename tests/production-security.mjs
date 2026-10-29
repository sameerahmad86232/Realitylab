// Exercise actual HTTP routes in an isolated production-mode Next.js server.
// No real provider key, live model inference, paid quota resource or network fixtures.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import sharp from "sharp";

const base = "http://127.0.0.1:3137";
const accessCode = "ci-preview-only-strong-code-1749";
const env = {
  ...process.env,
  NODE_ENV: "production",
  APP_ORIGIN: base,
  BASETEN_API_KEY: "ci-fake-provider-key-never-used",
  REALITYLAB_ACCESS_CODE: accessCode,
  REALITYLAB_SESSION_SECRET: "ci-private-signing-secret-is-long-enough-and-test-only",
  DURABLE_QUOTA_REQUIRED: "true",
  PROVIDER_SPEND_CAP_VERIFIED: "false",
  INFERENCE_REQUESTS_PER_HOUR: "5",
};
delete env.UPSTASH_REDIS_REST_URL;
delete env.UPSTASH_REDIS_REST_TOKEN;
delete env.RENDER_EXTERNAL_URL;

let output = "";
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3137"],
  { env, stdio: ["ignore", "pipe", "pipe"], cwd: process.cwd() },
);
for (const stream of [server.stdout, server.stderr])
  stream.on("data", chunk => { output = (output + String(chunk)).slice(-6000); });

function request(path, options = {}) {
  return fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(15000), ...options });
}
function form(code, origin = base) {
  return request("/api/access", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code }).toString(),
  });
}
async function scan(cookie) {
  const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: "#fff" } }).png().toBuffer();
  const body = new FormData();
  body.set("consent", "true");
  body.set("context", "");
  body.append("images", new File([png], "ci.png", { type: "image/png" }));
  return request("/api/scan", {
    method: "POST",
    headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}) },
    body,
  });
}
async function run() {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw Error("Production server terminated unexpectedly. " + output);
    try {
      const health = await request("/api/health");
      if (health.ok) { ready = true; break; }
    } catch {}
    await sleep(200);
  }
  assert.equal(ready, true, "Production server failed to start: " + output);
  const health = await (await request("/api/health")).json();
  assert.equal(health.security.configured, true, "Private preview must be configured");
  assert.equal(health.security.sharedQuotaRequired, true, "Production must fail closed");
  assert.equal(health.security.billingCapConfirmed, false, "No provider cap was verified");
  assert.equal(health.security.livePaidRequestsReady, false, "Paid inference must be disabled");
  assert.equal(health.capacity.durableQuota.configured, false, "No durable test store");
  assert.equal((await request("/access")).status, 200, "Private access screen must render");

  assert.equal((await scan()).status, 401, "Untrusted scans must be denied");
  const learning = { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: "{}" };
  assert.equal((await request("/api/learn", learning)).status, 401, "Untrusted learning requests must be denied");
  assert.equal((await form("wrong-password", "https://attacker.invalid")).status, 403, "Cross-origin login must fail");

  const bad = await form("wrong-password");
  assert.equal(bad.status, 303, "Invalid login must redirect");
  assert.equal(bad.headers.get("set-cookie"), null, "Invalid login must not authenticate");
  assert.match(bad.headers.get("location") ?? "", /\/access\?error=invalid$/);

  const success = await form(accessCode);
  assert.equal(success.status, 303, "Correct login must redirect");
  const setCookie = success.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /realitylab_session=v1\./);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Secure/i);
  const cookie = setCookie.split(";")[0];
  assert.equal((await scan(cookie)).status, 503, "Authenticated scan must fail closed without Redis");
  assert.equal((await scan("realitylab_session=forged")).status, 401, "Forged session must fail");

  for (let i = 0; i < 5; i++)
    assert.equal((await form("invalid-code-" + i)).status, 303);
  assert.equal((await form(accessCode)).status, 429, "Login throttle must block attempts even with the correct code");
  console.log("PASS: production HTTP login, session cookie security, invalid/foreign origins, paid endpoint auth, durable quota fail-closed, login throttling; no provider calls.");
}
try {
  await run();
} finally {
  server.kill("SIGTERM");
  await Promise.race([
    new Promise(resolve => server.once("exit", resolve)),
    sleep(2000),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

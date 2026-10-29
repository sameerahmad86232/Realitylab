import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  durableQuotaConfiguration,
  hourlyInferenceLimit,
  reserveDurableInferenceBudget,
  reserveInferenceBudget,
} from "../lib/server/limits.ts";
import { ScanError } from "../lib/server/provider.ts";

const originalFetch = globalThis.fetch,
  saved = {
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
    required: process.env.DURABLE_QUOTA_REQUIRED,
    limit: process.env.INFERENCE_REQUESTS_PER_HOUR,
  };
beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.DURABLE_QUOTA_REQUIRED;
  delete process.env.INFERENCE_REQUESTS_PER_HOUR;
  globalThis.fetch = originalFetch;
});
afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    const name = {
      url: "UPSTASH_REDIS_REST_URL",
      token: "UPSTASH_REDIS_REST_TOKEN",
      required: "DURABLE_QUOTA_REQUIRED",
      limit: "INFERENCE_REQUESTS_PER_HOUR",
    }[key as keyof typeof saved];
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  globalThis.fetch = originalFetch;
});

test("process limit is bounded, configurable and explicitly restartable state", () => {
  process.env.INFERENCE_REQUESTS_PER_HOUR = "2";
  assert.equal(hourlyInferenceLimit(), 2);
  const state = { hour: 0, hourCount: 0 };
  reserveInferenceBudget(state, 10);
  reserveInferenceBudget(state, 11);
  assert.throws(
    () => reserveInferenceBudget(state, 12),
    (error) => error instanceof ScanError && error.status === 429,
  );
  process.env.INFERENCE_REQUESTS_PER_HOUR = "unbounded";
  assert.equal(hourlyInferenceLimit(), 50);
});
test("missing durable store is reported and can fail closed when required", async () => {
  assert.equal(durableQuotaConfiguration().configured, false);
  assert.deepEqual(await reserveDurableInferenceBudget(), {
    state: "not-configured",
    limit: 50,
    used: null,
    remaining: null,
    resetSeconds: null,
  });
  process.env.DURABLE_QUOTA_REQUIRED = "true";
  await assert.rejects(
    reserveDurableInferenceBudget(),
    (error) => error instanceof ScanError && error.status === 503,
  );
});
test("atomic shared reservation returns remaining capacity without exposing credentials", async () => {
  process.env.UPSTASH_REDIS_REST_URL = "https://quota.example";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  process.env.INFERENCE_REQUESTS_PER_HOUR = "5";
  let authorization = "",
    command: unknown;
  globalThis.fetch = async (_url, options) => {
    authorization = String(
      (options?.headers as Record<string, string>).Authorization,
    );
    command = JSON.parse(String(options?.body));
    return Response.json({ result: [1, 3, 1200] });
  };
  assert.deepEqual(await reserveDurableInferenceBudget(), {
    state: "enforced",
    limit: 5,
    used: 3,
    remaining: 2,
    resetSeconds: 1200,
  });
  assert.equal(authorization, "Bearer test-token");
  assert.equal((command as unknown[])[0], "EVAL");
});
test("shared rejection remains 429 while store failures only fail open when optional", async () => {
  process.env.UPSTASH_REDIS_REST_URL = "https://quota.example";
  process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";
  globalThis.fetch = async () => Response.json({ result: [0, 51, 900] });
  await assert.rejects(
    reserveDurableInferenceBudget(),
    (error) => error instanceof ScanError && error.status === 429,
  );
  globalThis.fetch = async () => new Response("", { status: 503 });
  assert.equal((await reserveDurableInferenceBudget()).state, "fallback");
  process.env.DURABLE_QUOTA_REQUIRED = "true";
  await assert.rejects(
    reserveDurableInferenceBudget(),
    (error) => error instanceof ScanError && error.status === 503,
  );
});

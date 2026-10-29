import { ScanError } from "./provider.ts";

const DEFAULT_HOURLY_LIMIT = 50;
export type DurableQuotaState = "enforced" | "fallback" | "not-configured";
export type QuotaResult = {
  state: DurableQuotaState;
  limit: number;
  used: number | null;
  remaining: number | null;
  resetSeconds: number | null;
};

export function hourlyInferenceLimit() {
  const value = Number(
    process.env.INFERENCE_REQUESTS_PER_HOUR || DEFAULT_HOURLY_LIMIT,
  );
  return Number.isInteger(value) && value >= 1 && value <= 1000
    ? value
    : DEFAULT_HOURLY_LIMIT;
}

/** Reserve synchronously immediately before inference; normalization may have awaited. */
export function reserveInferenceBudget(
  state: { hour: number; hourCount: number },
  now = Date.now(),
) {
  if (now - state.hour >= 3_600_000) {
    state.hour = now;
    state.hourCount = 0;
  }
  if (state.hourCount >= hourlyInferenceLimit())
    throw new ScanError(
      429,
      "The hourly demo limit has been reached. Please return later.",
    );
  state.hourCount++;
}

export function durableQuotaConfiguration() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "") || "";
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || "";
  return {
    configured: Boolean(url && token),
    url,
    token,
    // Production must not silently fall back to restartable process counters.
    required: process.env.NODE_ENV === "production" || process.env.DURABLE_QUOTA_REQUIRED === "true",
  };
}

function bucket(now = Date.now()) {
  return Math.floor(now / 3_600_000);
}
async function command(command: unknown[], signal?: AbortSignal) {
  const config = durableQuotaConfiguration();
  if (!config.configured) throw Error("Durable quota store is not configured.");
  const timeout = AbortSignal.timeout(3500),
    combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
  const response = await fetch(config.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: combined,
  });
  if (!response.ok) {
    await response.body?.cancel();
    throw Error(`Durable quota store returned ${response.status}.`);
  }
  const body = (await response.json()) as { result?: unknown; error?: string };
  if (body.error) throw Error("Durable quota store rejected the command.");
  return body.result;
}

const reserveScript =
  "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[2]) end; local ttl=redis.call('TTL',KEYS[1]); if n>tonumber(ARGV[1]) then return {0,n,ttl} end; return {1,n,ttl}";
export async function reserveDurableInferenceBudget(
  signal?: AbortSignal,
  now = Date.now(),
): Promise<QuotaResult> {
  const config = durableQuotaConfiguration(),
    limit = hourlyInferenceLimit();
  if (!config.configured) {
    if (config.required)
      throw new ScanError(
        503,
        "The shared usage limit is not configured. Analysis is temporarily unavailable.",
      );
    return {
      state: "not-configured",
      limit,
      used: null,
      remaining: null,
      resetSeconds: null,
    };
  }
  try {
    const value = await command(
      [
        "EVAL",
        reserveScript,
        "1",
        `realitylab:inference:${bucket(now)}`,
        String(limit),
        "3700",
      ],
      signal,
    );
    if (
      !Array.isArray(value) ||
      value.length < 3 ||
      !value.every((item) => Number.isFinite(Number(item)))
    )
      throw Error("Durable quota response was invalid.");
    const allowed = Number(value[0]) === 1,
      used = Number(value[1]),
      resetSeconds = Math.max(0, Number(value[2]));
    if (!allowed)
      throw new ScanError(
        429,
        "The shared hourly demo limit has been reached. Please return later.",
      );
    return {
      state: "enforced",
      limit,
      used,
      remaining: Math.max(0, limit - used),
      resetSeconds,
    };
  } catch (error) {
    if (error instanceof ScanError) throw error;
    if (config.required)
      throw new ScanError(
        503,
        "The shared usage limit is unavailable. Analysis is temporarily paused.",
      );
    console.warn(
      JSON.stringify({
        event: "durable_quota_fallback",
        errorType: error instanceof Error ? error.name : "unknown",
      }),
    );
    return {
      state: "fallback",
      limit,
      used: null,
      remaining: null,
      resetSeconds: null,
    };
  }
}

export async function recordDurableUsage(
  kind: "scan" | "lesson" | "question",
  tokens: number | null,
  now = Date.now(),
) {
  if (!durableQuotaConfiguration().configured) return;
  try {
    const key = `realitylab:usage:${bucket(now)}`,
      amount = tokens ?? 0;
    await command([
      "EVAL",
      "redis.call('HINCRBY',KEYS[1],ARGV[1],1); redis.call('HINCRBY',KEYS[1],'known_tokens',ARGV[2]); redis.call('HINCRBY',KEYS[1],'unknown_token_requests',ARGV[3]); redis.call('EXPIRE',KEYS[1],ARGV[4]); return 1",
      "1",
      key,
      kind,
      String(amount),
      tokens === null ? "1" : "0",
      "3700",
    ]);
  } catch (error) {
    console.warn(
      JSON.stringify({
        event: "durable_usage_record_failed",
        errorType: error instanceof Error ? error.name : "unknown",
      }),
    );
  }
}

export async function durableQuotaSnapshot(
  now = Date.now(),
): Promise<QuotaResult> {
  const config = durableQuotaConfiguration(),
    limit = hourlyInferenceLimit();
  if (!config.configured)
    return {
      state: "not-configured",
      limit,
      used: null,
      remaining: null,
      resetSeconds: null,
    };
  try {
    const value = await command(["GET", `realitylab:inference:${bucket(now)}`]);
    const used = value === null ? 0 : Number(value);
    if (!Number.isFinite(used)) throw Error("Invalid quota value.");
    return {
      state: "enforced",
      limit,
      used,
      remaining: Math.max(0, limit - used),
      resetSeconds: 3600 - (Math.floor(now / 1000) % 3600),
    };
  } catch {
    return {
      state: "fallback",
      limit,
      used: null,
      remaining: null,
      resetSeconds: null,
    };
  }
}

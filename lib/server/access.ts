import { createHmac, timingSafeEqual } from "node:crypto";
import { ScanError } from "./provider.ts";

export const ACCESS_COOKIE = "realitylab_session";
const SESSION_SECONDS = 8 * 60 * 60;

function configured() {
  return (
    (process.env.REALITYLAB_ACCESS_CODE?.length ?? 0) >= 16 &&
    (process.env.REALITYLAB_SESSION_SECRET?.length ?? 0) >= 32
  );
}

export function accessStatus() {
  return { configured: configured(), restricted: process.env.NODE_ENV === "production" || configured() };
}

function signature(expires: string) {
  return createHmac("sha256", process.env.REALITYLAB_SESSION_SECRET!).update("RealityLab:v1:" + expires).digest("hex");
}

export function validAccessCode(candidate: unknown): boolean {
  if (!configured() || typeof candidate !== "string") return false;
  const expected = Buffer.from(process.env.REALITYLAB_ACCESS_CODE!);
  const supplied = Buffer.from(candidate);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

export function newSession(now = Date.now()) {
  if (!configured()) throw new Error("Private access is not configured");
  const expires = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return { value: "v1." + expires + "." + signature(expires), maxAge: SESSION_SECONDS };
}

export function validSession(value: string | undefined, now = Date.now()) {
  if (!configured() || !value) return false;
  const match = /^v1\.([0-9]{10,11})\.([0-9a-f]{64})$/.exec(value);
  if (!match) return false;
  const expiry = Number(match[1]);
  if (!Number.isSafeInteger(expiry) || expiry <= Math.floor(now / 1000)) return false;
  if (expiry > Math.floor(now / 1000) + SESSION_SECONDS) return false;
  return timingSafeEqual(Buffer.from(signature(match[1]), "hex"), Buffer.from(match[2], "hex"));
}

export function assertPaidAccess(request: Request) {
  const { configured: enabled, restricted } = accessStatus();
  if (!enabled) {
    if (restricted) throw new ScanError(503, "Live AI is closed until private access is configured. Recorded examples remain available.");
    return; // Local development and test fixture execution only.
  }
  const cookie = request.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => x.startsWith(ACCESS_COOKIE + "="));
  let value: string | undefined;
  try { value = cookie ? decodeURIComponent(cookie.slice(ACCESS_COOKIE.length + 1)) : undefined; } catch {}
  if (!validSession(value)) throw new ScanError(401, "Private AI access required. Open /access to unlock live scanning and learning.");
}

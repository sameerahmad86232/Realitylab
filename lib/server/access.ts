import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE = "realitylab_session";
const SESSION_SECONDS = 8 * 60 * 60;

function configured() {
  return (
    (process.env.REALITYLAB_ACCESS_CODE?.length ?? 0) >= 16 &&
    (process.env.REALITYLAB_SESSION_SECRET?.length ?? 0) >= 32
  );
}

export function accessStatus() {
  return { configured: configured(), restricted: false };
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
  void request;
}

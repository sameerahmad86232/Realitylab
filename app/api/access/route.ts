import { NextResponse } from "next/server";
import { ACCESS_COOKIE, accessStatus, newSession, validAccessCode } from "../../../lib/server/access";

export const runtime = "nodejs";
const attempts = new Map<string, { count: number; until: number }>();

export async function POST(request: Request) {
  // Form-only endpoint with origin validation. Do not record passcodes in logs or URLs.
  // Next.js may receive an internal URL behind Render's reverse proxy.
  // Validate against our configured public origin, never an untrusted forwarded host.
  const configuredOrigin = process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || request.url;
  let publicOrigin: string;
  try {
    publicOrigin = new URL(configuredOrigin).origin;
  } catch {
    return new Response("Private access origin is unavailable.", { status: 503 });
  }
  if (request.headers.get("origin") !== publicOrigin)
    return new Response("Origin rejected.", { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown";
  const now = Date.now();
  const prior = attempts.get(ip);
  if (prior && prior.until > now && prior.count >= 5)
    return new Response("Too many attempts. Try again later.", { status: 429, headers: { "Cache-Control": "no-store" } });
  if ((Number(request.headers.get("content-length") || 0)) > 2048)
    return new Response("Invalid request.", { status: 413 });
  let code: FormDataEntryValue | null;
  try {
    const text = await request.text();
    if (text.length > 2048 || !request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded"))
      return new Response("Invalid request.", { status: 400 });
    code = new URLSearchParams(text).get("code");
  } catch {
    return new Response("Invalid request.", { status: 400 });
  }
  if (!validAccessCode(code)) {
    attempts.set(ip, { count: (prior?.until && prior.until > now ? prior.count : 0) + 1, until: now + 15 * 60_000 });
    return NextResponse.redirect(new URL("/access?error=invalid", publicOrigin), 303);
  }
  if (!accessStatus().configured) return new Response("Private access is unavailable.", { status: 503 });
  attempts.delete(ip);
  const response = NextResponse.redirect(new URL("/", publicOrigin), 303);
  response.cookies.set(ACCESS_COOKIE, newSession().value, {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

import { z } from "zod";
import { assertPaidAccess } from "../../../lib/server/access.ts";
import { reserveDurableInferenceBudget, reserveInferenceBudget } from "../../../lib/server/limits.ts";
import { ScanError } from "../../../lib/server/provider.ts";
import { scanState } from "../../../lib/server/scan.ts";

export const runtime = "nodejs";
export const maxDuration = 90;

const requestSchema = z.object({
  object_name: z.string().trim().min(1).max(180),
  component_name: z.string().trim().min(1).max(120),
  component_function: z.string().trim().min(1).max(700),
  evidence_status: z.enum(["observed", "inferred"]),
  materials: z.array(z.string().trim().min(1).max(100)).max(3),
}).strict();

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    const expected = process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL;
    const trusted = !!origin && (expected ? new URL(origin).origin === new URL(expected).origin : new URL(origin).host === (request.headers.get("host") || new URL(request.url).host));
    if (!trusted)
      throw new ScanError(403, "Use component illustration from the RealityLab website.");
    assertPaidAccess(request);
    if (!request.headers.get("content-type")?.includes("application/json"))
      throw new ScanError(415, "Send a JSON component request.");
    const input = requestSchema.parse(await request.json());
    const key = process.env.META_API_KEY;
    const model = process.env.META_IMAGE_MODEL;
    if (!key || !model)
      throw new ScanError(503, "Meta component illustration is not configured yet.");
    reserveInferenceBudget(scanState);
    await reserveDurableInferenceBudget(request.signal);
    const prompt = `Isolated engineering concept illustration of the ${input.component_name} from a ${input.object_name}. Functional role: ${input.component_function}. Possible materials: ${input.materials.join(", ") || "unknown"}. ${input.evidence_status === "observed" ? "Use the description as a photo-grounded interpretation, without inventing dimensions." : "This part is inferred and not visible; present it as a clearly conceptual possibility."} Single component only, three-quarter orthographic view, clean white background, precise dark graphite outlines, subtle cyan technical callouts, no text, no logo, no dimensions, no hands, no complete object, educational exploded-parts catalog style.`;
    if (scanState.active >= 2) throw new ScanError(429, "The live demo is busy. Try again shortly.");
    scanState.active++;
    let response: Response;
    try {
      response = await fetch(`${(process.env.META_API_BASE_URL || "https://api.meta.ai/v1").replace(/\/$/, "")}/images/generations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt, n: 1, size: "1024x1024", response_format: "b64_json" }),
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(80000)]),
      });
    } finally { scanState.active--; }
    const body = await response.json().catch(() => null) as { data?: { b64_json?: string; url?: string }[]; error?: unknown } | null;
    if (!response.ok) throw new ScanError(response.status === 429 ? 429 : 502, response.status === 429 ? "The image provider limit was reached. Try later." : "Meta could not create this component illustration.");
    const item = body?.data?.[0];
    const image = item?.b64_json ? `data:image/png;base64,${item.b64_json}` : item?.url;
    if (!image || (!image.startsWith("data:image/png;base64,") && !image.startsWith("https://")))
      throw new ScanError(502, "Meta returned an invalid component illustration.");
    return json({ image, model, conceptual: true });
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) return json({ error: { message: "A valid component description is required." } }, 400);
    if (error instanceof ScanError) return json({ error: { message: error.message } }, error.status);
    if (error instanceof DOMException && ["AbortError", "TimeoutError"].includes(error.name)) return json({ error: { message: "Component illustration timed out. Try again." } }, 504);
    return json({ error: { message: "Component illustration is temporarily unavailable." } }, 502);
  }
}

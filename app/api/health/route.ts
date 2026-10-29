import { configuration } from "../../../lib/server/provider";
import { scanState } from "../../../lib/server/scan";
export const runtime = "nodejs";
export function GET() {
  const { configured, provider, model } = configuration();
  return Response.json(
    {
      status: "ok",
      app: "RealityLab",
      release: "recoverable-projects-v21",
      sourceRevision: process.env.RENDER_GIT_COMMIT || null,
      analysis: {
        configured,
        provider,
        model,
        liveVerified: scanState.lastSuccess !== null,
        lastSuccess: scanState.lastSuccess,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

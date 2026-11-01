import { configuration } from "../../../lib/server/provider";
import { accessStatus } from "../../../lib/server/access";
import { scanState } from "../../../lib/server/scan";
import {
  durableQuotaConfiguration,
  durableQuotaSnapshot,
  hourlyInferenceLimit,
} from "../../../lib/server/limits";
export const runtime = "nodejs";
export async function GET() {
  const { configured, provider, model } = configuration();
  const componentImageProvider = process.env.COMPONENT_IMAGE_PROVIDER || "meta";
  const componentImageModel = process.env.META_IMAGE_MODEL || null;
  const componentImageConfigured =
    componentImageProvider === "meta"
      ? Boolean(process.env.META_API_KEY && componentImageModel)
      : Boolean(
          process.env.MODAL_IMAGE_ENDPOINT && process.env.MODAL_IMAGE_SECRET,
        );
  const durable = durableQuotaConfiguration(),
    quota = await durableQuotaSnapshot(),
    processHourlyUsed=Date.now()-scanState.hour>=3_600_000?0:scanState.hourCount;
  return Response.json(
    {
      status: "ok",
      app: "RealityLab",
      release: "safe-image-readiness-v23",
      sourceRevision: process.env.RENDER_GIT_COMMIT || null,
      analysis: {
        configured,
        provider,
        model,
        liveVerified: scanState.lastSuccess !== null,
        lastSuccess: scanState.lastSuccess,
      },
      componentImages: {
        configured: componentImageConfigured,
        provider: componentImageProvider,
        model: componentImageProvider === "meta" ? componentImageModel : null,
      },
      security: {
        ...accessStatus(),
        sharedQuotaRequired: durable.required,
        billingCapConfirmed: process.env.PROVIDER_SPEND_CAP_VERIFIED === "true",
        livePaidRequestsReady: accessStatus().configured && quota.state === "enforced" && process.env.PROVIDER_SPEND_CAP_VERIFIED === "true",
      },
      capacity: {
        activeRequests: scanState.active,
        processHourlyUsed,
        processHourlyLimit: hourlyInferenceLimit(),
        processCountersResetOnRestart: true,
        durableQuota: {
          configured: durable.configured,
          required: durable.required,
          state: quota.state,
          used: quota.used,
          remaining: quota.remaining,
          limit: quota.limit,
          resetSeconds: quota.resetSeconds,
        },
        providerSpendCapVerified:
          process.env.PROVIDER_SPEND_CAP_VERIFIED === "true",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

import { z } from "zod";

export const stageIds = ["validation", "normalization", "quota", "analysis", "safety", "research", "verification", "complete"] as const;
export const stageLabels: Record<typeof stageIds[number], string> = {
  validation: "Checking upload and consent", normalization: "Preparing photos",
  quota: "Checking request budget", analysis: "Examining evidence and possible causes",
  safety: "Checking guidance against safety rules", research: "Manual research",
  verification: "Follow-up repair verification", complete: "Preparing results",
};
export const stageEventSchema = z.object({
  caseId: z.string().uuid(), sequence: z.number().int().positive(),
  stage: z.enum(stageIds), status: z.enum(["queued", "running", "completed", "skipped", "failed"]),
  elapsedMs: z.number().nonnegative(), durationMs: z.number().nonnegative().optional(),
  reason: z.string().max(200).optional(),
}).strict();
export type StageEvent = z.infer<typeof stageEventSchema>;
export const orchestrationSchema = z.object({
  version: z.literal(1), caseId: z.string().uuid(),
  status: z.enum(["completed", "failed", "cancelled"]),
  events: z.array(stageEventSchema).max(32),
  budget: z.object({maxCalls: z.literal(1), callsUsed: z.number().int().min(0).max(1), maxOutputTokens: z.number().int().positive(), maxPhotos: z.literal(3)}).strict(),
  safety: z.object({decision: z.enum(["allow", "request-evidence", "refer"]), ruleIds: z.array(z.string().max(80)).max(10)}).strict().optional(),
}).strict();
export type Orchestration = z.infer<typeof orchestrationSchema>;

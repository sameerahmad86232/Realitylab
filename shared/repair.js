import { z } from "zod";
const text = (n) => z.string().trim().min(1).max(n);
export const repairSourceSchema = z
  .object({
    scanId: text(100),
    objectName: text(150),
    summary: text(2000),
    parts: z
      .array(
        z
          .object({
            id: text(60),
            name: text(150),
            evidence: text(1000),
            role: z.string().trim().max(700),
          })
          .strict(),
      )
      .min(1)
      .max(30),
  })
  .strict()
  .superRefine((s, c) => {
    if (new Set(s.parts.map((p) => p.id)).size !== s.parts.length)
      c.addIssue({ code: "custom", message: "Part IDs must be unique." });
  });
const followUpSchema = z
  .object({ question: text(600), photoInstruction: text(600).nullable() })
  .strict();
const status = z.enum([
  "repair-guide",
  "needs-more-evidence",
  "professional-help",
]);
export const repairResultSchema = z
  .object({
    status,
    confidence: z.enum(["supported", "uncertain"]),
    suspectedPartId: text(60).nullable(),
    summary: text(1500),
    evidence: z
      .array(
        z
          .object({
            observationId: text(60).nullable(),
            imageId: text(60).nullable(),
            basis: text(700),
          })
          .strict(),
      )
      .max(6),
    alternatives: z
      .array(z.object({ observationId: text(60), reason: text(500) }).strict())
      .max(3),
    followUp: followUpSchema.nullable(),
    steps: z
      .array(
        z
          .object({
            title: text(150),
            instruction: text(800),
            check: text(500),
            stopIf: text(500),
          })
          .strict(),
      )
      .max(5),
    precautions: z.array(text(500)).min(1).max(5),
    limitations: z.array(text(500)).min(1).max(5),
  })
  .strict()
  .superRefine((r, c) => {
    if (
      r.status === "repair-guide" &&
      (r.steps.length < 3 ||
        !r.suspectedPartId ||
        r.confidence !== "supported" ||
        !r.evidence.length ||
        r.followUp)
    )
      c.addIssue({
        code: "custom",
        message:
          "A guide needs a supported existing part, evidence and 3–5 steps, without a pending follow-up.",
      });
    if (r.status !== "repair-guide" && r.steps.length)
      c.addIssue({
        code: "custom",
        message:
          "Uncertain or professional-only assessments cannot contain DIY repair steps.",
      });
    if (
      r.status === "needs-more-evidence" &&
      (!r.followUp || r.confidence !== "uncertain")
    )
      c.addIssue({
        code: "custom",
        message: "Uncertain assessments must ask one follow-up before repair.",
      });
    if (r.status === "professional-help" && r.followUp)
      c.addIssue({
        code: "custom",
        message:
          "Professional-only assessments must not ask the user to investigate a hazard.",
      });
  });
export const repairRequestSchema = z
  .object({
    source: repairSourceSchema,
    problem: z.string().trim().max(1500),
    answer: z.string().trim().max(1500).default(""),
    originalImageCount: z.number().int().min(1).max(3),
    consent: z.literal(true),
    previous: z
      .object({
        status,
        summary: text(1500),
        suspectedPartId: text(60).nullable(),
        followUp: followUpSchema.nullable(),
      })
      .strict()
      .nullable()
      .default(null),
  })
  .strict()
  .superRefine((r, c) => {
    if (
      r.previous?.suspectedPartId &&
      !r.source.parts.some((p) => p.id === r.previous.suspectedPartId)
    )
      c.addIssue({
        code: "custom",
        message: "The previous assessment refers to an absent part.",
      });
  });
export function validateRepairResult(raw, source, imageIds) {
  const result = repairResultSchema.parse(raw);
  const ids = new Set(source.parts.map((p) => p.id));
  const refs = [
    result.suspectedPartId,
    ...result.alternatives.map((a) => a.observationId),
    ...result.evidence.map((e) => e.observationId),
  ].filter(Boolean);
  if (refs.some((id) => !ids.has(id)))
    throw Error("Repair assessment refers to an absent component.");
  if (result.evidence.some((e) => e.imageId && !imageIds.includes(e.imageId)))
    throw Error("Repair assessment refers to an absent photo.");
  return result;
}
export function repairHazard(problem, answer = "") {
  const symptoms = `${problem} ${answer}`
    .toLowerCase()
    .replace(
      /\b(?:no|not|without)\s+(?:smoke|sparks?|sparking|burning smell|electric shock)\b/g,
      "",
    );
  const risk =
    /\b(smoke|smoking|sparks?|sparking|burning smell|gas leak|leaking gas|brakes?|braking|steering|high[ -]?voltage|electric shock|electrocut\w*)\b|(?:swollen|bulging|puffed).{0,25}(?:battery|cell)|(?:battery|cell).{0,25}(?:swollen|bulging|puffed)/i.test(
      symptoms,
    );
  if (!risk) return null;
  return repairResultSchema.parse({
    status: "professional-help",
    confidence: "uncertain",
    suspectedPartId: null,
    summary:
      "The reported symptoms may involve a safety-critical or hazardous fault. Stop using the object and arrange qualified service; a photo cannot establish a safe DIY repair.",
    evidence: [
      {
        observationId: null,
        imageId: null,
        basis:
          "The problem description includes a potentially hazardous or safety-critical symptom. This is a precautionary routing decision, not a fault diagnosis.",
      },
    ],
    alternatives: [],
    followUp: null,
    steps: [],
    precautions: [
      "Stop using the object. Do not open, energize or test it to reproduce the symptom.",
      /\b(smoke|smoking|gas leak|leaking gas)\b/.test(symptoms)
        ? "If there is an active fire, gas release or immediate danger, leave the area and contact the appropriate local emergency service. Otherwise contact qualified repair support."
        : "Contact qualified repair support before using the object again.",
    ],
    limitations: [
      "The app has not verified a faulty component or the condition of the object.",
      "No DIY repair guide is provided for this reported hazard.",
    ],
  });
}

export { repairSource, repairMarkdown } from "./repairFormatting.js";

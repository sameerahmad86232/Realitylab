import { z } from "zod";
const text = (max = 1000) => z.string().trim().min(1).max(max);
export const componentSchema = z
  .object({
    id: text(40).regex(/^[a-zA-Z0-9_-]+$/),
    name: text(120),
    function: text(1000),
    observed: z.boolean(),
    evidence: text(1200),
    material_candidates: z.array(text(100)).max(3),
    confidence: z.enum(["supported", "uncertain"]),
    image_index: z.number().int().min(0).max(2).nullable(),
    marker: z
      .object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) })
      .strict()
      .nullable(),
    connections: z.array(text(40)).max(7),
  })
  .strict()
  .superRefine((part, ctx) => {
    if (part.observed && part.image_index === null)
      ctx.addIssue({
        code: "custom",
        message: "Observed parts need a source photo.",
      });
    if (!part.observed && (part.image_index !== null || part.marker !== null))
      ctx.addIssue({
        code: "custom",
        message: "Inferred parts cannot claim photographed locations.",
      });
  });
export const analysisSchema = z
  .object({
    object_name: text(180),
    summary: text(2000),
    category: text(80),
    recognition: z.enum(["identified", "uncertain", "no-object"]),
    components: z.array(componentSchema).max(8),
    principles: z
      .array(
        z
          .object({
            name: text(120),
            explanation: text(1500),
            component_ids: z.array(text(40)).max(8),
          })
          .strict(),
      )
      .max(4),
    uncertainty: z.array(text(700)).min(1).max(8),
    next_steps: z.array(text(700)).max(4),
    safety_notes: z.array(text(700)).min(1).max(5),
  })
  .strict()
  .superRefine((data, ctx) => {
    const ids = new Set(data.components.map((p) => p.id));
    if (ids.size !== data.components.length)
      ctx.addIssue({
        code: "custom",
        message: "Component IDs must be unique.",
      });
    for (const p of data.components)
      if (
        p.connections.some((id) => !ids.has(id) || id === p.id) ||
        new Set(p.connections).size !== p.connections.length
      )
        ctx.addIssue({
          code: "custom",
          message: "Connections must reference other supplied components.",
        });
    for (const p of data.principles)
      if (p.component_ids.some((id) => !ids.has(id)))
        ctx.addIssue({
          code: "custom",
          message: "Principles must reference supplied components.",
        });
    if (
      data.recognition === "no-object" &&
      (data.components.length || data.principles.length)
    )
      ctx.addIssue({
        code: "custom",
        message: "No-object results cannot contain components or principles.",
      });
  });
export type Analysis = z.infer<typeof analysisSchema>;
export const scanResultSchema = z
  .object({
    analysis: analysisSchema,
    meta: z
      .object({
        requestId: z.string().uuid(),
        provider: text(80),
        model: text(200),
        durationMs: z.number().nonnegative().finite(),
        analyzedAt: z.string().datetime(),
        usage: z
          .object({
            inputTokens: z.number().int().nonnegative().nullable(),
            outputTokens: z.number().int().nonnegative().nullable(),
            totalTokens: z.number().int().nonnegative().nullable(),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();
export type ScanResult = z.infer<typeof scanResultSchema>;
export type WorkspaceState = {
  selected?: string;
  image?: number;
  view?: "photo" | "map" | "blueprint";
  adjustments?: Record<string, { x: number; y: number }>;
};
export type ScanView = {
  startInBlueprint?: boolean;
  recorded?: { sourceUrl: string; author: string; license: string };
  result: ScanResult;
  photos: {
    id: string;
    url: string;
    width: number;
    height: number;
    omitted?: boolean;
  }[];
  workspace?: WorkspaceState;
};

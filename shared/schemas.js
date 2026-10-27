import { z } from "zod";
const text = (max = 1000) => z.string().trim().min(1).max(max);
const point = z
  .object({
    x: z.number().finite().min(0).max(1),
    y: z.number().finite().min(0).max(1),
  })
  .strict();
export const modelAnalysisSchema = z
  .object({
    objectName: text(150),
    summary: text(2000),
    category: z
      .enum([
        "vehicle",
        "electronics",
        "appliance",
        "furniture",
        "tool",
        "mechanism",
        "natural",
        "other",
        "unclear",
      ])
      .default("other"),
    recognition: z
      .enum(["identified", "uncertain", "no-object"])
      .default("identified"),
    relationships: z
      .array(
        z
          .object({
            source: text(60),
            target: text(60),
            relation: z.enum([
              "connected-to",
              "supports",
              "contains",
              "transmits-motion",
              "electrical-link",
              "unknown",
            ]),
            basis: text(1000),
            certainty: z.enum(["visible", "hypothesis"]),
          })
          .strict(),
      )
      .max(60)
      .default([]),
    nextSteps: z.array(text(500)).max(6).default([]),
    observations: z
      .array(
        z
          .object({
            id: text(60),
            imageId: text(60),
            name: text(150),
            marker: point,
            evidence: text(),
            function: text(700).optional(),
          })
          .strict(),
      )
      .max(30),
    hypotheses: z
      .array(
        z
          .object({
            name: text(150),
            basis: text(),
            verificationNeeded: text(),
          })
          .strict(),
      )
      .max(15),
    unknowns: z.array(text(500)).max(20),
    mechanism: z
      .object({
        type: z.enum(["external-gear-pair", "unsupported"]),
        gears: z
          .array(
            z
              .object({
                observationId: text(60),
                toothCount: z.number().int().min(1).max(10000).nullable(),
              })
              .strict(),
          )
          .max(2),
      })
      .strict(),
  })
  .strict()
  .superRefine((a, ctx) => {
    const ids = a.observations.map((o) => o.id);
    if (a.recognition !== "no-object" && ids.length === 0)
      ctx.addIssue({
        code: "custom",
        message: "An object result needs at least one visible observation",
      });
    if (
      a.recognition === "no-object" &&
      (ids.length ||
        a.relationships.length ||
        a.mechanism.type !== "unsupported")
    )
      ctx.addIssue({
        code: "custom",
        message: "No-object results cannot contain fabricated components",
      });
    const pairs = new Set();
    for (const edge of a.relationships) {
      if (
        !ids.includes(edge.source) ||
        !ids.includes(edge.target) ||
        edge.source === edge.target
      )
        ctx.addIssue({
          code: "custom",
          message: "Relationship requires two existing distinct components",
        });
      const pair =
        [edge.source, edge.target].sort().join("|") + ":" + edge.relation;
      if (pairs.has(pair))
        ctx.addIssue({ code: "custom", message: "Duplicate relationship" });
      pairs.add(pair);
    }

    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: "custom",
        message: "Duplicate observation identifiers",
      });
    if (a.mechanism.gears.some((g) => !ids.includes(g.observationId)))
      ctx.addIssue({
        code: "custom",
        message: "Gear references an absent observation",
      });
    if (
      a.mechanism.type === "external-gear-pair" &&
      (a.mechanism.gears.length !== 2 ||
        new Set(a.mechanism.gears.map((g) => g.observationId)).size !== 2)
    )
      ctx.addIssue({
        code: "custom",
        message: "A gear pair needs two distinct visible gears",
      });
    if (a.mechanism.type === "unsupported" && a.mechanism.gears.length !== 0)
      ctx.addIssue({
        code: "custom",
        message: "Unsupported mechanisms must not propose a gear prediction",
      });
  });
const gear = z
  .object({
    teeth: z.number().int().min(1).max(10000),
    confirmed: z.literal(true),
  })
  .strict();
export const setupSchema = z
  .object({
    mechanismType: z.literal("external-gear-pair"),
    driver: gear,
    follower: gear,
    inputTurns: z.number().finite().min(0.001).max(100000),
    inputDirection: z.enum(["clockwise", "counterclockwise"]),
  })
  .strict();
export const comparisonSchema = z
  .object({
    setup: setupSchema,
    measurement: z
      .object({
        outputTurns: z.number().finite().min(0).max(1000000),
        outputDirection: z.enum(["clockwise", "counterclockwise"]),
        tolerance: z.number().finite().min(0).max(100),
      })
      .strict(),
  })
  .strict();

export const toolPredictionSchema = z.discriminatedUnion("tool", [
  z
    .object({
      tool: z.literal("lever"),
      loadNewtons: z.number().finite().positive().max(1e8),
      effortArmMeters: z.number().finite().min(0.0001).max(1000),
      loadArmMeters: z.number().finite().min(0.0001).max(1000),
      confirmed: z.literal(true),
    })
    .strict(),
  z
    .object({
      tool: z.literal("pulley"),
      loadNewtons: z.number().finite().positive().max(1e8),
      supportingStrands: z.number().int().min(1).max(20),
      liftMeters: z.number().finite().min(0.001).max(100),
      confirmed: z.literal(true),
    })
    .strict(),
]);

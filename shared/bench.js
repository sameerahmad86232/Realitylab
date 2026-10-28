import { z } from "zod";
import { setupSchema, toolPredictionSchema } from "./schemas.js";
import { predict as gearPredict, compare as gearCompare } from "./gearMath.js";
import { predictPhysicsTool } from "./physicsTools.js";
const text = (n) => z.string().trim().max(n);
export const benchSetupSchema = z.union([setupSchema, toolPredictionSchema]);
export const benchMeasurementSchema = z
  .object({
    value: z.number().finite().min(0).max(1e8),
    tolerance: z.number().finite().min(0).max(1e6),
    direction: z.enum(["clockwise", "counterclockwise"]).optional(),
    confirmed: z.literal(true),
  })
  .strict();
export const benchSourceSchema = z
  .object({
    objectName: text(150),
    summary: text(2000),
    observations: z
      .array(z.object({ name: text(150), evidence: text(1000) }).strict())
      .max(20),
  })
  .strict();
export const benchEvaluationSchema = z
  .object({
    setup: benchSetupSchema,
    measurement: benchMeasurementSchema.nullable().default(null),
  })
  .strict()
  .superRefine((x, ctx) => {
    if (x.setup.mechanismType && x.measurement && !x.measurement.direction)
      ctx.addIssue({
        code: "custom",
        message: "Confirm the measured gear direction.",
      });
    if (
      x.setup.mechanismType &&
      x.measurement &&
      (x.measurement.value > 1e6 || x.measurement.tolerance > 100)
    )
      ctx.addIssue({
        code: "custom",
        message: "Gear measurement or tolerance exceeds the supported range.",
      });
  });
export function evaluateBench(input) {
  const { setup, measurement } = benchEvaluationSchema.parse(input);
  const gears = !!setup.mechanismType;
  const prediction = gears ? gearPredict(setup) : predictPhysicsTool(setup);
  const expected = gears ? prediction.outputTurns : prediction.effortNewtons;
  const unit = gears ? "turns" : "N";
  let comparison = null;
  if (measurement) {
    if (gears) {
      const c = gearCompare({
        setup,
        measurement: {
          outputTurns: measurement.value,
          outputDirection: measurement.direction,
          tolerance: measurement.tolerance,
        },
      });
      comparison = {
        withinTolerance: c.withinTolerance,
        residual: c.residualTurns,
        absoluteError: c.absoluteErrorTurns,
        nextChecks: c.nextChecks,
      };
    } else {
      const residual = measurement.value - expected;
      const absoluteError = Math.abs(residual);
      const withinTolerance =
        absoluteError <=
        measurement.tolerance +
          Number.EPSILON * Math.max(1, expected, measurement.value) * 8;
      comparison = {
        withinTolerance,
        residual,
        absoluteError,
        nextChecks: withinTolerance
          ? [
              "Agreement applies only to this setup, measurement and declared tolerance.",
            ]
          : [
              setup.tool === "lever"
                ? "Check perpendicular moment arms, static balance, lever weight and force-meter zero."
                : "Check the number of load-supporting strands, rope routing, force-meter zero and pulley friction.",
              "Repeat the measurement with the same setup; change one assumption at a time.",
              "A mismatch does not identify its cause or certify an assembly.",
            ],
      };
    }
  }
  return {
    model: gears ? "gears" : setup.tool,
    expected,
    unit,
    prediction,
    measurement,
    comparison,
    notice:
      "Ideal prediction and user-reported measurement; no physical experiment is automatically verified.",
  };
}
export const benchReviewRequestSchema = z
  .object({
    setup: benchSetupSchema,
    measurement: benchMeasurementSchema.nullable().default(null),
    notes: text(2000).default(""),
    source: benchSourceSchema.nullable().default(null),
    consent: z.literal(true),
  })
  .strict();
export const benchReviewSchema = z
  .object({
    summary: z.string().trim().min(1).max(1500),
    recommendedAction: z.enum([
      "collect-measurement",
      "repeat-measurement",
      "review-setup",
      "record-agreement",
    ]),
    hypotheses: z
      .array(
        z
          .object({
            title: z.string().trim().min(1).max(180),
            basis: z.string().trim().min(1).max(700),
            nextCheck: z.string().trim().min(1).max(700),
          })
          .strict(),
      )
      .max(4),
    limitations: z.array(z.string().trim().min(1).max(500)).min(1).max(5),
  })
  .strict();
const fields = [
  "driver",
  "follower",
  "inputTurns",
  "inputDirection",
  "load",
  "effortArm",
  "loadArm",
  "strands",
  "lift",
];
export const benchProjectSchema = z
  .object({
    schemaVersion: z.literal("realitylab-bench-1"),
    title: text(150),
    model: z.enum(["gears", "lever", "pulley"]),
    draft: z
      .object(Object.fromEntries(fields.map((k) => [k, text(80)])))
      .strict(),
    source: benchSourceSchema.nullable(),
    working: z
      .object({
        value: text(80),
        tolerance: text(80),
        direction: z.enum(["clockwise", "counterclockwise"]),
        notes: text(2000),
      })
      .strict()
      .optional(),
    trials: z
      .array(
        z
          .object({
            id: z.string().uuid(),
            recordedAt: z.string().datetime(),
            setup: benchSetupSchema,
            measurement: benchMeasurementSchema,
            notes: text(2000),
            source: benchSourceSchema.nullable().optional(),
            investigation: z
              .object({
                review: benchReviewSchema,
                notes: text(2000),
                provider: text(120),
                model: text(150),
                reviewedAt: z.string().datetime(),
              })
              .strict()
              .optional(),
          })
          .strict(),
      )
      .max(25),
  })
  .strict()
  .superRefine((p, ctx) => {
    for (const trial of p.trials) {
      if (
        !benchEvaluationSchema.safeParse({
          setup: trial.setup,
          measurement: trial.measurement,
        }).success
      )
        ctx.addIssue({ code: "custom", message: "Invalid trial measurement." });
    }
    if (new Set(p.trials.map((t) => t.id)).size !== p.trials.length)
      ctx.addIssue({ code: "custom", message: "Duplicate trial IDs." });
  });
export function benchMarkdown(project) {
  const p = benchProjectSchema.parse(project);
  return [
    `# ${p.title || "RealityLab Bench experiment"}`,
    "",
    "User-reported experiments. Ideal models do not verify physical safety or causation.",
    p.source
      ? `\nPhoto context: ${p.source.objectName}\n${p.source.summary}`
      : "",
    "",
    ...p.trials.flatMap((t, i) => {
      const r = evaluateBench({ setup: t.setup, measurement: t.measurement });
      return [
        `## Trial ${i + 1} — ${r.model}`,
        t.recordedAt,
        `Setup: ${JSON.stringify(t.setup)}`,
        `Predicted: ${r.expected} ${r.unit}`,
        `Measured: ${t.measurement.value} ${r.unit}${t.measurement.direction ? " " + t.measurement.direction : ""}`,
        `Absolute tolerance: ${t.measurement.tolerance} ${r.unit}`,
        `Result: ${r.comparison.withinTolerance ? "within tolerance" : "discrepancy"}`,
        `Signed residual: ${r.comparison.residual} ${r.unit}`,
        `Notes: ${t.notes}`,
        t.investigation
          ? `AI investigation (${t.investigation.model}, ${t.investigation.reviewedAt}): ${t.investigation.review.summary}\nInvestigation notes: ${t.investigation.notes}\n${t.investigation.review.hypotheses.map((h) => `${h.title}: ${h.basis} Next check: ${h.nextCheck}`).join("\n")}`
          : "",
        "Next checks:",
        ...r.comparison.nextChecks.map((x) => `- ${x}`),
        "",
      ];
    }),
  ].join("\n");
}

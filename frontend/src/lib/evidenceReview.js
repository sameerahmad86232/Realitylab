export const reviewLabels = {
  pending: "Not reviewed",
  consistent: "Consistent with my observation",
  "needs-view": "Needs another view",
  disputed: "I disagree with this suggestion",
};

export function updateObservation(observation, patch) {
  const { id, imageId, name, marker, evidence, function: role } = observation;
  return {
    ...observation,
    ...patch,
    source: "user-edited",
    modelSuggestion: observation.modelSuggestion || {
      id,
      imageId,
      name,
      marker: { ...marker },
      evidence,
      function: role,
    },
    // An earlier review does not automatically apply to a changed claim.
    review: observation.review
      ? {
          ...observation.review,
          status: "pending",
          updatedAt: new Date().toISOString(),
        }
      : undefined,
  };
}

export function withReview(observation, patch) {
  return {
    ...observation,
    review: {
      status: "pending",
      notes: "",
      ...observation.review,
      ...patch,
      source: "user-reported",
      updatedAt: new Date().toISOString(),
    },
  };
}

// Escape source text so a downloaded Markdown report cannot introduce HTML,
// external images or links through a model response or a user note.
const md = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([\\`*_[\]{}()#!|~])/g, "\\$1")
    .replace(/\r?\n/g, " ");

export function makeExplorationMarkdown(report) {
  const { analysis, prediction, comparison, physicsTool } = report;
  const lines = [
    `# ${md(analysis?.objectName || "RealityLab experiment")}`,
    "",
    `Exported: ${md(report.exportedAt)}`,
    "",
    "Model suggestions and user-reported observations are distinct. This report is not independent verification or manufacture-ready CAD.",
    "",
  ];
  if (analysis) {
    lines.push(
      `Category: ${md(analysis.category)} · Recognition: ${md(analysis.recognition)}`,
      "",
      `Provider: ${md(analysis.provenance?.provider)} · Model: ${md(analysis.provenance?.model)}`,
      "",
      md(analysis.summary),
      "",
      "## Visible components",
      "",
    );
    for (const o of analysis.observations) {
      lines.push(
        `### ${md(o.name)}`,
        "",
        `Image: ${md(o.imageId)} · Source: ${md(o.source)}`,
        "",
        `Evidence: ${md(o.evidence)}`,
        "",
        `Suggested role: ${md(o.function || "Not specified")}`,
        "",
        `User review: ${md(reviewLabels[o.review?.status] || reviewLabels.pending)}`,
        "",
      );
      if (o.review?.notes) lines.push(`User note: ${md(o.review.notes)}`, "");
      if (o.modelSuggestion)
        lines.push(
          `Original model label: ${md(o.modelSuggestion.name)}`,
          "",
          `Original model evidence: ${md(o.modelSuggestion.evidence)}`,
          "",
          `Original model role: ${md(o.modelSuggestion.function || "Not specified")}`,
          "",
        );
    }
    const names = new Map(analysis.observations.map((o) => [o.id, o.name]));
    lines.push("## Relationships", "");
    for (const e of analysis.relationships || [])
      lines.push(
        `- ${md(names.get(e.source))} → ${md(names.get(e.target))}: ${md(e.relation)} \u00b7 ${md(e.certainty)} \u00b7 ${md(e.origin)}. Basis: ${md(e.basis)}`,
      );
    if (!analysis.relationships?.length)
      lines.push("No relationships recorded.");
    if (analysis.spatialModel) {
      lines.push(
        "",
        "## Approximate 3D concept",
        "",
        "Relative proportions and inferred depth; not reconstructed or verified CAD.",
        "",
      );
      for (const p of analysis.spatialModel.parts)
        lines.push(
          `- ${md(names.get(p.observationId))}: ${md(p.primitive)}; relative size ${md(p.size.join(" × "))}; source ${md(p.source || "model-suggested")}. Basis: ${md(p.basis)}`,
        );
      lines.push(
        "",
        ...analysis.spatialModel.assumptions.map(
          (a) => `- Assumption: ${md(a)}`,
        ),
      );
    }
    if (analysis.operation) {
      lines.push(
        "",
        "## How it may work",
        "",
        md(analysis.operation.summary),
        "",
      );
      for (const step of analysis.operation.steps)
        lines.push(`- ${md(step.title)}: ${md(step.description)}`);
    }
    if (analysis.recreationGuide) {
      const guide = analysis.recreationGuide;
      lines.push(
        "",
        "## Unpowered study-model guide",
        "",
        "Not a manufacturing or functional construction plan.",
        "",
        "Materials:",
        ...guide.materials.map((m) => `- ${md(m)}`),
        "",
        "Measurements needed:",
        ...guide.measurementsNeeded.map((m) => `- ${md(m)}`),
        "",
      );
      for (const step of guide.steps)
        lines.push(
          `- ${md(step.title)}: ${md(step.instruction)} Check: ${md(step.check)}`,
        );
      lines.push("", ...guide.limitations.map((l) => `- Limitation: ${md(l)}`));
    }
    lines.push("", "## Internal hypotheses", "");
    for (const h of analysis.hypotheses)
      lines.push(
        `- ${md(h.name)}. Basis: ${md(h.basis)}. To check: ${md(h.verificationNeeded)}`,
      );
    if (!analysis.hypotheses.length)
      lines.push("No internal hypotheses proposed.");
    lines.push(
      "",
      "## Open questions",
      "",
      ...analysis.unknowns.map((u) => `- ${md(u)}`),
      "",
      "## Follow-up observation notebook",
      "",
    );
    for (const [index, step] of (analysis.nextSteps || []).entries()) {
      const entry = analysis.followUpNotes?.[index];
      const status =
        entry?.status === "recorded"
          ? "Observation recorded"
          : entry?.status === "unavailable"
            ? "Cannot check yet"
            : "Planned";
      lines.push(`- ${md(step)} — ${status}.`);
      if (entry?.notes) lines.push(`  User note: ${md(entry.notes)}`);
    }
  }
  if (prediction)
    lines.push(
      "",
      "## Computed gear prediction",
      "",
      `${md(prediction.outputTurns)} output turns, ${md(prediction.outputDirection)}.`,
      "",
      ...(prediction.assumptions || []).map((a) => `- ${md(a)}`),
    );
  if (comparison)
    lines.push(
      "",
      `User-reported comparison: ${md(comparison.status)}. Absolute error: ${md(comparison.absoluteErrorTurns)} turns.`,
      "",
    );
  if (physicsTool)
    lines.push(
      "",
      "## Manual physics calculation",
      "",
      "See the accompanying JSON report for exact user-confirmed inputs, outputs, units and ideal assumptions.",
      "",
    );
  lines.push(
    "",
    "Source photos are omitted from this text report. Download JSON with explicit photo opt-in to include them.",
    "",
    "Notes live only in the current tab until exported; refreshing or starting a new analysis clears the notebook.",
    "",
  );
  return lines.join("\n");
}

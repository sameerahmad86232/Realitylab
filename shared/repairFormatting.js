// Pure report/context helpers; keep schema validation off the initial UI bundle.
export function repairSource(analysis) {
  return {
    scanId: analysis.id,
    objectName: analysis.objectName.trim(),
    summary: analysis.summary.trim(),
    parts: analysis.observations.map((o) => ({
      id: o.id,
      name: o.name.trim(),
      evidence: o.evidence.trim(),
      role: (o.function || "").trim(),
    })),
  };
}
const md = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/([\\`*_[\]{}()#!|~])/g, "\\$1")
    .replace(/\r?\n/g, " ");
export function repairMarkdown(record) {
  const { assessment: a, source: s } = record;
  const name = (id) =>
    s.parts.find((p) => p.id === id)?.name || "Not identified";
  return [
    `# Repair assessment: ${md(s.objectName)}`,
    "",
    `Status: ${md(a.status)} · ${md(record.provenance.assessedAt)}`,
    `Suggested part: ${md(name(a.suspectedPartId))}`,
    `Problem: ${md(record.problem)}`,
    `Follow-up answer: ${md(record.answer)}`,
    `Additional photos: ${record.problemPhotoCount}`,
    "",
    md(a.summary),
    "",
    "AI-suggested assessment, not a verified diagnosis. Photos are not included.",
    "",
    "## Evidence",
    ...a.evidence.map(
      (e) => `- ${md(e.basis)} (${md(e.imageId || "reported context")})`,
    ),
    "",
    "## Precautions",
    ...a.precautions.map((p) => `- ${md(p)}`),
    "",
    ...(a.followUp
      ? [
          "## More evidence needed",
          md(a.followUp.question),
          md(a.followUp.photoInstruction || ""),
          "",
        ]
      : []),
    ...a.steps.flatMap((step, i) => [
      `## ${i + 1}. ${md(step.title)}`,
      md(step.instruction),
      `Check: ${md(step.check)}`,
      `Stop if: ${md(step.stopIf)}`,
      "",
    ]),
    "## Limitations",
    ...a.limitations.map((l) => `- ${md(l)}`),
    "",
    `Provider: ${md(record.provenance.provider)} · Model: ${md(record.provenance.model || "App safety check")}`,
  ].join("\n");
}

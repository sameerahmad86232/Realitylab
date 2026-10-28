// Injected repair responses, never evidence of a real diagnosis.
export const source = {
  scanId: "test-scan",
  objectName: "Manual pencil sharpener",
  summary: "Test-only unpowered sharpener with an exterior knob and screw.",
  parts: [
    {
      id: "knob",
      name: "Exterior handle knob",
      evidence: "A visible exterior turning knob.",
      role: "Hand grip",
    },
    {
      id: "screw",
      name: "Outer fixing screw",
      evidence: "An exterior screw retains the knob.",
      role: "Retains knob",
    },
  ],
};
export function repairFixture(s = source, status = "repair-guide") {
  const id = s.parts[0].id;
  return {
    status,
    confidence: status === "needs-more-evidence" ? "uncertain" : "supported",
    suspectedPartId: id,
    summary:
      status === "needs-more-evidence"
        ? "Test fixture: the exterior knob may be loose; the fastener is not clear."
        : "Test fixture: check the exterior knob and its accessible fixing.",
    evidence: [
      {
        observationId: id,
        imageId: "scan-1",
        basis: "Test-only visible exterior knob plus a user-reported wobble.",
      },
    ],
    alternatives: [],
    followUp:
      status === "needs-more-evidence"
        ? {
            question: "Is the outer fixing screw visibly loose?",
            photoInstruction:
              "Add one close side view of the knob’s outer screw, without opening the body.",
          }
        : null,
    steps:
      status === "repair-guide"
        ? [
            {
              title: "Stop use and inspect externally",
              instruction:
                "Set down the passive object and inspect the exterior knob.",
              check:
                "Confirm the knob can be reached without opening the body.",
              stopIf:
                "The housing is damaged or the fix requires access near a blade.",
            },
            {
              title: "Check the user-serviceable fixing",
              instruction:
                "Consult the manufacturer’s guide for the accessible knob fixing; do not remove covers.",
              check: "Confirm the described fixing matches this object.",
              stopIf:
                "The instructions do not identify it as user-serviceable.",
            },
            {
              title: "Verify the exterior attachment",
              instruction:
                "After a permitted external adjustment, check the knob attachment gently without operating the mechanism.",
              check: "The knob should remain attached without wobbling.",
              stopIf: "The fixing does not hold or abnormal movement persists.",
            },
          ]
        : [],
    precautions: [
      "Use only passive exterior checks; avoid blades and internal springs.",
    ],
    limitations: ["Injected test result, not a real physical diagnosis."],
  };
}
export const request = {
  source,
  problem: "The exterior handle knob wobbles.",
  answer: "",
  originalImageCount: 1,
  consent: true,
  previous: null,
};

import { toolPredictionSchema } from "./schemas.js";
export function predictPhysicsTool(input) {
  const setup = toolPredictionSchema.parse(input);
  if (setup.tool === "lever")
    return {
      setup,
      tool: { name: "ideal_static_lever", version: "1.0" },
      effortNewtons:
        (setup.loadNewtons * setup.loadArmMeters) / setup.effortArmMeters,
      mechanicalAdvantage: setup.effortArmMeters / setup.loadArmMeters,
      equation:
        "effort force = load force × load moment arm / effort moment arm",
      assumptions: [
        "Static moment balance about one fulcrum.",
        "Moment arms are perpendicular distances to each force line, not arbitrary handle lengths.",
        "Ignore lever weight, friction and deformation. No strength or stability prediction.",
      ],
    };
  return {
    setup,
    tool: { name: "ideal_pulley", version: "1.0" },
    effortNewtons: setup.loadNewtons / setup.supportingStrands,
    mechanicalAdvantage: setup.supportingStrands,
    pullMeters: setup.liftMeters * setup.supportingStrands,
    equation:
      "ideal effort = load / supporting strands; rope pull = lift × supporting strands",
    assumptions: [
      "Ideal massless rope and frictionless pulleys with equal tension.",
      "Count only rope segments directly supporting the moving load.",
      "No acceleration, counterweight or structural safety prediction. Real effort is usually higher.",
    ],
  };
}

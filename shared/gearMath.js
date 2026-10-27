import { setupSchema, comparisonSchema } from "./schemas.js";
export function predict(input) {
  const setup = setupSchema.parse(input);
  const ratio = -setup.driver.teeth / setup.follower.teeth;
  const signedInput =
    setup.inputTurns * (setup.inputDirection === "clockwise" ? 1 : -1);
  const signedOutput = ratio * signedInput;
  return {
    setup,
    signedRatio: ratio,
    signedInputTurns: signedInput,
    signedOutputTurns: signedOutput,
    outputTurns: Math.abs(signedOutput),
    outputDirection: signedOutput < 0 ? "counterclockwise" : "clockwise",
    convention:
      "Viewed from the same side of both gears, clockwise is positive.",
    equation:
      "output turns = signed input turns × (−driver teeth / follower teeth)",
    assumptions: [
      "Exactly two external gears in direct mesh.",
      "No slip, skipped teeth, backlash correction or additional stages.",
      "Tooth counts are confirmed by the user; torque and efficiency are not predicted.",
    ],
    tool: { name: "compute_external_gear_pair", version: "1.0" },
  };
}
export function compare(input) {
  const { setup, measurement } = comparisonSchema.parse(input);
  const prediction = predict(setup);
  const measuredSigned =
    measurement.outputTurns === 0
      ? 0
      : measurement.outputTurns *
        (measurement.outputDirection === "clockwise" ? 1 : -1);
  const residual = measuredSigned - prediction.signedOutputTurns;
  const absoluteError = Math.abs(residual);
  // Floating point roundoff must not turn exact decimal tolerance boundaries into failures.
  const roundoff =
    Number.EPSILON *
    Math.max(1, Math.abs(measuredSigned), prediction.outputTurns) *
    8;
  return {
    prediction,
    measurement,
    measuredSignedTurns: measuredSigned,
    residualTurns: residual,
    absoluteErrorTurns: absoluteError,
    withinTolerance: absoluteError <= measurement.tolerance + roundoff,
    status:
      absoluteError <= measurement.tolerance + roundoff
        ? "within-tolerance"
        : "discrepancy",
    nextChecks:
      absoluteError <= measurement.tolerance + roundoff
        ? ["Agreement applies to this measurement and tolerance only."]
        : [
            "Recount the teeth and check the viewing direction.",
            "Check for slipping, skipped teeth or an extra gear stage.",
            "Repeat the measurement without changing several inputs at once.",
          ],
    tool: { name: "compare_external_gear_measurement", version: "1.0" },
  };
}

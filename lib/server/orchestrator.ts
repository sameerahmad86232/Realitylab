import { analysisSchema, type Analysis } from "../analysis.ts";
import { stageIds, type StageEvent, type Orchestration } from "../orchestration.ts";
import { ScanError } from "./provider.ts";

export const SCAN_BUDGET = Object.freeze({maxCalls: 1 as const, maxOutputTokens: 6000, maxPhotos: 3 as const});
/** Request-local state only. No photos, prompts, or user text are retained in traces. */
export class FixCoreCase {
  events: StageEvent[] = [];
  private starts = new Map<string, number>();
  private states = new Map<string, StageEvent["status"]>();
  callsUsed = 0;
  safety?: Orchestration["safety"];
  readonly caseId: string;
  private emit: (event: StageEvent) => void;
  private now: () => number;
  private started: number;
  constructor(caseId: string, emit: (event: StageEvent) => void = () => {}, now = Date.now) {
    this.caseId = caseId; this.emit = emit; this.now = now; this.started = now();
  }
  event(stage: StageEvent["stage"], status: StageEvent["status"], reason?: string) {
    const previous = this.states.get(stage);
    if (previous === "completed" || previous === "skipped" || previous === "failed" ||
        (status === "queued" && previous) || (status === "running" && previous === "running") ||
        (status === "completed" && previous !== "running")) throw Error("Invalid orchestration transition");
    const time = this.now();
    if (status === "running") this.starts.set(stage, time);
    const began = this.starts.get(stage);
    const event: StageEvent = {caseId: this.caseId, sequence: this.events.length + 1, stage, status,
      elapsedMs: Math.max(0, time - this.started),
      ...(["completed", "failed"].includes(status) && began !== undefined ? {durationMs: Math.max(0, time - began)} : {}),
      ...(reason ? {reason} : {})};
    this.states.set(stage, status); this.events.push(event); this.emit(event);
  }
  queue() { for (const stage of stageIds) this.event(stage, "queued"); }
  reserveCall(signal: AbortSignal) {
    signal.throwIfAborted();
    if (this.callsUsed >= SCAN_BUDGET.maxCalls) throw new ScanError(429, "This case has reached its AI call budget.");
    this.callsUsed++;
  }
  finish(status: Orchestration["status"]): Orchestration {
    if (status !== "completed") for (const stage of stageIds) {
      const state = this.states.get(stage);
      if (state === "running") this.event(stage, "failed", status === "cancelled" ? "Request cancelled" : "Stage could not complete");
      else if (state === "queued") this.event(stage, "skipped", "Case stopped before this stage");
    }
    return {version: 1, caseId: this.caseId, status, events: [...this.events],
      budget: {...SCAN_BUDGET, callsUsed: this.callsUsed}, ...(this.safety ? {safety: this.safety} : {})};
  }
}

// Independent, deterministic veto. These rules are defense in depth, not validated physical diagnosis.
const hazardousObject = /\b(mains|gas|pressure vessel|boiler|airbag|brakes?|steering|medical equipment|chainsaw|circular saw|swollen battery|swelling battery|battery.{0,25}(swollen|swelling|damaged|punctured|leaking)|structural (load|beam|column)|load.bearing)\b/i;
const hazardousAction = /\b(rewir(?:e|ing)|bypass(?:ing)?|live (test|testing)|energiz(?:e|ed)|cut(?:ting)?|drill(?:ing)?|solder(?:ing)?|heat(?:ing)?|forceful disassembly)\b/i;
export function applySafetyGate(source: Analysis, context: string): {analysis: Analysis; safety: NonNullable<Orchestration["safety"]>} {
  const analysis = structuredClone(source);
  const repair = analysis.repair_assessment;
  const rules: string[] = [];
  const hazard = hazardousObject.test([analysis.object_name, analysis.category, context].join(" "));
  // Reject suspicious procedures even if the model labels the task low risk.
  const unsafeSteps = repair?.steps.some(step => hazardousAction.test(step.instruction));
  const refer = hazard || unsafeSteps || repair?.risk === "high" || repair?.status === "professional-help";
  if (hazard) rules.push("hazardous-object-or-symptom");
  if (unsafeSteps) rules.push("hazardous-procedure");
  if (repair?.risk === "high" || repair?.status === "professional-help") rules.push("model-risk-escalation");
  const needsEvidence = !repair || analysis.recognition !== "identified" || repair.status !== "guided-inspection";
  if (!repair) rules.push("missing-repair-assessment");
  if (analysis.recognition !== "identified") rules.push("uncertain-object");
  const decision = refer ? "refer" : needsEvidence ? "request-evidence" : "allow";
  if (decision !== "allow") {
    analysis.repair_assessment = {
      status: refer ? "professional-help" : "needs-more-evidence",
      possible_cause: repair?.possible_cause || "The cause is not established from these photos.",
      explanation: refer ? "The independent safety gate withheld procedural guidance. Get qualified help for this case." : repair?.explanation || "More evidence is required before inspection guidance can be provided.",
      risk: refer ? "high" : "medium", component_ids: repair?.component_ids || [],
      check_first: refer ? "Do not attempt a repair. Keep clear of the hazard and contact a qualified professional." : "Provide the symptom and a clear photo of the affected area.",
      tools: [], steps: [],
      stop_conditions: repair?.stop_conditions || ["Stop if any hazard is present."],
      missing_evidence: repair?.missing_evidence.length ? repair.missing_evidence : ["A clear symptom description and object model, if available."],
    };
  }
  return {analysis: analysisSchema.parse(analysis), safety: {decision, ruleIds: rules}};
}

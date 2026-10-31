import { z } from "zod";

const text = (max = 400) => z.string().trim().min(1).max(max);

export const repairPlanSchema = z.object({
  object_name: text(140),
  problem: text(420),
  overview: text(750),
  risk: z.enum(["low", "caution", "professional"]),
  risk_reason: text(450),
  tools: z.array(text(100)).max(8),
  possible_causes: z.array(z.object({
    title: text(120),
    reason: text(420),
    evidence: z.enum(["visible", "reported", "hypothesis"]),
  }).strict()).min(1).max(4),
  steps: z.array(z.object({
    id: text(30).regex(/^step-[1-6]$/),
    title: text(120),
    instruction: text(800),
    why: text(350),
    component_name: text(120),
    expected_result: text(350),
    caution: z.string().trim().max(350),
  }).strict()).min(1).max(6),
  stop_if: z.array(text(280)).min(1).max(5),
  verify: z.array(text(300)).min(1).max(5),
}).strict().superRefine((plan, ctx) => {
  const ids = new Set(plan.steps.map(step => step.id));
  if (ids.size !== plan.steps.length) ctx.addIssue({code:"custom",message:"Step IDs must be distinct"});
});
export type RepairPlan = z.infer<typeof repairPlanSchema>;

/** Fixed, clearly labeled sample; it never pretends to be live model output. */
export const sampleRepairPlan: RepairPlan = {
  object_name: "Desk fan",
  problem: "The fan does not run when switched on.",
  overview: "A stopped desk fan can have several causes. Start with passive observations and simple external checks. These steps do not establish a diagnosis.",
  risk: "caution",
  risk_reason: "Electric appliances can retain dangerous voltage. Never open the motor housing, bypass safeguards, or touch exposed wiring.",
  tools: ["Soft cloth", "Phone camera", "Product manual"],
  possible_causes: [
    {title:"Blocked or dusty guard",reason:"Visible dirt or an obstruction could interfere with movement.",evidence:"hypothesis"},
    {title:"Power source or control issue",reason:"A loose plug, outlet issue, or mis-set control may prevent operation.",evidence:"hypothesis"},
    {title:"Internal electrical fault",reason:"An internal failure is also possible but cannot be diagnosed from a photograph.",evidence:"hypothesis"}
  ],
  steps: [
    {id:"step-1",title:"Disconnect and inspect",component_name:"Power cord",instruction:"Switch the fan off and unplug it. From the outside, check the cord and plug for visible damage, heat discoloration, or fraying. Do not use it if damage is present.",why:"A visual safety check identifies reasons to stop before troubleshooting.",expected_result:"No visible cable or plug damage; otherwise stop and seek a professional.",caution:"Do not handle damaged wiring or test exposed conductors."},
    {id:"step-2",title:"Check the guard and airflow path",component_name:"Front guard",instruction:"While unplugged, look for dust buildup, loose objects, or debris obstructing the guard. Remove only loose external dust with a dry soft cloth. Do not open the housing.",why:"External buildup may impede airflow or reveal a simple obstruction.",expected_result:"The guard is visibly clear of debris.",caution:"Do not remove protective guards or insert fingers near blades."},
    {id:"step-3",title:"Review the controls and manual",component_name:"Speed control",instruction:"Consult the manufacturer's manual for the correct switch settings and any user-serviceable reset instructions. If the cord, plug and guard appear safe, follow only its normal operating procedure.",why:"Incorrect settings and model-specific protections can resemble faults.",expected_result:"You know the intended control setting or the manual's next safe check.",caution:"If there is sparking, smoke, unusual heat or a burning smell, stop immediately."},
    {id:"step-4",title:"Escalate unresolved faults",component_name:"Motor housing",instruction:"If the fan still fails to start, leave it unplugged and contact qualified appliance service. Share the photos and your observations.",why:"Internal motor or electrical issues require measurements and inspection beyond a photograph.",expected_result:"A service technician can inspect the appliance safely.",caution:"Do not open or energize the motor housing."}
  ],
  stop_if: ["Burning smell, smoke, sparks or unusual heat", "Frayed wiring or a damaged plug", "Unstable or broken protective guard"],
  verify: ["Guard remains securely attached", "No abnormal sound, heat or vibration during normal use", "If unresolved, seek qualified service instead of forcing a repair"]
};
/** High-risk topics never receive procedural DIY instructions, even if the model proposes them. */
export function enforceSafetyBoundary(plan: RepairPlan, userProblem: string): RepairPlan {
  const highRisk = /(?:gas\s*(?:leak|smell)|carbon monoxide|smok(?:e|ing)|sparks?|sparking|burning smell|swollen\s*(?:battery|cell)|battery\s*(?:swollen|punctured|smoking)|lithium\s*(?:fire|leak)|electric shock|exposed\s*(?:wire|wiring|conductor)|high[ -]?voltage|live\s*(?:wire|wiring)|brakes?\s*(?:fail|broken|not working)|steering\s*(?:fail|broken)|load[ -]?bearing|firearm|ammunition|explosive|pacemaker)/i.test(userProblem);
  if (!highRisk && plan.risk !== "professional") return plan;
  return {
    ...plan,
    risk: "professional",
    risk_reason: highRisk ? "The reported symptom may involve an immediate safety hazard. An image cannot establish safe repair conditions." : plan.risk_reason,
    tools: [],
    steps: [
      {id:"step-1",title:"Stop using the object",instruction:"Do not operate, open, power, test, or handle the affected equipment if there may be immediate danger. Keep people away from the hazard.",why:"Avoid making a potentially hazardous failure worse.",component_name:"Affected object",expected_result:"The object is not being used or disturbed.",caution:"If there is smoke, fire or a suspected gas leak, move away and contact local emergency services."},
      {id:"step-2",title:"Get qualified assistance",instruction:"Contact an appropriate qualified technician or emergency service. Describe the symptom and share photos only from a safe location.",why:"An on-site safety assessment is required before any repair instruction is appropriate.",component_name:"Object exterior",expected_result:"A qualified professional can assess the hazard and next safe action.",caution:"Do not attempt internal repairs based on this AI-generated guide."}
    ],
    stop_if: ["Any danger to people, smoke, sparks, heat or suspected leak", "A professional has not yet confirmed that the object is safe to approach"],
    verify: ["Only a qualified professional should verify safe operation before reuse"]
  };
}

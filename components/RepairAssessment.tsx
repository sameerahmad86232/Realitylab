import { AlertTriangle, ArrowUpRight, Camera, CheckCircle2, ShieldAlert, Wrench } from "lucide-react";
import type { Analysis } from "../lib/analysis";

export default function RepairAssessment({analysis,onSelect,onMoreEvidence}:{analysis:Analysis;onSelect:(id:string)=>void;onMoreEvidence:()=>void}) {
  const assessment=analysis.repair_assessment!;
  const blocked=assessment.status!=="guided-inspection";
  return <section className={`repair-assessment ${assessment.status}`} aria-labelledby="repair-answer-title">
    <div className="repair-answer-head"><div><p className="eyebrow">VISUAL REPAIR TRIAGE / NOT A CONFIRMED DIAGNOSIS</p><h2 id="repair-answer-title">{assessment.status==="professional-help"?"Stop here and get qualified help.":assessment.status==="needs-more-evidence"?"One more look before guidance.":"A cautious inspection path."}</h2></div><span className={`risk-badge ${assessment.risk}`}><ShieldAlert size={14}/>{assessment.risk} risk · model assessment</span></div>
    <div className="repair-answer-grid"><div className="repair-cause"><span>POSSIBLE CAUSE</span><h3>{assessment.possible_cause}</h3><p>{assessment.explanation}</p><div className="repair-components">{assessment.component_ids.map(id=><button key={id} onClick={()=>onSelect(id)}>{analysis.components.find(part=>part.id===id)?.name}<ArrowUpRight size={11}/></button>)}</div><aside><AlertTriangle size={16}/><p><strong>Check first:</strong> {assessment.check_first}</p></aside></div>
    <div className="repair-action">
      {blocked?<><Camera size={23}/><h3>{assessment.status==="professional-help"?"DIY steps are intentionally withheld":"The evidence is not sufficient yet"}</h3><ul>{assessment.missing_evidence.map((item,i)=><li key={i}>{item}</li>)}</ul>{assessment.status==="needs-more-evidence"&&<button className="primary" onClick={onMoreEvidence}>Add another photo <Camera size={14}/></button>}</>:<><div className="repair-tools"><Wrench size={18}/><div><span>TOOLS FOR THESE STEPS</span><p>{assessment.tools.length?assessment.tools.map(tool=>tool.name).join(" · "):"No tool required"}</p></div></div><ol>{assessment.steps.map((step,i)=><li key={i}><span>{String(i+1).padStart(2,"0")}</span><div><h3>{step.title}</h3><p>{step.instruction}</p><small><CheckCircle2 size={13}/>{step.checkpoint}</small></div></li>)}</ol></>}
    </div></div>
    <div className="repair-stop"><strong>STOP CONDITIONS</strong><ul>{assessment.stop_conditions.map((item,i)=><li key={i}>{item}</li>)}</ul></div>
  </section>
}

"use client";

import { useState } from "react";
import { AlertTriangle, ArrowUpRight, Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, ImageIcon, Loader2, ShieldAlert, Users, Wrench } from "lucide-react";
import {ManualResearch,RepairVerification,type StepFeedback} from "./RepairFollowup";
import type {ScanView} from "../lib/analysis";
import OrchestrationTrace from "./OrchestrationTrace";
import type { Orchestration } from "../lib/orchestration";
import type { Analysis } from "../lib/analysis";

export default function RepairAssessment({analysis,orchestration,sourceCaseId,photos,onSelect,onMoreEvidence}:{analysis:Analysis;orchestration?:Orchestration;sourceCaseId:string;photos:ScanView["photos"];onSelect:(id:string)=>void;onMoreEvidence:()=>void}) {
  const assessment=analysis.repair_assessment!;
  const blocked=assessment.status!=="guided-inspection";
  const [active,setActive]=useState(0);
  const [feedback,setFeedback]=useState<Record<number,StepFeedback>>({});
  const [images,setImages]=useState<Record<number,string>>({});
  const [busy,setBusy]=useState<number|null>(null);
  const [error,setError]=useState("");
  const step=assessment.steps[active];

  async function createStepVisual(index:number){
    const selected=assessment.steps[index];
    if(!selected||images[index]||busy!==null)return;
    setBusy(index);setError("");
    try{
      const response=await fetch("/api/component-image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({kind:"repair-step",object_name:analysis.object_name,step_title:selected.title,instruction:selected.instruction,checkpoint:selected.checkpoint,tool:selected.tool||"No special tool"})});
      const body=await response.json();
      if(!response.ok||!body.image)throw new Error(body.error?.message||"The step illustration could not be created.");
      setImages(old=>({...old,[index]:body.image}));
    }catch(cause){setError(cause instanceof Error?cause.message:"The step illustration could not be created.");}
    finally{setBusy(null);}
  }

  return <section className={`repair-assessment ${assessment.status}`} aria-labelledby="repair-answer-title">
    <div className="repair-report-topline"><span><CheckCircle2 size={15}/> FIXCORE / REPAIR INTELLIGENCE</span><span>01 — DIAGNOSIS · 02 — ACTION · 03 — VERIFY</span></div>
    <div className="repair-answer-head"><div><p className="eyebrow">VISUAL REPAIR TRIAGE / NOT A CONFIRMED DIAGNOSIS</p><h2 id="repair-answer-title">{assessment.status==="professional-help"?"Stop here and get qualified help.":assessment.status==="needs-more-evidence"?"One more look before guidance.":"A cautious inspection path."}</h2></div><span className={`risk-badge ${assessment.risk}`}><ShieldAlert size={14}/>{assessment.risk} risk · model assessment</span></div>
    <div className="repair-answer-grid"><div className="repair-cause"><span>POSSIBLE CAUSE</span><h3>{assessment.possible_cause}</h3><p>{assessment.explanation}</p><div className="repair-components">{assessment.component_ids.map(id=><button key={id} onClick={()=>onSelect(id)}>{analysis.components.find(part=>part.id===id)?.name}<ArrowUpRight size={11}/></button>)}</div><aside><AlertTriangle size={16}/><p><strong>Check first:</strong> {assessment.check_first}</p></aside></div>
    <div className="repair-action">{blocked?<><Camera size={23}/><h3>{assessment.status==="professional-help"?"DIY steps are intentionally withheld":"The evidence is not sufficient yet"}</h3><ul>{assessment.missing_evidence.map((item,i)=><li key={i}>{item}</li>)}</ul>{assessment.status==="needs-more-evidence"&&<button className="primary" onClick={onMoreEvidence}>Add another photo <Camera size={14}/></button>}</>:step&&<>
      <div className="repair-tools"><Wrench size={18}/><div><span>TOOLS FOR THIS PATH</span><p>{assessment.tools.length?assessment.tools.map(tool=>tool.name).join(" · "):"No tool required"}</p></div></div>
      <div className="step-progress"><span>STEP {active+1} OF {assessment.steps.length}</span><progress aria-label={`Step ${active+1} of ${assessment.steps.length}`} value={active+1} max={assessment.steps.length}/></div>
      <article className="guided-step">
      <div className="guided-step-copy"><span>{String(active+1).padStart(2,"0")}</span><h3>{step.title}</h3>{step.purpose&&<p className="step-purpose"><b>Why:</b> {step.purpose}</p>}<p>{step.instruction}</p><dl><div><dt>Tool</dt><dd>{step.tool||assessment.tools[0]?.name||"No special tool"}</dd></div><div><dt>What you should see</dt><dd>{step.checkpoint}</dd></div>{step.common_mistake&&<div><dt>Common mistake</dt><dd>{step.common_mistake}</dd></div>}<div><dt>Stop if</dt><dd>{step.stop_condition||assessment.stop_conditions[0]}</dd></div></dl></div><details className="step-visual-option"><summary>Optional step illustration <ImageIcon size={16}/></summary>{images[active]?<img src={images[active]} alt={`AI-generated conceptual guide for step ${active+1}: ${step.title}`}/>:<div className="step-visual-empty"><ImageIcon size={27}/><strong>Optional step illustration</strong><p>Generate only when useful. The result is conceptual and may not match your exact model.</p><button className="secondary" disabled={busy!==null} onClick={()=>createStepVisual(active)}>{busy===active?<><Loader2 className="spin" size={14}/>Creating…</>:<><ImageIcon size={14}/>Generate this visual</>}</button></div>}</details></article>
      {error&&<p className="step-image-error" role="alert">{error}</p>}<div className="step-controls"><button className="secondary" disabled={active===0} onClick={()=>{setActive(value=>value-1);setError("")}}><ChevronLeft size={14}/>Previous</button><button className="primary" disabled={active===assessment.steps.length-1 || Object.values(feedback).some(item=>["problem-remains","different","stopped"].includes(item.outcome))} onClick={()=>{setActive(value=>value+1);setError("")}}>Next step<ChevronRight size={14}/></button></div>
    </>}</div></div>
    <div className="repair-execution">
      <div className="orchestrator-summary"><div><span><Users size={15}/> FIXCORE ORCHESTRATION</span><strong>{orchestration ? "Evidence analysis and independent safety rules" : "Recorded analysis"}</strong><p>{orchestration ? `${orchestration.budget.callsUsed} of ${orchestration.budget.maxCalls} analysis calls used. Manual lookup and follow-up review run separately when requested.` : "No execution trace was recorded for this result."}</p></div></div>
      {orchestration && <OrchestrationTrace events={orchestration.events} />}
    </div>
    {!blocked&&step&&<RepairVerification key={`${sourceCaseId}-${active}`} analysis={analysis} sourceCaseId={sourceCaseId} stepIndex={active} photos={photos} feedback={feedback[active]} onFeedbackChange={value=>setFeedback(previous=>({...previous,[active]:value}))}/>}
    {!blocked && <p className="repair-feedback-note">Step reports stay in this investigation while you move between steps. Refreshing clears them. They are your observations, not independently verified repair results.</p>}
    {!blocked && feedback[active] && ["problem-remains","different","stopped"].includes(feedback[active].outcome) && <button className="secondary" onClick={onMoreEvidence}>Reassess with another photo <Camera size={14}/></button>}
    <ManualResearch key={sourceCaseId} sourceCaseId={sourceCaseId}/>
    <div className="repair-stop"><strong>STOP CONDITIONS</strong><ul>{assessment.stop_conditions.map((item,i)=><li key={i}><CheckCircle2 size={12}/>{item}</li>)}</ul></div>
  </section>
}

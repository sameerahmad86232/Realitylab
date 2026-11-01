"use client";
import {useEffect,useRef,useState} from "react";
import type {Analysis,ScanView} from "../lib/analysis";
import {researchResponseSchema,verificationResponseSchema,type ResearchResult,type VerificationResult} from "../lib/followup";
import {preparePhoto,type Photo} from "../lib/photos";
import OrchestrationTrace from "./OrchestrationTrace";

function useRequest(){
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 return controller;
}
export function ManualResearch({sourceCaseId}:{sourceCaseId:string}){
 const [model,setModel]=useState(""),[url,setURL]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[result,setResult]=useState<ResearchResult|null>(null);
 const request=useRequest();
 async function lookup(event:React.FormEvent){
  event.preventDefault();request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setError("");setResult(null);
  try{
   const response=await fetch("/api/research",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model,url,sourceCaseId}),signal:controller.signal});
   const body=await response.json();if(!response.ok)throw Error(body.error?.message||"Documentation lookup failed.");
   const parsed=researchResponseSchema.parse(body);if(parsed.sourceCaseId!==sourceCaseId)throw Error("Documentation did not match this case.");
   if(!controller.signal.aborted)setResult(parsed);
  }catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Documentation lookup failed.");}finally{if(request.current===controller)setBusy(false);}
 }
 return <section className="repair-followup" aria-label="Manual research">
  <h3>Find the source documentation</h3><p>Enter the exact model and a manufacturer documentation page. Lookup uses no AI credits and does not change your inspection instructions.</p>
  <form onSubmit={lookup}>
   <label>Exact manufacturer and model<input required maxLength={120} value={model} disabled={busy} onChange={event=>{setModel(event.target.value);setResult(null);}} /></label>
   <label>Official documentation URL<input required type="url" maxLength={2048} value={url} disabled={busy} placeholder="https://support.apple.com/…" onChange={event=>{setURL(event.target.value);setResult(null);}} /></label>
   <p>Supported: Apple, Google, Microsoft, HP, Dell, Lenovo, Samsung, LG, Bosch Home and Sony. Use an HTML documentation page without query parameters; PDF extraction is not available.</p>
   <button className="secondary" disabled={busy||!model.trim()||!url.trim()}>{busy?"Retrieving documentation…":"Retrieve documentation"}</button>
   {busy&&<button type="button" className="secondary" onClick={()=>{request.current?.abort();setBusy(false);setError("Lookup cancelled.");}}>Cancel lookup</button>}
  </form>
  {error&&<p role="alert">{error}</p>}
  {result&&<div className="followup-result"><h4><a href={result.url} target="_blank" rel="noreferrer">{result.title}</a></h4><p>{result.modelMentioned?"The supplied model text appears on the page; applicability still needs checking.":"The supplied model text was not found. Treat this source as unmatched."}</p><blockquote>{result.excerpt}</blockquote><p>Source: {new URL(result.url).hostname} · Retrieved {new Date(result.retrievedAt).toLocaleString()} · Excerpt only</p><OrchestrationTrace events={result.orchestration.events}/></div>}
 </section>;
}
export function RepairVerification({analysis,sourceCaseId,stepIndex,photos}:{analysis:Analysis;sourceCaseId:string;stepIndex:number;photos:ScanView["photos"]}){
 const [after,setAfter]=useState<Photo|null>(null),[beforeIndex,setBeforeIndex]=useState(0),[report,setReport]=useState(""),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[preparing,setPreparing]=useState(false),[error,setError]=useState(""),[result,setResult]=useState<VerificationResult|null>(null);
 const request=useRequest(),generation=useRef(0),photo=useRef<Photo|null>(null);
 useEffect(()=>()=>{generation.current++;if(photo.current)URL.revokeObjectURL(photo.current.url);},[]);
 async function choose(file?:File){
  const id=++generation.current;setConsent(false);setResult(null);setError("");if(photo.current)URL.revokeObjectURL(photo.current.url);photo.current=null;setAfter(null);if(!file)return;setPreparing(true);
  try{const prepared=await preparePhoto(file);if(id!==generation.current){URL.revokeObjectURL(prepared.url);return;}photo.current=prepared;setAfter(prepared);}catch(cause){if(id===generation.current)setError(cause instanceof Error?cause.message:"Could not read photo.");}finally{if(id===generation.current)setPreparing(false);}
 }
 async function review(event:React.FormEvent){
  event.preventDefault();if(!after||!consent||photos[beforeIndex]?.omitted)return;
  request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setError("");setResult(null);
  try{
   const original=await fetch(photos[beforeIndex].url,{signal:controller.signal});if(!original.ok)throw Error("The original photo is no longer available. Start a new scan.");
   const form=new FormData();form.set("consent","true");form.set("before",new File([await original.blob()],"before.jpg",{type:"image/jpeg"}));form.set("after",after.file);
   form.set("input",JSON.stringify({analysis,sourceCaseId,stepIndex,report}));
   const response=await fetch("/api/verify",{method:"POST",body:form,signal:controller.signal});const body=await response.json();if(!response.ok)throw Error(body.error?.message||"Follow-up review failed.");
   const parsed=verificationResponseSchema.parse(body);if(parsed.sourceCaseId!==sourceCaseId||parsed.stepIndex!==stepIndex)throw Error("The comparison did not match this checkpoint.");if(!controller.signal.aborted)setResult(parsed);
  }catch(cause){if(!controller.signal.aborted)setError(cause instanceof Error?cause.message:"Follow-up review failed.");}finally{if(request.current===controller)setBusy(false);}
 }
 return <section className="repair-followup" aria-label="Follow-up checkpoint review">
  <h3>Review this checkpoint</h3><p>Add a photo of the same object and region after your inspection. A comparison can describe visible changes; it cannot establish that a repair succeeded or that the object is safe.</p>
  <form onSubmit={review}>
   <label>Original photo<select value={beforeIndex} disabled={busy} onChange={event=>{setBeforeIndex(Number(event.target.value));setConsent(false);setResult(null);}}>{photos.map((source,index)=><option key={source.id} value={index} disabled={source.omitted}>View {index+1}{source.omitted?" — photo unavailable":""}</option>)}</select></label>
   <label>After photo<input type="file" accept="image/jpeg,image/png" disabled={busy||preparing} onChange={event=>void choose(event.target.files?.[0])}/></label>
   {preparing&&<p role="status">Preparing photo…</p>}{after&&<img className="followup-photo" src={after.url} alt="Prepared follow-up evidence"/>}
   <label>What did you observe?<textarea required maxLength={500} value={report} disabled={busy} onChange={event=>{setReport(event.target.value);setConsent(false);setResult(null);}}/></label>
   <label className="consent"><input type="checkbox" checked={consent} disabled={busy||!after||preparing} onChange={event=>setConsent(event.target.checked)}/>I agree to send both photos, the source analysis, checkpoint and my observation to Baseten for one additional AI review.</label>
   <button className="secondary" disabled={busy||preparing||!after||!consent||!report.trim()||photos[beforeIndex]?.omitted}>{busy?"Reviewing checkpoint…":"Review checkpoint"}</button>
   {busy&&<button type="button" className="secondary" onClick={()=>{request.current?.abort();setBusy(false);setError("Review cancelled. Provider usage already incurred may still be charged.");}}>Cancel review</button>}
  </form>
  {error&&<p role="alert">{error}</p>}
  {result&&<div className="followup-result"><h4>{({"consistent-with-checkpoint":"Visually consistent with this checkpoint","inconsistent-with-checkpoint":"Visible evidence differs from this checkpoint",inconclusive:"More evidence is needed","professional-help":"Seek qualified help"})[result.verification.status]}</h4><p>{result.verification.summary}</p><ul>{result.verification.observations.map((item,index)=><li key={index}><strong>{item.source}:</strong> {item.detail}</li>)}</ul>{result.verification.missingEvidence.length>0&&<><h4>Missing evidence</h4><ul>{result.verification.missingEvidence.map((item,index)=><li key={index}>{item}</li>)}</ul></>}<ul>{result.verification.limitations.map((item,index)=><li key={index}>{item}</li>)}</ul><OrchestrationTrace events={result.orchestration.events}/></div>}
 </section>;
}

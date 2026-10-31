"use client";

import { useEffect, useRef, useState } from "react";
import {
  Aperture, ArrowLeft, ArrowRight, Camera, Check, CheckCircle2,
  ChevronRight, CircleHelp, Download, ImagePlus, LoaderCircle,
  RotateCcw, ShieldAlert, ShieldCheck, Sparkles, Upload, WandSparkles,
  Wrench, X, Zap
} from "lucide-react";
import type { RepairPlan } from "../../lib/repair";
import { sampleRepairPlan } from "../../lib/repair";
import styles from "./fix.module.css";

type PhotoItem = { file: File; url: string };
type Result = { plan: RepairPlan; demo: boolean };
const examples = ["My desk fan won't spin", "This chair leg is loose", "My backpack zipper is stuck"];

export default function FixStudio() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [problem, setProblem] = useState("");
  const [consent, setConsent] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [illustrations, setIllustrations] = useState<Record<string,string>>({});
  const [imageBusy, setImageBusy] = useState<string | null>(null);
  const [imageError, setImageError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const photoUrls = useRef<string[]>([]);
  const inFlight = useRef(false);

  useEffect(() => () => { photoUrls.current.forEach(url => URL.revokeObjectURL(url)); controller.current?.abort(); }, []);

  function addPhotos(files: FileList | File[]) {
    const chosen = Array.from(files);
    if (!chosen.length || busy) return;
    if (chosen.length + photos.length > 2) { setError("You can upload up to two photos."); return; }
    const invalid = chosen.find(f => !["image/jpeg","image/png"].includes(f.type) || !f.size || f.size > 5 * 1024 * 1024);
    if (invalid) { setError("Use JPG or PNG photos under 5 MB each."); return; }
    setPhotos(current => [...current, ...chosen.map(file => { const url = URL.createObjectURL(file); photoUrls.current.push(url); return {file, url}; })]);
    setConsent(false);
    setError("");
  }

  function resetResult() {
    setResult(null); setSelected(0); setCompleted([]); setIllustrations({}); setImageBusy(null); setImageError("");
  }

  async function diagnose() {
    if (inFlight.current) return;
    if (!photos.length) { setError("Add at least one photo of the object."); return; }
    if (problem.trim().length < 12) { setError("Describe the problem in at least 12 characters."); return; }
    if (!consent) { setError("Please confirm consent before sending photos to the AI provider."); return; }
    inFlight.current = true;
    setBusy(true); setError("");
    const abort = new AbortController();
    controller.current = abort;
    const timeout = setTimeout(() => abort.abort(), 85000);
    try {
      const form = new FormData();
      photos.forEach(({file}) => form.append("images", file));
      form.append("problem", problem.trim());
      form.append("consent", "true");
      const response = await fetch("/api/repair", {method:"POST",body:form,signal:abort.signal});
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw Error(payload.error?.message || "The repair service is unavailable.");
      if (!payload.plan || !Array.isArray(payload.plan.steps)) throw Error("The repair service sent an incomplete guide.");
      setResult({plan:payload.plan as RepairPlan,demo:false});
      setSelected(0); setCompleted([]); setIllustrations({});
      window.scrollTo({top:0,behavior:"smooth"});
    } catch(e) {
      setError(abort.signal.aborted ? "The request timed out or was cancelled. Your photos are still here." : e instanceof Error ? e.message : "Could not create a guide.");
    } finally {
      clearTimeout(timeout); controller.current = null; inFlight.current = false; setBusy(false);
    }
  }

  function sample() {
    setResult({plan:sampleRepairPlan,demo:true});
    setCompleted([]); setIllustrations({}); setSelected(0); setError("");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function createIllustration(step: RepairPlan["steps"][number]) {
    if (!result || result.demo || imageBusy || illustrations[step.id]) return;
    setImageBusy(step.id); setImageError("");
    try {
      const response = await fetch("/api/component-image", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          object_name:result.plan.object_name,
          component_name:step.component_name,
          component_function:step.instruction,
          evidence_status:"inferred",
          materials:[],
          repair_step:`${step.title}: ${step.instruction}`.slice(0,350)
        })
      });
      const payload = await response.json().catch(() => ({}));
      if(!response.ok) throw Error(payload.error?.message || "Image generation is currently unavailable.");
      if(typeof payload.image !== "string") throw Error("The image provider sent an invalid result.");
      setIllustrations(current => ({...current,[step.id]:payload.image}));
    } catch(e) { setImageError(e instanceof Error ? e.message : "Could not create the concept image."); }
    finally { setImageBusy(null); }
  }

  const plan = result?.plan;
  const step = plan?.steps[selected];
  const doneCount = completed.length;

  return (
    <div className={styles.shell}>
      <div className={styles.ambient} aria-hidden="true" />
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="RealityLab home"><Aperture size={26} /><span>Reality<span>Lab</span></span></a>
        <div className={styles.headerCenter}><span className={styles.liveDot} /> THE PRACTICAL AI WORKBENCH <span className={styles.beta}>HACKATHON EDITION</span></div>
        <a className={styles.headerLink} href="/">Explore Lab <ArrowRight size={15}/></a>
      </header>

      <main className={styles.main}>
        {!result ? (
          <>
            <section className={styles.hero}>
              <div className={styles.eyebrow}><span className={styles.liveDot}/> REPAIR INTELLIGENCE / 001</div>
              <h1>From broken <span>to understood.</span></h1>
              <p className={styles.heroLead}>Show us what&apos;s wrong. RealityLab turns your photo and problem into a clear, safe, step-by-step troubleshooting guide.</p>
              <div className={styles.howRow}>
                <div><Camera size={18}/><span>Show the object</span></div><ChevronRight size={15}/>
                <div><Sparkles size={18}/><span>Understand the issue</span></div><ChevronRight size={15}/>
                <div><Wrench size={18}/><span>Follow the guide</span></div>
              </div>
            </section>

            <div className={styles.intakeLayout}>
              <form className={styles.intake} onSubmit={e => {e.preventDefault(); void diagnose();}}>
                <div className={styles.panelHeader}><span className={styles.panelIndex}>01 / INPUT</span><span>NEW REPAIR SESSION</span></div>
                <div className={styles.fieldTop}><h2>What needs fixing?</h2><p>Start with the object as it is right now. No technical knowledge needed.</p></div>
                <div className={styles.fieldLabel}><span><ImagePlus size={17}/> Object photos</span><small>{photos.length} / 2 ADDED</small></div>
                <div className={styles.dropZone} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();addPhotos(e.dataTransfer.files);}}>
                  {photos.length ? (
                    <div className={styles.photoGrid}>
                      {photos.map((photo,i)=><div className={styles.photoCard} key={photo.url}>
                        <img src={photo.url} alt={`Uploaded object view ${i+1}`}/>
                        <button type="button" aria-label={`Remove photo ${i+1}`} onClick={()=>{setPhotos(current=>current.filter(p=>p!==photo));setConsent(false);}}><X size={14}/></button>
                      </div>)}
                      {photos.length<2&&<button type="button" className={styles.addAnother} onClick={()=>fileInput.current?.click()}><ImagePlus size={22}/><span>Add angle</span></button>}
                    </div>
                  ):(
                    <button type="button" className={styles.uploadButton} onClick={()=>fileInput.current?.click()}>
                      <span className={styles.uploadGlyph}><Upload size={25}/></span>
                      <strong>Drop a photo here, or browse</strong>
                      <span>JPEG / PNG · 5 MB max per image</span>
                      <span className={styles.browse}>Choose photos <ArrowRight size={14}/></span>
                    </button>
                  )}
                </div>
                <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png" hidden onChange={e=>{if(e.target.files) addPhotos(e.target.files);e.currentTarget.value="";}}/>
                <div className={styles.fieldLabel}><span><CircleHelp size={17}/> Describe the problem</span><small>{problem.length} / 600</small></div>
                <textarea className={styles.problemInput} value={problem} maxLength={600} rows={4}
                  onChange={e=>setProblem(e.target.value)}
                  placeholder="e.g. My desk fan makes a humming noise but the blades don't spin. It started yesterday."
                  aria-label="What is wrong with your object?" />
                <div className={styles.chips}>{examples.map(example=><button type="button" key={example} onClick={()=>setProblem(example)}>{example} <ArrowRight size={12}/></button>)}</div>
                <label className={styles.consent}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I agree to send these photos and my description to the AI inference provider for this analysis. Photos are not saved as a RealityLab project automatically.</span></label>
                {error&&<p className={styles.error} role="alert"><ShieldAlert size={16}/>{error}</p>}
                <button className={styles.analyze} disabled={busy || !photos.length || problem.trim().length<12 || !consent} type="submit">
                  {busy?<><LoaderCircle className={styles.spinner} size={18}/> Analyzing your object…</>:<><Sparkles size={19}/> Generate repair guide <ArrowRight size={20}/></>}
                </button>
                <div className={styles.formFoot}><ShieldCheck size={15}/> Safety-first suggestions, not a certified diagnosis. <span>Powered by Meta AI via Baseten</span></div>
              </form>
              <aside className={styles.side}>
                <div className={styles.featurePanel}>
                  <div className={styles.featureTop}><span>THE OUTPUT</span><span>LIVE WORKSPACE <Zap size={13}/></span></div>
                  <div className={styles.visual}><span className={styles.outerCircle}/><span className={styles.innerCircle}/><span className={styles.crossOne}/><span className={styles.crossTwo}/><Wrench size={65} strokeWidth={1.15}/><span className={styles.visualDot}/></div>
                  <div className={styles.visualCaption}><span className={styles.scanTag}>01 — INSPECT</span><span className={styles.scanTag}>02 — DIAGNOSE</span><span className={styles.scanTag}>03 — GUIDE</span></div>
                  <h3>Not another vague answer.</h3>
                  <p>Possible causes. Tools you may need. Instructions one action at a time. Optional AI-generated concept visuals for the parts you are inspecting.</p>
                </div>
                <button className={styles.demoButton} type="button" onClick={sample}><span><CheckCircle2 size={19}/> See a ready-made example</span><ArrowRight size={18}/></button>
                <div className={styles.sideNote}><ShieldAlert size={18}/><span>Electrical, gas, structural and other hazardous problems should be handled by qualified professionals. Photos can&apos;t verify internal faults.</span></div>
              </aside>
            </div>
          </>
        ) : (
          <section className={styles.workspace}>
            <div className={styles.workTop}>
              <div><button type="button" className={styles.back} onClick={resetResult}><ArrowLeft size={15}/> New diagnosis</button>
                <div className={styles.eyebrow}><span className={styles.liveDot}/> {result.demo?"RECORDED EXAMPLE / NO AI CALL":"META AI / PHOTO ANALYSIS"}</div>
                <h1>{plan!.object_name}<span> repair studio.</span></h1>
                <p className={styles.workLead}>{plan!.problem}</p>
              </div>
              <button className={styles.print} type="button" onClick={()=>window.print()}><Download size={17}/> Print guide</button>
            </div>
            {result.demo&&<p className={styles.sampleNotice}><Sparkles size={17}/> Example guide only — this sample was prepared in advance, not generated from your photos. Upload your own image for a live analysis.</p>}
            <div className={styles.riskBar} data-risk={plan!.risk}>
              {plan!.risk==="low"?<ShieldCheck size={22}/>:<ShieldAlert size={22}/>}
              <div><strong>{plan!.risk==="professional"?"Professional assistance recommended":plan!.risk==="caution"?"Use caution":"Low-risk external checks"}</strong><p>{plan!.risk_reason}</p></div>
            </div>
            <div className={styles.resultGrid}>
              <aside className={styles.timeline}>
                <span className={styles.panelIndex}>YOUR REPAIR ROUTE</span>
                <h2>{plan!.steps.length} guided steps</h2>
                <div className={styles.progressTrack}><span style={{width:`${Math.round(doneCount/plan!.steps.length*100)}%`}}/></div>
                <p className={styles.progressText}>{doneCount} of {plan!.steps.length} steps marked complete</p>
                <div className={styles.stepList}>{plan!.steps.map((item,i)=><button type="button" key={item.id} aria-current={selected===i?"step":undefined} data-active={selected===i} onClick={()=>{setSelected(i);setImageError("");}}>
                  <span className={styles.stepNumber}>{completed.includes(item.id)?<Check size={16}/>:String(i+1).padStart(2,"0")}</span><span><strong>{item.title}</strong><small>{item.component_name}</small></span><ChevronRight size={17}/>
                </button>)}</div>
                <div className={styles.tools}><span className={styles.panelIndex}>TOOLS & MATERIALS</span>{plan!.tools.length?<div>{plan!.tools.map(tool=><span key={tool}><Wrench size={13}/>{tool}</span>)}</div>:<p>No special tools specified.</p>}</div>
              </aside>
              <article className={styles.stepContent}>
                <div className={styles.stepHeader}><span>STEP {String(selected+1).padStart(2,"0")} / {String(plan!.steps.length).padStart(2,"0")}</span><span>{step?.component_name}</span></div>
                <h2>{step?.title}</h2>
                <p className={styles.instruction}>{step?.instruction}</p>
                <div className={styles.explainer}><span>WHY THIS HELPS</span><p>{step?.why}</p></div>
                <div className={styles.expected}><CheckCircle2 size={19}/><div><strong>What to look for</strong><p>{step?.expected_result}</p></div></div>
                {step?.caution&&<div className={styles.caution}><ShieldAlert size={19}/><div><strong>Be careful</strong><p>{step.caution}</p></div></div>}
                <div className={styles.stepActions}><button type="button" className={styles.markDone} onClick={()=>{if(!step)return;setCompleted(current=>current.includes(step.id)?current.filter(id=>id!==step.id):[...current,step.id]);}}><Check size={16}/>{step&&completed.includes(step.id)?"Marked complete":"Mark step complete"}</button>
                  <div><button type="button" disabled={selected===0} onClick={()=>{setSelected(i=>Math.max(0,i-1));setImageError("");}}><ArrowLeft size={17}/></button><button type="button" disabled={selected===plan!.steps.length-1} onClick={()=>{setSelected(i=>Math.min(plan!.steps.length-1,i+1));setImageError("");}}><ArrowRight size={17}/></button></div>
                </div>
              </article>
              <aside className={styles.imagePanel}>
                <div className={styles.imageHeader}><span>VISUAL ASSISTANT</span><span><WandSparkles size={15}/> AI CONCEPT</span></div>
                <div className={styles.renderArea}>
                  {step&&illustrations[step.id]?<img src={illustrations[step.id]} alt={`AI concept illustration of ${step.component_name}, not verified source evidence`}/>:(
                    <div className={styles.illustrationPlaceholder}><div><Wrench size={65} strokeWidth={1.15}/><span className={styles.targetRing}/></div><strong>{step?.component_name}</strong><small>CONCEPTUAL COMPONENT VIEW</small></div>
                  )}
                </div>
                <div className={styles.imageInfo}><h3>See the component</h3><p>Generate a visual explanation of the part referenced in this step. Images are illustrative, not a diagnosis, accurate wiring diagram, or exact fit.</p>
                  {result.demo?<p className={styles.mutedNote}>Live visuals are available only after a real photo analysis.</p>:<button type="button" disabled={!!imageBusy||!!(step&&illustrations[step.id])} onClick={()=>step&&void createIllustration(step)}>
                    {imageBusy===step?.id?<><LoaderCircle className={styles.spinner} size={16}/> Generating…</>:step&&illustrations[step.id]?<><Check size={16}/> Illustration ready</>:<><WandSparkles size={16}/> Generate AI visual <ArrowRight size={15}/></>}
                  </button>}
                  {imageError&&<p className={styles.error} role="alert">{imageError}</p>}
                  <small>Optional request · May use provider credits</small>
                </div>
              </aside>
            </div>
            <div className={styles.outcomeGrid}>
              <section><span className={styles.panelIndex}>WHY THIS MAY BE HAPPENING</span><h2>Possible causes</h2>{plan!.possible_causes.map((cause,i)=><div className={styles.cause} key={i}><strong>{cause.title}</strong><span>{cause.evidence==="visible"?"Visible clue":cause.evidence==="reported"?"From your report":"Hypothesis"}</span><p>{cause.reason}</p></div>)}</section>
              <section><span className={styles.panelIndex}>BEFORE YOU FINISH</span><h2>Safety & verification</h2><h3>Stop if you notice</h3><ul>{plan!.stop_if.map((item,i)=><li key={i}><ShieldAlert size={16}/>{item}</li>)}</ul><h3>Check your work</h3><ul>{plan!.verify.map((item,i)=><li key={i}><CheckCircle2 size={16}/>{item}</li>)}</ul></section>
            </div>
            <div className={styles.bottomAction}><div><strong>Need to inspect another object?</strong><p>Start a new photo-guided repair session.</p></div><button type="button" onClick={resetResult}><RotateCcw size={17}/> New diagnosis</button></div>
          </section>
        )}
      </main>
      <footer className={styles.footer}><span>REALITYLAB / FIX STUDIO</span><span>Practical guidance, grounded in evidence. Not a substitute for professional repair or safety inspection.</span></footer>
    </div>
  );
}

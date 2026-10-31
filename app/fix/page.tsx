"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import {
  ArrowRight, ArrowUpRight, ArrowDown, Check, CheckCircle2, ChevronRight,
  Camera, Clock3, Copy, FileText, Globe2, Image as ImageIcon, Info,
  Leaf, Loader2, Menu, Mic, MoveHorizontal, RotateCcw, ScanLine, ShieldCheck,
  Shirt, Smartphone, Sparkles, UploadCloud, WandSparkles, WashingMachine,
  X, Zap, AlertTriangle, Droplets, Eye, MousePointer2, LockKeyhole
} from "lucide-react";
import "./studio.css";

type Step = {title:string; detail:string; tools:string[]; minutes:number};
type Diagnosis = { object:string; issue:string; cause:string; evidence:string; target:string; urgency:"low"|"medium"|"high"; dangerous:boolean; safety:string; confidence:number; steps:Step[]; estimate:string };
type ScanResult = {diagnosis:Diagnosis;grounding:{found:boolean;target:string;box:null|{left:number;top:number;width:number;height:number}};after:string|null;afterError?:string|null;disclaimer:string};
type Example = {name:string; subtitle:string; icon:string; tag:string; color:string; fault:string; cause:string; steps:[string,string,string]; tools:string};

const examples:Example[]=[
  {name:"Leaking tap",subtitle:"Plumbing",icon:"🚰",tag:"HOME",color:"blue",fault:"Possible worn tap washer",cause:"Water droplets near the outlet suggest a damaged seal, but the internal part is not visible.",steps:["Close the water supply","Inspect accessible washer or seal","Reassemble and test gently"],tools:"Cloth · Adjustable spanner"},
  {name:"Yellow leaves",subtitle:"Plant care",icon:"🌿",tag:"NATURE",color:"lime",fault:"Possible overwatering",cause:"Yellowing can follow poor drainage, although other causes require inspection.",steps:["Check soil moisture","Remove standing water","Adjust watering and watch new growth"],tools:"Finger test · Drainage tray"},
  {name:"Washing machine E4",subtitle:"Appliances",icon:"🧺",tag:"APPLIANCES",color:"violet",fault:"Error code needs model verification",cause:"An E4 code means different things across manufacturers. Consult the model's manual first.",steps:["Switch off and note model","Look up the exact E4 definition","Try only manufacturer-safe checks"],tools:"Manufacturer manual"},
  {name:"Pashmina stain",subtitle:"Fabric care",icon:"🧣",tag:"TEXTILES",color:"pink",fault:"Possible surface stain",cause:"The stain composition and dye stability cannot be verified from an image.",steps:["Blot dry — do not rub","Test a hidden area carefully","Seek a specialist for valuable pieces"],tools:"Clean white cloth"},
  {name:"Cracked screen",subtitle:"Electronics",icon:"📱",tag:"TECH",color:"cyan",fault:"Cracked display glass",cause:"Visible glass damage may coexist with hidden LCD or battery damage.",steps:["Avoid broken glass","Back up data if device is safe","Arrange qualified repair"],tools:"Protective case"},
  {name:"Confusing bill",subtitle:"Everyday life",icon:"🧾",tag:"DOCUMENTS",color:"amber",fault:"Unclear billed charges",cause:"A bill needs line-by-line review; no charges should be assumed.",steps:["Locate date and total","Compare line items with records","Ask provider to clarify discrepancies"],tools:"Bill · Previous statement"}
];
function Orb() {
  const mount=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const el=mount.current; if(!el)return;
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let renderer:THREE.WebGLRenderer;
    try { renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:"low-power"}); }
    catch {return;}
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.65));
    renderer.setSize(el.clientWidth,el.clientHeight);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,30);
    camera.position.z=8.8;
    const group=new THREE.Group();scene.add(group);
    const material=new THREE.ShaderMaterial({
      uniforms:{uTime:{value:0},uTint:{value:new THREE.Color("#84f1cf")}},
      vertexShader:String.raw'varying vec3 vNormal; varying vec3 vView; varying vec3 vPos; uniform float uTime; void main(){vec3 p=position; float wave=sin(p.y*7.5+uTime*1.25)*sin(p.x*5.5-uTime*.8)*.055; p+=normal*wave;vNormal=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(p,1.);vView=normalize(-mv.xyz);vPos=p;gl_Position=projectionMatrix*mv;}',
      fragmentShader:String.raw'precision highp float; varying vec3 vNormal;varying vec3 vView;varying vec3 vPos;uniform float uTime;void main(){float f=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.4);float latitude=abs(sin(vPos.y*33.+sin(vPos.x*5.+uTime)*.9));float longitude=abs(sin(atan(vPos.z,vPos.x)*29.));float grid=pow(max(latitude,longitude),19.);float pulse=.5+.5*sin(vPos.y*3.5+uTime*.7);vec3 core=mix(vec3(.018,.045,.072),vec3(.027,.31,.30),pulse*.55);vec3 teal=vec3(.45,1.,.81);vec3 lilac=vec3(.49,.42,1.);vec3 color=core+mix(teal,lilac,clamp(vPos.x*.25+.4,0.,1.))*f*1.3+teal*grid*(.17+f*.55);gl_FragColor=vec4(color,clamp(.92+f*.1,0.,1.));}'
    });
    const shell=new THREE.Mesh(new THREE.IcosahedronGeometry(2,26),material);
    group.add(shell);
    const wire=new THREE.Mesh(new THREE.IcosahedronGeometry(2.085,3),new THREE.MeshBasicMaterial({color:0x86ffe3,transparent:true,opacity:.14,wireframe:true,depthWrite:false}));
    group.add(wire);
    const ringMat=new THREE.MeshBasicMaterial({color:0x6adcc7,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false});
    const ring1=new THREE.Mesh(new THREE.TorusGeometry(2.55,.007,3,200),ringMat);
    ring1.rotation.x=1.08;ring1.rotation.y=.3;group.add(ring1);
    const ring2=new THREE.Mesh(new THREE.TorusGeometry(2.7,.006,3,200),ringMat.clone());
    ring2.rotation.x=.23;ring2.rotation.y=.7;group.add(ring2);
    const points=new Float32Array(650*3);
    for(let i=0;i<650;i++){const a=i*2.399963229728653,z=1-2*(i+.5)/650,r=Math.sqrt(1-z*z);points[3*i]=r*Math.cos(a)*2.35;points[3*i+1]=z*2.35;points[3*i+2]=r*Math.sin(a)*2.35;}
    const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(points,3));
    const dots=new THREE.Points(g,new THREE.PointsMaterial({color:0xc3ffec,size:.017,transparent:true,opacity:.45}));
    group.add(dots);
    let frame=0,disposed=false;const clock=new THREE.Clock();
    function resize(){if(!el)return;const w=el.clientWidth,h=el.clientHeight;if(w===0||h===0)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}
    const ro=new ResizeObserver(resize);ro.observe(el);resize();
    function tick(){
      if(disposed)return;const t=clock.getElapsedTime();material.uniforms.uTime.value=t;
      group.rotation.y=t*.095;group.rotation.x=Math.sin(t*.18)*.09-.12;
      ring1.rotation.z=t*.085;ring2.rotation.y=.7-t*.09;
      renderer.render(scene,camera);frame=requestAnimationFrame(tick);
    }
    tick();
    return()=>{disposed=true;cancelAnimationFrame(frame);ro.disconnect();g.dispose();shell.geometry.dispose();wire.geometry.dispose();ring1.geometry.dispose();ring2.geometry.dispose();material.dispose();(wire.material as THREE.Material).dispose();ringMat.dispose();(ring2.material as THREE.Material).dispose();(dots.material as THREE.Material).dispose();renderer.dispose();renderer.domElement.remove();};
  },[]);
  return <div className="rl-orb-wrap" aria-label="Animated interactive shader visualization of scanned object" role="img">
    <div className="rl-orb-glow"/><div className="rl-orb-canvas" ref={mount}/>
    <div className="rl-orbit-label rl-orbit-top"><span className="rl-pulse"/> PERCEPTION ENGINE <span>01 — ACTIVE</span></div>
    <div className="rl-orbit-label rl-orbit-bottom"><ScanLine size={14}/> OBJECT LOCALIZATION <span>3D FIELD</span></div>
    <div className="rl-orb-axis rl-axis-a"/><div className="rl-orb-axis rl-axis-b"/>
    <div className="rl-orb-corner rl-c1"/><div className="rl-orb-corner rl-c2"/><div className="rl-orb-corner rl-c3"/><div className="rl-orb-corner rl-c4"/>
    <div className="rl-orb-chip"><span className="rl-chip-dots">✦</span> <span>Visual intelligence<br/><strong>for the physical world.</strong></span></div>
  </div>;
}
function demoResult(x:Example):ScanResult {
  return {diagnosis:{
    object:x.name,issue:x.fault,cause:x.cause,evidence:"Prepared example — not a diagnosis of a real uploaded photo.",
    target:x.name,urgency:x.name==="Cracked screen"?"medium":"low",dangerous:false,
    safety:"Illustrative walkthrough. Inspect real conditions and stop when unsafe.",confidence:0,
    steps:x.steps.map((title,i)=>({title,detail:i===0?"Start with the least invasive check.":i===1?"Observe carefully. Avoid irreversible changes.":"Verify the outcome and ask a professional if unsure.",tools:x.tools.split(" · "),minutes:[2,4,3][i]})),
    estimate:"Varies by the actual condition."
  },grounding:{found:false,target:x.name,box:null},after:null,
    disclaimer:"This example is illustrative only. No Meta model was called."};
}
function StageIcon({n}:{n:number}){return [<Eye key="a"/>,<ScanLine key="b"/>,<WandSparkles key="c"/>,<ImageIcon key="d"/>][n];}
const stages=[["Understand","Muse Spark vision"],["Locate","SAM 3.1"],["Guide","3 focused steps"],["Visualize","Muse Image"]];

export default function RealityLabFix(){
  const [photo,setPhoto]=useState<string|null>(null),[filename,setFilename]=useState(""),[note,setNote]=useState("");
  const [language,setLanguage]=useState("en"),[busy,setBusy]=useState(false),[stage,setStage]=useState(0);
  const [error,setError]=useState(""),[result,setResult]=useState<ScanResult|null>(null);
  const [demo,setDemo]=useState<Example|null>(null),[compare,setCompare]=useState(50),[mask,setMask]=useState(true);
  const [done,setDone]=useState<number[]>([]),[copied,setCopied]=useState(false),[navOpen,setNavOpen]=useState(false);
  const [recording,setRecording]=useState(false),[voiceError,setVoiceError]=useState("");
  const inputRef=useRef<HTMLInputElement>(null),workRef=useRef<HTMLElement>(null),recRef=useRef<MediaRecorder|null>(null),piecesRef=useRef<Blob[]>([]);
  useEffect(()=>{if(!busy)return;const i=window.setInterval(()=>setStage(s=>Math.min(3,s+1)),3100);return()=>clearInterval(i);},[busy]);
  const loadFile=(file?:File)=>{
    if(!file)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>5_000_000){setError("Choose a JPEG, PNG or WebP image smaller than 5 MB.");return;}
    const rd=new FileReader();rd.onload=()=>{if(typeof rd.result!=="string")return;setPhoto(rd.result);setFilename(file.name);setResult(null);setDemo(null);setError("");setDone([]);setCompare(50);workRef.current?.scrollIntoView({behavior:"smooth",block:"start"});};
    rd.readAsDataURL(file);
  };
  useEffect(()=>{
    function onPaste(e:ClipboardEvent){const img=Array.from(e.clipboardData?.files||[]).find(f=>f.type.startsWith("image/"));if(img)loadFile(img);}
    window.addEventListener("paste",onPaste);return()=>window.removeEventListener("paste",onPaste);
  },[]);
  const chooseDemo=(x:Example)=>{setDemo(x);setPhoto(null);setFilename("");setResult(demoResult(x));setError("");setDone([]);setCompare(50);workRef.current?.scrollIntoView({behavior:"smooth",block:"start"});};
  const run=async()=>{
    if(!photo)return;setBusy(true);setStage(0);setResult(null);setDemo(null);setError("");setDone([]);
    try {
      const r=await fetch("/api/fix",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({image:photo,detail:note,language})});
      const data=await r.json();if(!r.ok)throw new Error(data.error||"Analysis failed.");
      setResult(data);setStage(3);
    } catch(e){setError(e instanceof Error?e.message:"Couldn't complete the analysis.");}
    finally{setBusy(false);}
  };
  const toggleMic=async()=>{
    if(recording){recRef.current?.stop();setRecording(false);return;}
    setVoiceError("");
    try{
      if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined")throw new Error("Audio recording is not supported here.");
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const rec=new MediaRecorder(stream);recRef.current=rec;piecesRef.current=[];
      rec.ondataavailable=e=>{if(e.data.size)piecesRef.current.push(e.data);};
      rec.onstop=async()=>{stream.getTracks().forEach(t=>t.stop());const b=new Blob(piecesRef.current,{type:rec.mimeType||"audio/webm"});
        if(!b.size)return;
        try{const fd=new FormData();fd.append("file",b,"note.webm");const response=await fetch("/api/fix/transcribe",{method:"POST",body:fd});const val=await response.json();if(!response.ok)throw new Error(val.error||"Transcription unavailable.");setNote(s=>[s,val.text].filter(Boolean).join(" "));}
        catch(e){setVoiceError(e instanceof Error?e.message:"Unable to transcribe.");}
      };
      rec.start();setRecording(true);
    }catch(e){setVoiceError(e instanceof Error?e.message:"Microphone access unavailable.");}
  };
  const copyPlan=async()=>{
    if(!result)return;
    const d=result.diagnosis; const text=[d.issue,d.cause,"",...d.steps.map((s,i)=>(i+1)+". "+s.title+" — "+s.detail),"",result.disclaimer].join("\n");
    try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),1800);}catch{setError("Copy failed. Select the steps manually.");}
  };
  const imageArea=photo||null;
  const sections=<></>;
  return <main className="rl-root">
    <div className="rl-ambient rl-ambient-one"/><div className="rl-ambient rl-ambient-two"/>
    <header className="rl-header">
      <a href="/" className="rl-brand" aria-label="RealityLab home"><span className="rl-brand-mark"><span/><span/><span/></span><span>reality<span className="rl-brand-light">lab</span><span className="rl-brand-star">✳</span></span></a>
      <nav className={navOpen?"rl-nav rl-nav-open":"rl-nav"} aria-label="Main navigation">
        <a href="#studio" onClick={()=>setNavOpen(false)}>The studio</a><a href="#examples" onClick={()=>setNavOpen(false)}>Explore use cases</a><a href="#how" onClick={()=>setNavOpen(false)}>How it works</a>
      </nav>
      <div className="rl-header-right"><div className="rl-live-pill"><span className="rl-live-dot"/> BUILD FOR YOUR WORLD</div><a className="rl-header-cta" href="#studio">Launch studio <ArrowUpRight size={16}/></a><button className="rl-menu" onClick={()=>setNavOpen(!navOpen)} aria-label="Toggle menu">{navOpen?<X/>:<Menu/>}</button></div>
    </header>
    <section className="rl-hero" aria-label="Introducing RealityLab">
      <div className="rl-hero-copy">
        <div className="rl-eyebrow"><span className="rl-tiny-star">✳</span> VISUAL INTELLIGENCE, UNLOCKED <span className="rl-eyebrow-rule"/></div>
        <h1>Anything broken?<br/><span className="rl-hero-highlight">See the fix<span className="rl-period">.</span></span></h1>
        <p className="rl-hero-description">Your world doesn't come with a manual.<br className="rl-desktop-only"/> Now it comes with a second pair of eyes.</p>
        <p className="rl-hero-sub">One photo. A clearer diagnosis. Three practical next steps. And a glimpse of what could be.</p>
        <div className="rl-hero-actions"><a className="rl-button rl-button-primary" href="#studio">Try RealityLab <ArrowUpRight size={18}/></a><a href="#how" className="rl-link-action"><span className="rl-play-icon">▶</span> See how it works</a></div>
        <div className="rl-hero-proof"><div className="rl-avatar-spark"><Zap size={17}/></div><div><strong>Physical-world AI</strong><span>Observe · Understand · Repair · Envision</span></div></div>
      </div>
      <div className="rl-hero-art"><Orb/></div>
      <div className="rl-hero-index">REALITY LAB / EXPERIMENT 001 <span>SCROLL TO EXPLORE ↓</span></div>
    </section>
    <section className="rl-model-strip" aria-label="Powered by Meta models"><span className="rl-strip-caption">THE INTELLIGENCE BEHIND THE INTERFACE</span><div><span className="rl-model-symbol">◈</span> Muse Spark 1.3</div><span className="rl-separator"/><div><span className="rl-model-symbol">⬡</span> SAM 3.1</div><span className="rl-separator"/><div><span className="rl-model-symbol">✦</span> Muse Image 1.0</div><span className="rl-strip-end">THREE MODELS. ONE EXPERIENCE.</span></section>
    <section className="rl-studio-section" id="studio" ref={workRef}>
      <div className="rl-section-heading"><div><div className="rl-kicker"><span className="rl-kicker-line"/> THE REPAIR STUDIO / 01</div><h2>Your fix starts <em>here.</em></h2><p>Take a picture of the problem. We&apos;ll help you figure out the next move.</p></div><span className="rl-sec-index">01 — 04 <ArrowDown size={18}/></span></div>
      <div className="rl-workspace">
        <div className="rl-work-main">
          <div className="rl-work-header"><span><span className="rl-pulse"/> VISUAL INPUT <small>01 / CAPTURE</small></span><span className="rl-work-status"><LockKeyhole size={13}/> NO ACCOUNT REQUIRED</span></div>
          <div className={"rl-drop"+(photo?" rl-drop-filled":"")}
            onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();loadFile(e.dataTransfer.files[0]);}}>
            {photo?<div className="rl-photo-preview"><img src={photo} alt="Photo of object to analyze"/><button className="rl-remove-photo" onClick={()=>{setPhoto(null);setResult(null);setFilename("");}} aria-label="Remove photo"><X size={17}/></button><div className="rl-photo-filename"><CheckCircle2 size={15}/> {filename}</div></div>
            :<><div className="rl-drop-art"><span className="rl-drop-grid"/><div className="rl-upload-icon"><ScanLine size={34} strokeWidth={1.3}/><span>+</span></div><i className="rl-drop-sweep"/></div>
            <div className="rl-drop-title">Show us what&apos;s wrong.</div><p>Drop your photo here, paste an image, or use your camera.</p>
            <button className="rl-select-photo" onClick={()=>inputRef.current?.click()}><UploadCloud size={17}/> Choose a photo <ArrowUpRight size={15}/></button><div className="rl-drop-hint">JPEG, PNG, WEBP <span>·</span> MAX 5MB</div></>}
            <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" capture={undefined} className="rl-visually-hidden" aria-label="Choose image" onChange={e=>{loadFile(e.target.files?.[0]);e.currentTarget.value="";}}/>
          </div>
          <div className="rl-input-bottom"><div className="rl-note-row"><div className="rl-note-symbol"><Sparkles size={17}/></div><input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional: tell us what you noticed..." maxLength={350} aria-label="Description of problem"/><button className={recording?"rl-mic rl-mic-on":"rl-mic"} onClick={toggleMic} aria-label={recording?"Stop recording":"Record voice description"} title="Record voice note"><Mic size={19}/></button></div>
            <div className="rl-work-controls"><label className="rl-lang-select"><Globe2 size={15}/> <select value={language} onChange={e=>setLanguage(e.target.value)} aria-label="Response language"><option value="en">English</option><option value="hi">हिन्दी</option><option value="ur">اردو</option></select></label><span className="rl-privacy"><ShieldCheck size={15}/> Photos aren&apos;t stored by this app</span></div>
          </div>
          {voiceError&&<div className="rl-inline-error" role="alert">{voiceError}</div>}
          <button className="rl-analyze-btn" disabled={!photo||busy} onClick={run}>{busy?<><Loader2 className="rl-spin" size={19}/> Analyzing your photo...</>:<><span className="rl-btn-spark">✳</span> Find my fix <ArrowRight size={19}/></>}</button>
          {error&&<div className="rl-error" role="alert"><AlertTriangle size={17}/>{error}</div>}
        </div>
        <aside className="rl-work-side"><div className="rl-side-label"><span>◉</span> HOW IT THINKS <small>FOUR STAGES</small></div><div className="rl-stage-list">{stages.map(([name,model],i)=><div className={"rl-stage"+(busy&&stage===i?" rl-stage-active":"")+(busy&&stage>i?" rl-stage-done":"")} key={name}><span className="rl-stage-icon"><StageIcon n={i}/></span><div><strong>{name}</strong><small>{model}</small></div><span className="rl-stage-number">0{i+1}</span></div>)}</div><div className="rl-side-quote"><span>“</span><p>Good technology doesn&apos;t just understand your problem. It helps you do something about it.</p><div>THE REALITYLAB PHILOSOPHY</div></div></aside>
      </div>
      {result&&<div className="rl-result" aria-live="polite">
        <div className="rl-result-top"><div><div className="rl-kicker"><span className="rl-kicker-line"/> {demo?"EXAMPLE WALKTHROUGH":"YOUR REPAIR REPORT"}</div><h3>{demo?"Here’s how it works.":"We found a path forward."}</h3><p>{demo?"Illustrative sample. Upload a real photo to run the live Meta pipeline.":"AI-assisted guidance — inspect and verify before acting."}</p></div><button className="rl-quiet-button" onClick={()=>{setResult(null);setDemo(null);setPhoto(null);setDone([]);}}><RotateCcw size={15}/> Start again</button></div>
        <div className="rl-result-grid">
          <div className="rl-panel rl-image-panel">
            <div className="rl-panel-header"><span><Eye size={15}/> VISUAL EVIDENCE</span>{!demo&&result.grounding.found&&<button className="rl-mini-toggle" onClick={()=>setMask(!mask)}>{mask?"Hide":"Show"} SAM region</button>}</div>
            <div className="rl-compare" onPointerMove={e=>{if(e.buttons===1){const b=e.currentTarget.getBoundingClientRect();setCompare(Math.max(0,Math.min(100,(e.clientX-b.left)/b.width*100)));}}}>
              {photo?<><img className="rl-compare-before" src={photo} alt="Original uploaded scene"/>{result.after&&<div className="rl-after-clip" style={{clipPath:"inset(0 0 0 "+compare+"%)"}}><img src={result.after} alt="AI illustrative after concept"/></div>}</>:
                <div className="rl-demo-picture rl-demo-before"><span>{demo?.icon||"✦"}</span><div>{demo?.name}</div></div>}
              {!photo&&<div className="rl-demo-after" style={{clipPath:"inset(0 0 0 "+compare+"%)"}}><span>{demo?.icon||"✦"}</span><div>CONCEPT</div></div>}
              {photo&&mask&&result.grounding.box&&<div className="rl-sam-box" style={{left:result.grounding.box.left+"%",top:result.grounding.box.top+"%",width:result.grounding.box.width+"%",height:result.grounding.box.height+"%"}}><span>SAM 3.1 REGION</span></div>}
              {(!!result.after||!!demo)&&<div className="rl-compare-handle" style={{left:compare+"%"}}><MoveHorizontal size={19}/></div>}
              <div className="rl-compare-tag rl-tag-before">BEFORE</div><div className="rl-compare-tag rl-tag-after">{result.after?"AI CONCEPT":"ILLUSTRATIVE"}</div>
            </div>
            {(!!result.after||!!demo)&&<input type="range" min="0" max="100" className="rl-scrubber" aria-label="Before and after comparison" value={compare} onChange={e=>setCompare(Number(e.target.value))}/>}
            <div className="rl-visual-foot">{result.grounding.found?"SAM object region located":"No verified segmentation region"} <span>•</span> {result.after?"After-image is an AI prediction":result.afterError||"Demonstration visual only"}</div>
          </div>
          <div className="rl-panel rl-diagnosis-panel"><div className="rl-panel-header"><span><ScanLine size={15}/> DIAGNOSIS</span><span className={"rl-urgency rl-urgency-"+result.diagnosis.urgency}>{result.diagnosis.urgency.toUpperCase()} URGENCY</span></div><div className="rl-diagnosis-body"><div className="rl-diagnosis-label">POSSIBLE ISSUE IDENTIFIED</div><h4>{result.diagnosis.issue}</h4><div className="rl-diagnosis-rule"/><span className="rl-diagnosis-label">WHAT MIGHT BE CAUSING IT</span><p>{result.diagnosis.cause}</p><span className="rl-diagnosis-label">PHOTO EVIDENCE</span><p>{result.diagnosis.evidence}</p>{result.diagnosis.dangerous&&<div className="rl-danger"><AlertTriangle size={18}/><span>Potential hazard. Do not attempt invasive DIY repair; consult a qualified professional.</span></div>}<div className="rl-diagnosis-notice"><Info size={16}/>{result.diagnosis.safety}</div></div></div>
        </div>
        <div className="rl-steps-head"><div><div className="rl-kicker"><span className="rl-kicker-line"/> YOUR NEXT MOVES</div><h3>Three steps. <em>One way forward.</em></h3></div><button onClick={copyPlan} className="rl-quiet-button">{copied?<Check size={16}/>:<Copy size={16}/>} {copied?"Copied":"Copy guide"}</button></div>
        <div className="rl-steps-grid">{result.diagnosis.steps.map((s,i)=><button className={"rl-step-card"+(done.includes(i)?" rl-step-complete":"")} key={i} onClick={()=>setDone(v=>v.includes(i)?v.filter(j=>j!==i):[...v,i])} aria-pressed={done.includes(i)}><div className="rl-step-top"><span className="rl-step-index">0{i+1}</span><span className="rl-step-check">{done.includes(i)?<Check size={17}/>:<span/>}</span></div><h4>{s.title}</h4><p>{s.detail}</p><div className="rl-step-foot"><span><Clock3 size={14}/> ~{s.minutes} min</span><span>{done.includes(i)?"MARKED DONE":"MARK COMPLETE"} <ChevronRight size={13}/></span></div></button>)}</div>
        <div className="rl-result-disclaimer"><ShieldCheck size={16}/>{result.disclaimer}</div>
      </div>}
    </section>
    <section className="rl-examples" id="examples"><div className="rl-section-heading"><div><div className="rl-kicker"><span className="rl-kicker-line"/> MADE FOR THE MESSY REAL WORLD / 02</div><h2>Life happens. <em>We&apos;re here.</em></h2><p>From a dripping tap to a mystery appliance code. Pick an example to explore.</p></div><div className="rl-examples-note">6 USE CASES <ArrowUpRight size={18}/></div></div><div className="rl-example-grid">{examples.map((x,i)=><button key={x.name} className={"rl-example-card rl-example-"+x.color} onClick={()=>chooseDemo(x)}><div className="rl-example-top"><span>{x.tag}</span><ArrowUpRight size={18}/></div><div className="rl-example-illustration"><div className="rl-example-halo"/><span>{x.icon}</span><div className="rl-example-number">0{i+1}</div></div><div className="rl-example-bottom"><div><h3>{x.name}</h3><p>{x.subtitle}</p></div><span className="rl-example-arrow"><ArrowRight size={17}/></span></div></button>)}</div><div className="rl-examples-foot">No categories to choose in the real flow. <strong>Just show us.</strong><span>← SELECT ANY EXAMPLE ABOVE</span></div></section>
    <section className="rl-how" id="how"><div className="rl-section-heading"><div><div className="rl-kicker"><span className="rl-kicker-line"/> UNDER THE HOOD / 03</div><h2>It&apos;s a little bit <em>magic.</em><br/>And a lot of science.</h2></div></div><div className="rl-how-grid"><div className="rl-how-large"><div className="rl-how-orbit">✳</div><span className="rl-how-index">01 / UNDERSTAND</span><h3>A picture is worth<br/><em>a thousand clues.</em></h3><p>Muse Spark interprets visible evidence. SAM 3.1 locates the object. The system keeps observations separate from possibilities.</p><span className="rl-how-bottom">PHOTO → VISUAL GROUNDING <ArrowUpRight size={16}/></span></div><div className="rl-how-small"><span className="rl-how-index">02 / ACT</span><span className="rl-how-glyph">⌘</span><h3>Less searching.<br/>More solving.</h3><p>Three approachable steps, suitable tools and clear safety limits.</p><span className="rl-how-bottom">DIAGNOSIS → GUIDANCE <ArrowUpRight size={16}/></span></div><div className="rl-how-small rl-how-rose"><span className="rl-how-index">03 / ENVISION</span><span className="rl-how-glyph">◌</span><h3>See what<br/>could be.</h3><p>Muse Image edits your actual photo into a possible after-state. It's a visualization, not a guarantee.</p><span className="rl-how-bottom">BEFORE → POSSIBILITY <ArrowUpRight size={16}/></span></div></div></section>
    <section className="rl-bottom-cta"><div className="rl-bottom-orb">◉</div><div className="rl-bottom-label">YOUR WORLD, REIMAGINED</div><h2>Something broken?<br/><em>Let&apos;s make progress.</em></h2><a href="#studio" className="rl-button rl-button-primary">Open the repair studio <ArrowUpRight size={18}/></a><p>Free to explore · No sign-up · Real problems, practical steps</p></section>
    <footer className="rl-footer"><a className="rl-brand" href="/"><span className="rl-brand-mark"><span/><span/><span/></span><span>reality<span className="rl-brand-light">lab</span><span className="rl-brand-star">✳</span></span></a><div>MADE IN KASHMIR <span>✳</span> BUILT FOR YOUR WORLD</div><div>META GLOBAL AI DEVELOPER HACKATHON 2026</div></footer>
  </main>;
}

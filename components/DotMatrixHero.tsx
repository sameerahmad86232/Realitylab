"use client";

import { useRef, useState } from "react";
import { Aperture, ArrowDown, ArrowUpRight, Camera, Focus, Play, Plus, ShieldCheck } from "lucide-react";

const details = [
  { name: "The structure", label: "01 / STRUCTURE", copy: "An enclosure gives a mechanism its shape. What is visible is only the beginning of the story.", x: "81%", y: "35%" },
  { name: "The connection", label: "02 / CONNECTION", copy: "Parts work together. Understanding a connection starts with separating what you see from what you infer.", x: "29%", y: "60%" },
  { name: "The principle", label: "03 / PRINCIPLE", copy: "A familiar object can reveal an unfamiliar idea. Explore the principle without assuming how your own object is built.", x: "60%", y: "48%" },
] as const;

export default function DotMatrixHero({ onStart, onDemo, onResume }: { onStart: () => void; onDemo: () => void; onResume?: () => void }) {
  const [selected, setSelected] = useState(0);
  const stage = useRef<HTMLElement>(null);
  const detail = details[selected];
  function move(event: React.PointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--look-x", `${((event.clientX - rect.left) / rect.width - .5) * 8}px`);
    event.currentTarget.style.setProperty("--look-y", `${((event.clientY - rect.top) / rect.height - .5) * 6}px`);
  }
  function reset() { stage.current?.style.setProperty("--look-x", "0px"); stage.current?.style.setProperty("--look-y", "0px"); }
  return <section className="matrix-hero premium-hero" aria-labelledby="matrix-title">
    <nav className="premium-nav" aria-label="Landing navigation">
      <button className="premium-brand" aria-label="RealityLab home" onClick={() => window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" })}><Aperture size={24}/><span>Reality<span>Lab</span></span></button>
      <div className="premium-nav-links"><a href="#how-it-works">How it works</a><a href="#collection">The collection</a><button onClick={onDemo}>Interactive demo</button></div>
      <button className="premium-nav-cta" onClick={onStart}>Start diagnosis <ArrowUpRight size={15}/></button>
    </nav>
    <div className="premium-hero-grid">
      <div className="premium-copy">
        <p className="premium-kicker"><span/> A CLOSER LOOK AT YOUR WORLD</p>
        <h1 id="matrix-title"><span>See the problem.</span>Find your<br/><em>next move.</em></h1>
        <p className="premium-description">A photo. A different perspective. <br/>Explore visible evidence, understand possible causes, and find a more informed next step.</p>
        <div className="premium-actions"><button className="primary" onClick={onStart}><Camera size={17}/>Start diagnosing<ArrowUpRight size={17}/></button><button className="premium-demo" onClick={onDemo}><span><Play size={13} fill="currentColor"/></span>Explore interactive demo →</button></div>
        {onResume && <button className="premium-resume" onClick={onResume}>Resume your exploration <ArrowUpRight size={14}/></button>}
        <p className="premium-privacy"><ShieldCheck size={14}/>Your photo. Your consent. Your next step.</p>
      </div>
      <figure className="mechanism-stage" ref={stage} onPointerMove={move} onPointerLeave={reset} aria-label="Illustrative mechanism concept">
        <div className="mechanism-ruler"><span><Focus size={13}/> EXPLORATION NO. 001</span><span>FORM / FUNCTION</span></div>
        <div className="mechanism-image-wrap"><img className="matrix-canvas mechanism-image" src="/art/mechanism-study-v2.webp" alt="AI-generated concept illustration of an exploded electric motor with brushed metal housing and copper windings; not a reconstruction or technical specification" width={1600} height={900} fetchPriority="high"/>
          {details.map((item, index) => <button key={item.name} className={`mechanism-point ${selected === index ? "selected" : ""}`} style={{ left: item.x, top: item.y }} onClick={() => setSelected(index)} aria-label={`Explore ${item.name.toLowerCase()}`} aria-pressed={selected === index}><Plus size={13}/></button>)}
        </div>
        <figcaption className="mechanism-caption"><div className="mechanism-caption-head"><span>{detail.label}</span><div aria-label="Concept detail selection">{details.map((item,index)=><button key={item.name} aria-label={`Show ${item.name.toLowerCase()}`} aria-pressed={selected===index} onClick={()=>setSelected(index)}><span/></button>)}</div></div><p aria-live="polite">{detail.copy}</p><small>AI-generated concept artwork · Not a scan or repair instruction</small></figcaption>
        <span className="mechanism-coordinate" aria-hidden="true">RL—001 / 3 PARTS OF A BIGGER PICTURE</span>
      </figure>
    </div>
    <div className="premium-hero-footer"><a href="#collection"><ArrowDown size={14}/>Take a closer look</a><p>Built around evidence.<span>Designed for curiosity.</span></p><span className="premium-edition">THE PHYSICAL WORLD, EXPLAINED.</span></div>
  </section>;
}

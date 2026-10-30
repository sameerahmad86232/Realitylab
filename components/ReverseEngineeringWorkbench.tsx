"use client";
import { useState } from "react";
import { Box, Check, ExternalLink, Hammer, ImagePlus, Info, Search } from "lucide-react";
import type { Analysis, ScanView } from "../lib/analysis";

type Route = "undecided" | "make" | "source";

export default function ReverseEngineeringWorkbench({
  scan,
  selected,
  onSelect,
}: {
  scan: ScanView;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const { analysis } = scan.result;
  const [routes, setRoutes] = useState<Record<string, Route>>({});
  const [images, setImages] = useState<Record<string,string>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const decided = Object.values(routes).filter((route) => route !== "undecided").length;
  const query = (part: string, intent: string) =>
    `https://duckduckgo.com/?q=${encodeURIComponent(`${analysis.object_name} ${part} ${intent}`)}`;
  async function illustrate(part: Analysis["components"][number]) {
    setBusy(part.id);setError("");
    try { const response=await fetch("/api/component-image",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({object_name:analysis.object_name,component_name:part.name,component_function:part.function,evidence_status:part.observed?"observed":"inferred",materials:part.material_candidates})});const body=await response.json();if(!response.ok||!body.image)throw Error(body.error?.message||"The illustration could not be created.");setImages(old=>({...old,[part.id]:body.image})); }
    catch(e){setError(e instanceof Error?e.message:"The illustration could not be created.");}finally{setBusy("");}
  }

  return (
    <section id="reverse-workbench" className="reverse-workbench" aria-labelledby="reverse-workbench-title">
      <header>
        <div>
          <p className="eyebrow">REVERSE-ENGINEERING WORKBENCH / 02</p>
          <h2 id="reverse-workbench-title">Turn the blueprint into a component plan.</h2>
          <p>Select what you would recreate and what you would source. Each card stays tied to the model’s evidence and uncertainty.</p>
        </div>
        <span>{decided} / {analysis.components.length} decisions</span>
      </header>
      <div className="reverse-boundary"><Info size={15}/><p>These are research leads, not verified specifications. Measure the real object before purchasing, fabricating or assembling anything. Search links open the web; RealityLab does not copy or endorse third-party images or listings.</p></div>
      <div className="component-workbench-grid">
        {analysis.components.map((part, index) => {
          const route = routes[part.id] || "undecided";
          return <article key={part.id} className={selected === part.id ? "selected" : ""}>
            <button className="component-technical-thumb" onClick={() => onSelect(part.id)} aria-label={`Inspect ${part.name}`}>
              {images[part.id] ? <img src={images[part.id]} alt={`AI-generated conceptual illustration of ${part.name}`} style={{display:"block",width:"100%",height:150,objectFit:"cover"}}/> : part.observed && part.image_index !== null && !scan.photos[part.image_index]?.omitted ? <img src={scan.photos[part.image_index].url} alt={`Source-photo detail for ${part.name}`} style={{display:"block",width:"100%",height:150,objectFit:"cover",objectPosition:part.marker ? `${part.marker.x*100}% ${part.marker.y*100}%` : "center"}}/> : <svg viewBox="0 0 240 150" role="img" aria-label={`Generated technical study for ${part.name}`}>
                <path d="M18 24H222V126H18Z M36 42H204V108H36Z"/>
                <circle cx="120" cy="75" r="28"/><path d="M48 75H92M148 75H192M120 30V47M120 103V120"/>
                <text x="120" y="80">{String(index + 1).padStart(2,"0")}</text>
              </svg>}
              <span>{images[part.id] ? "AI CONCEPT · NOT SOURCE EVIDENCE" : part.observed ? "SOURCE-PHOTO DETAIL" : "INFERRED TECHNICAL STUDY"}</span>
            </button>
            <div className="component-workbench-copy">
              <div className="component-card-heading"><span>{String(index + 1).padStart(2,"0")}</span><div><strong style={{display:"block",fontSize:16}}>{part.name}</strong><small>{part.confidence === "supported" ? "Evidence supported" : "Uncertain"}</small></div></div>
              <p>{part.function}</p>
              <dl>
                <div><dt>Possible material</dt><dd>{part.material_candidates.join(" / ") || "Measure and identify"}</dd></div>
                <div><dt>Verify first</dt><dd>Dimensions, interfaces, load and attachment method</dd></div>
              </dl>
              <div className="route-choices" role="group" aria-label={`Plan for ${part.name}`}>
                <button aria-pressed={route === "make"} onClick={() => setRoutes(old => ({...old,[part.id]:route === "make" ? "undecided" : "make"}))}><Hammer size={14}/>{route === "make" && <Check size={12}/>}Recreate</button>
                <button aria-pressed={route === "source"} onClick={() => setRoutes(old => ({...old,[part.id]:route === "source" ? "undecided" : "source"}))}><Box size={14}/>{route === "source" && <Check size={12}/>}Source</button>
              </div>
              <button className="component-generate" disabled={!!busy} onClick={()=>illustrate(part)}><ImagePlus size={14}/>{busy===part.id?"Generating concept…":images[part.id]?"Regenerate AI concept":"Generate AI component concept"}</button>
              <div className="component-research-links">
                <a href={query(part.name,"replacement part dimensions")} target="_blank" rel="noreferrer"><Search size={12}/>Find references<ExternalLink size={11}/></a>
                <a href={query(part.name,"DIY fabrication tutorial")} target="_blank" rel="noreferrer"><Hammer size={12}/>Fabrication research<ExternalLink size={11}/></a>
              </div>
            </div>
          </article>;
        })}
      </div>
      {error&&<p className="message" role="alert">{error}</p>}
    </section>
  );
}

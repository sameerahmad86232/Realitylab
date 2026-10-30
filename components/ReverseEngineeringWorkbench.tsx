"use client";
import { useState } from "react";
import { Box, Check, ExternalLink, Hammer, Info, Search } from "lucide-react";
import type { ScanView } from "../lib/analysis";

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
  const decided = Object.values(routes).filter((route) => route !== "undecided").length;
  const query = (part: string, intent: string) =>
    `https://duckduckgo.com/?q=${encodeURIComponent(`${analysis.object_name} ${part} ${intent}`)}`;

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
              {part.observed && part.image_index !== null && !scan.photos[part.image_index]?.omitted ? <img src={scan.photos[part.image_index].url} alt={`Source-photo detail for ${part.name}`} style={{display:"block",width:"100%",height:150,objectFit:"cover",objectPosition:part.marker ? `${part.marker.x*100}% ${part.marker.y*100}%` : "center"}}/> : <svg viewBox="0 0 240 150" role="img" aria-label={`Generated technical study for ${part.name}`}>
                <path d="M18 24H222V126H18Z M36 42H204V108H36Z"/>
                <circle cx="120" cy="75" r="28"/><path d="M48 75H92M148 75H192M120 30V47M120 103V120"/>
                <text x="120" y="80">{String(index + 1).padStart(2,"0")}</text>
              </svg>}
              <span>{part.observed ? "SOURCE-PHOTO DETAIL" : "INFERRED TECHNICAL STUDY"}</span>
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
              <div className="component-research-links">
                <a href={query(part.name,"replacement part dimensions")} target="_blank" rel="noreferrer"><Search size={12}/>Find references<ExternalLink size={11}/></a>
                <a href={query(part.name,"DIY fabrication tutorial")} target="_blank" rel="noreferrer"><Hammer size={12}/>Fabrication research<ExternalLink size={11}/></a>
              </div>
            </div>
          </article>;
        })}
      </div>
    </section>
  );
}

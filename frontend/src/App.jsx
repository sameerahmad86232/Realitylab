import { useState } from "react";
import {
  ArrowUpRight,
  ScanLine,
  Layers3,
  MoveUpRight,
  Plus,
  Minus,
  Crosshair,
  Box,
  Menu,
  X,
  Check,
  RotateCcw,
  Camera,
  Aperture,
  Compass,
  ArrowDown,
  ShieldCheck,
  Eye,
  Settings2,
} from "lucide-react";
import carImage from "./assets/reality-gt.png";
import carPlanImage from "./assets/reality-gt-plan.png";
import StudioShowcase from "./components/StudioShowcase";
import ShaderAtmosphere from "./components/ShaderAtmosphere";
import UploadZone from "./components/UploadZone";
import ActionArea from "./components/ActionArea";
import ExperimentStudio from "./features/exploration/ExperimentStudio";
import ResultsSection from "./components/ResultsSection";
import { sampleBlueprintData } from "./data/sampleBlueprintData";

function carDrawing(exploded, overhead) {
  return (
    <div className={`car-art ${exploded ? "exploded" : ""}`}>
      <img
        className="car-photograph"
        src={overhead ? carPlanImage : carImage}
        alt={
          overhead
            ? "AI-generated overhead concept study of the original Reality GT coupe"
            : "Original silver Reality GT electric coupe concept in a softly lit forest-green studio"
        }
        fetchPriority="high"
      />
      <svg
        className="car-wireframe"
        viewBox="0 0 800 440"
        fill="none"
        aria-label="Illustrative side-view automotive concept schematic"
      >
        <g stroke="#cfeeac" strokeWidth="1.2" strokeLinejoin="round">
          <path d="M92 286L110 247L203 222L293 153Q317 137 370 137H471Q506 140 543 177L596 211L688 236L716 270L710 301H666Q658 244 615 244Q568 244 562 301H252Q247 244 198 244Q151 244 146 301H97Z" />
          <path d="M221 219L305 157L359 153V212Z M375 153H469L535 210H375Z M269 233L548 232L553 285H270Z" />
          <path
            d="M378 231V283M109 255L159 249M642 231L694 250M286 301H552"
            strokeDasharray="4 4"
          />
          <circle cx="198" cy="299" r="43" />
          <circle cx="198" cy="299" r="28" />
          <circle cx="615" cy="299" r="43" />
          <circle cx="615" cy="299" r="28" />
          <path d="M198 271V327M170 299H226M615 271V327M587 299H643" />
        </g>
        <g
          className="car-internal-layer"
          stroke="#cfeeac"
          strokeDasharray="4 5"
        >
          <path d="M276 344H550V368H276Z" fill="#cfeeac0d" />
          <path d="M290 349V363M320 349V363M350 349V363M380 349V363M410 349V363M440 349V363M470 349V363M500 349V363M530 349V363" />
          <path d="M280 315V340M550 315V340" />
        </g>
        <g stroke="#cfeeac80" strokeWidth=".6">
          <path d="M85 390H720M85 382V398M720 382V398M750 137V342M742 137H758M742 342H758" />
        </g>
        <text
          x="400"
          y="413"
          textAnchor="middle"
          fill="#b5ca9c"
          fontSize="8"
          fontFamily="monospace"
        >
          CONCEPTUAL SCHEMATIC / NOT TO SCALE
        </text>
      </svg>
      <span className="car-image-credit">
        ORIGINAL AI-GENERATED DESIGN STUDY
      </span>
    </div>
  );
}

export default function App() {
  const [studioMode, setStudioMode] = useState("mechanism");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [exploded, setExploded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [menu, setMenu] = useState(false);
  const [part, setPart] = useState(0);
  const [wireframe, setWireframe] = useState(false);
  const [overhead, setOverhead] = useState(false);
  const components = [
    {
      name: "Body architecture",
      code: "01 / FORM & STRUCTURE",
      detail:
        "Sculptural surfaces. A flowing roofline. Explore the exterior design of an original electric grand tourer concept.",
      value: "GT",
      unit: "ORIGINAL DESIGN STUDY",
    },
    {
      name: "Wheel assemblies",
      code: "02 / MOTION & CONTACT",
      detail:
        "Precision wheel forms anchor the silhouette. Tire specifications and performance remain unverified in this concept study.",
      value: "4×",
      unit: "WHEEL POSITIONS",
    },
    {
      name: "Energy platform",
      code: "03 / INTERNAL HYPOTHESIS",
      detail:
        "An underfloor battery is a possible packaging approach. This is an illustrative hypothesis, not a view inside a working vehicle.",
      value: "EV",
      unit: "CONCEPT ARCHITECTURE",
    },
  ];
  const loadSample = () => {
    setGenerated(false);
    const preview = carImage;
    setFiles([
      {
        id: "sample-1",
        name: "reality_gt_studio.png",
        size: "142 KB",
        preview,
        isSample: true,
      },
      {
        id: "sample-2",
        name: "reality_gt_overhead.png",
        size: "186 KB",
        preview: carPlanImage,
        isSample: true,
      },
    ]);
  };
  const demo = () => {
    setStudioMode("sample");
    loadSample();
    document.getElementById("studio").scrollIntoView({ behavior: "smooth" });
  };
  const generate = () => {
    if (!files.length) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setGenerated(true);
    }, 2000);
  };
  return (
    <div className="site-shell">
      <header className="site-header">
        <a href="#" className="wordmark">
          <ScanLine size={26} />
          realitylab<span>LAB / 01</span>
        </a>
        <nav className={menu ? "nav-links open" : "nav-links"}>
          <a href="#process" onClick={() => setMenu(false)}>
            How it works
          </a>
          <a href="#studio" onClick={() => setMenu(false)}>
            The studio
          </a>
          <a href="#about" onClick={() => setMenu(false)}>
            The idea <ArrowUpRight size={13} />
          </a>
        </nav>
        <a className="nav-cta" href="#studio">
          Start exploring <ArrowUpRight size={16} />
        </a>
        <button
          className="mobile-menu"
          aria-label="Toggle navigation"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main>
        <section className="hero hero-premiere">
          <ShaderAtmosphere />
          <div className="hero-copy">
            <div className="hackathon-pill">
              <span className="meta-symbol">∞</span> AN EXPERIMENT IN EVERYDAY
              INGENUITY <span>VOL. 001</span>
            </div>
            <div className="eyebrow">
              <span className="live-dot" /> THE WORLD IS YOUR WORKSHOP
            </div>
            <h1>
              See beyond
              <br />
              <span className="serif-accent">the ordinary.</span>
            </h1>
            <p>
              Extraordinary ideas hide in ordinary things. Explore the parts,
              uncover the possibilities, and turn your curiosity into something
              you can build.
            </p>
            <div className="hero-actions">
              <a className="button-lime" href="#studio">
                Enter the studio <ArrowUpRight size={19} />
              </a>
              <button className="text-button" onClick={demo}>
                <span className="play-icon">▶</span> Try the sample demo
              </button>
            </div>
            <div className="hero-note">
              <span className="mini-icons">
                <ScanLine size={14} />
                <Layers3 size={14} />
                <Box size={14} />
              </span>{" "}
              Made for curious minds. Designed for hands-on discovery.
            </div>
          </div>
          <div
            className={`hero-visual premiere-stage ${wireframe ? "wireframe-mode" : ""}`}
          >
            <span className="specimen-watermark" aria-hidden="true">
              004
            </span>
            <div className="orbital-glow" />
            <div className="visual-top">
              <span>
                <span className="live-dot" /> OBJECT EXPLORER
              </span>
              <span>REALITY GT / DESIGN STUDY</span>
            </div>
            <div className="drawing-container">
              <span className="canvas-badge">
                <Aperture size={13} /> THE ANATOMY OF MOTION
              </span>
              <div className="scan-sweep" />
              <span className="viewer-coordinate">
                ORIGINAL DESIGN
                <br />
                AI-GENERATED
                <br />
                CONCEPT STUDY
              </span>
              <div
                className="drawing-scale"
                style={{ transform: `scale(${zoom})` }}
              >
                {carDrawing(exploded, overhead)}
              </div>
              <div className="floating-label">
                <span className="live-dot" />{" "}
                {exploded
                  ? "CONCEPT VIEW / POSSIBLE BATTERY PACKAGING"
                  : "DESIGN STUDY / EXPLORE THE COMPONENTS"}
              </div>
            </div>
            <div className="component-tabs" aria-label="Explore components">
              {components.map((item, i) => (
                <button
                  key={item.code}
                  aria-pressed={part === i}
                  className={part === i ? "selected" : ""}
                  onClick={() => setPart(i)}
                >
                  <span>0{i + 1}</span>
                  {item.name}
                  <Plus size={12} />
                </button>
              ))}
            </div>
            <div className="part-inspector" aria-live="polite">
              <div>
                <span className="micro-label">{components[part].code}</span>
                <p>{components[part].detail}</p>
              </div>
              <div className="part-value">
                {components[part].value}
                <span>{components[part].unit}</span>
              </div>
            </div>
            <div className="visual-bottom">
              <div>
                <span className="micro-label">CURRENT EXPLORATION</span>
                <h3>Reality GT / Electric grand tourer</h3>
                <p>
                  SAMPLE SPECIMEN <span>·</span> INTERACTIVE VIEW
                </p>
              </div>
              <button
                className="round-button"
                aria-label="Explore car concept demo"
                onClick={demo}
              >
                <ArrowUpRight />
              </button>
            </div>
            <div className="viewer-toolbar">
              <button
                className={!exploded ? "active" : ""}
                onClick={() => setExploded(false)}
              >
                <Box size={13} /> Assembled
              </button>
              <button
                className={exploded ? "active" : ""}
                onClick={() => setExploded(true)}
              >
                <Layers3 size={13} /> Concept layers
              </button>
              <button
                className={wireframe ? "active" : ""}
                aria-pressed={wireframe}
                onClick={() => setWireframe((w) => !w)}
              >
                <ScanLine size={13} /> Wireframe
              </button>
              <button
                className={overhead ? "active" : ""}
                aria-pressed={overhead}
                onClick={() => {
                  setOverhead((v) => !v);
                  setWireframe(false);
                  setExploded(false);
                }}
              >
                <Eye size={13} /> Overhead
              </button>
              <span />
              <button
                aria-label="Zoom out"
                onClick={() => setZoom(Math.max(0.75, zoom - 0.1))}
              >
                <Minus size={15} />
              </button>
              <button
                aria-label="Zoom in"
                onClick={() => setZoom(Math.min(1.3, zoom + 0.1))}
              >
                <Plus size={15} />
              </button>
              <button
                aria-label="Reset view"
                onClick={() => {
                  setZoom(1);
                  setExploded(false);
                  setWireframe(false);
                  setOverhead(false);
                }}
              >
                <RotateCcw size={13} />
              </button>
            </div>
          </div>
        </section>
        <div className="explore-cue">
          <span>LESS SCROLLING. MORE DISCOVERING.</span>
          <a href="#process" aria-label="Discover how RealityLab works">
            <ArrowDown size={16} />
          </a>
          <span>DESIGNED FOR THE NATURALLY CURIOUS</span>
        </div>
        <div className="mission-strip">
          <span>A WORKSPACE FOR WONDER.</span>
          <p>
            The makers. The tinkerers. The <em>“how does that work?”</em>{" "}
            people.
          </p>
          <div className="strip-tag">
            <Crosshair size={15} /> LOOK CLOSER.
          </div>
        </div>
        <section className="process-section" id="process">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                01 / A LITTLE CURIOSITY GOES A LONG WAY
              </span>
              <h2>
                Every object has a story.
                <br />
                <span>Let’s open it.</span>
              </h2>
            </div>
            <p>
              No engineering degree required.
              <br />
              Just an object and a question.
            </p>
          </div>
          <div className="process-grid">
            {[
              {
                n: "01",
                icon: ScanLine,
                title: "Start with a spark.",
                text: "Pick something that makes you curious. Upload up to three photos from different angles.",
                tag: "YOUR PERSPECTIVE",
              },
              {
                n: "02",
                icon: Layers3,
                title: "Connect the dots.",
                text: "Explore an interactive blueprint. See how visible parts connect and what might be beneath the surface.",
                tag: "A NEW UNDERSTANDING",
              },
              {
                n: "03",
                icon: Box,
                title: "Follow the possibility.",
                text: "Find accessible materials and follow a build guide to turn your new understanding into a hands-on project.",
                tag: "ENDLESS POSSIBILITIES",
              },
            ].map(({ n, icon: Icon, title, text, tag }) => (
              <article className="process-card" key={n} data-step={n}>
                <div className="card-top">
                  <Icon size={25} />
                  <span>{n} /</span>
                </div>
                <div
                  className={`process-illustration illustration-${n}`}
                  aria-hidden="true"
                >
                  {n === "01" ? (
                    <>
                      <span className="capture-corner tl" />
                      <span className="capture-corner tr" />
                      <ScanLine size={55} />
                      <span className="capture-corner bl" />
                      <span className="capture-corner br" />
                      <small>OBJECT CAPTURED</small>
                    </>
                  ) : n === "02" ? (
                    <>
                      <div className="layer layer-one" />
                      <div className="layer layer-two" />
                      <div className="layer layer-three" />
                      <span className="layer-dot" />
                    </>
                  ) : (
                    <>
                      <div className="build-outline">
                        <Box size={44} />
                      </div>
                      <span className="build-plus">+</span>
                      <div className="build-result">
                        <Check size={23} />
                      </div>
                      <small>IDEA → REALITY</small>
                    </>
                  )}
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className="card-tag">
                  {tag}
                  <ArrowUpRight size={15} />
                </div>
              </article>
            ))}
          </div>
        </section>
        <StudioShowcase/>
        <section className="studio-section" id="studio">
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <span className="live-dot" /> 02 / YOUR CURIOSITY STARTS HERE
              </span>
              <h2>
                Your next <span>“what if?”</span>
              </h2>
            </div>
            <span className="prototype-badge">
              PREDICT · TEST · COMPARE <span>↗</span>
            </span>
          </div>
          <div className="studio-caption">
            <p>An open desk. A fresh perspective. A place to begin.</p>
            <span>
              Explore your own objects, run a manual experiment, or open the car
              design study.
            </span>
          </div>
          <div
            className="studio-mode-tabs"
            role="tablist"
            aria-label="Studio mode"
          >
            <button
              id="mechanism-tab"
              role="tab"
              aria-selected={studioMode === "mechanism"}
              aria-controls="mechanism-panel"
              onClick={() => setStudioMode("mechanism")}
            >
              <Settings2 size={15} /> Object explorer{" "}
              <span>LIVE & MANUAL TOOLS</span>
            </button>
            <button
              id="sample-tab"
              role="tab"
              aria-selected={studioMode === "sample"}
              aria-controls="sample-panel"
              onClick={() => setStudioMode("sample")}
            >
              <Box size={15} /> Car concept sample <span>CURATED</span>
            </button>
          </div>
          <div
            id="mechanism-panel"
            role="tabpanel"
            aria-labelledby="mechanism-tab"
            hidden={studioMode !== "mechanism"}
          >
            <ExperimentStudio />
          </div>
          <div
            id="sample-panel"
            role="tabpanel"
            aria-labelledby="sample-tab"
            hidden={studioMode !== "sample"}
          >
            <div className="studio-layout">
              <aside className="studio-sidebar">
                <div className="sidebar-heading">
                  <Compass size={19} />
                  <span>YOUR WORKSPACE</span>
                </div>
                <div className="studio-progress">
                  <div className="current">
                    <span>01</span>
                    <div>
                      <strong>Capture</strong>
                      <small>A new perspective starts here</small>
                    </div>
                    <span className="step-dot" />
                  </div>
                  <div className={generated ? "current" : ""}>
                    <span>02</span>
                    <div>
                      <strong>Discover</strong>
                      <small>Explore the blueprint</small>
                    </div>
                  </div>
                  <div>
                    <span>03</span>
                    <div>
                      <strong>Create</strong>
                      <small>Take the next step</small>
                    </div>
                  </div>
                </div>
                <div className="capture-tip">
                  <Camera size={23} />
                  <h3>A little perspective helps.</h3>
                  <p>
                    Use clear light and a simple background. Different angles
                    tell a better story.
                  </p>
                  <div className="angle-sketch" aria-hidden="true">
                    <div />
                    <span>↗</span>
                    <div />
                    <span>↗</span>
                    <div />
                  </div>
                  <span>FRONT / SIDE / ABOVE</span>
                </div>
                <div className="sidebar-foot">
                  <ShieldCheck size={14} /> Private by design.
                  <br />
                  Your photos stay in this browser.
                </div>
              </aside>
              <div className="studio-workbench">
                <div className="workbench-bar">
                  <span>
                    <ScanLine size={15} /> UNTITLED EXPLORATION
                  </span>
                  <span>
                    JPG, PNG, WEBP{" "}
                    <span className="muted">/ UP TO 3 PHOTOS</span>
                  </span>
                </div>
                <UploadZone
                  files={files}
                  setFiles={(next) => {
                    setGenerated(false);
                    setFiles(next);
                  }}
                  onSelectSample={loadSample}
                />
                <ActionArea
                  hasFiles={files.length > 0}
                  isLoading={loading}
                  onGenerate={generate}
                  hasGenerated={generated}
                />
                <div className="privacy-note">
                  <Check size={13} /> Photos stay in your browser. No sign-up.
                  Just curiosity.
                </div>
              </div>
            </div>
            <ResultsSection
              blueprintData={generated ? sampleBlueprintData : null}
              isVisible={generated && studioMode === "sample"}
            />
          </div>
        </section>
        <section className="field-guide" aria-labelledby="field-guide-title">
          <div>
            <span className="eyebrow">A FEW FIELD NOTES</span>
            <h2 id="field-guide-title">
              Good questions.
              <br />
              <span>Clear answers.</span>
            </h2>
            <p>Every exploration starts with understanding what’s possible.</p>
          </div>
          <div className="field-questions">
            {[
              {
                q: "What can I explore right now?",
                a: "The object explorer supports many everyday object types with visible-part annotations and editable relationship maps. Manual gear, lever and pulley tools use your confirmed measurements. Unclear objects may need another angle or context. The car is a separate curated design study.",
              },
              {
                q: "Are the internal components verified?",
                a: "No. The sample separates visible features from illustrative internal hypotheses. Exact specifications and hidden mechanisms require physical inspection or testing.",
              },
              {
                q: "What happens to my photos?",
                a: "The car sample keeps photos in your browser. In the object explorer, choosing live analysis sends normalized photos and context to the configured inference provider after your consent. The app does not persist photos on the server.",
              },
            ].map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <Plus size={17} />
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="about-section" id="about">
          <div>
            <span className="eyebrow">THE IDEA BEHIND REALITYLAB</span>
            <h2>
              Everything starts
              <br />
              with <span>“I wonder.”</span>
            </h2>
          </div>
          <div>
            <p>
              We believe understanding how things work should be for everyone.
              RealityLab explores a future where a simple photo can become the
              first step toward learning, repairing, and creating.
            </p>
            <a href="#studio">
              Find your next discovery. <MoveUpRight size={21} />
            </a>
          </div>
          <span className="about-asterisk" aria-hidden="true">
            ✳
          </span>
        </section>
      </main>
      <footer className="site-footer">
        <a href="#" className="wordmark">
          <ScanLine size={22} />
          realitylab<span>LAB / 01</span>
        </a>
        <p>Independent minds. Shared possibilities. / Meta Hackathon 2026</p>
        <a href="#">
          Stay curious. <ArrowUpRight size={15} />
        </a>
      </footer>
    </div>
  );
}

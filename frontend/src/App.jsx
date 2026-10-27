import { useState, lazy, Suspense } from "react";
const CadWorkspace = lazy(() => import("./features/cad/CadWorkspace"));
import {
  ArrowUpRight,
  ScanLine,
  Layers3,
  MoveUpRight,
  Plus,
  Box,
  Menu,
  X,
  Check,
  Camera,
  Compass,
  ShieldCheck,
  Settings2,
} from "lucide-react";
import carImage from "./assets/reality-gt-white.png";
import carPlanImage from "./assets/reality-gt-plan.png";
import StudioShowcase from "./components/StudioShowcase";
import FieldGuideHero from "./components/FieldGuideHero";
import UploadZone from "./components/UploadZone";
import ActionArea from "./components/ActionArea";
import ExperimentStudio from "./features/exploration/ExperimentStudio";
import ResultsSection from "./components/ResultsSection";
import { sampleBlueprintData } from "./data/sampleBlueprintData";

export default function App() {
  const [studioMode, setStudioMode] = useState("mechanism");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [menu, setMenu] = useState(false);
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
          RealityLab<span>THE OBJECT STUDIO</span>
        </a>
        <nav className={menu ? "nav-links open" : "nav-links"}>
          <a href="#objects" onClick={() => setMenu(false)}>
            Objects
          </a>
          <a href="#process" onClick={() => setMenu(false)}>
            Discover
          </a>
          <a
            href="#studio"
            onClick={() => {
              setMenu(false);
              setStudioMode("mechanism");
            }}
          >
            Notebook <ArrowUpRight size={13} />
          </a>
        </nav>
        <a
          className="nav-cta"
          href="#studio"
          onClick={() => setStudioMode("mechanism")}
        >
          Upload a photo <ArrowUpRight size={16} />
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
        <FieldGuideHero onExplore={() => setStudioMode("mechanism")} />
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
                title: "Try it. Check it.",
                text: "Review the suggestions, record what you observe, and test supported mechanisms with your own measurements.",
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
        <StudioShowcase />
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
              id="cad-tab"
              role="tab"
              aria-selected={studioMode === "cad"}
              aria-controls="cad-panel"
              onClick={() => setStudioMode("cad")}
            >
              <Box size={15} /> 3D model inspector <span>GLB / STL</span>
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
            id="cad-panel"
            role="tabpanel"
            aria-labelledby="cad-tab"
            hidden={studioMode !== "cad"}
          >
            {studioMode === "cad" && (
              <Suspense
                fallback={
                  <p className="lab-help">Preparing the model inspector…</p>
                }
              >
                <CadWorkspace />
              </Suspense>
            )}
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
          RealityLab<span>THE OBJECT STUDIO</span>
        </a>
        <p>Independent minds. Shared possibilities. / Meta Hackathon 2026</p>
        <a href="#">
          Stay curious. <ArrowUpRight size={15} />
        </a>
      </footer>
    </div>
  );
}

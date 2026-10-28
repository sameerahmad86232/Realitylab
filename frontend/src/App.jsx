import { useState, lazy, Suspense } from "react";
import { handleTabKeys } from "./lib/accessibleTabs";
const BenchWorkspace = lazy(() => import("./features/bench/BenchWorkspace"));
const CadWorkspace = lazy(() => import("./features/cad/CadWorkspace"));
import {
  ArrowUpRight,
  ScanLine,
  Layers3,
  Aperture,
  Plus,
  Check,
  Box,
  Menu,
  X,
  Camera,
  Compass,
  ShieldCheck,
  Settings2,
} from "lucide-react";
import carImage from "./assets/reality-gt-white.webp";
import carPlanImage from "./assets/reality-gt-plan.webp";
import StudioShowcase from "./components/StudioShowcase";
import FieldGuideHero, {
  FieldGuideStories,
  PrecisionRepairIntro,
} from "./components/FieldGuideHero";
import UploadZone from "./components/UploadZone";
import ActionArea from "./components/ActionArea";
import ExperimentStudio from "./features/exploration/ExperimentStudio";
import ResultsSection from "./components/ResultsSection";
import { sampleBlueprintData } from "./data/sampleBlueprintData";

export default function App() {
  const [studioMode, setStudioMode] = useState("mechanism");
  const [benchSource, setBenchSource] = useState(null);
  const [files, setFiles] = useState([]);
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
    setGenerated(true);
  };
  return (
    <div className="site-shell">
      <a className="skip-link" href="#studio">
        Skip to object studio
      </a>
      <header className="site-header">
        <a href="#" className="wordmark">
          <Aperture size={26} />
          RealityLab
        </a>
        <nav
          id="main-navigation"
          aria-label="Main navigation"
          className={menu ? "nav-links open" : "nav-links"}
        >
          <a
            href="#studio"
            onClick={() => {
              setMenu(false);
              setStudioMode("mechanism");
            }}
          >
            Discover
          </a>
          <a href="#process" onClick={() => setMenu(false)}>
            How it works
          </a>
          <a
            href="#studio"
            onClick={() => {
              setMenu(false);
              setStudioMode("bench");
            }}
          >
            Tools
          </a>
        </nav>
        <a
          className="nav-cta"
          aria-label="Scan an object"
          href="#studio"
          onClick={() => setStudioMode("mechanism")}
        >
          <span>Scan an object</span> <ArrowUpRight size={16} />
        </a>
        <button
          className="mobile-menu"
          aria-label="Toggle navigation"
          aria-expanded={menu}
          aria-controls="main-navigation"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
      </header>
      <main id="main-content">
        <FieldGuideHero onExplore={() => setStudioMode("mechanism")} />
        <section className="studio-section" id="studio" tabIndex={-1}>
          <div className="section-heading">
            <div>
              <span className="eyebrow">
                <span className="live-dot" /> YOUR WORKSPACE
              </span>
              <h2>Your object. In focus.</h2>
            </div>
            <span className="prototype-badge">
              DISCOVER · REPAIR · REVIEW <span>↗</span>
            </span>
          </div>
          <div className="studio-caption">
            <p>Explore parts, keep the photo close, and follow the evidence.</p>
            <span>
              Start with photos of your object. If something is wrong, describe
              it or add another view.
            </span>
          </div>
          <div
            className="studio-mode-tabs"
            role="tablist"
            aria-label="Studio mode"
            onKeyDown={handleTabKeys}
          >
            <button
              id="mechanism-tab"
              aria-label="Object explorer · Discover and repair"
              role="tab"
              aria-selected={studioMode === "mechanism"}
              tabIndex={studioMode === "mechanism" ? 0 : -1}
              aria-controls="mechanism-panel"
              onClick={() => setStudioMode("mechanism")}
            >
              <Settings2 size={15} /> Discover & repair{" "}
              <span>SCAN · UNDERSTAND · REPAIR</span>
            </button>
            <button
              id="bench-tab"
              role="tab"
              aria-selected={studioMode === "bench"}
              tabIndex={studioMode === "bench" ? 0 : -1}
              aria-controls="bench-panel"
              onClick={() => setStudioMode("bench")}
            >
              <Settings2 size={15} /> Experiment bench{" "}
              <span>PREDICT · MEASURE · INVESTIGATE</span>
            </button>
            <button
              id="cad-tab"
              role="tab"
              aria-selected={studioMode === "cad"}
              tabIndex={studioMode === "cad" ? 0 : -1}
              aria-controls="cad-panel"
              onClick={() => setStudioMode("cad")}
            >
              <Box size={15} /> 3D model inspector{" "}
              <span>YOUR GLB / STL FILES</span>
            </button>
            <button
              id="sample-tab"
              role="tab"
              aria-selected={studioMode === "sample"}
              tabIndex={studioMode === "sample" ? 0 : -1}
              aria-controls="sample-panel"
              onClick={() => setStudioMode("sample")}
            >
              <Box size={15} /> Car concept sample <span>CURATED</span>
            </button>
          </div>
          <div
            id="bench-panel"
            role="tabpanel"
            aria-labelledby="bench-tab"
            hidden={studioMode !== "bench"}
          >
            <Suspense
              fallback={
                <p className="lab-help">Preparing the experiment bench…</p>
              }
            >
              <BenchWorkspace
                source={benchSource}
                onSourceChange={setBenchSource}
                onScan={() => setStudioMode("mechanism")}
              />
            </Suspense>
          </div>
          <div
            id="mechanism-panel"
            role="tabpanel"
            aria-labelledby="mechanism-tab"
            hidden={studioMode !== "mechanism"}
          >
            <ExperimentStudio
              onExperimentSource={(analysis) => {
                setBenchSource({
                  objectName: analysis.objectName,
                  summary: analysis.summary,
                  observations: analysis.observations.map((o) => ({
                    name: o.name,
                    evidence: o.evidence,
                  })),
                });
                setStudioMode("bench");
              }}
            />
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
                <details className="reference-study">
                  <summary>
                    Optional lighting study · illustrative gear sample
                  </summary>
                  <StudioShowcase />
                </details>
              </Suspense>
            )}
          </div>
          <div
            id="sample-panel"
            role="tabpanel"
            aria-labelledby="sample-tab"
            hidden={studioMode !== "sample"}
          >
            <div className="sample-scope-note" role="note">
              <strong>Curated car demonstration</strong>
              <p>
                This blueprint is fixed sample content. Uploaded photos do not
                change its parts or specifications.
              </p>
              <button
                className="quiet-button"
                onClick={() => setStudioMode("mechanism")}
              >
                Analyze your own object <ArrowUpRight size={16} />
              </button>
            </div>
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
                  <ShieldCheck size={14} /> Local sample only.
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
                  isLoading={false}
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
              onRepair={() => setStudioMode("mechanism")}
            />
          </div>
        </section>
        <PrecisionRepairIntro onExplore={() => setStudioMode("mechanism")} />
        <section className="process-section" id="process">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A LITTLE PERSPECTIVE</span>
              <h2>How it works.</h2>
            </div>
            <p>Three simple steps. Keep the evidence in view.</p>
          </div>
          <div className="process-grid">
            {[
              {
                n: "01",
                icon: ScanLine,
                title: "Capture clearly.",
                text: "Pick something that makes you curious. Upload up to three photos from different angles.",
                tag: "YOUR PERSPECTIVE",
              },
              {
                n: "02",
                icon: Layers3,
                title: "Discover the parts.",
                text: "See the visible components, their suggested roles, and the questions that still need evidence.",
                tag: "A NEW UNDERSTANDING",
              },
              {
                n: "03",
                icon: Box,
                title: "Choose the next step.",
                text: "Describe a problem, add another angle if needed, and review an object-specific repair assessment.",
                tag: "ENDLESS POSSIBILITIES",
              },
            ].map(({ n, icon: Icon, title, text, tag }) => (
              <article className="process-card" key={n} data-step={n}>
                <div className="card-top">
                  <Icon size={25} />
                  <span>{n} /</span>
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
        <FieldGuideStories onExplore={() => setStudioMode("mechanism")} />
        <section
          className="field-guide"
          id="privacy"
          aria-labelledby="field-guide-title"
        >
          <div>
            <span className="eyebrow">A FEW FIELD NOTES</span>
            <h2 id="field-guide-title">A few clear answers.</h2>
            <p>Know what to expect before you begin.</p>
          </div>
          <div className="field-questions">
            {[
              {
                q: "What can I scan?",
                a: "The object explorer creates approximate 3D component concepts, explanations, and evidence-linked repair assessments for many everyday objects. You can edit parts and export GLB/STL files. Manual gear, lever and pulley tools use your confirmed measurements. Unclear objects may need another angle or context. The car is a separate curated design study.",
              },
              {
                q: "Are repair suggestions verified?",
                a: "No. Fault suggestions and repair steps require your review. Scan geometry is approximate, and the car sample is illustrative. Visible evidence is separated from inferred geometry and suggested roles. Exact specifications and hidden mechanisms require physical inspection or testing.",
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
        <section className="about-section precision-final-cta" id="about">
          <div>
            <h2>A closer look starts here.</h2>
            <p>Scan an object. Explore the parts. Choose a useful next step.</p>
          </div>
          <a
            href="#studio"
            className="button-lime"
            onClick={() => setStudioMode("mechanism")}
          >
            <ScanLine size={18} /> Scan your object <ArrowUpRight size={17} />
          </a>
        </section>
      </main>
      <footer className="site-footer">
        <a href="#" className="wordmark">
          <Aperture size={24} />
          RealityLab
        </a>
        <p>Built with Meta AI · Made for a closer look.</p>
        <div className="precision-footer-links">
          <a
            href="#privacy"
            onClick={() =>
              document
                .querySelector("#privacy details:last-of-type")
                ?.setAttribute("open", "")
            }
          >
            Privacy
          </a>
          <a href="#about">About</a>
        </div>
      </footer>
    </div>
  );
}

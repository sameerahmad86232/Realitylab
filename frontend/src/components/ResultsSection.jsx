import carPlanImage from "../assets/reality-gt-plan.png";
import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Layers3,
  Box,
  Eye,
  Plus,
  Minus,
  RotateCcw,
  Check,
  Lightbulb,
  MoveUpRight,
} from "lucide-react";

export default function ResultsSection({ blueprintData, isVisible }) {
  const [tab, setTab] = useState("discover");
  const [part, setPart] = useState("obs-1");
  const [layer, setLayer] = useState("all");
  const [zoom, setZoom] = useState(1);
  const [complete, setComplete] = useState([]);
  const target = useRef(null);
  useEffect(() => {
    if (isVisible)
      target.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [isVisible]);
  if (!isVisible || !blueprintData) return null;
  const observed = blueprintData.observedParts;
  const inferred = blueprintData.inferredParts;
  const visibleParts =
    layer === "observed"
      ? observed
      : layer === "inferred"
        ? inferred
        : [...observed, ...inferred];
  const selected = [...observed, ...inferred].find((p) => p.id === part);
  const steps = [
    {
      title: "Sketch the structure",
      text: "Sketch the side profile of a coupe. Label the body shell, cabin and four wheel positions. Treat all proportions as illustrative.",
    },
    {
      title: "Make a static frame",
      text: "Fold paper or cardboard into an unpowered body model. Use simple cardboard circles for the wheels. This activity demonstrates form, not a roadworthy vehicle.",
    },
    {
      title: "Map the connections",
      text: "Mark possible positions for an electric motor, battery and cooling system. Keep these clearly labeled as packaging hypotheses.",
    },
    {
      title: "Compare and reflect",
      text: "Compare the model with the diagram. Note which features are observable and which would require inspection or testing to confirm.",
    },
  ];
  function exportReport() {
    const report = {
      title: blueprintData.objectName,
      mode: "curated-sample",
      notice:
        "Illustrative educational sample; not a live image analysis or verified construction plan.",
      observedParts: observed.map((p) => ({
        name: p.name,
        location: p.location,
      })),
      hypotheses: inferred.map((p) => ({
        name: p.name,
        reason: p.inferenceReason,
      })),
      learningProject: steps,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "realitylab-sample-exploration.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="exploration-results" ref={target}>
      <div className="results-top">
        <span className="eyebrow">
          <span className="live-dot" /> YOUR EXPLORATION / 001
        </span>
        <button className="quiet-button" onClick={exportReport}>
          <ArrowDownToLine size={14} /> Export report
        </button>
      </div>
      <div className="result-title">
        <div>
          <span className="sample-label">
            CURATED SAMPLE · NOT LIVE ANALYSIS
          </span>
          <h2>{blueprintData.objectName}</h2>
          <p>An original design. A new perspective on motion.</p>
        </div>
        <span className="result-seal">
          <Box size={24} />
          <small>
            OBJECT
            <br />
            STUDY 001
          </small>
        </span>
      </div>
      <div
        className="result-tabs"
        role="tablist"
        aria-label="Exploration views"
      >
        <button
          role="tab"
          aria-selected={tab === "discover"}
          onClick={() => setTab("discover")}
        >
          <Eye size={16} /> Discover <span>01</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === "build"}
          onClick={() => setTab("build")}
        >
          <Box size={16} /> Make a model <span>02</span>
        </button>
      </div>
      {tab === "discover" ? (
        <div className="discover-grid">
          <div className="result-viewer">
            <div className="result-viewer-top">
              <span>
                <Layers3 size={14} /> COMPONENT MAP
              </span>
              <span>ILLUSTRATIVE / PLAN VIEW</span>
            </div>
            <div className="schematic-stage">
              <div
                className="schematic"
                style={{ transform: `scale(${zoom})` }}
              >
                <img
                  className="car-plan-image"
                  src={carPlanImage}
                  alt="AI-generated top-down illustration of the Reality GT concept, with interactive component markers"
                />
                <button
                  className={`map-pin pin-frame ${part === "obs-1" ? "selected" : ""}`}
                  aria-label="Select body shell"
                  onClick={() => setPart("obs-1")}
                >
                  01
                </button>
                <button
                  className={`map-pin pin-rotor ${part === "obs-2" ? "selected" : ""}`}
                  aria-label="Select wheel"
                  onClick={() => setPart("obs-2")}
                >
                  02
                </button>
                <button
                  className={`map-pin pin-control ${part === "inf-2" ? "selected" : ""}`}
                  aria-label="Select hypothetical battery"
                  onClick={() => setPart("inf-2")}
                >
                  03
                </button>
                <span className="map-axis">X — HORIZONTAL AXIS</span>
              </div>
              <div className="schematic-tools">
                <button
                  aria-label="Zoom out diagram"
                  onClick={() => setZoom((z) => Math.max(0.7, z - 0.1))}
                >
                  <Minus size={14} />
                </button>
                <button
                  aria-label="Reset diagram zoom"
                  onClick={() => setZoom(1)}
                >
                  <RotateCcw size={13} />
                </button>
                <button
                  aria-label="Zoom in diagram"
                  onClick={() => setZoom((z) => Math.min(1.4, z + 0.1))}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div className="selected-insight" aria-live="polite">
              <span className="micro-label">
                {part.startsWith("obs")
                  ? "VISIBLE COMPONENT"
                  : "INTERNAL HYPOTHESIS"}
              </span>
              <h3>{selected?.name}</h3>
              <p>
                {part.startsWith("obs")
                  ? selected?.visualCue
                  : selected?.inferenceReason}
              </p>
            </div>
          </div>
          <div className="component-list">
            <div className="component-list-heading">
              <h3>The sum of its parts.</h3>
              <p>Choose a component to look a little closer.</p>
            </div>
            <div className="filter-pills" aria-label="Filter components">
              {["all", "observed", "inferred"].map((l) => (
                <button
                  aria-pressed={layer === l}
                  className={layer === l ? "active" : ""}
                  key={l}
                  onClick={() => setLayer(l)}
                >
                  {l === "all"
                    ? "All parts"
                    : l === "observed"
                      ? "Visible"
                      : "Inferred"}
                </button>
              ))}
            </div>
            <div className="parts-scroll">
              {visibleParts.map((p, i) => (
                <button
                  className={`component-row ${part === p.id ? "selected" : ""}`}
                  key={p.id}
                  onClick={() => setPart(p.id)}
                >
                  <span className="part-index">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <strong>{p.name}</strong>
                    <small>
                      {p.id.startsWith("obs") ? "VISIBLE · " : "HYPOTHESIS · "}
                      {p.category}
                    </small>
                  </span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
            </div>
            <div className="inference-note">
              <Lightbulb size={15} />
              <p>
                What we can see is evidence. What might be inside is a
                hypothesis, waiting to be tested.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="learning-project">
          <div className="project-overview">
            <span className="eyebrow">LEARN BY MAKING</span>
            <h3>
              Big ideas.
              <br />
              Small-scale beginnings.
            </h3>
            <p>
              Make a simple, unpowered model to explore the car concept’s
              proportions. This is a learning activity, not a drivable vehicle.
            </p>
            <div className="materials-tags">
              <span>Paper or cardboard</span>
              <span>Pencil</span>
              <span>Ruler</span>
              <span>Colored thread</span>
            </div>
            <div className="project-progress">
              <div>
                <span>YOUR PROGRESS</span>
                <strong>
                  {complete.length} / {steps.length}
                </strong>
              </div>
              <div className="progress-track">
                <span
                  style={{
                    width: `${(complete.length / steps.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="project-steps">
            {steps.map((step, i) => (
              <button
                aria-pressed={complete.includes(i)}
                className={`project-step ${complete.includes(i) ? "complete" : ""}`}
                key={step.title}
                onClick={() =>
                  setComplete((c) =>
                    c.includes(i) ? c.filter((v) => v !== i) : [...c, i],
                  )
                }
              >
                <span className="step-check">
                  {complete.includes(i) ? (
                    <Check size={15} />
                  ) : (
                    String(i + 1).padStart(2, "0")
                  )}
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                  <small>
                    {complete.includes(i) ? "COMPLETED" : "MARK AS COMPLETE"}{" "}
                    <MoveUpRight size={10} />
                  </small>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="result-footnote">
        <span>
          Curiosity is the starting point. Verification is the next step.
        </span>
        <span>REALITYLAB / EXPLORATION NOTES</span>
      </div>
    </section>
  );
}

const componentType = PropTypes.shape({
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  category: PropTypes.string,
  location: PropTypes.string,
  visualCue: PropTypes.string,
  inferenceReason: PropTypes.string,
});
ResultsSection.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  blueprintData: PropTypes.shape({
    objectName: PropTypes.string.isRequired,
    observedParts: PropTypes.arrayOf(componentType).isRequired,
    inferredParts: PropTypes.arrayOf(componentType).isRequired,
  }),
};

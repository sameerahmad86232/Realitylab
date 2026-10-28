import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { handleTabKeys } from "../../lib/accessibleTabs";
import {
  Box,
  Play,
  Layers3,
  Download,
  RotateCcw,
  ArrowUpRight,
} from "lucide-react";
import { createCadViewer } from "../../lib/createCadViewer";
import { downloadFile } from "../../lib/exportReport";

function ScanModel({ analysis, selected, onSelect, onSpatialChange }) {
  const host = useRef(null),
    engine = useRef(null),
    selectRef = useRef(onSelect),
    planRef = useRef(null);
  const [failed, setFailed] = useState(false),
    [error, setError] = useState(""),
    [wire, setWire] = useState(false),
    [view, setView] = useState("iso"),
    [exporting, setExporting] = useState(false);
  const hasPlan = Boolean(analysis.spatialModel?.parts?.length);
  const names = new Map(analysis.observations.map((o) => [o.id, o.name]));
  const modelKey = hasPlan
    ? JSON.stringify({
        objectName: `${analysis.objectName} / approximate concept`,
        parts: analysis.spatialModel.parts.map((p) => ({
          ...p,
          name: names.get(p.observationId) || "Visible part",
        })),
      })
    : "";
  const selectedPart = analysis.spatialModel?.parts.find(
    (p) => p.observationId === selected,
  );
  const selectedObservation = analysis.observations.find(
    (o) => o.id === selected,
  );
  const image =
    analysis.images.find((im) => im.id === selectedObservation?.imageId) ||
    analysis.images[0];
  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!hasPlan || !host.current) return;
    setFailed(false);
    const viewer = createCadViewer(host.current, {
      onFailure: () => setFailed(true),
      onSelect: (id) => {
        const index = Number(id?.replace("mesh-", "")) - 1;
        const ref = planRef.current?.parts[index]?.observationId;
        if (ref) selectRef.current(ref);
      },
    });
    engine.current = viewer;
    return () => {
      viewer.dispose();
      engine.current = null;
    };
  }, [hasPlan]);
  useEffect(() => {
    if (!modelKey || !engine.current) return;
    const data = JSON.parse(modelKey);
    planRef.current = data;
    setError("");
    try {
      engine.current.concept?.(data);
      setWire(false);
      setView("iso");
    } catch (e) {
      setError(e.message);
    }
  }, [modelKey]);
  useEffect(() => {
    if (!engine.current || !modelKey) return;
    const index = JSON.parse(modelKey).parts.findIndex(
      (p) => p.observationId === selected,
    );
    engine.current.select?.(index >= 0 ? `mesh-${index + 1}` : null);
  }, [modelKey, selected]);
  useEffect(() => {
    engine.current?.setWireframe?.(wire);
  }, [wire]);
  useEffect(() => {
    engine.current?.setView?.(view);
  }, [view]);
  async function exportModel(format) {
    setExporting(true);
    setError("");
    try {
      const result = await engine.current.exportMesh(format);
      downloadFile(
        `realitylab-approximate-concept.${format}`,
        result,
        format === "glb" ? "model/gltf-binary" : "model/stl",
      );
    } catch {
      setError("The concept could not be exported. Try resetting the view.");
    } finally {
      setExporting(false);
    }
  }
  function patchPart(patch) {
    if (!selectedPart) return;
    onSpatialChange({
      ...analysis.spatialModel,
      parts: analysis.spatialModel.parts.map((p) =>
        p.observationId === selected
          ? { ...p, ...patch, source: "user-edited" }
          : p,
      ),
    });
  }
  return (
    <>
      <div className="scan-concept-notice">
        <strong>APPROXIMATE 3D CONCEPT</strong>
        <p>
          This is a proposed arrangement of visible parts. Depth, thickness and
          back surfaces are inferred. It is not a realistic reconstruction or
          verified CAD.
        </p>
      </div>
      {!hasPlan ? (
        <div className="scan-no-model">
          <Box size={28} />
          <h4>No scan-specific geometry was proposed.</h4>
          <p>
            This result still has its own photo evidence and component map
            below. An older result may need re-analysis; an unclear object may
            need additional angles. No gear or car sample has been substituted.
          </p>
        </div>
      ) : (
        <>
          <div className="scan-model-grid">
            <aside className="scan-reference">
              <span className="micro-label">YOUR PHOTO / REFERENCE</span>
              {image && (
                <img
                  src={image.dataUrl}
                  alt="Reference photo for this scan-specific 3D concept"
                />
              )}
              <strong>{analysis.objectName}</strong>
              <p>
                Select a component in the model or the list to link it back to
                its photo evidence.
              </p>
              <a href="#scan-photo-evidence">
                Review photo evidence <ArrowUpRight size={13} />
              </a>
            </aside>
            <div className="scan-model-stage">
              <div ref={host} className="scan-model-canvas" />
              {(failed || error) && (
                <div className="scan-model-overlay">
                  {failed
                    ? "3D rendering is unavailable in this browser. Your photo evidence and guide are still available."
                    : error}
                </div>
              )}
              <div className="scan-camera-buttons">
                {["iso", "front", "top"].map((v) => (
                  <button
                    key={v}
                    aria-label={`Scan model ${v} view`}
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    disabled={failed}
                  >
                    {v === "iso"
                      ? "Isometric"
                      : v === "front"
                        ? "Front"
                        : "Top"}
                  </button>
                ))}
              </div>
              <span className="scan-stage-label">
                DRAG TO ORBIT · RELATIVE PROPORTIONS
              </span>
              <button
                className="quiet-button scan-reset"
                aria-label="Reset scan 3D view"
                disabled={failed}
                onClick={() => {
                  setWire(false);
                  setView("iso");
                  engine.current?.setView?.("iso");
                }}
              >
                <RotateCcw size={14} />
              </button>
            </div>
            <aside className="scan-model-parts">
              <span className="micro-label">VISIBLE COMPONENTS</span>
              {analysis.observations.map((o) => {
                const modelled = analysis.spatialModel.parts.some(
                  (p) => p.observationId === o.id,
                );
                return (
                  <button
                    key={o.id}
                    aria-label={`Select 3D component ${o.name}`}
                    aria-pressed={selected === o.id}
                    className={selected === o.id ? "selected" : ""}
                    onClick={() => onSelect(o.id)}
                  >
                    <span>{o.name}</span>
                    <small>
                      {modelled ? "Approximate shape" : "Photo evidence only"}
                    </small>
                  </button>
                );
              })}
            </aside>
          </div>
          <div className="scan-model-tools">
            <label className="lab-check">
              <input
                type="checkbox"
                checked={wire}
                disabled={failed}
                onChange={(e) => setWire(e.target.checked)}
              />
              <span>Wireframe scan concept</span>
            </label>
            <div>
              <button
                className="quiet-button"
                disabled={failed || exporting}
                onClick={() => exportModel("glb")}
              >
                <Download size={14} /> Concept GLB
              </button>
              <button
                className="quiet-button"
                disabled={failed || exporting}
                onClick={() => exportModel("stl")}
              >
                <Download size={14} /> Concept STL
              </button>
              <button
                className="quiet-button"
                disabled={failed}
                onClick={() => engine.current?.still?.()}
              >
                <Download size={14} /> 3D view PNG
              </button>
            </div>
          </div>
          {selectedObservation && (
            <div className="scan-part-inspector">
              <div>
                <span className="eyebrow">SELECTED COMPONENT</span>
                <h4>{selectedObservation.name}</h4>
                <p>{selectedObservation.evidence}</p>
                {selectedObservation.function && (
                  <p>
                    <strong>Suggested role:</strong>{" "}
                    {selectedObservation.function}
                  </p>
                )}
                {selectedPart && <small>{selectedPart.basis}</small>}
              </div>
              {selectedPart ? (
                <div className="scan-shape-editor">
                  <label className="lab-label">
                    Concept shape
                    <select
                      aria-label="Selected scan part shape"
                      value={selectedPart.primitive}
                      onChange={(e) => patchPart({ primitive: e.target.value })}
                    >
                      {[
                        "box",
                        "ellipsoid",
                        "cylinder",
                        "cone",
                        "torus",
                        "capsule",
                        "tube",
                      ].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="lab-label">
                    Illustrative color
                    <input
                      aria-label="Selected scan part color"
                      type="color"
                      value={selectedPart.color || "#879b85"}
                      onChange={(e) => patchPart({ color: e.target.value })}
                    />
                  </label>
                  {["X", "Y", "Z"].map((axis, index) => (
                    <label className="lab-label" key={axis}>
                      Relative size {axis}
                      <span>{selectedPart.size[index].toFixed(2)}</span>
                      <input
                        type="range"
                        aria-label={`Scan part relative size ${axis}`}
                        min=".02"
                        max="4"
                        step=".02"
                        value={selectedPart.size[index]}
                        onChange={(e) => {
                          const size = [...selectedPart.size];
                          size[index] = Number(e.target.value);
                          patchPart({ size });
                        }}
                      />
                    </label>
                  ))}
                  <p className="lab-help">
                    Editing changes the concept, not the photographic evidence.
                    Values are relative units, not measured dimensions.
                  </p>
                </div>
              ) : (
                <p className="lab-help">
                  This component has photo evidence only; no volume has been
                  proposed for it.
                </p>
              )}
            </div>
          )}
          <div className="scan-assumptions">
            <h5>What the model had to assume</h5>
            <ul>
              {analysis.spatialModel.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}
ScanModel.propTypes = {
  analysis: PropTypes.object.isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onSpatialChange: PropTypes.func.isRequired,
};

export default function ScanExperience({
  analysis,
  selected,
  onSelect,
  onSpatialChange,
}) {
  const [tab, setTab] = useState("model");
  return (
    <section
      className="scan-experience"
      aria-labelledby="scan-experience-title"
    >
      <div className="scan-experience-heading">
        <span className="eyebrow">
          YOUR SCAN / AN OBJECT-SPECIFIC EXPLORATION
        </span>
        <h3 id="scan-experience-title">
          See the parts. Follow the possibilities.
        </h3>
        <p>
          A 3D concept, an explanation, and a practical study-model plan for
          this object.
        </p>
      </div>
      <div
        role="tablist"
        aria-label="Scanned object exploration"
        onKeyDown={handleTabKeys}
        className="scan-experience-tabs"
      >
        <button
          role="tab"
          aria-selected={tab === "model"}
          tabIndex={tab === "model" ? 0 : -1}
          onClick={() => setTab("model")}
        >
          <Box size={15} /> 3D concept
        </button>
        <button
          role="tab"
          aria-selected={tab === "operation"}
          tabIndex={tab === "operation" ? 0 : -1}
          onClick={() => setTab("operation")}
        >
          <Play size={15} /> How it works
        </button>
        <button
          role="tab"
          aria-selected={tab === "create"}
          tabIndex={tab === "create" ? 0 : -1}
          onClick={() => setTab("create")}
        >
          <Layers3 size={15} /> Make a study model
        </button>
      </div>
      {tab === "model" && (
        <ScanModel
          analysis={analysis}
          selected={selected}
          onSelect={onSelect}
          onSpatialChange={onSpatialChange}
        />
      )}
      {tab === "operation" && (
        <div className="scan-learning">
          <span className="scan-guide-label">
            MODEL-SUGGESTED EXPLANATION · VERIFY WITH OBSERVATION
          </span>
          <h4>How this object may work.</h4>
          <p>{analysis.operation?.summary || analysis.summary}</p>
          {analysis.operation?.steps.map((step, i) => (
            <article key={i}>
              <span>{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h5>{step.title}</h5>
                <p>{step.description}</p>
                <div className="scan-step-parts">
                  {step.observationIds.map((id) => (
                    <button
                      className="quiet-button"
                      key={id}
                      onClick={() => {
                        onSelect(id);
                        setTab("model");
                      }}
                    >
                      Highlight{" "}
                      {analysis.observations.find((o) => o.id === id)?.name ||
                        "component"}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))}
          {!analysis.operation &&
            analysis.observations.map((o) => (
              <article key={o.id}>
                <Box size={17} />
                <div>
                  <h5>{o.name}</h5>
                  <p>{o.function || o.evidence}</p>
                </div>
              </article>
            ))}
        </div>
      )}
      {tab === "create" && (
        <div className="scan-learning">
          <span className="scan-guide-label">
            UNPOWERED STUDY MODEL · NOT A MANUFACTURING PLAN
          </span>
          <h4>A way to recreate the visible structure.</h4>
          <p>
            This guide is for a nonfunctional study model. Real products require
            measurements, material choices, engineering checks and inspection of
            hidden parts.
          </p>
          {analysis.recreationGuide ? (
            <>
              <div className="scan-guide-columns">
                <div>
                  <h5>Suggested craft materials</h5>
                  <ul>
                    {analysis.recreationGuide.materials.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5>Measurements to collect first</h5>
                  <ul>
                    {analysis.recreationGuide.measurementsNeeded.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
              {analysis.recreationGuide.steps.map((step, i) => (
                <article key={i}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <h5>{step.title}</h5>
                    <p>{step.instruction}</p>
                    <small>
                      <strong>Check:</strong> {step.check}
                    </small>
                  </div>
                </article>
              ))}
              <div className="scan-guide-limits">
                <h5>Limits of this guide</h5>
                <ul>
                  {analysis.recreationGuide.limitations.map((l, i) => (
                    <li key={i}>{l}</li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <>
              <p>
                No object-specific recreation guide was proposed for this
                result. Start with the evidence and collect the missing
                measurements.
              </p>
              <ul>
                {analysis.nextSteps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
ScanExperience.propTypes = ScanModel.propTypes;

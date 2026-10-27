import { useEffect, useRef, useState, lazy, Suspense } from "react";
import ObjectOverview from "./ObjectOverview";
import PhysicsBench from "./PhysicsBench";
import EvidenceNotebook from "./EvidenceNotebook";
import {
  updateObservation,
  withReview,
  reviewLabels,
  makeExplorationMarkdown,
} from "../../lib/evidenceReview";
const ComponentGraph = lazy(() => import("./ComponentGraph"));
import {
  ArrowUpRight,
  Upload,
  Loader2,
  Check,
  AlertCircle,
  RotateCcw,
  Download,
  FlaskConical,
  Settings2,
  Camera,
  Plus,
  X,
  MoveRight,
} from "lucide-react";
import { api } from "../../lib/api";
import { downloadFile, makeReportSvg } from "../../lib/exportReport";

function gearPath(cx, cy, r, teeth) {
  const n = Math.min(40, Math.max(8, teeth || 12));
  return (
    Array.from({ length: n * 4 }, (_, i) => {
      const a = (i * Math.PI * 2) / (n * 4);
      const radius = i % 4 < 2 ? r : r * 0.88;
      return `${i ? "L" : "M"}${cx + Math.cos(a) * radius},${cy + Math.sin(a) * radius}`;
    }).join(" ") + "Z"
  );
}
const initial = {
  driver: "",
  follower: "",
  inputTurns: "1",
  inputDirection: "clockwise",
  driverConfirmed: false,
  followerConfirmed: false,
};
export default function ExperimentStudio() {
  const [activeTool, setActiveTool] = useState("objects");
  const [physicsReport, setPhysicsReport] = useState(null);
  const [health, setHealth] = useState(null),
    [healthError, setHealthError] = useState("");
  const [files, setFiles] = useState([]),
    [context, setContext] = useState(""),
    [consent, setConsent] = useState(false);
  const [analysis, setAnalysis] = useState(null),
    [imageIndex, setImageIndex] = useState(0),
    [selected, setSelected] = useState(null);
  const [setup, setSetup] = useState(initial),
    [prediction, setPrediction] = useState(null),
    [comparison, setComparison] = useState(null);
  const [measurement, setMeasurement] = useState({
    turns: "",
    direction: "counterclockwise",
    tolerance: "0.05",
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(""),
    [includeImages, setIncludeImages] = useState(false),
    [example, setExample] = useState(false);
  const fileInput = useRef(null),
    controller = useRef(null),
    requestId = useRef(0),
    urls = useRef(new Set());
  const resultTarget = useRef(null),
    captureTarget = useRef(null);
  useEffect(() => {
    if (analysis?.id)
      resultTarget.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
  }, [analysis?.id]);
  useEffect(() => {
    const ownedUrls = urls.current;
    const ac = new AbortController();
    api("health", { signal: ac.signal })
      .then(setHealth)
      .catch((e) => {
        if (e.name !== "AbortError") setHealthError(e.message);
      });
    return () => {
      ac.abort();
      controller.current?.abort();
      ownedUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);
  async function refresh() {
    setHealthError("");
    try {
      setHealth(await api("health"));
    } catch (e) {
      setHealthError(e.message);
    }
  }
  function resetDerived() {
    setPrediction(null);
    setComparison(null);
    setError("");
  }
  function update(key, value) {
    setMeasurement((m) => ({ ...m, turns: "" }));
    setSetup((s) => ({
      ...s,
      [key]: value,
      ...(key === "driver"
        ? { driverConfirmed: false }
        : key === "follower"
          ? { followerConfirmed: false }
          : {}),
    }));
    resetDerived();
  }
  function addFiles(incoming) {
    const added = [];
    let warning = "";
    for (const f of incoming) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        warning = "Choose JPEG, PNG or WebP images.";
        continue;
      }
      if (f.size > 5 * 1024 * 1024) {
        warning = "Each image must be at most 5 MB.";
        continue;
      }
      if (files.length + added.length >= 3) {
        warning = "Use at most three photos.";
        break;
      }
      const url = URL.createObjectURL(f);
      urls.current.add(url);
      added.push({ file: f, url, id: crypto.randomUUID() });
    }
    if (added.length) {
      setFiles((f) => [...f, ...added]);
      setAnalysis(null);
      setExample(false);
      setSetup(initial);
      resetDerived();
    }
    setError(warning);
  }
  function removeFile(id) {
    const old = files.find((f) => f.id === id);
    if (old) {
      URL.revokeObjectURL(old.url);
      urls.current.delete(old.url);
    }
    setFiles((f) => f.filter((v) => v.id !== id));
    setAnalysis(null);
    setSetup(initial);
    resetDerived();
  }
  async function run(kind, operation, onSuccess) {
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    const id = ++requestId.current;
    setBusy(kind);
    setError("");
    try {
      const result = await operation(ac.signal);
      if (id === requestId.current) onSuccess(result);
    } catch (e) {
      if (id === requestId.current && e.name !== "AbortError")
        setError(e.message);
    } finally {
      if (id === requestId.current) setBusy("");
    }
  }
  function cancel() {
    controller.current?.abort();
    requestId.current++;
    setBusy("");
    setError("Analysis cancelled. Your selected photos are preserved.");
  }
  function analyze() {
    if (!files.length || !consent) return;
    setMeasurement((m) => ({ ...m, turns: "" }));
    const form = new FormData();
    files.forEach((f) => form.append("images", f.file));
    form.append("context", context);
    form.append("consent", "true");
    setAnalysis(null);
    setActiveTool("objects");
    setPhysicsReport(null);
    setExample(false);
    setSetup(initial);
    resetDerived();
    run(
      "analysis",
      (signal) => api("analyze", { body: form, signal }),
      (result) => {
        setAnalysis(result);
        setActiveTool(
          result.mechanism.type === "external-gear-pair" ? "gears" : "objects",
        );
        setImageIndex(0);
        setSelected(result.observations[0]?.id || null);
        setIncludeImages(false);
        if (result.mechanism.type === "external-gear-pair") {
          const [a, b] = result.mechanism.gears;
          setSetup({
            ...initial,
            driverObservationId: a.observationId,
            followerObservationId: b.observationId,
            driver: a.toothCount === null ? "" : String(a.toothCount),
            follower: b.toothCount === null ? "" : String(b.toothCount),
          });
        }
      },
    );
  }
  function exampleSetup() {
    setActiveTool("gears");
    setAnalysis(null);
    setExample(true);
    setSetup({ ...initial, driver: "12", follower: "24" });
    setPrediction(null);
    setComparison(null);
    setError("");
    setMeasurement({
      turns: "",
      direction: "counterclockwise",
      tolerance: "0.05",
    });
  }
  function swapGears() {
    setSetup((s) => ({
      ...s,
      driver: s.follower,
      follower: s.driver,
      driverObservationId: s.followerObservationId,
      followerObservationId: s.driverObservationId,
      driverConfirmed: false,
      followerConfirmed: false,
    }));
    setMeasurement((m) => ({ ...m, turns: "" }));
    resetDerived();
  }
  function body() {
    return {
      mechanismType: "external-gear-pair",
      driver: { teeth: Number(setup.driver), confirmed: setup.driverConfirmed },
      follower: {
        teeth: Number(setup.follower),
        confirmed: setup.followerConfirmed,
      },
      inputTurns: Number(setup.inputTurns),
      inputDirection: setup.inputDirection,
    };
  }
  const ready =
    setup.driverConfirmed &&
    setup.followerConfirmed &&
    Number(setup.driver) > 0 &&
    Number(setup.follower) > 0 &&
    Number(setup.inputTurns) > 0;
  const image = analysis?.images[imageIndex];
  const observation = analysis?.observations.find((o) => o.id === selected);
  function editObservation(patch) {
    setAnalysis((a) => ({
      ...a,
      observations: a.observations.map((o) =>
        o.id === selected ? updateObservation(o, patch) : o,
      ),
    }));
    setPrediction(null);
    setComparison(null);
  }
  function reviewObservation(patch) {
    setAnalysis((a) => ({
      ...a,
      observations: a.observations.map((o) =>
        o.id === selected ? withReview(o, patch) : o,
      ),
    }));
  }
  function reposition(event) {
    if (!observation || !image || busy) return;
    const r = event.currentTarget.getBoundingClientRect();
    editObservation({
      marker: {
        x: Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)),
        y: Math.min(1, Math.max(0, (event.clientY - r.top) / r.height)),
      },
    });
  }
  function report() {
    return {
      schemaVersion: "1.2",
      exportedAt: new Date().toISOString(),
      mode: analysis ? "live" : example ? "manual-example" : "manual",
      analysis: analysis
        ? {
            ...analysis,
            images: includeImages
              ? analysis.images
              : analysis.images.map(({ id, width, height }) => ({
                  id,
                  width,
                  height,
                })),
          }
        : null,
      setup: prediction ? body() : null,
      physicsTool: physicsReport,
      componentAssignments: {
        driverObservationId: setup.driverObservationId || null,
        followerObservationId: setup.followerObservationId || null,
      },
      prediction,
      comparison,
      predictionInputSource:
        analysis?.mechanism.type === "external-gear-pair"
          ? "User-confirmed counts following model suggestions"
          : "Manual user input, independent of any unsupported object analysis",
      measurementSource: "User reported; not independently verified",
      notice:
        "Object exploration and optional ideal physics experiments. Model suggestions, user edits and self-reported reviews are distinct. Not manufacture-ready CAD. No server-side persistence.",
    };
  }
  return (
    <div
      className="mechanism-lab"
      data-print-images={includeImages ? "yes" : "no"}
    >
      <div className="lab-intro">
        <div>
          <span className="eyebrow">
            <FlaskConical size={14} /> THE GENERAL OBJECT EXPLORER
          </span>
          <h3>
            Your world, <span>understood better.</span>
          </h3>
          <p>
            Explore visible structure, edit a component map, and test supported
            mechanisms with your own measurements.
          </p>
        </div>
        <span className="lab-mode-badge">
          {health?.analysis.configured
            ? "LIVE ADAPTER CONFIGURED"
            : "MANUAL EXPERIMENTS AVAILABLE"}
        </span>
      </div>
      <div className="lab-service">
        <span className="live-dot" />
        <p>
          {health?.analysis.configured
            ? `Image analysis uses ${health.analysis.model}. Recognition and inferred relationships still need your review.`
            : healthError ||
              "Manual physics tools work without AI. Live object exploration needs the server-side Baseten key."}
        </p>
        <button className="quiet-button" onClick={refresh} disabled={!!busy}>
          <RotateCcw size={12} /> Recheck
        </button>
      </div>
      {error && (
        <div className="lab-error" role="alert">
          <AlertCircle size={17} />
          <p>{error}</p>
        </div>
      )}
      <div className="lab-workflow">
        <section className="lab-panel capture-panel" ref={captureTarget}>
          <div className="lab-panel-heading">
            <span>01</span>
            <div>
              <h4>Start with evidence.</h4>
              <p>Upload an object photo or use a manual experiment.</p>
            </div>
            <Camera size={19} />
          </div>
          <fieldset disabled={!!busy}>
            <input
              className="visually-hidden"
              type="file"
              ref={fileInput}
              accept="image/jpeg,image/png,image/webp"
              multiple
              aria-label="Upload object photos for analysis"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <div
              className="lab-upload"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (!busy) addFiles(e.dataTransfer.files);
              }}
            >
              <Upload size={24} />
              <h5>Bring something that makes you curious.</h5>
              <p>
                Photograph an object clearly: a tool, appliance, vehicle, piece
                of furniture, natural object or something unfamiliar.
              </p>
              <button
                className="quiet-button"
                onClick={() => fileInput.current?.click()}
              >
                <Plus size={13} /> Choose photos
              </button>
              <small>1–3 IMAGES · JPEG, PNG, WEBP · 5 MB EACH</small>
            </div>
            <details className="capture-guide">
              <summary>Three angles. Better evidence.</summary>
              <ol>
                <li>
                  <strong>The whole object.</strong> Keep it in focus with even
                  light and room around the edges.
                </li>
                <li>
                  <strong>A second angle.</strong> Photograph the same object
                  from its side or back.
                </li>
                <li>
                  <strong>The detail.</strong> Add a close-up of the joint,
                  label or feature you want to understand.
                </li>
              </ol>
              <p>
                Use up to three views of one object. Include a known reference
                if you want to discuss size; the app does not measure dimensions
                from a photo.
              </p>
            </details>
            {!!files.length && (
              <div className="lab-thumbnails">
                {files.map((f) => (
                  <div key={f.id}>
                    <img src={f.url} alt={f.file.name} />
                    <button
                      aria-label={`Remove mechanism photo ${f.file.name}`}
                      onClick={() => removeFile(f.id)}
                    >
                      <X size={12} />
                    </button>
                    <span>{f.file.name}</span>
                  </div>
                ))}
              </div>
            )}
            <label className="lab-label">
              What are you investigating?
              <textarea
                value={context}
                maxLength={1000}
                onChange={(e) => setContext(e.target.value)}
                placeholder="For example: explain the visible parts of this chair, and how the supports connect."
              />
            </label>
            <label className="lab-check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I agree to send these photos and context to the configured
                inference provider. The app does not persist them on the server.
              </span>
            </label>
            <button
              className="button-lime lab-wide"
              disabled={
                !files.length ||
                !consent ||
                !health?.analysis.configured ||
                !!busy
              }
              onClick={analyze}
            >
              {busy === "analysis" ? (
                <Loader2 className="spin" size={15} />
              ) : (
                <Camera size={15} />
              )}{" "}
              Analyze my photos <ArrowUpRight size={16} />
            </button>
          </fieldset>
          {busy === "analysis" && (
            <button className="quiet-button lab-cancel" onClick={cancel}>
              Cancel analysis
            </button>
          )}
          <div className="manual-invitation">
            <Settings2 size={19} />
            <div>
              <strong>No AI key needed to experiment.</strong>
              <p>
                Enter your own confirmed counts below, or load a labeled
                numerical example.
              </p>
            </div>
            <button onClick={exampleSetup} disabled={!!busy}>
              Load gear example <ArrowUpRight size={14} />
            </button>
          </div>
        </section>
        <section className="lab-panel setup-panel">
          {activeTool === "gears" ? (
            <>
              <button
                className="quiet-button back-to-objects"
                onClick={() => setActiveTool("objects")}
              >
                Back to object discovery
              </button>
              <div className="lab-panel-heading">
                <span>02</span>
                <div>
                  <h4>Turn observations into a prediction.</h4>
                  <p>
                    {analysis?.mechanism.type === "unsupported"
                      ? "This object has no supported gear-pair prediction. Start a separate manual pair below."
                      : example
                        ? "Numerical example · no image analysis or physical test has occurred."
                        : "Only directly meshing, external gear pairs are supported."}
                  </p>
                </div>
                <Settings2 size={19} />
              </div>
              <div className="lab-gear-drawing">
                <svg
                  viewBox="0 0 400 220"
                  role="img"
                  aria-label="Symbolic gear pair, not an exact tooth profile or scale drawing"
                >
                  <defs>
                    <pattern
                      id="lab-dots"
                      width="15"
                      height="15"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="1" cy="1" r=".7" fill="#b6d68c22" />
                    </pattern>
                  </defs>
                  <rect width="400" height="220" fill="url(#lab-dots)" />
                  <path
                    d={gearPath(141, 105, 44, Number(setup.driver))}
                    fill="#a6cc6e13"
                    stroke="#b6d68c"
                  />
                  <path
                    d={gearPath(249, 105, 66, Number(setup.follower))}
                    fill="#a6cc6e0a"
                    stroke="#9bbb7f"
                  />
                  <circle
                    cx="141"
                    cy="105"
                    r="8"
                    fill="none"
                    stroke="#b6d68c"
                  />
                  <circle
                    cx="249"
                    cy="105"
                    r="10"
                    fill="none"
                    stroke="#b6d68c"
                  />
                  <text
                    x="141"
                    y="174"
                    textAnchor="middle"
                    fill="#cce8ab"
                    fontSize="11"
                  >
                    DRIVER / {setup.driver || "?"}
                  </text>
                  <text
                    x="249"
                    y="190"
                    textAnchor="middle"
                    fill="#abc491"
                    fontSize="11"
                  >
                    FOLLOWER / {setup.follower || "?"}
                  </text>
                  <text
                    x="200"
                    y="213"
                    textAnchor="middle"
                    fill="#8aa674"
                    fontSize="7"
                  >
                    SYMBOLIC DIAGRAM · NOT TO SCALE
                  </text>
                </svg>
              </div>
              <div className="gear-assignment">
                <p>
                  {analysis?.mechanism.type === "external-gear-pair"
                    ? `Driver: ${analysis.observations.find((o) => o.id === setup.driverObservationId)?.name || "Choose manually"} · Follower: ${analysis.observations.find((o) => o.id === setup.followerObservationId)?.name || "Choose manually"}`
                    : "The driver is the gear you turn. The follower is the gear it turns."}
                </p>
                <button
                  className="quiet-button"
                  onClick={swapGears}
                  disabled={!!busy}
                >
                  Swap driver / follower
                </button>
              </div>
              <fieldset disabled={!!busy}>
                <div className="lab-field-grid">
                  <label className="lab-label">
                    Driver teeth
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      step="1"
                      value={setup.driver}
                      onChange={(e) => update("driver", e.target.value)}
                    />
                  </label>
                  <label className="lab-label">
                    Follower teeth
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      step="1"
                      value={setup.follower}
                      onChange={(e) => update("follower", e.target.value)}
                    />
                  </label>
                </div>
                <label className="lab-check">
                  <input
                    type="checkbox"
                    checked={setup.driverConfirmed}
                    onChange={(e) =>
                      update("driverConfirmed", e.target.checked)
                    }
                  />
                  <span>I confirmed the driver tooth count.</span>
                </label>
                <label className="lab-check">
                  <input
                    type="checkbox"
                    checked={setup.followerConfirmed}
                    onChange={(e) =>
                      update("followerConfirmed", e.target.checked)
                    }
                  />
                  <span>
                    I confirmed the follower tooth count and direct external
                    contact.
                  </span>
                </label>
                <div className="lab-field-grid">
                  <label className="lab-label">
                    Input turns
                    <input
                      type="number"
                      min="0.001"
                      max="100000"
                      step="any"
                      value={setup.inputTurns}
                      onChange={(e) => update("inputTurns", e.target.value)}
                    />
                  </label>
                  <label className="lab-label">
                    Input direction
                    <select
                      aria-label="Input direction"
                      value={setup.inputDirection}
                      onChange={(e) => update("inputDirection", e.target.value)}
                    >
                      <option value="clockwise">Clockwise</option>
                      <option value="counterclockwise">Counterclockwise</option>
                    </select>
                  </label>
                </div>
                <p className="lab-help">
                  View both gears from the same side. Counts require your
                  confirmation; changing them invalidates previous results.
                </p>
                <button
                  className="button-lime lab-wide"
                  disabled={!ready || !!busy}
                  onClick={() =>
                    run(
                      "predict",
                      (signal) => api("predict", { body: body(), signal }),
                      (result) => {
                        setPrediction(result);
                        setComparison(null);
                      },
                    )
                  }
                >
                  {busy === "predict" ? (
                    <Loader2 className="spin" size={15} />
                  ) : (
                    <MoveRight size={15} />
                  )}{" "}
                  Compute prediction
                </button>
              </fieldset>
            </>
          ) : (
            <fieldset disabled={!!busy}>
              <ObjectOverview
                analysis={analysis}
                onSuggest={setContext}
                onGearTool={() => setActiveTool("gears")}
              />
            </fieldset>
          )}
        </section>
      </div>
      {analysis && (
        <section className="lab-panel analysis-panel" ref={resultTarget}>
          <div className="lab-panel-heading">
            <span>AI</span>
            <div>
              <h4>{analysis.objectName}</h4>
              <p>
                {analysis.provenance.provider} / {analysis.provenance.model} ·
                model suggestions need confirmation
              </p>
            </div>
          </div>
          <p className="analysis-summary">{analysis.summary}</p>
          <span className="object-category-badge">
            {analysis.category || "other"} /{" "}
            {analysis.recognition || "identified"}
          </span>
          <Suspense
            fallback={<p className="lab-help">Loading the component map…</p>}
          >
            <ComponentGraph
              analysis={analysis}
              selected={selected}
              onSelect={(id) => {
                setSelected(id);
                const found = analysis.observations.find((o) => o.id === id);
                if (found)
                  setImageIndex(
                    analysis.images.findIndex((i) => i.id === found.imageId),
                  );
              }}
              onRelationshipsChange={(relationships) => {
                setAnalysis((a) => ({ ...a, relationships }));
                setPrediction(null);
                setComparison(null);
                setMeasurement((m) => ({ ...m, turns: "" }));
              }}
              onLayoutChange={(graphLayout) =>
                setAnalysis((a) => ({ ...a, graphLayout }))
              }
            />
          </Suspense>
          <h5 className="lab-subheading">
            Photographic evidence & corrections
          </h5>
          <div className="analysis-workspace">
            <div>
              <div className="filter-pills">
                {analysis.images.map((im, i) => (
                  <button
                    key={im.id}
                    aria-pressed={imageIndex === i}
                    className={imageIndex === i ? "active" : ""}
                    onClick={() => {
                      setImageIndex(i);
                      setSelected(
                        analysis.observations.find((o) => o.imageId === im.id)
                          ?.id || null,
                      );
                    }}
                  >
                    Image {i + 1}
                  </button>
                ))}
              </div>
              <div className="evidence-image" onClick={reposition}>
                <img
                  src={image.dataUrl}
                  alt="Your normalized object photo with editable component markers"
                />
                {analysis.observations
                  .filter((o) => o.imageId === image.id)
                  .map((o, i) => (
                    <button
                      key={o.id}
                      style={{
                        left: `${o.marker.x * 100}%`,
                        top: `${o.marker.y * 100}%`,
                      }}
                      className={o.id === selected ? "selected" : ""}
                      aria-label={`Inspect ${o.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(o.id);
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
              </div>
              <p className="lab-help">
                Select a marker, then click the image to move it. You can also
                edit its coordinates below.
              </p>
            </div>
            <div>
              <div className="live-observations">
                {analysis.observations.map((o) => (
                  <button
                    className={selected === o.id ? "selected" : ""}
                    key={o.id}
                    onClick={() => {
                      setSelected(o.id);
                      setImageIndex(
                        analysis.images.findIndex((im) => im.id === o.imageId),
                      );
                    }}
                  >
                    <strong>{o.name}</strong>
                    <span>{o.source}</span>
                    <p>{o.evidence}</p>
                    {o.function && (
                      <p className="part-function">
                        Suggested role: {o.function}
                      </p>
                    )}
                  </button>
                ))}
              </div>
              {observation && (
                <div className="observation-editor">
                  <label className="lab-label">
                    Component label
                    <input
                      value={observation.name}
                      maxLength={150}
                      onChange={(e) =>
                        editObservation({ name: e.target.value })
                      }
                    />
                  </label>
                  <label className="lab-label">
                    Visible evidence
                    <textarea
                      aria-label="Visible evidence"
                      maxLength={1000}
                      value={observation.evidence}
                      onChange={(e) =>
                        editObservation({ evidence: e.target.value })
                      }
                    />
                  </label>
                  <label className="lab-label">
                    Suggested role / function
                    <textarea
                      aria-label="Suggested role / function"
                      maxLength={700}
                      value={observation.function || ""}
                      onChange={(e) =>
                        editObservation({ function: e.target.value })
                      }
                    />
                  </label>
                  <div className="lab-field-grid">
                    {["x", "y"].map((axis) => (
                      <label className="lab-label" key={axis}>
                        Marker {axis.toUpperCase()} (0–1)
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.01"
                          value={observation.marker[axis]}
                          onChange={(e) => {
                            if (e.target.value !== "")
                              editObservation({
                                marker: {
                                  ...observation.marker,
                                  [axis]: Math.max(
                                    0,
                                    Math.min(1, Number(e.target.value)),
                                  ),
                                },
                              });
                          }}
                        />
                      </label>
                    ))}
                  </div>
                  <div className="part-review">
                    <span className="eyebrow">YOUR REVIEW / SELF-REPORTED</span>
                    <label className="lab-label">
                      Review selected component
                      <select
                        aria-label="Review selected component"
                        value={observation.review?.status || "pending"}
                        onChange={(e) =>
                          reviewObservation({ status: e.target.value })
                        }
                      >
                        {Object.entries(reviewLabels).map(([value, label]) => (
                          <option value={value} key={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="lab-label">
                      My evidence notes
                      <textarea
                        aria-label="My evidence notes"
                        value={observation.review?.notes || ""}
                        maxLength={1000}
                        placeholder="What matches, what seems wrong, or what another view could clarify."
                        onChange={(e) =>
                          reviewObservation({ notes: e.target.value })
                        }
                      />
                    </label>
                    <p className="lab-help">
                      Editing the component resets its review. The original
                      model suggestion is retained in the report.
                    </p>
                    {observation.modelSuggestion && (
                      <details>
                        <summary>Original model suggestion</summary>
                        <strong>{observation.modelSuggestion.name}</strong>
                        <p>{observation.modelSuggestion.evidence}</p>
                        <p>{observation.modelSuggestion.function}</p>
                      </details>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="lab-field-grid">
            <div>
              <h5 className="lab-subheading">Internal hypotheses</h5>
              {analysis.hypotheses.length ? (
                analysis.hypotheses.map((h, i) => (
                  <div className="hypothesis-card" key={i}>
                    <strong>{h.name}</strong>
                    <p>{h.basis}</p>
                    <small>To verify: {h.verificationNeeded}</small>
                  </div>
                ))
              ) : (
                <p className="lab-help">
                  No internal hypotheses were proposed.
                </p>
              )}
            </div>
            <div>
              <h5 className="lab-subheading">What remains unknown</h5>
              <ul className="unknown-list">
                {analysis.unknowns.map((u, i) => (
                  <li key={i}>{u}</li>
                ))}
              </ul>
            </div>
          </div>
          <EvidenceNotebook
            analysis={analysis}
            onChange={(followUpNotes) =>
              setAnalysis((a) => ({ ...a, followUpNotes }))
            }
            onCapture={() =>
              captureTarget.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              })
            }
          />
        </section>
      )}
      {prediction && (
        <section className="lab-panel prediction-panel" aria-live="polite">
          <div className="prediction-summary">
            <div>
              <span className="eyebrow">COMPUTED / NOT AI-GENERATED</span>
              <h4>
                {prediction.outputTurns.toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })}
                <span>output turns</span>
              </h4>
              <p>
                {prediction.outputDirection} · signed ratio{" "}
                {prediction.signedRatio.toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })}
              </p>
            </div>
            <div className="prediction-equation">
              <code>{prediction.equation}</code>
              <p>{prediction.convention}</p>
            </div>
          </div>
          <ul className="unknown-list">
            {prediction.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <div className="experiment-instructions">
            <FlaskConical size={20} />
            <div>
              <h5>Now test it in the real world.</h5>
              <p>
                Mark both gears. Slowly turn the driver {setup.inputTurns} full
                turns {setup.inputDirection}, and count the follower’s turns
                from the same viewpoint. Stop if the hand-powered assembly
                binds. Record what you observe, including zero movement.
              </p>
            </div>
          </div>
          <fieldset disabled={!!busy}>
            <div className="lab-measure-fields">
              <label className="lab-label">
                Measured output turns
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  step="any"
                  value={measurement.turns}
                  onChange={(e) => {
                    setMeasurement((m) => ({ ...m, turns: e.target.value }));
                    setComparison(null);
                  }}
                />
              </label>
              <label className="lab-label">
                Measured direction
                <select
                  aria-label="Measured direction"
                  value={measurement.direction}
                  onChange={(e) => {
                    setMeasurement((m) => ({
                      ...m,
                      direction: e.target.value,
                    }));
                    setComparison(null);
                  }}
                >
                  <option value="counterclockwise">Counterclockwise</option>
                  <option value="clockwise">Clockwise</option>
                </select>
              </label>
              <label className="lab-label">
                Tolerance (turns)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={measurement.tolerance}
                  onChange={(e) => {
                    setMeasurement((m) => ({
                      ...m,
                      tolerance: e.target.value,
                    }));
                    setComparison(null);
                  }}
                />
              </label>
            </div>
            <p className="lab-help">
              These are user-reported measurements. Two still images cannot
              establish complete rotations. Your declared absolute tolerance
              determines agreement.
            </p>
            <button
              className="button-lime"
              disabled={
                measurement.turns === "" ||
                measurement.tolerance === "" ||
                !!busy
              }
              onClick={() =>
                run(
                  "compare",
                  (signal) =>
                    api("compare", {
                      body: {
                        setup: body(),
                        measurement: {
                          outputTurns: Number(measurement.turns),
                          outputDirection: measurement.direction,
                          tolerance: Number(measurement.tolerance),
                        },
                      },
                      signal,
                    }),
                  setComparison,
                )
              }
            >
              {busy === "compare" ? (
                <Loader2 className="spin" size={15} />
              ) : (
                <FlaskConical size={15} />
              )}{" "}
              Compare with prediction
            </button>
          </fieldset>
          {comparison && (
            <div
              className={`comparison-result ${comparison.withinTolerance ? "agreement" : "discrepancy"}`}
            >
              <span>
                {comparison.withinTolerance ? (
                  <Check size={19} />
                ) : (
                  <AlertCircle size={19} />
                )}
              </span>
              <div>
                <h5>
                  {comparison.withinTolerance
                    ? "Within your declared tolerance"
                    : "A discrepancy worth investigating"}
                </h5>
                <p>
                  Predicted:{" "}
                  {comparison.prediction.signedOutputTurns.toFixed(4)} turns ·
                  measured: {comparison.measuredSignedTurns.toFixed(4)} turns ·
                  absolute error: {comparison.absoluteErrorTurns.toFixed(4)}{" "}
                  turns.
                </p>
                <ul>
                  {comparison.nextChecks.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>
      )}
      <PhysicsBench
        key={analysis?.id || "manual"}
        onReport={setPhysicsReport}
      />
      {(analysis || prediction || physicsReport) && (
        <section className="lab-export">
          <div>
            <span className="eyebrow">KEEP THE EVIDENCE</span>
            <h4>Your exploration, documented.</h4>
            <p>
              Inputs, assumptions, tool versions, model provenance and
              user-reported results. No server-side storage.
            </p>
            {analysis && (
              <label className="lab-check">
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                />
                <span>Include my normalized photos in downloads.</span>
              </label>
            )}
          </div>
          <div className="export-buttons">
            <button
              className="quiet-button"
              onClick={() =>
                downloadFile(
                  "realitylab-exploration.md",
                  makeExplorationMarkdown(report()),
                  "text/markdown;charset=utf-8",
                )
              }
            >
              <Download size={15} /> Readable report
            </button>
            <button
              className="quiet-button"
              onClick={() =>
                downloadFile(
                  "realitylab-experiment.json",
                  JSON.stringify(report(), null, 2),
                  "application/json",
                )
              }
            >
              <Download size={15} /> JSON report
            </button>
            <button
              className="quiet-button"
              disabled={!analysis && !prediction}
              onClick={() =>
                downloadFile(
                  "realitylab-evidence.svg",
                  makeReportSvg({
                    analysis,
                    prediction,
                    comparison,
                    includeImages,
                  }),
                  "image/svg+xml",
                )
              }
            >
              <Download size={15} /> SVG report
            </button>
            <button className="quiet-button" onClick={() => window.print()}>
              Print / PDF
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

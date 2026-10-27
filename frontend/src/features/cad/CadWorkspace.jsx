import { useEffect, useRef, useState } from "react";
import {
  Box,
  Upload,
  RotateCcw,
  Download,
  Plus,
  Minus,
  Layers3,
  Scissors,
  ExternalLink,
} from "lucide-react";
import { createCadViewer } from "../../lib/createCadViewer";
import { CAD_FILE_LIMIT } from "../../lib/cadFiles";
import { downloadFile } from "../../lib/exportReport";
export default function CadWorkspace() {
  const host = useRef(null),
    engine = useRef(null),
    input = useRef(null),
    alive = useRef(false),
    request = useRef(0);
  const [report, setReport] = useState(null),
    [error, setError] = useState(""),
    [failed, setFailed] = useState(false),
    [loading, setLoading] = useState(false),
    [selected, setSelected] = useState(null),
    [wire, setWire] = useState(false),
    [explode, setExplode] = useState(0),
    [axis, setAxis] = useState("off"),
    [cut, setCut] = useState(0.5),
    [view, setView] = useState("iso");
  function resetState() {
    setSelected(null);
    setWire(false);
    setExplode(0);
    setAxis("off");
    setCut(0.5);
    setView("iso");
  }
  useEffect(() => {
    alive.current = true;
    const viewer = createCadViewer(host.current, {
      onSelect: (id) => setSelected(id),
      onFailure: () => {
        if (alive.current) setFailed(true);
      },
    });
    engine.current = viewer;
    const initial = viewer.example?.();
    if (initial) setReport(initial);
    return () => {
      alive.current = false;
      viewer.dispose();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    engine.current?.select?.(selected);
  }, [selected]);
  useEffect(() => {
    engine.current?.setWireframe?.(wire);
  }, [wire]);
  useEffect(() => {
    engine.current?.setExplode?.(explode);
  }, [explode]);
  useEffect(() => {
    engine.current?.setSection?.(axis, cut);
  }, [axis, cut]);
  useEffect(() => {
    engine.current?.setView?.(view);
  }, [view]);
  async function loadFile(file) {
    if (!file) return;
    if (file.size > CAD_FILE_LIMIT) {
      setError("Use a GLB or STL file of at most 20 MB.");
      return;
    }
    const id = ++request.current;
    setLoading(true);
    setError("");
    try {
      const bytes = await file.arrayBuffer();
      if (!alive.current || id !== request.current) return;
      const result = await engine.current.load(bytes, file.name);
      if (alive.current && id === request.current && result) {
        resetState();
        setReport(result);
      }
    } catch (e) {
      if (alive.current && id === request.current)
        setError(e.message || "The model could not be loaded.");
    } finally {
      if (alive.current && id === request.current) setLoading(false);
    }
  }
  async function loadPiCar() {
    const id = ++request.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${import.meta.env.BASE_URL}models/picar-reference-chassis.stl`,
      );
      if (!response.ok)
        throw Error("The PiCar reference model is unavailable.");
      const bytes = await response.arrayBuffer();
      if (!alive.current || id !== request.current) return;
      const result = await engine.current.load(
        bytes,
        "PiCar reference chassis - obsolete design.stl",
      );
      if (alive.current && result) {
        resetState();
        setReport(result);
      }
    } catch (e) {
      if (alive.current) setError(e.message);
    } finally {
      if (alive.current) setLoading(false);
    }
  }
  function loadExample() {
    request.current++;
    setError("");
    resetState();
    const result = engine.current?.example?.();
    if (result) setReport(result);
  }
  function resetView() {
    resetState();
    engine.current?.setWireframe?.(false);
    engine.current?.setExplode?.(0);
    engine.current?.setSection?.("off", 0.5);
    engine.current?.select?.(null);
    engine.current?.setView?.("iso");
  }
  return (
    <section className="model-studio" aria-labelledby="model-studio-title">
      <div className="model-studio-heading">
        <div>
          <span className="eyebrow">
            <Box size={14} /> THE MODEL INSPECTOR
          </span>
          <h3 id="model-studio-title">Turn the geometry around.</h3>
          <p>
            Open an existing model. Inspect its parts, separate a multi-part
            assembly, or take a section through the mesh.
          </p>
        </div>
        <button
          className="button-lime"
          disabled={failed || loading}
          onClick={() => input.current?.click()}
        >
          <Upload size={15} /> Open GLB or STL
        </button>
        <input
          ref={input}
          type="file"
          accept=".glb,.stl"
          className="visually-hidden"
          aria-label="Import a GLB or STL model"
          disabled={failed || loading}
          onChange={(e) => {
            loadFile(e.target.files[0]);
            e.target.value = "";
          }}
        />
      </div>
      <div className="model-source-row">
        <span>START WITH A REFERENCE</span>
        <button
          className="quiet-button"
          disabled={failed || loading}
          onClick={loadExample}
        >
          Text23D cube study
        </button>
        <button
          className="quiet-button"
          disabled={failed || loading}
          onClick={loadPiCar}
        >
          PiCar chassis reference
        </button>
        <span className="model-local-badge">
          LOCAL MODEL VIEWING / NO AI CALL
        </span>
      </div>
      {error && (
        <p role="alert" className="model-error">
          {error}
        </p>
      )}
      <div className="model-workspace">
        <aside className="model-part-list">
          <span className="micro-label">
            MESH PARTS / {report?.partCount || 0}
          </span>
          <button
            className={!selected ? "selected" : ""}
            onClick={() => setSelected(null)}
            disabled={failed || loading}
          >
            Entire model
          </button>
          {report?.parts.map((part) => (
            <button
              key={part.id}
              aria-pressed={selected === part.id}
              className={selected === part.id ? "selected" : ""}
              disabled={failed || loading}
              onClick={() => setSelected(part.id)}
            >
              <Box size={14} />
              <span>
                {part.name}
                <small>{part.triangles.toLocaleString()} triangles</small>
              </span>
            </button>
          ))}
        </aside>
        <div className="model-viewport">
          <div className="model-canvas" ref={host} />
          {(failed || loading) && (
            <div className="model-overlay" role="status">
              {failed
                ? "3D rendering is unavailable in this browser. Try another browser or device."
                : "Preparing your model…"}
            </div>
          )}
          <span className="model-viewport-note">
            NEUTRAL SURFACE PREVIEW · DRAG TO ORBIT
          </span>
          <div className="model-view-controls">
            {["iso", "top", "front"].map((v) => (
              <button
                key={v}
                className={view === v ? "selected" : ""}
                aria-pressed={view === v}
                disabled={failed || loading}
                onClick={() => setView(v)}
              >
                {v === "iso" ? "Isometric" : v === "top" ? "Top" : "Front"}
              </button>
            ))}
          </div>
          <div className="model-zoom">
            <button
              className="quiet-button"
              aria-label="Zoom out model"
              disabled={failed || loading}
              onClick={() => engine.current?.zoom?.("out")}
            >
              <Minus size={15} />
            </button>
            <button
              className="quiet-button"
              aria-label="Reset model inspection"
              disabled={failed || loading}
              onClick={resetView}
            >
              <RotateCcw size={15} />
            </button>
            <button
              className="quiet-button"
              aria-label="Zoom in model"
              disabled={failed || loading}
              onClick={() => engine.current?.zoom?.("in")}
            >
              <Plus size={15} />
            </button>
          </div>
        </div>
        <aside className="model-inspector">
          <span className="micro-label">VIEW OPTIONS</span>
          <label className="lab-check">
            <input
              type="checkbox"
              disabled={failed || loading}
              checked={wire}
              onChange={(e) => setWire(e.target.checked)}
            />
            <span>
              <Layers3 size={14} /> Wireframe model
            </span>
          </label>
          <label className="lab-label">
            Visual separation
            <input
              aria-label="Model visual separation"
              type="range"
              min="0"
              max="1"
              step=".01"
              disabled={failed || loading || report?.partCount < 2}
              value={explode}
              onChange={(e) => setExplode(Number(e.target.value))}
            />
          </label>
          <p className="lab-help">
            {report?.partCount < 2
              ? "This model is a single mesh. Separate part nodes are needed for an exploded view."
              : "Visual separation only. Directions do not represent a verified assembly or maintenance sequence."}
          </p>
          <label className="lab-label">
            <span>
              <Scissors size={13} /> Section axis
            </span>
            <select
              aria-label="Model section axis"
              disabled={failed || loading}
              value={axis}
              onChange={(e) => setAxis(e.target.value)}
            >
              <option value="off">No section</option>
              <option value="x">Viewer X</option>
              <option value="y">Viewer Y</option>
              <option value="z">Viewer Z</option>
            </select>
          </label>
          <label className="lab-label">
            Section position
            <input
              aria-label="Model section position"
              type="range"
              min=".05"
              max=".95"
              step=".01"
              disabled={axis === "off" || failed || loading}
              value={cut}
              onChange={(e) => setCut(Number(e.target.value))}
            />
          </label>
          <p className="lab-help">
            Open mesh section; cut faces are not capped. A section is not
            evidence of real wall thickness.
          </p>
          {report && (
            <div className="model-measurements">
              <strong>{report.triangles.toLocaleString()}</strong>
              <span>MEASURED TRIANGLES</span>
              <h4>Viewer bounds</h4>
              {["X", "Y", "Z"].map((a, i) => (
                <p key={a}>
                  <span>{a}</span>
                  <code>
                    {report.bounds[i].toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}
                  </code>
                </p>
              ))}
              <small>
                Model coordinates. Verify physical units with the author. STL is
                displayed Z-up.
              </small>
            </div>
          )}
        </aside>
      </div>
      <div className="model-summary">
        <div>
          <strong>{report?.name || "Model inspection"}</strong>
          <p>
            GLB/STL exports from Text23D and other CAD tools are supported. Use
            static, untextured, self-contained triangle meshes, up to 20 MB and
            500,000 triangles. Photos are not converted into 3D here.
          </p>
        </div>
        <div className="model-downloads">
          <button
            className="quiet-button"
            disabled={!report || failed || loading}
            onClick={() => engine.current?.still?.()}
          >
            <Download size={14} /> Model PNG
          </button>
          <button
            className="quiet-button"
            disabled={!report || failed || loading}
            onClick={() =>
              downloadFile(
                "realitylab-mesh-inspection.json",
                JSON.stringify(
                  {
                    ...engine.current.inspection(),
                    exportedAt: new Date().toISOString(),
                  },
                  null,
                  2,
                ),
                "application/json",
              )
            }
          >
            <Download size={14} /> Mesh report
          </button>
        </div>
      </div>
      <div className="model-provenance">
        <p>
          <a
            href="https://github.com/zqf3229294/Text23D"
            target="_blank"
            rel="noreferrer"
          >
            Text23D <ExternalLink size={11} />
          </a>{" "}
          viewer adaptation ·{" "}
          <a
            href="https://github.com/Aihua96/cad-showcase-studio"
            target="_blank"
            rel="noreferrer"
          >
            CAD Showcase Studio <ExternalLink size={11} />
          </a>{" "}
          assembly guidance ·{" "}
          <a
            href="https://github.com/xz-group/PiCar"
            target="_blank"
            rel="noreferrer"
          >
            PiCar <ExternalLink size={11} />
          </a>{" "}
          reference geometry ·{" "}
          <a href="#design-studio">Loböle-inspired lighting study above</a>.
        </p>
        <a href="/models/text23d-cube-with-hole.py" download>
          Download Text23D CadQuery example
        </a>
        <a
          href="/licenses/model-inspector-notices.txt"
          target="_blank"
          rel="noreferrer"
        >
          Open-source notices
        </a>
        <p>
          The Text23D cube is a browser mesh adaptation of its example script,
          not a generated STEP solid. PiCar’s included chassis is an obsolete
          reference design; no robot hardware or remote control is connected.
        </p>
      </div>
    </section>
  );
}

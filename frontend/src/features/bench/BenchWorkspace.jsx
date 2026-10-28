import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Camera,
  ArrowRight,
  FlaskConical,
  Download,
  Save,
  Upload,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  benchProjectSchema,
  evaluateBench,
  benchMarkdown,
} from "../../../../shared/bench.js";
import { api } from "../../lib/api";
import { downloadFile } from "../../lib/exportReport";
const blank = {
  driver: "",
  follower: "",
  inputTurns: "1",
  inputDirection: "clockwise",
  load: "",
  effortArm: "",
  loadArm: "",
  strands: "",
  lift: "",
};
const examples = {
  gears: { ...blank, driver: "12", follower: "24" },
  lever: { ...blank, load: "2", effortArm: "0.2", loadArm: "0.1" },
  pulley: { ...blank, load: "2", strands: "2", lift: "0.1" },
};
const labels = {
  driver: "Driver tooth count",
  follower: "Follower tooth count",
  inputTurns: "Input turns",
  load: "Load force (N)",
  effortArm: "Effort moment arm (m)",
  loadArm: "Load moment arm (m)",
  strands: "Load-supporting rope strands",
  lift: "Desired load lift (m)",
};
const fmt = (n) =>
  Number(n).toLocaleString(undefined, { maximumFractionDigits: 5 });
const storageKey = "realitylab-bench-project-v1";
export default function BenchWorkspace({ source, onSourceChange, onScan }) {
  const [model, setModel] = useState("gears"),
    [draft, setDraft] = useState({ ...blank }),
    [title, setTitle] = useState("My tabletop experiment"),
    [confirmed, setConfirmed] = useState(false),
    [observed, setObserved] = useState(""),
    [tolerance, setTolerance] = useState("0.05"),
    [direction, setDirection] = useState("counterclockwise"),
    [measurementConfirmed, setMeasurementConfirmed] = useState(false),
    [notes, setNotes] = useState(""),
    [result, setResult] = useState(null),
    [trials, setTrials] = useState([]),
    [review, setReview] = useState(null),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const file = useRef(null),
    controller = useRef(null),
    request = useRef(0);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    // A newly selected photo context invalidates an in-flight investigation.
    controller.current?.abort();
    request.current++;
    setBusy("");
    setReview(null);
    setResult(null);
    setConfirmed(false);
    setMeasurementConfirmed(false);
    setConsent(false);
  }, [source]);
  function invalidate() {
    setConsent(false);
    setConfirmed(false);
    setMeasurementConfirmed(false);
    setResult(null);
    setReview(null);
    setObserved("");
    setError("");
    setMessage("");
  }
  function setup() {
    return model === "gears"
      ? {
          mechanismType: "external-gear-pair",
          driver: { teeth: Number(draft.driver), confirmed },
          follower: { teeth: Number(draft.follower), confirmed },
          inputTurns: Number(draft.inputTurns),
          inputDirection: draft.inputDirection,
        }
      : model === "lever"
        ? {
            tool: "lever",
            loadNewtons: Number(draft.load),
            effortArmMeters: Number(draft.effortArm),
            loadArmMeters: Number(draft.loadArm),
            confirmed,
          }
        : {
            tool: "pulley",
            loadNewtons: Number(draft.load),
            supportingStrands: Number(draft.strands),
            liftMeters: Number(draft.lift),
            confirmed,
          };
  }
  const required =
    model === "gears"
      ? ["driver", "follower", "inputTurns"]
      : model === "lever"
        ? ["load", "effortArm", "loadArm"]
        : ["load", "strands", "lift"];
  const missing = required.filter((k) => !draft[k].trim());
  let ready = false;
  try {
    if (!missing.length) {
      evaluateBench({ setup: setup() });
      ready = true;
    }
  } catch {
    /* Invalid or unconfirmed setup stays blocked. */
  }
  function measurement() {
    return {
      value: Number(observed),
      tolerance: Number(tolerance),
      ...(model === "gears" ? { direction } : {}),
      confirmed: measurementConfirmed,
    };
  }
  function project() {
    return benchProjectSchema.parse({
      schemaVersion: "realitylab-bench-1",
      title,
      model,
      draft,
      source,
      working: { value: observed, tolerance, direction, notes },
      trials,
    });
  }
  function restore(raw) {
    const p = benchProjectSchema.parse(raw);
    setModel(p.model);
    setDraft(p.draft);
    setTitle(p.title);
    setTrials(p.trials);
    onSourceChange(p.source);
    invalidate();
    setNotes(p.working?.notes || "");
    setObserved(p.working?.value || "");
    setTolerance(p.working?.tolerance || "0.05");
    setDirection(p.working?.direction || "counterclockwise");
    setConsent(false);
    setMessage(
      "Project restored. Recheck the current setup before predicting. Trial history is preserved.",
    );
  }
  async function run(kind, work) {
    const id = ++request.current;
    controller.current?.abort();
    const ac = new AbortController();
    controller.current = ac;
    setBusy(kind);
    setError("");
    setMessage("");
    try {
      await work(ac.signal, id);
    } catch (e) {
      if (id === request.current && e.name !== "AbortError")
        setError(e.message);
    } finally {
      if (id === request.current) setBusy("");
    }
  }
  async function predict() {
    await run("predict", async (signal, id) => {
      const r = await api("bench/evaluate", {
        body: { setup: setup() },
        signal,
      });
      if (id === request.current) {
        setResult(r);
        setReview(null);
      }
    });
  }
  async function record() {
    await run("compare", async (signal, id) => {
      const s = setup(),
        m = measurement();
      const r = await api("bench/evaluate", {
        body: { setup: s, measurement: m },
        signal,
      });
      if (id !== request.current) return;
      const trialId = crypto.randomUUID();
      setResult({ ...r, trialId });
      setReview(null);
      setTrials((t) => [
        ...t,
        {
          id: trialId,
          recordedAt: new Date().toISOString(),
          setup: s,
          measurement: m,
          notes,
          source,
        },
      ]);
      setMeasurementConfirmed(false);
      setMessage(
        "Trial recorded as your reported measurement. Repeat or revise one input to investigate.",
      );
    });
  }
  async function investigate() {
    await run("ai", async (signal, id) => {
      const r = await api("bench/review", {
        body: {
          setup: setup(),
          measurement: result?.measurement || null,
          notes,
          source,
          consent,
        },
        signal,
      });
      if (id === request.current) {
        setReview(r);
        if (result?.trialId)
          setTrials((ts) =>
            ts.map((t) =>
              t.id === result.trialId
                ? {
                    ...t,
                    investigation: {
                      review: r.review,
                      notes,
                      provider: r.provenance.provider,
                      model: r.provenance.model,
                      reviewedAt: r.provenance.reviewedAt,
                    },
                  }
                : t,
            ),
          );
      }
    });
  }
  function newProject() {
    setModel("gears");
    setDraft({ ...blank });
    setTitle("My tabletop experiment");
    setTrials([]);
    setNotes("");
    onSourceChange(null);
    invalidate();
    setMessage("New experiment started. Any saved device copy is unchanged.");
  }
  function exportProject() {
    try {
      downloadFile(
        "realitylab-bench.json",
        JSON.stringify(project(), null, 2),
        "application/json",
      );
    } catch {
      setError("The project could not be exported.");
    }
  }
  async function importProject(f) {
    if (!f) return;
    try {
      if (f.size > 4 * 1024 * 1024) throw Error();
      restore(JSON.parse(await f.text()));
    } catch {
      setError(
        "Choose a valid RealityLab Bench JSON project under 4 MB. The current project was kept.",
      );
    }
  }
  function sample() {
    invalidate();
    setDraft(examples[model]);
    setMessage(
      "Example inputs loaded. No physical test has occurred. Confirm only after checking these values against your own setup.",
    );
  }
  return (
    <section className="bench-workspace" aria-labelledby="bench-title">
      <div className="bench-top">
        <div>
          <span className="eyebrow">
            <FlaskConical size={15} /> REALITYLAB BENCH
          </span>
          <h3 id="bench-title">
            Predict. Measure.
            <br />
            <em>Find out why.</em>
          </h3>
          <p>
            A guided experiment for small, passive gear, lever and pulley
            setups. Keep the evidence, the math, and your observations together.
          </p>
        </div>
        <button className="button-lime" onClick={onScan} disabled={!!busy}>
          <Camera size={16} /> Scan a mechanism <ArrowRight size={16} />
        </button>
      </div>
      <ol className="bench-steps">
        <li>01 · Capture evidence</li>
        <li>02 · Confirm inputs</li>
        <li>03 · Predict & measure</li>
        <li>04 · Investigate & repeat</li>
      </ol>
      <div className="bench-toolbar">
        <label className="lab-label">
          Experiment title
          <input
            value={title}
            maxLength={150}
            disabled={!!busy}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <div>
          <button
            className="quiet-button"
            disabled={!!busy}
            onClick={newProject}
          >
            New experiment
          </button>
          <button
            className="quiet-button"
            disabled={!!busy}
            onClick={() => {
              try {
                localStorage.setItem(storageKey, JSON.stringify(project()));
                setMessage(
                  "Photo-free project saved on this device. Use Export JSON for a portable backup.",
                );
              } catch {
                setError(
                  "Device storage is unavailable or full. Export JSON instead.",
                );
              }
            }}
          >
            <Save size={15} /> Save on device
          </button>
          <button
            className="quiet-button"
            disabled={!!busy}
            onClick={() => {
              try {
                const raw = localStorage.getItem(storageKey);
                if (!raw) throw Error();
                restore(JSON.parse(raw));
              } catch {
                setError("No valid saved project was found on this device.");
              }
            }}
          >
            Restore saved
          </button>
          <button
            className="quiet-button"
            disabled={!!busy}
            onClick={exportProject}
          >
            <Download size={15} /> Export JSON
          </button>
          <button
            className="quiet-button"
            disabled={!!busy}
            onClick={() => file.current.click()}
          >
            <Upload size={15} /> Import JSON
          </button>
          <input
            ref={file}
            type="file"
            accept=".json,application/json"
            className="visually-hidden"
            aria-label="Import Bench project"
            onChange={(e) => {
              importProject(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </div>
      </div>
      <p className="bench-storage-note">
        Saving is explicit and local to this browser. Saved projects contain
        trial inputs, notes and photo descriptions, never photo bytes. New,
        Import or Restore replaces the current workspace; export it first if
        needed.
      </p>
      {error && (
        <p className="lab-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="bench-message" role="status">
          {message}
        </p>
      )}
      {source && (
        <div className="bench-source">
          <strong>Photo context · {source.objectName}</strong>
          <p>{source.summary}</p>
          <details>
            <summary>
              {source.observations.length} AI-suggested visible components
            </summary>
            <ul>
              {source.observations.map((o, i) => (
                <li key={i}>
                  <strong>{o.name}</strong> — {o.evidence}
                </li>
              ))}
            </ul>
          </details>
          <p>
            Photo suggestions are not confirmed measurements. Recount or measure
            before predicting.
          </p>
        </div>
      )}
      <div className="bench-grid">
        <section className="bench-card">
          <span className="eyebrow">01 / CONFIRM THE MODEL</span>
          <h4>What are you testing?</h4>
          <fieldset disabled={!!busy}>
            <label className="lab-label">
              Mechanism model
              <select
                aria-label="Bench mechanism model"
                value={model}
                onChange={(e) => {
                  setModel(e.target.value);
                  setDraft({ ...blank });
                  invalidate();
                }}
              >
                <option value="gears">Two external gears in direct mesh</option>
                <option value="lever">Ideal static lever</option>
                <option value="pulley">Ideal pulley system</option>
              </select>
            </label>
            <p className="bench-model-help">
              {model === "gears"
                ? "View both gears from the same side. Clockwise is positive. No internal gears, belt drives or extra stages."
                : model === "lever"
                  ? "Measure perpendicular distances from the fulcrum to each force line. Use newtons and meters; the lever must be in static balance."
                  : "Count only rope strands directly supporting the moving load. Use newtons and meters; the calculation assumes equal rope tension."}
            </p>
            <div className="bench-fields">
              {required.map((k) => (
                <label className="lab-label" key={k}>
                  {labels[k]}
                  <input
                    aria-label={`Bench ${labels[k]}`}
                    type="number"
                    min="0.0001"
                    step={
                      ["driver", "follower", "strands"].includes(k)
                        ? "1"
                        : "any"
                    }
                    value={draft[k]}
                    onChange={(e) => {
                      setDraft((d) => ({ ...d, [k]: e.target.value }));
                      invalidate();
                    }}
                  />
                </label>
              ))}
              {model === "gears" && (
                <label className="lab-label">
                  Input direction
                  <select
                    aria-label="Bench input direction"
                    value={draft.inputDirection}
                    onChange={(e) => {
                      setDraft((d) => ({
                        ...d,
                        inputDirection: e.target.value,
                      }));
                      invalidate();
                    }}
                  >
                    <option value="clockwise">Clockwise</option>
                    <option value="counterclockwise">Counterclockwise</option>
                  </select>
                </label>
              )}
            </div>
            <button className="quiet-button" onClick={sample}>
              <RotateCcw size={14} /> Load numerical example
            </button>
            <label className="lab-check">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => {
                  setConfirmed(e.target.checked);
                  setResult(null);
                  setReview(null);
                  setMeasurementConfirmed(false);
                }}
              />
              <span>
                I have checked the inputs, units and applicability against my
                setup. AI suggestions and example values are not measurements.
              </span>
            </label>
            <button className="button-lime" disabled={!ready} onClick={predict}>
              {busy === "predict" ? (
                <Loader2 className="spin" size={15} />
              ) : (
                <FlaskConical size={15} />
              )}{" "}
              Predict behavior
            </button>
            {!ready && (
              <p className="lab-help">
                {missing.length
                  ? `Still needed: ${missing.map((k) => labels[k]).join(", ")}.`
                  : !confirmed
                    ? "Confirm the inputs to unlock the prediction."
                    : "Check that inputs are positive and counts are whole numbers within the supported range."}
              </p>
            )}
          </fieldset>
        </section>
        <section className="bench-card">
          <span className="eyebrow">02 / RECORD WHAT HAPPENED</span>
          <h4>Does reality agree?</h4>
          {result ? (
            <>
              <div className="bench-prediction">
                <span>IDEAL PREDICTION</span>
                <strong>
                  {fmt(result.expected)} <small>{result.unit}</small>
                </strong>
                {result.prediction.outputDirection && (
                  <p>{result.prediction.outputDirection}</p>
                )}
                <code>{result.prediction.equation}</code>
                {result.prediction.pullMeters !== undefined && (
                  <p>Ideal rope pull: {fmt(result.prediction.pullMeters)} m</p>
                )}
              </div>
              <details>
                <summary>Model assumptions</summary>
                <ul>
                  {result.prediction.assumptions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </details>
              <fieldset disabled={!!busy}>
                <label className="lab-label">
                  Measured{" "}
                  {model === "gears" ? "output turns" : "effort force (N)"}
                  <input
                    aria-label="Bench measured value"
                    type="number"
                    min="0"
                    step="any"
                    value={observed}
                    onChange={(e) => {
                      setObserved(e.target.value);
                      setMeasurementConfirmed(false);
                      setReview(null);
                    }}
                  />
                </label>
                {model === "gears" && (
                  <label className="lab-label">
                    Measured direction
                    <select
                      aria-label="Bench measured direction"
                      value={direction}
                      onChange={(e) => {
                        setDirection(e.target.value);
                        setMeasurementConfirmed(false);
                        setReview(null);
                      }}
                    >
                      <option value="counterclockwise">Counterclockwise</option>
                      <option value="clockwise">Clockwise</option>
                    </select>
                  </label>
                )}
                <label className="lab-label">
                  Absolute tolerance ({result.unit})
                  <input
                    aria-label="Bench absolute tolerance"
                    type="number"
                    min="0"
                    step="any"
                    value={tolerance}
                    onChange={(e) => {
                      setTolerance(e.target.value);
                      setMeasurementConfirmed(false);
                      setReview(null);
                    }}
                  />
                </label>
                <label className="lab-label">
                  Observation notes
                  <textarea
                    value={notes}
                    maxLength={2000}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setReview(null);
                    }}
                    placeholder="What did you observe? What stayed the same between trials?"
                  />
                </label>
                <label className="lab-check">
                  <input
                    type="checkbox"
                    checked={measurementConfirmed}
                    onChange={(e) => setMeasurementConfirmed(e.target.checked)}
                  />
                  <span>
                    I recorded this measurement myself and chose an appropriate
                    tolerance. The app did not observe the physical experiment.
                  </span>
                </label>
                <button
                  className="button-lime"
                  disabled={
                    !ready ||
                    observed.trim() === "" ||
                    tolerance.trim() === "" ||
                    !measurementConfirmed ||
                    trials.length >= 25
                  }
                  onClick={record}
                >
                  Compare & record trial
                </button>
                {trials.length >= 25 && (
                  <p>
                    25-trial limit reached. Export this project before starting
                    another.
                  </p>
                )}
              </fieldset>
            </>
          ) : (
            <div className="bench-empty">
              <FlaskConical size={32} />
              <p>
                Confirm your setup and predict first. Your measured result will
                be compared with the ideal model here.
              </p>
            </div>
          )}
        </section>
      </div>
      {result && (
        <section className="bench-investigation">
          <span className="eyebrow">03 / CHOOSE THE NEXT EXPERIMENT</span>
          <p>
            Investigation uses the latest recorded result below. Unrecorded
            measurement-field edits are not included.
          </p>
          <h4>
            {result.comparison
              ? result.comparison.withinTolerance
                ? "Within your declared tolerance."
                : "A discrepancy to investigate."
              : "Collect a measurement next."}
          </h4>
          {result.comparison && (
            <p>
              Signed residual: {fmt(result.comparison.residual)} {result.unit}.
              Absolute error: {fmt(result.comparison.absoluteError)}{" "}
              {result.unit}. This does not establish a cause or prove the model.
            </p>
          )}
          <ul>
            {(
              result.comparison?.nextChecks || [
                "Record a measurement using the same confirmed setup, units and viewing direction.",
              ]
            ).map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <fieldset disabled={!!busy}>
            <label className="lab-check">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              <span>
                I agree to send this setup, recorded result, notes and optional
                photo descriptions to the configured Meta inference provider.
                Photo bytes are not sent by this investigation.
              </span>
            </label>
            <button
              className="button-lime"
              disabled={!consent || !ready}
              onClick={investigate}
            >
              {busy === "ai" ? (
                <Loader2 className="spin" size={15} />
              ) : (
                <FlaskConical size={15} />
              )}{" "}
              Ask Meta to investigate
            </button>
          </fieldset>
          {busy === "ai" && (
            <div role="status">
              <p>
                Waiting for a suggested next check. The numerical result stays
                independent of the AI.
              </p>
              <button
                className="quiet-button"
                onClick={() => {
                  request.current++;
                  controller.current?.abort();
                  setBusy("");
                }}
              >
                Cancel investigation
              </button>
            </div>
          )}
          {review && (
            <div className="bench-ai-review">
              <span>AI-SUGGESTED · {review.provenance.model}</span>
              <h5>{review.review.summary}</h5>
              <p>
                Suggested action:{" "}
                {review.review.recommendedAction.replaceAll("-", " ")}
              </p>
              {review.review.hypotheses.map((h, i) => (
                <article key={i}>
                  <strong>{h.title}</strong>
                  <p>{h.basis}</p>
                  <p>
                    <b>Next check:</b> {h.nextCheck}
                  </p>
                  <button
                    className="quiet-button"
                    disabled={!!busy}
                    onClick={() => {
                      setNotes(`Next check selected: ${h.nextCheck}`);
                      setMessage(
                        "Next check copied to observation notes. Perform it, update one setup input if needed, then predict and record the next trial.",
                      );
                    }}
                  >
                    Use this check for next trial <ArrowRight size={14} />
                  </button>
                </article>
              ))}
              <ul>
                {review.review.limitations.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
      <section className="bench-history">
        <div>
          <span className="eyebrow">04 / THE EXPERIMENT RECORD</span>
          <h4>
            {trials.length} recorded {trials.length === 1 ? "trial" : "trials"}
          </h4>
        </div>
        <button
          className="quiet-button"
          disabled={!trials.length || !!busy}
          onClick={() => {
            try {
              downloadFile(
                "realitylab-bench.md",
                benchMarkdown(project()),
                "text/markdown",
              );
            } catch {
              setError("Report export failed.");
            }
          }}
        >
          <Download size={15} /> Export experiment report
        </button>
        {trials.length ? (
          <div className="bench-table-wrap">
            <table>
              <caption>
                User-reported measurements; predictions recomputed from each
                saved setup.
              </caption>
              <thead>
                <tr>
                  <th>Trial</th>
                  <th>Model</th>
                  <th>Predicted</th>
                  <th>Measured</th>
                  <th>Tolerance</th>
                  <th>Outcome</th>
                </tr>
              </thead>
              <tbody>
                {trials.map((t, i) => {
                  const r = evaluateBench({
                    setup: t.setup,
                    measurement: t.measurement,
                  });
                  return (
                    <tr key={t.id}>
                      <td>
                        {i + 1}
                        <details>
                          <summary>Trial notes</summary>
                          <p>{t.notes || "No notes recorded."}</p>
                          {t.investigation && (
                            <p>
                              Saved AI suggestion:{" "}
                              {t.investigation.review.summary}
                            </p>
                          )}
                        </details>
                      </td>
                      <td>{r.model}</td>
                      <td>
                        {fmt(r.expected)} {r.unit}
                        {r.prediction.outputDirection
                          ? " " + r.prediction.outputDirection
                          : ""}
                      </td>
                      <td>
                        {fmt(t.measurement.value)} {r.unit}
                        {t.measurement.direction
                          ? " " + t.measurement.direction
                          : ""}
                      </td>
                      <td>±{fmt(t.measurement.tolerance)}</td>
                      <td>
                        {r.comparison.withinTolerance
                          ? "Within tolerance"
                          : "Discrepancy"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            Every trial keeps its own setup and notes. Editing the next setup
            preserves earlier trials.
          </p>
        )}
      </section>
      <p className="bench-limit">
        Use only small, passive tabletop setups. Predictions ignore losses and
        do not assess strength, stability or safe operating loads. AI
        investigations propose checks; a human conducts and verifies each
        experiment.
      </p>
    </section>
  );
}
BenchWorkspace.propTypes = {
  source: PropTypes.object,
  onSourceChange: PropTypes.func.isRequired,
  onScan: PropTypes.func.isRequired,
};

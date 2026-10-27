import { useState } from "react";
import PropTypes from "prop-types";
import { Calculator, Loader2, ArrowUpRight } from "lucide-react";
import { api } from "../../lib/api";
export default function PhysicsBench({ onReport }) {
  const [tool, setTool] = useState("lever"),
    [load, setLoad] = useState(""),
    [effortArm, setEffortArm] = useState(""),
    [loadArm, setLoadArm] = useState(""),
    [strands, setStrands] = useState(""),
    [lift, setLift] = useState(""),
    [confirmed, setConfirmed] = useState(false),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  function reset() {
    setResult(null);
    setConfirmed(false);
    setError("");
    onReport(null);
  }
  async function calculate() {
    setBusy(true);
    setError("");
    try {
      const body =
        tool === "lever"
          ? {
              tool,
              loadNewtons: Number(load),
              effortArmMeters: Number(effortArm),
              loadArmMeters: Number(loadArm),
              confirmed,
            }
          : {
              tool,
              loadNewtons: Number(load),
              supportingStrands: Number(strands),
              liftMeters: Number(lift),
              confirmed,
            };
      const r = await api("tools/predict", { body });
      setResult(r);
      onReport(r);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="physics-bench">
      <summary>
        <Calculator size={18} />
        <span>
          Manual physics bench{" "}
          <small>GEARS ARE ONLY ONE KIND OF MECHANISM</small>
        </span>
        <span>+</span>
      </summary>
      <div className="physics-bench-content">
        <p>
          Use your own measured values for an ideal lever or pulley. These
          calculations do not infer measurements from an image or certify a real
          assembly.
        </p>
        <fieldset disabled={busy}>
          <label className="lab-label">
            Choose a numerical model
            <select
              aria-label="Physics model"
              value={tool}
              onChange={(e) => {
                setTool(e.target.value);
                reset();
              }}
            >
              <option value="lever">Ideal static lever</option>
              <option value="pulley">Ideal pulley system</option>
            </select>
          </label>
          <div className="lab-field-grid">
            <label className="lab-label">
              Load force (newtons)
              <input
                type="number"
                min="0.0001"
                max="100000000"
                step="any"
                value={load}
                onChange={(e) => {
                  setLoad(e.target.value);
                  reset();
                }}
              />
            </label>
            {tool === "lever" ? (
              <>
                <label className="lab-label">
                  Effort moment arm (meters)
                  <input
                    type="number"
                    min="0.0001"
                    max="1000"
                    step="any"
                    value={effortArm}
                    onChange={(e) => {
                      setEffortArm(e.target.value);
                      reset();
                    }}
                  />
                </label>
                <label className="lab-label">
                  Load moment arm (meters)
                  <input
                    type="number"
                    min="0.0001"
                    max="1000"
                    step="any"
                    value={loadArm}
                    onChange={(e) => {
                      setLoadArm(e.target.value);
                      reset();
                    }}
                  />
                </label>
              </>
            ) : (
              <>
                <label className="lab-label">
                  Supporting rope strands
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="1"
                    value={strands}
                    onChange={(e) => {
                      setStrands(e.target.value);
                      reset();
                    }}
                  />
                </label>
                <label className="lab-label">
                  Desired load lift (meters)
                  <input
                    type="number"
                    min="0.001"
                    max="100"
                    step="any"
                    value={lift}
                    onChange={(e) => {
                      setLift(e.target.value);
                      reset();
                    }}
                  />
                </label>
              </>
            )}
          </div>
          <label className="lab-check">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span>
              I have checked the inputs, units and applicability of this ideal
              model. These values are not model-inferred measurements.
            </span>
          </label>
          <button
            className="button-lime"
            disabled={
              !confirmed ||
              busy ||
              !load ||
              (tool === "lever" ? !effortArm || !loadArm : !strands || !lift)
            }
            onClick={calculate}
          >
            {busy ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <Calculator size={14} />
            )}{" "}
            Calculate ideal result <ArrowUpRight size={15} />
          </button>
        </fieldset>
        {error && (
          <p className="lab-error" role="alert">
            {error}
          </p>
        )}
        {result && (
          <div className="physics-result" aria-live="polite">
            <div>
              <strong>
                {result.effortNewtons.toLocaleString(undefined, {
                  maximumFractionDigits: 5,
                })}{" "}
                N
              </strong>
              <span>IDEAL EFFORT FORCE</span>
            </div>
            <div>
              <strong>
                {result.mechanicalAdvantage.toLocaleString(undefined, {
                  maximumFractionDigits: 5,
                })}
                ×
              </strong>
              <span>MECHANICAL ADVANTAGE</span>
            </div>
            {result.pullMeters !== undefined && (
              <div>
                <strong>
                  {result.pullMeters.toLocaleString(undefined, {
                    maximumFractionDigits: 5,
                  })}{" "}
                  m
                </strong>
                <span>IDEAL ROPE PULL</span>
              </div>
            )}
            <code>{result.equation}</code>
            <ul className="unknown-list">
              {result.assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}
PhysicsBench.propTypes = { onReport: PropTypes.func.isRequired };

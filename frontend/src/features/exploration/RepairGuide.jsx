import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Wrench,
  Camera,
  ImagePlus,
  X,
  Loader2,
  ArrowUpRight,
  Download,
  RotateCcw,
} from "lucide-react";
import CameraCapture from "../../components/CameraCapture";
import { api } from "../../lib/api";
import { downloadFile } from "../../lib/exportReport";
import {
  repairSource,
  repairMarkdown,
} from "../../../../shared/repairFormatting.js";
export default function RepairGuide({
  analysis,
  active,
  onHighlight,
  onRecord,
}) {
  const source = repairSource(analysis),
    sourceKey = JSON.stringify(source);
  const [caseId, setCaseId] = useState(
    () => analysis.repairHistory?.at(-1)?.caseId || crypto.randomUUID(),
  );
  const [problem, setProblem] = useState(""),
    [answer, setAnswer] = useState(""),
    [photos, setPhotos] = useState([]),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [camera, setCamera] = useState(false);
  const input = useRef(null),
    device = useRef(null),
    controller = useRef(null),
    generation = useRef({ value: 0 }),
    urls = useRef(new Set()),
    form = useRef(null);
  const records = (analysis.repairHistory || []).filter(
    (r) => r.caseId === caseId,
  );
  const latest = records.at(-1),
    assessment = latest?.assessment;
  const sourceMatches = latest && JSON.stringify(latest.source) === sourceKey;
  const sameProblem = latest?.problem === problem.trim();
  const samePhotos =
    JSON.stringify(latest?.problemPhotoKeys || []) ===
    JSON.stringify(photos.map((p) => p.id));
  const current =
    sourceMatches &&
    sameProblem &&
    samePhotos &&
    latest.answer === answer.trim();
  const canFollowUp = sourceMatches && sameProblem;
  useEffect(() => {
    const owned = urls.current;
    const counter = generation.current;
    return () => {
      counter.value++;
      controller.current?.abort();
      owned.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);
  useEffect(() => {
    generation.current.value++;
    controller.current?.abort();
    setBusy(false);
    setConsent(false);
    setError("");
  }, [sourceKey]);
  useEffect(() => {
    if (!active) setCamera(false);
  }, [active]);
  function changed() {
    setConsent(false);
    setError("");
  }
  function addFiles(incoming) {
    let warning = "";
    const added = [];
    for (const f of incoming) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        warning = "Choose JPEG, PNG or WebP photos.";
        continue;
      }
      if (f.size > 5 * 1024 * 1024) {
        warning = "Each problem photo must be at most 5 MB.";
        continue;
      }
      if (photos.length + added.length >= 2) {
        warning =
          "Keep at most two problem photos. Remove an old one to add a new angle.";
        break;
      }
      const url = URL.createObjectURL(f);
      urls.current.add(url);
      added.push({ id: crypto.randomUUID(), file: f, url });
    }
    setPhotos((p) => [...p, ...added]);
    changed();
    setError(warning);
  }
  function removePhoto(id) {
    const photo = photos.find((p) => p.id === id);
    if (photo) {
      URL.revokeObjectURL(photo.url);
      urls.current.delete(photo.url);
    }
    setPhotos((p) => p.filter((f) => f.id !== id));
    changed();
  }
  function cancel() {
    generation.current.value++;
    controller.current?.abort();
    setBusy(false);
    setError(
      "Repair assessment cancelled. Your scan and problem details are preserved.",
    );
  }
  async function assess() {
    const token = ++generation.current.value;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setBusy(true);
    setError("");
    try {
      const data = new FormData();
      for (const [i, image] of analysis.images.entries()) {
        const bytes = Uint8Array.from(atob(image.dataUrl.split(",")[1]), (c) =>
          c.charCodeAt(0),
        );
        data.append(
          "images",
          new Blob([bytes], { type: "image/jpeg" }),
          `scan-${i + 1}.jpg`,
        );
      }
      photos.forEach((p) => data.append("images", p.file));
      const previous = canFollowUp
        ? {
            status: assessment.status,
            summary: assessment.summary,
            suspectedPartId: assessment.suspectedPartId,
            followUp: assessment.followUp,
          }
        : null;
      data.append(
        "request",
        JSON.stringify({
          source,
          problem,
          answer,
          originalImageCount: analysis.images.length,
          consent,
          previous,
        }),
      );
      const record = await api("repair", { body: data, signal: abort.signal });
      if (token === generation.current.value)
        onRecord({
          ...record,
          caseId,
          problemPhotoKeys: photos.map((p) => p.id),
        });
    } catch (e) {
      if (token === generation.current.value && e.name !== "AbortError")
        setError(e.message);
    } finally {
      if (token === generation.current.value) setBusy(false);
    }
  }
  const candidate = latest?.source.parts.find(
    (p) => p.id === assessment?.suspectedPartId,
  );
  return (
    <section className="repair-guide" aria-labelledby="repair-title">
      <div className="repair-heading">
        <span className="eyebrow">
          <Wrench size={15} /> REPAIR MODE
        </span>
        <h4 id="repair-title">Let’s find the next step.</h4>
        <p>
          Describe the symptom or show the problem. We’ll check the listed
          parts, ask for another view if needed, and suggest a low-risk next
          step.
        </p>
      </div>
      <div className="repair-content">
        <div className="repair-original">
          {analysis.images[0] && (
            <img
              className="repair-original-thumbnail"
              src={analysis.images[0].dataUrl}
              alt={`Original scan of ${analysis.objectName}`}
            />
          )}
          <strong>{analysis.objectName}</strong>
          <span>{source.parts.length} parts from this scan</span>
          <p>The original scan stays with your assessment.</p>
          <div className="precision-repair-part-list">
            <span className="eyebrow">SCANNED PARTS</span>
            {source.parts.map((part) => (
              <button
                className={
                  assessment?.suspectedPartId === part.id ? "is-suspected" : ""
                }
                key={part.id}
                onClick={() => onHighlight(part.id)}
              >
                <span>{part.name}</span>
                <ArrowUpRight size={14} />
              </button>
            ))}
            <small>Visible-part suggestions · Review against your photo.</small>
          </div>
        </div>
        <fieldset disabled={busy} ref={form}>
          {!source.parts.length && (
            <p className="lab-error">
              No visible parts were identified. Rescan the object before
              requesting a part-linked repair guide.
            </p>
          )}
          <label className="lab-label">
            What isn’t working?
            <textarea
              aria-label="Describe the repair problem"
              maxLength={1500}
              value={problem}
              onChange={(e) => {
                setProblem(e.target.value);
                changed();
              }}
              placeholder="For example: the drawer knob spins freely and won’t stay attached. It started after I moved the cabinet."
            />
          </label>
          <div className="repair-photo-actions">
            <button
              className="quiet-button"
              disabled={photos.length >= 2}
              onClick={() => input.current.click()}
            >
              <ImagePlus size={16} /> Add problem photo
            </button>
            <button
              className="quiet-button"
              disabled={photos.length >= 2}
              onClick={() => setCamera(true)}
            >
              <Camera size={16} /> Take problem photo
            </button>
            <span>Optional · up to 2 photos · 5 MB each</span>
          </div>
          <input
            type="file"
            ref={input}
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="visually-hidden"
            aria-label="Upload repair problem photos"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            type="file"
            ref={device}
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            className="visually-hidden"
            aria-label="Take repair photo with device camera"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {!!photos.length && (
            <div className="repair-photos">
              {photos.map((p, i) => (
                <figure key={p.id}>
                  <img
                    src={p.url}
                    alt={`Problem photo ${i + 1} for repair assessment`}
                  />
                  <button
                    className="quiet-button"
                    aria-label={`Remove repair problem photo ${i + 1}`}
                    onClick={() => removePhoto(p.id)}
                  >
                    <X size={14} />
                  </button>
                  <figcaption>Problem view {i + 1}</figcaption>
                </figure>
              ))}
            </div>
          )}
          {canFollowUp && assessment.followUp && (
            <div className="repair-followup">
              <span className="eyebrow">ONE MORE DETAIL</span>
              <h5>{assessment.followUp.question}</h5>
              {assessment.followUp.photoInstruction && (
                <p>
                  <Camera size={16} /> {assessment.followUp.photoInstruction}
                </p>
              )}
              <p>
                Add the requested view above, or answer below. Keep the same
                object and avoid disassembly.
              </p>
            </div>
          )}
          {canFollowUp && (
            <label className="lab-label">
              {assessment.followUp
                ? "Answer the follow-up question"
                : "What happened after these checks?"}
              <textarea
                aria-label="Repair follow-up answer"
                maxLength={1500}
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  changed();
                }}
                placeholder="What can you see or confirm? Do not try to recreate a dangerous fault."
              />
            </label>
          )}
          <label className="lab-check">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I agree to send the original scan photos, listed parts, problem
              details and any added photos to the configured Meta provider. The
              app does not store these photos on the server.
            </span>
          </label>
          <button
            className="button-lime"
            disabled={
              !source.parts.length ||
              !consent ||
              (!problem.trim() && !answer.trim() && !photos.length)
            }
            onClick={assess}
          >
            {busy ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <Wrench size={16} />
            )}{" "}
            {latest ? "Reassess with this evidence" : "Assess the problem"}{" "}
            <ArrowUpRight size={16} />
          </button>
        </fieldset>
        {camera && active && (
          <CameraCapture
            onPhoto={(file) => addFiles([file])}
            onClose={() => setCamera(false)}
            onDevicePhoto={() => device.current.click()}
          />
        )}
        {busy && (
          <div className="repair-pending" role="status">
            <p>Checking your symptoms against the scanned parts and photos…</p>
            <button className="quiet-button" onClick={cancel}>
              Cancel repair assessment
            </button>
          </div>
        )}
        {error && (
          <p className="lab-error" role="alert">
            {error}
          </p>
        )}
        {!latest && (
          <div className="precision-repair-empty">
            <span className="precision-empty-icon">
              <Wrench size={26} />
            </span>
            <h4>A clearer next step.</h4>
            <p>
              Your assessment will appear here. We’ll check the scanned parts
              and ask one useful question when the evidence is unclear.
            </p>
            <div>
              <span>01 · Report the symptom</span>
              <span>02 · Add the missing detail</span>
              <span>03 · Review the guidance</span>
            </div>
            <small>
              Suggestions need your review. Some faults require qualified
              service.
            </small>
          </div>
        )}
        {latest && (
          <section
            className={`repair-assessment repair-${assessment.status}`}
            aria-labelledby="repair-assessment-title"
          >
            <div className="repair-result-top">
              <span className="eyebrow">
                {assessment.status === "repair-guide"
                  ? "LOW-RISK REPAIR SUGGESTION"
                  : assessment.status === "needs-more-evidence"
                    ? "MORE EVIDENCE NEEDED"
                    : "QUALIFIED SERVICE RECOMMENDED"}
              </span>
              <button
                className="quiet-button"
                onClick={() =>
                  downloadFile(
                    "realitylab-repair.md",
                    (current
                      ? ""
                      : "# Historical assessment — inputs have changed. Reassess before acting.\n\n") +
                      repairMarkdown(latest),
                    "text/markdown",
                  )
                }
              >
                <Download size={15} /> Download repair report
              </button>
            </div>
            <h4 id="repair-assessment-title">
              {candidate
                ? `Part to check: ${candidate.name}`
                : assessment.status === "professional-help"
                  ? "Stop and arrange qualified help."
                  : "The faulty part is not clear yet."}
            </h4>
            <p>{assessment.summary}</p>
            {!current && (
              <p className="repair-stale" role="status">
                The inputs or listed parts have changed. This assessment
                describes the earlier evidence; reassess before following a
                guide.
              </p>
            )}
            {candidate && sourceMatches && (
              <button
                className="quiet-button"
                onClick={() => onHighlight(candidate.id)}
              >
                Highlight {candidate.name} in Discover{" "}
                <ArrowUpRight size={15} />
              </button>
            )}
            <details className="repair-evidence">
              <summary>Why this part? Evidence and alternatives</summary>
              <ul>
                {assessment.evidence.map((e, i) => (
                  <li key={i}>
                    {e.basis}{" "}
                    {e.imageId && (
                      <small>
                        (
                        {e.imageId
                          .replace("scan-", "original photo ")
                          .replace("problem-", "problem photo ")}
                        )
                      </small>
                    )}
                  </li>
                ))}
              </ul>
              {assessment.alternatives.map((a) => (
                <p key={a.observationId}>
                  <strong>
                    {
                      latest.source.parts.find((p) => p.id === a.observationId)
                        ?.name
                    }
                    :
                  </strong>{" "}
                  {a.reason}
                </p>
              ))}
            </details>
            <div className="repair-precautions">
              <h5>Before you act</h5>
              <ul>
                {assessment.precautions.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            {current && assessment.steps.length > 0 && (
              <ol className="repair-steps">
                {assessment.steps.map((step, i) => (
                  <li key={i}>
                    <span>{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h5>{step.title}</h5>
                      <p>{step.instruction}</p>
                      <p>
                        <strong>Check:</strong> {step.check}
                      </p>
                      <p className="repair-stop">
                        <strong>Stop if:</strong> {step.stopIf}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            <ul className="repair-limitations">
              {assessment.limitations.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
            <p className="repair-provenance">
              {latest.provenance.model || "App safety check"} ·{" "}
              {new Date(latest.provenance.assessedAt).toLocaleString()} ·
              Suggested assessment, not a verified fault diagnosis.
            </p>
          </section>
        )}
        {!!records.length && (
          <details className="repair-history">
            <summary>{records.length} assessments for this problem</summary>
            <ol>
              {records.map((r) => (
                <li key={r.id}>
                  <strong>{r.assessment.status.replaceAll("-", " ")}</strong>
                  <p>{r.assessment.summary}</p>
                </li>
              ))}
            </ol>
          </details>
        )}
        <button
          className="quiet-button repair-new"
          disabled={busy}
          onClick={() => {
            photos.forEach((p) => {
              URL.revokeObjectURL(p.url);
              urls.current.delete(p.url);
            });
            setPhotos([]);
            setProblem("");
            setAnswer("");
            setConsent(false);
            setError("");
            setCaseId(crypto.randomUUID());
          }}
        >
          <RotateCcw size={14} /> Start a different problem
        </button>
      </div>
    </section>
  );
}
RepairGuide.propTypes = {
  analysis: PropTypes.object.isRequired,
  active: PropTypes.bool.isRequired,
  onHighlight: PropTypes.func.isRequired,
  onRecord: PropTypes.func.isRequired,
};

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Camera,
  Check,
  ChevronRight,
  Info,
  Layers3,
  Maximize2,
  ShieldCheck,
  Sun,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useOnline } from "../lib/use-online";
import CameraCapture from "./CameraCapture";
import { investigationGoals } from "../lib/product-scope";
import { scanResultSchema } from "../lib/analysis";
import type { ScanView } from "../lib/analysis";
import { MAX_PHOTOS, Photo, preparePhoto } from "../lib/photos";
export default function CapturePanel({
  active,
  onHome,
  onSample,
  onResult,
  onChange,
}: {
  active: boolean;
  onHome: () => void;
  onSample: () => void;
  onResult: (scan: ScanView) => void;
  onChange: () => void;
}) {
  const online = useOnline();
  const [photos, setPhotos] = useState<Photo[]>([]),
    [busy, setBusy] = useState(false),
    [camera, setCamera] = useState(false),
    [consent, setConsent] = useState(false),
    [message, setMessage] = useState(""),
    [errors, setErrors] = useState<string[]>([]),
    [dragging, setDragging] = useState(false),
    [review, setReview] = useState<Photo | null>(null);
  const [analyzing, setAnalyzing] = useState(false),
    [elapsed, setElapsed] = useState(0),
    [context, setContext] = useState(""),
    [configured, setConfigured] = useState<boolean | null>(null),
    [capacity, setCapacity] = useState<{
      durable: boolean;
      state: string;
      remaining: number | null;
      limit: number;
      providerCap: boolean;
    } | null>(null);
  const abort = useRef<AbortController | null>(null),
    running = useRef(false),
    attempt = useRef(0);
  const input = useRef<HTMLInputElement>(null),
    native = useRef<HTMLInputElement>(null),
    current = useRef<Photo[]>([]),
    processing = useRef(false),
    mounted = useRef(true),
    generation = useRef(0),
    reviewDialog = useRef<HTMLDialogElement>(null);
  const closeCamera = useCallback(() => setCamera(false), []);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current++;
      current.current.forEach((p) => URL.revokeObjectURL(p.url));
      current.current = [];
      abort.current?.abort();
    };
  }, []);
  useEffect(() => {
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((body) => {
        if (mounted.current) {
          setConfigured(body.analysis?.configured === true);
          const quota = body.capacity?.durableQuota;
          if (quota)
            setCapacity({
              durable: quota.configured === true,
              state: String(quota.state || "unknown"),
              remaining: Number.isFinite(quota.remaining)
                ? quota.remaining
                : null,
              limit: Number(quota.limit) || 50,
              providerCap: body.capacity?.providerSpendCapVerified === true,
            });
        }
      })
      .catch(() => {
        if (mounted.current) setConfigured(null);
      });
  }, []);
  useEffect(() => {
    if (!analyzing) return;
    const start = Date.now();
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - start) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [analyzing]);
  useEffect(() => {
    if (!active) {
      setCamera(false);
      setReview(null);
      if (running.current) {
        attempt.current++;
        abort.current?.abort();
        running.current = false;
        setAnalyzing(false);
        setMessage(
          "Scan cancelled because you left this screen. Your photos are preserved.",
        );
      }
    }
  }, [active]);
  useEffect(() => {
    if (!review) return;
    const prior = document.activeElement as HTMLElement | null;
    reviewDialog.current?.showModal();
    return () => prior?.focus();
  }, [review]);
  function update(next: Photo[]) {
    onChange();
    current.current = next;
    setPhotos(next);
    setConsent(false);
    setMessage("");
  }
  async function addFiles(files: File[]) {
    if (running.current) {
      setMessage("Cancel the current analysis before changing photos.");
      return;
    }
    if (processing.current) {
      setMessage("Photos are already being prepared. Please wait a moment.");
      return;
    }
    processing.current = true;
    setBusy(true);
    setErrors([]);
    setMessage("");
    const epoch = generation.current,
      issues: string[] = [];
    try {
      for (const file of files) {
        if (current.current.length >= MAX_PHOTOS) {
          issues.push(
            "You can add up to three photos. Remove a photo to make room.",
          );
          break;
        }
        try {
          const photo = await preparePhoto(file);
          if (!mounted.current || generation.current !== epoch) {
            URL.revokeObjectURL(photo.url);
            break;
          }
          update([...current.current, photo]);
        } catch (e) {
          issues.push(
            `${file.name.slice(0, 80)}: ${e instanceof Error ? e.message : "Could not read this photo."}`,
          );
        }
      }
    } finally {
      processing.current = false;
      if (mounted.current) {
        setBusy(false);
        setErrors(issues);
        if (!issues.length && current.current.length)
          setMessage(
            `${current.current.length} of 3 photos ready. Nothing has been uploaded.`,
          );
      }
    }
  }
  function remove(id: string) {
    const removed = current.current.find((p) => p.id === id);
    if (removed) URL.revokeObjectURL(removed.url);
    update(current.current.filter((p) => p.id !== id));
    setErrors([]);
  }
  function clear() {
    generation.current++;
    current.current.forEach((p) => URL.revokeObjectURL(p.url));
    update([]);
    setErrors([]);
    setReview(null);
    setMessage("All photos removed.");
  }
  function choose() {
    input.current?.click();
  }
  async function analyze() {
    if (!online) {
      setErrors([
        "Reconnect before analyzing. Your prepared photos are still available in this tab.",
      ]);
      return;
    }
    if (
      running.current ||
      processing.current ||
      !consent ||
      !current.current.length
    )
      return;
    running.current = true;
    const clientStart = performance.now(),
      id = ++attempt.current;
    const controller = new AbortController();
    abort.current = controller;
    setAnalyzing(true);
    setElapsed(0);
    setErrors([]);
    setMessage(
      "Sending prepared photos to Baseten. Analysis usually takes a few moments.",
    );
    const timeout = setTimeout(() => controller.abort(), 90_000);
    try {
      const snapshot = current.current.map((p) => ({
        id: p.id,
        url: p.url,
        width: p.width,
        height: p.height,
      }));
      const form = new FormData();
      current.current.forEach((p, i) =>
        form.append("images", p.file, `view-${i + 1}.jpg`),
      );
      form.append("consent", "true");
      form.append("context", context);
      const response = await fetch("/api/scan", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      let body;
      try {
        body = await response.json();
      } catch {
        throw Error(
          "The service returned an unreadable response. Your photos are preserved. Please retry.",
        );
      }
      if (!response.ok)
        throw Error(
          body.error?.message ||
            "The scan could not be completed. Your photos are preserved.",
        );
      const validated = scanResultSchema.safeParse(body);
      if (
        !validated.success ||
        validated.data.analysis.components.some(
          (p) => p.image_index !== null && p.image_index >= snapshot.length,
        )
      )
        throw Error(
          "The service returned invalid results. No sample was substituted. Please retry.",
        );
      if (id !== attempt.current || !mounted.current) return;
      setMessage("Analysis complete. Your results are ready.");
      onResult({
        result: validated.data,
        photos: snapshot,
        clientTiming: { totalMs: Math.round(performance.now() - clientStart) },
      });
    } catch (e) {
      if (id !== attempt.current || !mounted.current) return;
      setErrors([
        controller.signal.aborted
          ? "Scan cancelled or timed out. Your photos are preserved. Cancelling may not reverse provider usage already incurred."
          : e instanceof Error
            ? e.message
            : "Could not reach the service. Your photos are preserved.",
      ]);
    } finally {
      clearTimeout(timeout);
      if (id === attempt.current) {
        running.current = false;
        if (mounted.current) setAnalyzing(false);
      }
    }
  }
  function cancel() {
    attempt.current++;
    abort.current?.abort();
    running.current = false;
    setAnalyzing(false);
    setMessage(
      "Scan cancelled. Your photos are preserved. Cancelling may not reverse provider usage already incurred.",
    );
  }

  const tips = [
    {
      Icon: Sun,
      title: "Find the light",
      body: "Natural, even lighting helps make the details visible.",
    },
    {
      Icon: Maximize2,
      title: "Show the whole object",
      body: "Keep the object in focus, with a little space around it.",
    },
    {
      Icon: Layers3,
      title: "Add another angle",
      body: "A second view helps reveal connections you might miss.",
    },
  ];
  return (
    <section
      className="capture-page section"
      hidden={!active}
      aria-label="Photo capture"
    >
      <div className="breadcrumb">
        <button onClick={onHome}>Home</button>
        <ChevronRight size={12} /> New exploration
      </div>
      <div className="capture-heading">
        <p className="eyebrow">01 / A NEW PERSPECTIVE</p>
        <h1>
          Start with
          <br />
          <span>a closer look.</span>
        </h1>
        <p>
          Prepare one hands-on demonstration.
          <br />
          Start with a clear view and a question about your object.
        </p>
      </div>
      <div className="capture-grid">
        <div className="upload-panel">
          <div
            className={`dropzone ${dragging ? "is-dragging" : ""}`}
            aria-busy={busy || analyzing}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null))
                setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              void addFiles(Array.from(e.dataTransfer.files));
            }}
          >
            <span className="upload-icon">
              <Upload size={27} />
            </span>
            <h3>
              {busy
                ? "Preparing your photos…"
                : dragging
                  ? "Let’s take a closer look."
                  : "Drop your photos here"}
            </h3>
            <p>
              {busy
                ? "Checking, orienting, and resizing on your device."
                : "or choose them from your device"}
            </p>
            <div className="upload-actions">
              <button
                className="primary"
                onClick={choose}
                disabled={busy || analyzing || photos.length === 3}
              >
                <Upload size={16} />
                Choose photos
              </button>
              <button
                className="secondary"
                disabled={busy || analyzing || photos.length === 3}
                onClick={() => {
                  setErrors([]);
                  setCamera(true);
                }}
              >
                <Camera size={16} />
                Use camera
              </button>
            </div>
            <small>JPEG or PNG · Up to 3 photos · 5 MB / 20 MP each</small>
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = "";
                void addFiles(files);
              }}
            />
            <input
              ref={native}
              type="file"
              accept="image/jpeg,image/png"
              capture="environment"
              hidden
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                e.target.value = "";
                void addFiles(files);
              }}
            />
          </div>
          <div className="capture-summary">
            <span>
              <span className="dot" /> {photos.length} / 3 photos ready
            </span>
            <button
              className="native-camera text-link"
              disabled={busy || analyzing || photos.length === 3}
              onClick={() => native.current?.click()}
            >
              Open device camera <ArrowUpRight size={12} />
            </button>
            {photos.length > 0 && (
              <button
                className="text-link"
                disabled={busy || analyzing}
                onClick={clear}
              >
                <Trash2 size={12} />
                Clear all
              </button>
            )}
          </div>
          {photos.length > 0 && (
            <div className="previews">
              {photos.map((photo, i) => (
                <div key={photo.id}>
                  <button
                    className="photo-open"
                    onClick={() => setReview(photo)}
                    aria-label={`Review photo ${i + 1}`}
                  >
                    <img
                      src={photo.url}
                      alt={`Your uploaded object view ${i + 1}`}
                    />
                    <span className="photo-index">
                      {i === 0 ? "Main view" : `View ${i + 1}`}
                    </span>
                    <Maximize2 size={13} />
                  </button>
                  <button
                    className="photo-remove"
                    disabled={busy || analyzing}
                    aria-label={`Remove photo ${i + 1}`}
                    onClick={() => remove(photo.id)}
                  >
                    <X size={14} />
                  </button>
                  <span title={photo.originalName}>{photo.originalName}</span>
                  <small>
                    {photo.width} × {photo.height} ·{" "}
                    {Math.max(1, Math.round(photo.file.size / 1024))} KB
                  </small>
                  {i > 0 && (
                    <button
                      className="make-main"
                      disabled={busy || analyzing}
                      onClick={() =>
                        update([
                          photo,
                          ...current.current.filter((p) => p.id !== photo.id),
                        ])
                      }
                    >
                      Make main view
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {errors.length > 0 && (
            <div className="message capture-errors" role="alert">
              <strong>We couldn’t complete that step.</strong>
              <ul>
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="capture-status" role="status" aria-live="polite">
            {analyzing
              ? `Analyzing your object… ${elapsed}s. Stay on this screen or cancel below.`
              : busy
                ? "Preparing photos on your device…"
                : message}
          </p>
          <section
            className="investigation-goals"
            aria-labelledby="investigation-goals-title"
          >
            <p className="eyebrow">YOUR DEMONSTRATION / ONE QUESTION</p>
            <h2 id="investigation-goals-title">Choose what to investigate.</h2>
            <p>
              Start with a familiar object you can inspect without opening or
              powering it. Choose one question, or write your own below.
            </p>
            <div role="group" aria-label="Choose an investigation question">
              {investigationGoals.map((goal) => (
                <button
                  key={goal.id}
                  disabled={busy || analyzing}
                  aria-pressed={context === goal.prompt}
                  onClick={() => {
                    setContext(goal.prompt);
                    onChange();
                  }}
                >
                  <strong>{goal.title}</strong>
                  <span>{goal.description}</span>
                </button>
              ))}
            </div>
            <small>
              Your choice fills the editable focus below. It does not start an
              AI request or establish the answer.
            </small>
          </section>
          <details className="exploratory-focuses">
            <summary>More exploratory object focuses</summary>
            <div className="object-family-guide">
              <p>Other objects can be explored, with uncertain results.</p>
              <div role="group" aria-label="Object exploration focus">
                {[
                  [
                    "Furniture",
                    "Explain load paths, supports and visible joints.",
                  ],
                  [
                    "Tools",
                    "Explain the working surfaces, grip and motion transfer.",
                  ],
                  [
                    "Electronics",
                    "Explain visible modules and their functions; keep hidden wiring uncertain.",
                  ],
                  [
                    "Textiles",
                    "Explain visible fabric structure, seams and joining.",
                  ],
                  [
                    "Containers",
                    "Explain containment, shape, closures and visible seals.",
                  ],
                  [
                    "Natural objects",
                    "Explain visible structures and natural formation; do not invent manufactured parts.",
                  ],
                ].map(([label, focus]) => (
                  <button
                    key={label}
                    disabled={busy || analyzing}
                    onClick={() => {
                      setContext(focus);
                      onChange();
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <small>
                Exploratory prompts, not verified support categories. Textiles,
                containers and natural structures have not been broadly
                evaluated. The photo remains primary evidence.
              </small>
            </div>
          </details>
          <label className="object-context">
            What should we focus on? <span>Optional</span>
            <textarea
              maxLength={500}
              rows={2}
              value={context}
              disabled={busy || analyzing}
              onChange={(e) => {
                setContext(e.target.value);
                onChange();
              }}
              placeholder="For example: the connections on this bicycle, or the object in the foreground."
            />
            <small>{context.length} / 500 characters</small>
          </label>
          {configured === false && (
            <p className="message" role="status">
              Live analysis is not configured yet. Your photos stay here; the
              prepared sample is available.
            </p>
          )}
          {capacity && (
            <p className="capacity-note">
              <Info size={13} />
              <span>
                {capacity.durable && capacity.state === "enforced"
                  ? `Shared request limit active${capacity.remaining === null ? "." : `: ${capacity.remaining} of ${capacity.limit} requests remain in the current window.`}`
                  : "Availability currently uses restartable server counters; a durable shared limit is not verified."}{" "}
                {capacity.providerCap
                  ? "The owner marked the provider spend cap as verified."
                  : "A provider billing cap is not verified by this app."}
              </span>
            </p>
          )}
          <label className="consent">
            <input
              type="checkbox"
              checked={consent}
              disabled={busy || analyzing || !photos.length}
              onChange={(e) => setConsent(e.target.checked)}
            />
            <span>
              I agree to send these prepared photos to Baseten to run Meta’s
              model.
              <small>
                Sent only when you press Analyze. Confirm again whenever you
                change photos. Provider processing may use your credits.
              </small>
            </span>
          </label>
          <button
            className="primary analyze"
            disabled={
              !online ||
              busy ||
              analyzing ||
              !photos.length ||
              !consent ||
              configured === false
            }
            onClick={analyze}
          >
            {analyzing ? "Analyzing…" : "Analyze object"}{" "}
            <ArrowRight size={16} />
          </button>
          {analyzing && (
            <button className="secondary cancel-scan" onClick={cancel}>
              Cancel analysis
            </button>
          )}
          <button className="text-link" onClick={onSample}>
            Just looking? Try the prepared sample <ArrowUpRight size={14} />
          </button>
        </div>
        <aside className="photo-tips">
          <p className="eyebrow">A GOOD PHOTO GOES A LONG WAY</p>
          {tips.map(({ Icon, title, body }) => (
            <div key={title}>
              <Icon size={22} />
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
          <div className="privacy-note">
            <ShieldCheck size={18} />
            <p>
              Photos stay in this browser tab. Prepared copies are resized to
              1600 pixels and re-encoded without source metadata. They are sent
              to Baseten only with your consent when you press Analyze.
              RealityLab does not save photos on the server; provider retention
              policies apply. Closing or refreshing clears the local draft.
            </p>
          </div>
          <div className="capture-checklist">
            <Check size={16} />
            <p>
              You can leave this screen and return without losing your draft.
              Photos are never saved to browser storage.
            </p>
          </div>
        </aside>
      </div>
      {camera && active && (
        <CameraCapture
          onClose={closeCamera}
          onUse={(file) => addFiles([file])}
          onChoose={choose}
        />
      )}
      {review && active && (
        <dialog
          ref={reviewDialog}
          className="camera-modal camera-dialog"
          aria-labelledby="photo-review-title"
          onCancel={(e) => {
            e.preventDefault();
            setReview(null);
          }}
        >
          <div>
            <h2 id="photo-review-title">Your photo, up close.</h2>
            <button
              className="icon-button"
              aria-label="Close photo review"
              onClick={() => setReview(null)}
            >
              <X />
            </button>
          </div>
          <img
            className="camera-review"
            src={review.url}
            alt="Full preview of your selected object photo"
          />
          <p className="camera-help">
            {review.width} × {review.height} pixels · Prepared locally · Sent
            only on Analyze
          </p>
          <button className="primary" onClick={() => setReview(null)}>
            Looks good <Check size={15} />
          </button>
        </dialog>
      )}
    </section>
  );
}

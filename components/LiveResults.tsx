"use client";
import { useRef, useState } from "react";
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Download,
  Info,
  Layers3,
  Network,
  Image as ImageIcon,
  Search,
  SlidersHorizontal,
  RotateCcw,
  Save,
} from "lucide-react";
import type { ScanView } from "../lib/analysis";
import {
  clampMarker,
  componentEdges,
  filterComponents,
} from "../lib/exploration";
import type { EvidenceFilter, Marker } from "../lib/exploration";
import BuildLearn from "./BuildLearn";
import DiagramLab from "./DiagramLab";
import ConceptBlueprint from "./ConceptBlueprint";
import ComponentMap from "./ComponentMap";
import ReverseEngineeringWorkbench from "./ReverseEngineeringWorkbench";
import { getLearningDraft } from "../lib/learning-cache";
import { makeProjectFile } from "../lib/project-file";
export default function LiveResults({
  scan,
  onEdit,
  onNew,
  recoveryNotice = "",
}: {
  scan: ScanView;
  onEdit: () => void;
  onNew: () => void;
  recoveryNotice?: string;
}) {
  const { analysis, meta } = scan.result;
  const [selected, setSelected] = useState(
      scan.workspace?.selected || analysis.components[0]?.id || "",
    ),
    [image, setImage] = useState(
      scan.workspace?.image ?? analysis.components[0]?.image_index ?? 0,
    ),
    [view, setView] = useState<"photo" | "map" | "blueprint">(
      scan.workspace?.view || "blueprint",
    );
  const [filter, setFilter] = useState<EvidenceFilter>("all"),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState(false),
    [adjustments, setAdjustments] = useState<Record<string, Marker>>(
      scan.workspace?.adjustments || {},
    ),
    [includeProjectPhotos, setIncludeProjectPhotos] = useState(false),
    [projectBusy, setProjectBusy] = useState(false),
    [projectMessage, setProjectMessage] = useState(recoveryNotice);
  const photoSurface = useRef<HTMLDivElement>(null),
    explorer = useRef<HTMLDivElement>(null);
  const visible = filterComponents(analysis.components, filter, query),
    visibleIds = new Set(visible.map((p) => p.id));
  const part = analysis.components.find((c) => c.id === selected),
    edges = componentEdges(analysis.components);
  const related = part
    ? edges.flatMap((e) =>
        e.source === part.id
          ? [e.target]
          : e.target === part.id
            ? [e.source]
            : [],
      )
    : [];
  const currentMarker = part ? adjustments[part.id] || part.marker : null;
  const observed = analysis.components.filter((p) => p.observed).length,
    inferred = analysis.components.length - observed;
  function select(id: string, reveal = false) {
    const component = analysis.components.find((c) => c.id === id);
    if (!component) return;
    setSelected(id);
    setEditing(false);
    if (!visibleIds.has(id)) {
      setFilter("all");
      setQuery("");
    }
    if (component.image_index !== null) setImage(component.image_index);
    if (reveal)
      explorer.current?.scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
  }
  function changeFilter(next: EvidenceFilter, text = query) {
    setFilter(next);
    setQuery(text);
    setEditing(false);
    const nextParts = filterComponents(analysis.components, next, text);
    if (!nextParts.some((p) => p.id === selected)) {
      const first = nextParts[0];
      setSelected(first?.id || "");
      if (first?.image_index !== null && first?.image_index !== undefined)
        setImage(first.image_index);
    }
  }
  function move(marker: Marker) {
    if (!part?.observed || part.image_index !== image) return;
    setAdjustments((old) => ({ ...old, [part.id]: clampMarker(marker) }));
  }
  function download() {
    const corrections = Object.entries(adjustments).map(([id, marker]) => ({
      component_id: id,
      image_index: analysis.components.find((p) => p.id === id)!.image_index,
      marker,
      source: "user-adjusted",
    }));
    const output = {
      kind: "realitylab-analysis",
      version: 1,
      exported_at: new Date().toISOString(),
      ...scan.result,
      ...(scan.recorded ? { recordedExample: scan.recorded } : {}),
      ...(corrections.length
        ? {
            userAnnotations: {
              markerAdjustments: corrections,
              notice:
                "Local placement corrections. The original model analysis is unchanged; these do not verify identity, function or materials.",
            },
          }
        : {}),
    };
    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "realitylab-analysis-v1.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function saveProject() {
    setProjectBusy(true);
    setProjectMessage("");
    try {
      const project = await makeProjectFile(
        scan,
        { selected, image, view, adjustments },
        getLearningDraft(meta.requestId),
        includeProjectPhotos,
      );
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(project, null, 2)], {
          type: "application/json",
        }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = `realitylab-project-${meta.requestId.slice(0, 8)}-v1.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setProjectMessage(
        `Project saved. ${includeProjectPhotos ? "Source photos are embedded in this file." : "No photo bytes were included."}`,
      );
    } catch (e) {
      setProjectMessage(
        e instanceof Error ? e.message : "The project could not be saved.",
      );
    } finally {
      setProjectBusy(false);
    }
  }
  return (
    <section className="section live-results">
      <div className="breadcrumb">
        <button onClick={onEdit}>
          {scan.recorded ? "Scan your object" : "Your photos"}
        </button>
        <ChevronRight size={12} /> Analysis{" "}
        <span className="sample-label">
          {scan.recorded ? "Recorded Meta scan" : "Live Meta model"} ·{" "}
          {meta.provider}
        </span>
      </div>
      <div className="explore-heading">
        <div>
          <p className="eyebrow">
            {scan.recorded ? "RECORDED PHOTO" : "FROM YOUR PHOTO"} /{" "}
            {analysis.category}
          </p>
          <h1>{analysis.object_name}</h1>
        </div>
        <div className="result-actions">
          <button className="secondary" onClick={onEdit}>
            {scan.recorded ? "Scan your object" : "Edit photos"}
          </button>
          <button className="primary" onClick={onNew}>
            New scan <ArrowUpRight size={15} />
          </button>
        </div>
      </div>
      {scan.recorded && (
        <p className="demo-notice">
          Recorded response · No new scan request. Photo: {scan.recorded.author}{" "}
          ({scan.recorded.license}).{" "}
          <a href={scan.recorded.sourceUrl} target="_blank" rel="noreferrer">
            View source
          </a>
          . Build &amp; Learn makes a new AI request only with your consent.
        </p>
      )}
      {analysis.recognition === "uncertain" && (
        <aside
          className="recognition-recovery"
          aria-labelledby="recognition-recovery-title"
        >
          <Info size={22} />
          <div>
            <p className="eyebrow">IDENTITY UNCERTAIN</p>
            <h2 id="recognition-recovery-title">
              This object needs another look.
            </h2>
            <p>
              The model has not established the object’s identity. Treat these
              parts and explanations as tentative.
            </p>
            {analysis.next_steps[0] && (
              <p>
                <strong>Suggested next view:</strong> {analysis.next_steps[0]}
              </p>
            )}
            <button className="secondary" onClick={onEdit}>
              {scan.recorded ? "Scan your own object" : "Add or change a photo"}{" "}
              <ArrowUpRight size={14} />
            </button>
            <small>
              No new request starts automatically. A retry uses credits after
              consent.
            </small>
          </div>
        </aside>
      )}
      <p className="analysis-summary">{analysis.summary}</p>
      <div className="analysis-meta">
        <span>
          <Clock3 size={12} />
          {scan.clientTiming
            ? `${(scan.clientTiming.totalMs / 1000).toFixed(1)}s total wait`
            : `${(meta.durationMs / 1000).toFixed(1)}s server processing`}
        </span>
        <span>
          {analysis.recognition === "identified"
            ? "Model identification"
            : "Identity uncertain"}{" "}
          · Not verified
        </span>
        <span>
          {meta.usage.totalTokens !== null
            ? `${meta.usage.totalTokens.toLocaleString()} tokens`
            : "Token usage unavailable"}
        </span>
      </div>
      {meta.timing && (
        <details className="timing-breakdown">
          <summary>Request timing and usage</summary>
          <dl>
            <div>
              <dt>Total browser wait</dt>
              <dd>
                {scan.clientTiming
                  ? `${(scan.clientTiming.totalMs / 1000).toFixed(2)}s`
                  : "Unavailable for this saved response"}
              </dd>
            </div>
            <div>
              <dt>Server total</dt>
              <dd>{(meta.durationMs / 1000).toFixed(2)}s</dd>
            </div>
            <div>
              <dt>Request upload/read</dt>
              <dd>{(meta.timing.requestReadMs / 1000).toFixed(2)}s</dd>
            </div>
            <div>
              <dt>Image normalization</dt>
              <dd>{(meta.timing.normalizationMs / 1000).toFixed(2)}s</dd>
            </div>
            <div>
              <dt>Shared quota check</dt>
              <dd>{(meta.timing.quotaMs / 1000).toFixed(2)}s</dd>
            </div>
            <div>
              <dt>Meta provider</dt>
              <dd>{(meta.timing.inferenceMs / 1000).toFixed(2)}s</dd>
            </div>
            <div>
              <dt>Reported tokens</dt>
              <dd>
                {meta.usage.totalTokens === null
                  ? "Unknown"
                  : meta.usage.totalTokens.toLocaleString()}
              </dd>
            </div>
          </dl>
          <p>
            Timing is measured for this request. Token counts come from the
            provider; unknown does not mean zero. No dollar cost is inferred.
          </p>
        </details>
      )}
      {projectMessage && recoveryNotice && (
        <p className="project-recovery-notice" role="status">
          <Check size={15} />
          <span>
            <strong>Project restored.</strong> {projectMessage}
          </span>
        </p>
      )}
      <div className="project-path" aria-label="Primary investigation path">
        <span>
          <b>01</b> Blueprint
        </span>
        <ChevronRight size={13} />
        <span>
          <b>02</b> Components
        </span>
        <ChevronRight size={13} />
        <span>
          <b>03</b> Recreate
        </span>
      </div>
      <div className="evidence-dashboard">
        <div>
          <span>REVERSE ENGINEERING / 01</span>
          <strong>Begin with the blueprint.</strong>
          <p>Trace each proposed part back to visible evidence or a clearly labeled inference.</p>
        </div>
        <dl>
          <div>
            <dt>Observed parts</dt>
            <dd>{observed.toString().padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>Inferred parts</dt>
            <dd>{inferred.toString().padStart(2, "0")}</dd>
          </div>
          <div>
            <dt>Working principles</dt>
            <dd>{analysis.principles.length.toString().padStart(2, "0")}</dd>
          </div>
        </dl>
        <button
          className="primary"
          onClick={() => {
            setView("blueprint");
            explorer.current?.scrollIntoView({ block: "start" });
          }}
        >
          View blueprint first <ArrowUpRight size={16} />
        </button>
      </div>
      <div
        className="result-jumps"
        role="group"
        aria-label="Primary investigation sections"
      >
        <button
          aria-label="Open blueprint"
          onClick={() => {
            setView("blueprint");
            explorer.current?.scrollIntoView({ block: "start" });
          }}
        >
          01 · Blueprint
        </button>
        <button
          onClick={() => {
            setView("photo");
            explorer.current?.scrollIntoView({ block: "start" });
          }}
        >
          Inspect source photos
        </button>
        <button
          onClick={() => document.getElementById("reverse-workbench")?.scrollIntoView({ block: "start" })}
        >
          02 · Components
        </button>
        <button onClick={() => document.getElementById("build-learn")?.scrollIntoView({ block: "start" })}>
          03 · Recreate
        </button>
      </div>
      <div className="exploration-toolbar">
        <div
          className="evidence-filters"
          role="group"
          aria-label="Filter components by evidence"
        >
          {(
            [
              ["all", "All parts", analysis.components.length],
              ["observed", "Observed", observed],
              ["inferred", "Inferred", inferred],
            ] as const
          ).map(([value, label, count]) => (
            <button
              key={value}
              aria-pressed={filter === value}
              onClick={() => changeFilter(value)}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>
        <label className="component-search">
          <Search size={14} />
          <input
            type="search"
            aria-label="Search components"
            placeholder="Find a part or material…"
            value={query}
            onChange={(e) => changeFilter(filter, e.target.value)}
          />
        </label>
      </div>
      <div
        ref={explorer}
        className={`explorer live-explorer ${view === "blueprint" ? "studio-layout" : ""}`}
      >
        <div className="source-panel">
          <div
            className="explorer-view-switch"
            role="group"
            aria-label="Exploration view"
          >
            <button
              aria-pressed={view === "photo"}
              onClick={() => setView("photo")}
            >
              <ImageIcon size={14} />
              Photo evidence
            </button>
            <button
              aria-pressed={view === "map"}
              onClick={() => {
                setEditing(false);
                setView("map");
              }}
            >
              <Network size={14} />
              Relationship map
            </button>
            <button
              aria-pressed={view === "blueprint"}
              onClick={() => {
                setEditing(false);
                setView("blueprint");
              }}
            >
              <Layers3 size={14} />
              Blueprint
            </button>
          </div>
          {view === "photo" ? (
            <>
              <div className="source-header">
                <span>
                  {scan.recorded ? "DEMO PHOTO" : "YOUR PHOTO"} · VIEW{" "}
                  {image + 1}
                </span>
                <span>
                  {Object.keys(adjustments).length
                    ? "Model + locally adjusted markers"
                    : "Model-suggested markers"}
                </span>
              </div>
              <div
                ref={photoSurface}
                className={`source-image ${editing ? "is-editing" : ""}`}
                role="group"
                aria-label={
                  editing
                    ? "Marker placement surface"
                    : "Photo and component markers"
                }
                aria-describedby={editing ? "marker-help" : undefined}
                tabIndex={editing ? 0 : undefined}
                onClick={(e) => {
                  if (!editing) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  move({
                    x: (e.clientX - rect.left) / rect.width,
                    y: (e.clientY - rect.top) / rect.height,
                  });
                }}
                onKeyDown={(e) => {
                  if (!editing || !part) return;
                  const marker = adjustments[part.id] ||
                    part.marker || { x: 0.5, y: 0.5 };
                  const step = e.shiftKey ? 0.05 : 0.01;
                  const delta: { [key: string]: Marker } = {
                    ArrowLeft: { x: -step, y: 0 },
                    ArrowRight: { x: step, y: 0 },
                    ArrowUp: { x: 0, y: -step },
                    ArrowDown: { x: 0, y: step },
                  };
                  if (!delta[e.key]) return;
                  e.preventDefault();
                  move({
                    x: marker.x + delta[e.key].x,
                    y: marker.y + delta[e.key].y,
                  });
                }}
              >
                <img
                  src={scan.photos[image].url}
                  alt={
                    scan.photos[image].omitted
                      ? `Source photo ${image + 1} was omitted from the saved project`
                      : `${scan.recorded ? "Recorded example" : "Your submitted object"} photo, view ${image + 1}`
                  }
                />
                {!scan.photos[image].omitted &&
                  visible
                    .filter(
                      (p) =>
                        p.observed &&
                        p.image_index === image &&
                        (adjustments[p.id] || p.marker),
                    )
                    .map((p) => {
                      const marker = adjustments[p.id] || p.marker!;
                      return (
                        <button
                          key={p.id}
                          className={`photo-marker ${selected === p.id ? "selected" : ""} ${adjustments[p.id] ? "user-adjusted" : ""}`}
                          style={{
                            left: `${marker.x * 100}%`,
                            top: `${marker.y * 100}%`,
                          }}
                          aria-label={`Select ${p.name}`}
                          aria-pressed={selected === p.id}
                          title={
                            adjustments[p.id]
                              ? "Your local marker adjustment"
                              : "Model-suggested location"
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            select(p.id);
                          }}
                        >
                          {analysis.components.indexOf(p) + 1}
                        </button>
                      );
                    })}
              </div>
              {scan.photos[image].omitted && (
                <p className="photo-omitted-notice">
                  <Info size={14} />
                  This project was saved without this photo. The original model
                  analysis is retained, but photo markers and edge study cannot
                  be rechecked here.
                </p>
              )}
              {scan.photos.length > 1 && (
                <div className="source-thumbnails" aria-label="Submitted views">
                  {scan.photos.map((p, i) => (
                    <button
                      key={p.id}
                      aria-label={`View photo ${i + 1}`}
                      aria-pressed={image === i}
                      onClick={() => {
                        setImage(i);
                        setEditing(false);
                      }}
                    >
                      <img src={p.url} alt="" />
                      <span>View {i + 1}</span>
                    </button>
                  ))}
                </div>
              )}
              {part?.observed &&
                !scan.photos[part.image_index ?? image]?.omitted && (
                  <div className="marker-tools">
                    <button
                      className="text-link"
                      aria-pressed={editing}
                      onClick={() => {
                        setImage(part.image_index!);
                        setEditing((value) => !value);
                        setTimeout(() => photoSurface.current?.focus(), 0);
                      }}
                    >
                      <SlidersHorizontal size={13} />
                      {editing ? "Finish placement" : "Adjust selected marker"}
                    </button>
                    {adjustments[part.id] && (
                      <button
                        className="text-link"
                        onClick={() => {
                          setAdjustments((old) => {
                            const next = { ...old };
                            delete next[part.id];
                            return next;
                          });
                          setEditing(false);
                        }}
                      >
                        <RotateCcw size={12} />
                        Restore model placement
                      </button>
                    )}
                  </div>
                )}
              {editing && (
                <p className="marker-help" id="marker-help">
                  Place “{part?.name}”: click or tap its location in this photo,
                  or focus the photo and use arrow keys (Shift for larger
                  moves). Adjustments stay local and do not verify the part.
                  <span className="marker-coordinate" role="status">
                    {currentMarker
                      ? `Marker: ${Math.round(currentMarker.x * 100)}% across, ${Math.round(currentMarker.y * 100)}% down this photo.`
                      : "No location set yet."}
                  </span>
                </p>
              )}
              <p className="source-disclaimer">
                <Info size={13} /> Photo analysis only. Hidden structure and
                materials are hypotheses; no 3D reconstruction is generated.
              </p>
            </>
          ) : view === "map" ? (
            <ComponentMap
              parts={analysis.components}
              visibleIds={visibleIds}
              selected={selected}
              onSelect={select}
            />
          ) : (
            <ConceptBlueprint
              scan={scan}
              image={image}
              visibleIds={visibleIds}
              selected={selected}
              adjustments={adjustments}
              onSelect={select}
              onImage={setImage}
            />
          )}
        </div>
        <aside className="inspector">
          <div className="inspector-top">
            <span>COMPONENTS</span>
            <span>
              {visible.length} / {analysis.components.length}
            </span>
          </div>
          <div className="parts-list">
            {visible.map((p) => (
              <button
                key={p.id}
                aria-pressed={selected === p.id}
                onClick={() => select(p.id)}
              >
                <span className="part-number">
                  {String(analysis.components.indexOf(p) + 1).padStart(2, "0")}
                </span>
                <span>
                  {p.name}
                  <small>
                    {p.observed
                      ? "Observed in photo"
                      : "Inferred · not visible"}
                  </small>
                </span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
          {visible.length === 0 && analysis.components.length > 0 && (
            <div className="empty-parts">
              <p>No components match this view.</p>
              <button
                className="text-link"
                onClick={() => changeFilter("all", "")}
              >
                Clear filters
              </button>
            </div>
          )}
          {part && visibleIds.has(part.id) ? (
            <div className="part-detail" aria-live="polite">
              <span
                className={`evidence-tag ${part.observed ? "" : "inferred"}`}
              >
                {part.observed ? <Check size={12} /> : <Info size={12} />}{" "}
                {part.observed ? "Observed" : "Inferred"} ·{" "}
                {part.confidence === "supported"
                  ? "Evidence supported"
                  : "Uncertain"}
              </span>
              <h2>{part.name}</h2>
              <h4>LIKELY ROLE</h4>
              <p>{part.function}</p>
              <h4>{part.observed ? "PHOTO EVIDENCE" : "WHY IT IS INFERRED"}</h4>
              <p>{part.evidence}</p>
              <h4>POSSIBLE MATERIALS · UNVERIFIED</h4>
              <p>
                {part.material_candidates.join(" / ") ||
                  "Not established from these photos."}
              </p>
              {part.observed && (
                <p className="detail-source">
                  Source: view {part.image_index! + 1} ·{" "}
                  {adjustments[part.id]
                    ? "marker adjusted by you"
                    : part.marker
                      ? "marker suggested by model"
                      : "location not established"}
                </p>
              )}
              {!part.observed && (
                <p className="detail-source">
                  Not visible in the supplied photo. No location marker is
                  shown.
                </p>
              )}
              {related.length > 0 && (
                <>
                  <h4>MODEL-SUGGESTED ASSOCIATIONS · UNVERIFIED</h4>
                  <div className="connection-links">
                    {related.map((id) => (
                      <button key={id} onClick={() => select(id)}>
                        {analysis.components.find((p) => p.id === id)?.name}
                        <ChevronRight size={11} />
                      </button>
                    ))}
                  </div>
                </>
              )}
              {analysis.principles.some((p) =>
                p.component_ids.includes(part.id),
              ) && (
                <>
                  <h4>RELATED WORKING PRINCIPLES</h4>
                  <div className="connection-links">
                    {analysis.principles.map(
                      (p, i) =>
                        p.component_ids.includes(part.id) && (
                          <button
                            key={i}
                            onClick={() =>
                              document
                                .getElementById(`principle-${i}`)
                                ?.scrollIntoView({
                                  behavior: matchMedia(
                                    "(prefers-reduced-motion: reduce)",
                                  ).matches
                                    ? "instant"
                                    : "smooth",
                                  block: "center",
                                })
                            }
                          >
                            {p.name}
                            <ChevronRight size={11} />
                          </button>
                        ),
                    )}
                  </div>
                </>
              )}
            </div>
          ) : analysis.components.length === 0 ? (
            <p className="empty-parts">
              No components could be described reliably. Try a closer, clearer
              view.
            </p>
          ) : null}
          <p className="inspector-foot">
            <Info size={14} /> Evidence labels are model judgments, not
            calibrated probabilities.
          </p>
        </aside>
      </div>
      <p className="exploration-status" role="status">
        {visible.length} of {analysis.components.length} parts shown
        {part && visibleIds.has(part.id)
          ? ` · Selected: ${part.name}, ${part.observed ? "observed" : "inferred"}`
          : ""}
        .{" "}
        {Object.keys(adjustments).length
          ? `${Object.keys(adjustments).length} local marker adjustment(s).`
          : ""}
      </p>
      <ReverseEngineeringWorkbench scan={scan} selected={selected} onSelect={(id) => select(id, true)} />
      <div className="result-bottom">
        <div className="principle-list">
          <p className="eyebrow">HOW IT MAY WORK</p>
          {analysis.principles.length ? (
            analysis.principles.map((p, i) => (
              <article
                key={i}
                id={`principle-${i}`}
                className={
                  p.component_ids.includes(selected) ? "principle-selected" : ""
                }
              >
                <Layers3 size={19} />
                <div>
                  <h3>{p.name}</h3>
                  <p>{p.explanation}</p>
                  <div
                    className="principle-parts"
                    role="group"
                    aria-label={`Components in ${p.name}`}
                  >
                    {p.component_ids.map((id) => (
                      <button
                        key={id}
                        aria-pressed={selected === id}
                        onClick={() => select(id, true)}
                      >
                        {analysis.components.find((c) => c.id === id)?.name}
                        <ChevronRight size={11} />
                      </button>
                    ))}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p>No mechanism explanation could be grounded in these photos.</p>
          )}
          <div className="next-observations">
            <h3>A useful next look</h3>
            <ul>
              {analysis.next_steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        <aside className="uncertainty-panel">
          <h3>What we can’t establish</h3>
          <ul>
            {analysis.uncertainty.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <h4>KEEP IN MIND</h4>
          <ul>
            {analysis.safety_notes.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </aside>
      </div>
      <DiagramLab
        scan={scan}
        selected={selected}
        onSelect={(id) => select(id, true)}
      />
      <BuildLearn scan={scan} onSelect={(id) => select(id, true)} />
      <section className="project-save" aria-labelledby="project-save-title">
        <div>
          <p className="eyebrow">SAVE &amp; CONTINUE</p>
          <h3 id="project-save-title">Keep the whole investigation.</h3>
          <p>
            Save the analysis, marker corrections, drawing position, lesson,
            answers and observation journal in one validated project file.
          </p>
        </div>
        <div className="project-save-actions">
          <label>
            <input
              type="checkbox"
              checked={includeProjectPhotos}
              disabled={
                projectBusy || scan.photos.every((photo) => photo.omitted)
              }
              onChange={(event) =>
                setIncludeProjectPhotos(event.target.checked)
              }
            />
            <span>
              Embed photos in project file
              <small>
                Off by default. When enabled, image bytes are embedded in the
                JSON file you download.
              </small>
            </span>
          </label>
          <button
            className="primary"
            disabled={projectBusy}
            onClick={saveProject}
          >
            <Save size={15} />
            {projectBusy ? "Preparing project…" : "Save project"}
          </button>
        </div>
        <p className="project-save-status" role="status">
          {projectMessage ||
            "Nothing is saved automatically. Use Open project in the header to restore this file later."}
        </p>
      </section>
      <div className="result-provenance">
        <div>
          <strong>Generated with a Meta model</strong>
          <p>
            {meta.model} via {meta.provider}
            <br />
            Analyzed {new Date(meta.analyzedAt).toLocaleString()} · Request{" "}
            {meta.requestId}
          </p>
        </div>
        <button className="secondary" onClick={download}>
          <Download size={14} />
          Export analysis
        </button>
      </div>
    </section>
  );
}

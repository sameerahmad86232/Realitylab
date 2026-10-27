import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Download, Plus, Trash2, Network, LayoutGrid } from "lucide-react";
import { describeObjectGraph, makeObjectGraphSvg } from "../../lib/objectGraph";
import { downloadFile } from "../../lib/exportReport";
const relations = [
  "connected-to",
  "supports",
  "contains",
  "transmits-motion",
  "electrical-link",
  "unknown",
];
export default function ComponentGraph({
  analysis,
  selected,
  onSelect,
  onRelationshipsChange,
  onLayoutChange,
}) {
  const flow = useRef(null),
    layoutTimer = useRef(null);
  useEffect(() => () => clearTimeout(layoutTimer.current), []);
  const [showHypotheses, setShowHypotheses] = useState(false);
  const scheduleFit = useCallback(() => {
    clearTimeout(layoutTimer.current);
    layoutTimer.current = setTimeout(
      () => flow.current?.fitView({ padding: 0.2, duration: 0 }),
      150,
    );
  }, []);
  useEffect(() => {
    scheduleFit();
    return () => clearTimeout(layoutTimer.current);
  }, [analysis.id, showHypotheses, scheduleFit]);

  const descriptors = useMemo(
    () => describeObjectGraph(analysis, { includeHypotheses: showHypotheses }),
    [analysis, showHypotheses],
  );
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [source, setSource] = useState(""),
    [target, setTarget] = useState(""),
    [relation, setRelation] = useState("connected-to"),
    [basis, setBasis] = useState(""),
    [certainty, setCertainty] = useState("hypothesis"),
    [error, setError] = useState("");
  useEffect(() => {
    setNodes((previous) =>
      descriptors.nodes.map((n) => ({
        id: n.id,
        type: "default",
        position: previous.find((p) => p.id === n.id)?.position || n.position,
        selected: n.id === selected,
        connectable: n.kind === "observation",
        deletable: false,
        className:
          n.kind === "hypothesis"
            ? "object-node hypothesis-node"
            : `object-node review-${n.reviewStatus || "pending"}`,
        data: {
          label: (
            <div>
              <span>
                {n.kind === "hypothesis"
                  ? "INTERNAL HYPOTHESIS"
                  : "VISIBLE COMPONENT"}
              </span>
              <strong>{n.name}</strong>
              {n.reviewStatus === "disputed" && (
                <small className="node-review-warning">USER DISAGREES</small>
              )}
              {n.reviewStatus === "needs-view" && (
                <small className="node-review-warning">
                  NEEDS ANOTHER VIEW
                </small>
              )}
            </div>
          ),
        },
      })),
    );
  }, [descriptors, selected, setNodes]);
  const edges = useMemo(
    () =>
      descriptors.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.relation,
        type: "smoothstep",
        animated: false,
        style: {
          stroke: e.certainty === "hypothesis" ? "#a4783f" : "#667de1",
          strokeDasharray: e.certainty === "hypothesis" ? "5 5" : undefined,
        },
        labelStyle: { fill: "#485773", fontSize: 9 },
        labelBgStyle: { fill: "#ffffff" },
        data: e,
      })),
    [descriptors.edges],
  );
  function add(
    a,
    b,
    kind = "unknown",
    reason = "User-added connection; physical verification is still needed.",
    confidence = "hypothesis",
  ) {
    if (!a || !b || a === b) {
      setError("Choose two different visible components.");
      return;
    }
    if (descriptors.edges.length >= 60) {
      setError("A component map can contain at most 60 relationships.");
      return;
    }
    const valid = new Set(analysis.observations.map((o) => o.id));
    if (!valid.has(a) || !valid.has(b)) {
      setError(
        "Relationships must connect visible components. Internal hypotheses remain unverified.",
      );
      return;
    }
    if (
      descriptors.edges.some(
        (e) =>
          [e.source, e.target].sort().join("|") === [a, b].sort().join("|") &&
          e.relation === kind,
      )
    ) {
      setError("That relationship already exists.");
      return;
    }
    onRelationshipsChange([
      ...descriptors.edges,
      {
        id: crypto.randomUUID(),
        source: a,
        target: b,
        relation: kind,
        basis: reason,
        certainty: confidence,
        origin: "user-added",
      },
    ]);
    setError("");
  }
  function arrange() {
    const fresh = describeObjectGraph(
      { ...analysis, graphLayout: {} },
      { includeHypotheses: showHypotheses },
    );
    const layout = Object.fromEntries(
      fresh.nodes.map((n) => [n.id, n.position]),
    );
    setNodes((current) =>
      current.map((n) => ({ ...n, position: layout[n.id] || n.position })),
    );
    onLayoutChange(layout);
    clearTimeout(layoutTimer.current);
    layoutTimer.current = setTimeout(
      () => flow.current?.fitView({ padding: 0.2, duration: 200 }),
      100,
    );
  }
  return (
    <div className="object-map-panel">
      <div className="object-map-heading">
        <div>
          <Network size={17} />
          <div>
            <h5>How the parts relate.</h5>
            <p>
              Drag components. Connect visible parts. Inspect the evidence
              behind each relationship.
            </p>
          </div>
        </div>
        <div className="graph-action-buttons">
          <button
            className="quiet-button"
            aria-label="Automatically arrange component map"
            onClick={arrange}
          >
            <LayoutGrid size={13} /> Arrange
          </button>
          <button
            className="quiet-button"
            onClick={() =>
              downloadFile(
                "realitylab-component-map.svg",
                makeObjectGraphSvg(analysis, {
                  includeHypotheses: showHypotheses,
                }),
                "image/svg+xml",
              )
            }
          >
            <Download size={13} /> Map SVG
          </button>
        </div>
      </div>
      <label className="lab-check graph-filter">
        <input
          type="checkbox"
          checked={showHypotheses}
          onChange={(e) => setShowHypotheses(e.target.checked)}
        />
        <span>Include unverified internal hypotheses in the map and SVG</span>
      </label>
      <div
        className="object-graph"
        aria-label="Interactive object component map"
      >
        <ReactFlow
          onInit={(instance) => {
            flow.current = instance;
            scheduleFit();
          }}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeClick={(_, n) => {
            if (analysis.observations.some((o) => o.id === n.id))
              onSelect(n.id);
          }}
          onNodeDragStop={(_, n) =>
            onLayoutChange({ ...analysis.graphLayout, [n.id]: n.position })
          }
          onConnect={(c) => add(c.source, c.target)}
          onEdgesDelete={(deleted) =>
            onRelationshipsChange(
              descriptors.edges.filter(
                (e) => !deleted.some((d) => d.id === e.id),
              ),
            )
          }
          fitView
          fitViewOptions={{ padding: 0.25 }}
          minZoom={0.15}
          maxZoom={2}
          colorMode="light"
          ariaLabelConfig={{
            "controls.zoomIn.ariaLabel": "Zoom in component map",
            "controls.zoomOut.ariaLabel": "Zoom out component map",
            "controls.fitView.ariaLabel": "Fit component map",
          }}
        >
          <Background gap={20} color="#b6c1d844" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) =>
              n.className?.includes("hypothesis") ? "#c5a775" : "#a3b2ef"
            }
          />
        </ReactFlow>
      </div>
      <p className="graph-legend">
        <span /> Visible component <i /> Unverified hypothesis <em /> Dashed
        connection = inferred. Positions are schematic, not measured dimensions.
      </p>
      <details className="relationship-editor">
        <summary>
          Add or review relationships <Plus size={15} />
        </summary>
        <div className="lab-field-grid">
          <label className="lab-label">
            From component
            <select
              aria-label="Relationship source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="">Choose a component</option>
              {analysis.observations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="lab-label">
            To component
            <select
              aria-label="Relationship target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              <option value="">Choose a component</option>
              {analysis.observations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="lab-label">
            Relationship
            <select
              aria-label="Relationship type"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
            >
              {relations.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="lab-label">
            Evidence status
            <select
              aria-label="Relationship evidence status"
              value={certainty}
              onChange={(e) => setCertainty(e.target.value)}
            >
              <option value="hypothesis">Hypothesis / not verified</option>
              <option value="visible">I can see this relationship</option>
            </select>
          </label>
        </div>
        <label className="lab-label">
          Basis for the connection
          <textarea
            maxLength={1000}
            value={basis}
            onChange={(e) => setBasis(e.target.value)}
            placeholder="Describe the visible evidence or why this is only a hypothesis."
          />
        </label>
        {error && (
          <p className="upload-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="quiet-button"
          onClick={() => {
            if (certainty === "visible" && !basis.trim()) {
              setError(
                "Describe what you can actually see before labeling a connection visible.",
              );
              return;
            }
            add(
              source,
              target,
              relation,
              basis.trim() || "User-added hypothesis; evidence not supplied.",
              certainty,
            );
          }}
        >
          <Plus size={13} /> Add relationship
        </button>
        <div className="relationship-list">
          {descriptors.edges.length ? (
            descriptors.edges.map((e) => (
              <article key={e.id}>
                <div>
                  <strong>
                    {analysis.observations.find((o) => o.id === e.source)?.name}{" "}
                    →{" "}
                    {analysis.observations.find((o) => o.id === e.target)?.name}
                  </strong>
                  <span>
                    {e.relation} / {e.certainty} / {e.origin}
                  </span>
                  <p>{e.basis}</p>
                </div>
                <button
                  aria-label={`Remove relationship ${e.id}`}
                  onClick={() =>
                    onRelationshipsChange(
                      descriptors.edges.filter((v) => v.id !== e.id),
                    )
                  }
                >
                  <Trash2 size={14} />
                </button>
              </article>
            ))
          ) : (
            <p className="lab-help">
              No relationships have been established. An empty map is better
              than an invented connection.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
ComponentGraph.propTypes = {
  analysis: PropTypes.shape({
    id: PropTypes.string,
    objectName: PropTypes.string.isRequired,
    observations: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ).isRequired,
    relationships: PropTypes.array,
    graphLayout: PropTypes.object,
    hypotheses: PropTypes.array,
  }).isRequired,
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onRelationshipsChange: PropTypes.func.isRequired,
  onLayoutChange: PropTypes.func.isRequired,
};

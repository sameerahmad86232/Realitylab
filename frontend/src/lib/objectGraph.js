import dagre from "@dagrejs/dagre";
import { escapeXml } from "./exportReport.js";
export function describeObjectGraph(
  analysis,
  { includeHypotheses = true } = {},
) {
  const observations = analysis?.observations || [],
    edges = analysis?.relationships || [];
  const positions = new Map(
    observations.map((o, i) => [
      o.id,
      { x: (i % 3) * 270, y: Math.floor(i / 3) * 155 },
    ]),
  );
  if (edges.length) {
    const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
    graph.setGraph({
      rankdir: "TB",
      nodesep: 75,
      ranksep: 95,
      marginx: 30,
      marginy: 30,
    });
    observations.forEach((o) =>
      graph.setNode(o.id, { width: 225, height: 90 }),
    );
    edges.forEach((e) => {
      if (positions.has(e.source) && positions.has(e.target))
        graph.setEdge(e.source, e.target, { width: 100, height: 22 });
    });
    dagre.layout(graph);
    observations.forEach((o) => {
      const n = graph.node(o.id);
      positions.set(o.id, { x: n.x - 112.5, y: n.y - 45 });
    });
  }
  const nodes = observations.map((o) => ({
    id: o.id,
    name: o.name,
    kind: "observation",
    reviewStatus: o.review?.status || "pending",
    position: analysis.graphLayout?.[o.id] || positions.get(o.id),
  }));
  const bottom = Math.max(0, ...nodes.map((n) => n.position.y + 90)) + 100;
  for (const [i, h] of (includeHypotheses
    ? analysis?.hypotheses || []
    : []
  ).entries()) {
    const id = `hyp-${h.id || i}`;
    nodes.push({
      id,
      name: h.name,
      kind: "hypothesis",
      position: analysis.graphLayout?.[id] || {
        x: (i % 3) * 270,
        y: bottom + Math.floor(i / 3) * 155,
      },
    });
  }
  return { nodes, edges };
}
export function makeObjectGraphSvg(
  analysis,
  { includeHypotheses = true } = {},
) {
  const { nodes, edges } = describeObjectGraph(analysis, { includeHypotheses });
  const lookup = new Map(nodes.map((n) => [n.id, n]));
  const minX = Math.min(0, ...nodes.map((n) => n.position.x)) - 35,
    minY = Math.min(0, ...nodes.map((n) => n.position.y)) - 70;
  const width =
      Math.max(600, ...nodes.map((n) => n.position.x + 235)) - minX + 35,
    height = Math.max(300, ...nodes.map((n) => n.position.y + 110)) - minY + 35;
  const edgeSvg = edges
    .map((e) => {
      const a = lookup.get(e.source),
        b = lookup.get(e.target);
      if (!a || !b) return "";
      const x1 = a.position.x + 110,
        y1 = a.position.y + 80,
        x2 = b.position.x + 110,
        y2 = b.position.y;
      return `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="${e.certainty === "hypothesis" ? "#c5af7a" : "#a8cf81"}" stroke-dasharray="${e.certainty === "hypothesis" ? "5 5" : "none"}" fill="none"/><text x="${(x1 + x2) / 2 + 4}" y="${(y1 + y2) / 2}" font-size="9" fill="#b7ca9b">${escapeXml(e.relation)}</text>`;
    })
    .join("");
  const nodeSvg = nodes
    .map(
      (n) =>
        `<g><rect x="${n.position.x}" y="${n.position.y}" width="220" height="80" rx="7" fill="${n.kind === "hypothesis" ? "#302a1b" : "#213019"}" stroke="${n.kind === "hypothesis" ? "#bba272" : "#a8cf81"}" stroke-dasharray="${n.kind === "hypothesis" ? "5 4" : "none"}"/><text x="${n.position.x + 12}" y="${n.position.y + 20}" font-size="8" fill="#a5ba8a">${n.kind === "hypothesis" ? "UNVERIFIED HYPOTHESIS" : n.reviewStatus === "disputed" ? "MODEL COMPONENT / USER DISAGREES" : n.reviewStatus === "needs-view" ? "MODEL COMPONENT / NEEDS ANOTHER VIEW" : "VISIBLE COMPONENT"}</text>${(
          n.name.match(/.{1,27}/g) || [""]
        )
          .slice(0, 2)
          .map(
            (line, i) =>
              `<text x="${n.position.x + 12}" y="${n.position.y + 42 + i * 17}" font-size="12" fill="#e2efcf">${escapeXml(line)}</text>`,
          )
          .join("")}</g>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.min(width, 1600)}" height="${Math.min(height, 1600)}" viewBox="${minX} ${minY} ${width} ${height}"><rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#14200e"/><g font-family="sans-serif"><text x="${minX + 25}" y="${minY + 27}" fill="#d7ebbf" font-size="16">${escapeXml(analysis.objectName)} / component map</text><text x="${minX + 25}" y="${minY + 45}" fill="#91ac78" font-size="9">Educational map. Dashed relationships and internal nodes are hypotheses. Model suggestions and user edits are not physical verification.</text>${edgeSvg}${nodeSvg}</g></svg>`;
}

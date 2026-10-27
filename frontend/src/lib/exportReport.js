export const escapeXml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
export function downloadFile(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function makeReportSvg({
  analysis,
  prediction,
  comparison,
  includeImages = false,
}) {
  const title = escapeXml(
    analysis?.objectName || "External gear pair experiment",
  );
  const image = includeImages && analysis?.images?.[0];
  const items =
    analysis?.observations?.filter((o) => o.imageId === image?.id) || [];
  const imageScale = image
    ? Math.min(700 / image.width, 320 / image.height)
    : 1;
  const imageWidth = image ? image.width * imageScale : 0,
    imageHeight = image ? image.height * imageScale : 0;
  const imageX = 50 + (700 - imageWidth) / 2,
    imageY = 90 + (320 - imageHeight) / 2;
  const textOnlyEvidence = analysis
    ? `<text x="50" y="115" fill="#b6d68c" font-size="13">Visible components / source photos omitted</text>${analysis.observations
        .slice(0, 6)
        .map(
          (o, i) =>
            `<text x="50" y="${155 + i * 35}" fill="#edf5df" font-size="13">${escapeXml(`${i + 1}. ${o.name}`.slice(0, 85))}</text>`,
        )
        .join(
          "",
        )}<text x="50" y="395" fill="#a3bd8a" font-size="11">${escapeXml(`${analysis.observations.length} model-suggested or user-edited parts. Review the JSON or readable report for evidence.`)}</text>`
    : null;
  const drawing = image
    ? `<image href="${escapeXml(image.dataUrl)}" x="${imageX}" y="${imageY}" width="${imageWidth}" height="${imageHeight}"/>${items.map((o, i) => `<circle cx="${imageX + o.marker.x * imageWidth}" cy="${imageY + o.marker.y * imageHeight}" r="13" fill="#d7f7ab"/><text x="${imageX + o.marker.x * imageWidth}" y="${imageY + o.marker.y * imageHeight + 4}" text-anchor="middle" font-size="11" fill="#172011">${i + 1}</text>`).join("")}`
    : analysis
      ? textOnlyEvidence
      : '<circle cx="290" cy="245" r="68" fill="none" stroke="#b6d68c" stroke-width="3"/><circle cx="450" cy="245" r="92" fill="none" stroke="#b6d68c" stroke-width="3"/><circle cx="290" cy="245" r="12" fill="none" stroke="#b6d68c"/><circle cx="450" cy="245" r="12" fill="none" stroke="#b6d68c"/><text x="400" y="375" text-anchor="middle" fill="#b6d68c" font-size="14">Symbolic gear pair / not to scale</text>';
  const output = prediction
    ? `${prediction.outputTurns.toFixed(4)} output turns, ${prediction.outputDirection}`
    : "No numerical prediction computed";
  const measurement = comparison
    ? `User-reported comparison: ${comparison.status}; tolerance ${comparison.measurement.tolerance} turns`
    : "No physical measurement recorded";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="540" viewBox="0 0 800 540"><rect width="800" height="540" fill="#172011"/><g font-family="sans-serif"><text x="35" y="40" fill="#edf5df" font-size="22">${title}</text><text x="35" y="65" fill="#a3bd8a" font-size="11">REALITYLAB / ${escapeXml(analysis ? "MODEL-SUGGESTED OBSERVATIONS" : "MANUAL SETUP")} / EDUCATIONAL REPORT</text>${drawing}<text x="35" y="455" fill="#edf5df" font-size="14">${escapeXml(output)}</text><text x="35" y="483" fill="#b6d68c" font-size="12">${escapeXml(measurement)}</text><text x="35" y="515" fill="#a3bd8a" font-size="10">User confirmations and measurements are self-reported. This is not a manufacture-ready drawing.</text></g></svg>`;
}

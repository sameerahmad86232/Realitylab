// Explicit, opt-in real-provider evaluation. Not part of npm test.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createApp } from "../server/src/app.js";

if (!process.argv.includes("--live")) {
  console.log("Usage: npm run validate:photos -- --live [output-directory]");
  console.log(
    "Makes four real Baseten analyses of attributed public photos and consumes provider credits. No calls were made.",
  );
  process.exit(0);
}
const directory = path.resolve(
  process.argv.slice(2).find((arg) => !arg.startsWith("--")) ||
    "/tmp/realitylab-real-photo-evaluation",
);
const sources = JSON.parse(
  await readFile(
    new URL("../tests/fixtures/real-photo-sources.json", import.meta.url),
    "utf8",
  ),
);
const server = createApp().listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const rows = [];
try {
  const health = await (await fetch(`${origin}/api/health`)).json();
  if (!health.analysis.configured)
    throw Error(
      "Configure the server-side Baseten key before a live evaluation.",
    );
  await mkdir(directory, { recursive: true });
  for (const source of sources) {
    const photo = await fetch(source.url, {
      signal: AbortSignal.timeout(30000),
    });
    if (!photo.ok)
      throw Error(`Photo download failed (${photo.status}): ${source.title}`);
    const buffer = await photo.arrayBuffer();
    if (buffer.byteLength > 5 * 1024 * 1024)
      throw Error("Photo exceeded upload size; no analysis sent.");
    const form = new FormData();
    form.append(
      "images",
      new Blob([buffer], { type: "image/jpeg" }),
      `${source.category}.jpg`,
    );
    form.append("context", source.context);
    form.append("consent", "true");
    const started = Date.now();
    const response = await fetch(`${origin}/api/analyze`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(100000),
    });
    const { images, ...analysis } = await response.json();
    const row = {
      source,
      status: response.status,
      elapsedSeconds: Math.round((Date.now() - started) / 100) / 10,
      analysis,
    };
    rows.push(row);
    await writeFile(
      path.join(directory, "results.json"),
      JSON.stringify(rows, null, 2),
    );
    console.log(
      JSON.stringify({
        category: source.category,
        status: response.status,
        name: analysis.objectName,
        recognition: analysis.recognition,
      }),
    );
    if (!response.ok) process.exitCode = 1;
  }
  console.log(
    `Saved photo-free provider results to ${path.join(directory, "results.json")}. Human review is required; HTTP success is not accuracy.`,
  );
} finally {
  server.closeAllConnections();
  server.close();
}

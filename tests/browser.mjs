// End-to-end checks use isolated injected provider fixtures, never external AI credits.
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { createApp } from "../server/src/app.js";
const executablePath =
  process.env.CHROMIUM_PATH ||
  ["/usr/lib/chromium/chromium", "/usr/bin/chromium"].find(existsSync);
if (!executablePath)
  throw Error("Set CHROMIUM_PATH to an installed Chromium executable.");
const fixture = {
  objectName: "Browser test gear pair",
  summary: "Injected test observations, not a real model run.",
  observations: [
    {
      id: "driver",
      imageId: "image-1",
      name: "Driver gear",
      marker: { x: 0.3, y: 0.5 },
      evidence: "Test-only visible driver.",
    },
    {
      id: "follower",
      imageId: "image-1",
      name: "Follower gear",
      marker: { x: 0.7, y: 0.5 },
      evidence: "Test-only visible follower.",
    },
  ],
  hypotheses: [
    {
      name: "Possible bearing",
      basis: "A rotating axle may use a bearing.",
      verificationNeeded: "Inspect the axle.",
    },
  ],
  unknowns: ["Counts need confirmation."],
  mechanism: {
    type: "external-gear-pair",
    gears: [
      { observationId: "driver", toothCount: 12 },
      { observationId: "follower", toothCount: 24 },
    ],
  },
};
async function start(provider) {
  const server = createApp({ provider, rateLimitEnabled: false }).listen(
    0,
    "127.0.0.1",
  );
  await new Promise((r) => server.once("listening", r));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}
const manual = await start({ configured: false, missing: ["BASETEN_API_KEY"] });
let providerCalls = 0;
const model = await start({
  configured: true,
  provider: "TEST-FIXTURE-NOT-LIVE-AI",
  model: "test-only-model",
  analyze: async ({ context }) => {
    providerCalls++;
    if (context.startsWith("test-category:")) {
      const category = context.split(":")[1];
      return {
        ...structuredClone(fixture),
        objectName: `Fixture ${category} object`,
        category,
        recognition: "identified",
        observations: fixture.observations.map((o, i) => ({
          ...o,
          name: i ? "Supporting component" : "Primary component",
          function: i
            ? "May support another visible part"
            : "Main visible structure",
        })),
        relationships: [
          {
            source: "driver",
            target: "follower",
            relation: "connected-to",
            basis: "Test-only visible contact",
            certainty: "visible",
          },
        ],
        nextSteps: ["Take a side view to inspect the connection."],
        mechanism: { type: "unsupported", gears: [] },
      };
    }
    return structuredClone(fixture);
  },
});
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
  ],
});
const artifacts =
  process.env.BROWSER_ARTIFACT_DIR || "/tmp/realitylab-browser-check";
await mkdir(artifacts, { recursive: true });
try {
  const p = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(manual.url, { waitUntil: "networkidle" });
  await p.getByRole("tab", { name: /Object explorer/ }).click();
  await p.getByRole("button", { name: "Load gear example" }).click();
  assert.equal(
    await p.getByRole("button", { name: "Compute prediction" }).isDisabled(),
    true,
  );
  await p.getByRole("button", { name: "Swap driver / follower" }).click();
  assert.equal(
    await p.getByLabel("Driver teeth", { exact: true }).inputValue(),
    "24",
  );
  await p.getByRole("button", { name: "Swap driver / follower" }).click();
  await p.getByLabel("I confirmed the driver tooth count.").check();
  await p
    .getByLabel(
      "I confirmed the follower tooth count and direct external contact.",
    )
    .check();
  await p.getByRole("button", { name: "Compute prediction" }).click();
  await p
    .locator(".prediction-summary")
    .getByText("output turns", { exact: true })
    .waitFor();
  await p.getByLabel("Measured output turns", { exact: true }).fill("0.5");
  await p.getByRole("button", { name: "Compare with prediction" }).click();
  await p
    .getByRole("heading", { name: "Within your declared tolerance" })
    .waitFor();
  const download = p.waitForEvent("download");
  await p.getByRole("button", { name: "JSON report", exact: true }).click();
  const f = await download;
  await f.saveAs(`${artifacts}/manual-report.json`);
  const report = JSON.parse(
    await readFile(`${artifacts}/manual-report.json`, "utf8"),
  );
  assert.equal(report.mode, "manual-example");
  assert.equal(report.comparison.withinTolerance, true);
  await p
    .getByLabel("Measured direction", { exact: true })
    .selectOption("clockwise");
  await p.getByRole("button", { name: "Compare with prediction" }).click();
  await p
    .getByRole("heading", { name: "A discrepancy worth investigating" })
    .waitFor();
  await p
    .locator(".mechanism-lab")
    .screenshot({ path: `${artifacts}/working-lab.png` });
  await p.getByLabel("Driver teeth", { exact: true }).fill("24");
  assert.equal(await p.locator(".prediction-panel").count(), 0);
  assert.equal(
    await p.getByLabel("I confirmed the driver tooth count.").isChecked(),
    false,
  );
  assert.equal(
    await p.getByLabel("Measured output turns", { exact: true }).count(),
    0,
  );
  assert.equal(
    await p.getByRole("button", { name: "Analyze my photos" }).isDisabled(),
    true,
  );
  await p.getByRole("tab", { name: /Car concept sample/ }).click();
  await p.getByRole("button", { name: "Load sample", exact: true }).click();
  await p
    .getByRole("button", { name: "Explore sample blueprint", exact: true })
    .click();
  await p
    .getByRole("heading", {
      name: "Reality GT / Electric grand tourer",
      exact: true,
    })
    .waitFor();
  for (const width of [360, 390, 768]) {
    await p.setViewportSize({ width, height: 844 });
    await p.getByRole("tab", { name: /Object explorer/ }).click();
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `Overflow at ${width}`,
    );
  }
  console.log(
    "PASS manual UI: confirmations, predictions, agreement/discrepancy, report, edits invalidate results, keyless state, separate car sample, mobile/tablet.",
  );
  await p.setViewportSize({ width: 1440, height: 1050 });
  await p.goto(model.url, { waitUntil: "networkidle" });
  await p.getByRole("tab", { name: /Object explorer/ }).click();
  const bytes = await sharp({
    create: { width: 200, height: 120, channels: 3, background: "#7d9b62" },
  })
    .png()
    .toBuffer();
  await p.getByLabel("Upload object photos for analysis").setInputFiles({
    name: "mechanism.png",
    mimeType: "image/png",
    buffer: bytes,
  });
  await p
    .locator(".lab-check")
    .filter({ hasText: "I agree to send" })
    .getByRole("checkbox")
    .check();
  await p.getByRole("button", { name: "Analyze my photos" }).click();
  await p.getByRole("heading", { name: "Browser test gear pair" }).waitFor();
  assert.equal(providerCalls, 1);
  assert.equal(
    await p.getByLabel("Driver teeth", { exact: true }).inputValue(),
    "12",
  );
  assert.equal(
    await p.getByLabel("I confirmed the driver tooth count.").isChecked(),
    false,
  );
  await p.getByRole("button", { name: "Inspect Driver gear" }).click();
  await p
    .getByLabel("Component label", { exact: true })
    .fill("Corrected driver");
  await p.getByLabel("Marker X (0–1)", { exact: true }).fill("0.4");
  await p.getByRole("button", { name: "Inspect Corrected driver" }).waitFor();
  await p
    .getByLabel("Visible evidence", { exact: true })
    .fill("A user-corrected visible driver component.");
  await p
    .getByLabel("Suggested role / function", { exact: true })
    .fill("A user-suggested driver role, still requiring verification.");
  await p.locator(".relationship-editor > summary").click();
  await p
    .getByLabel("Relationship source", { exact: true })
    .selectOption({ label: "Corrected driver" });
  await p
    .getByLabel("Relationship target", { exact: true })
    .selectOption({ label: "Follower gear" });
  await p
    .getByLabel("Basis for the connection", { exact: true })
    .fill("User test hypothesis about a visible contact.");
  await p
    .getByRole("button", { name: "Add relationship", exact: true })
    .click();
  await p.locator(".relationship-list article").first().waitFor();
  const mapEvent = p.waitForEvent("download");
  await p.getByRole("button", { name: "Map SVG", exact: true }).click();
  await (await mapEvent).saveAs(`${artifacts}/component-map.svg`);
  const mapSvg = await readFile(`${artifacts}/component-map.svg`, "utf8");
  assert.ok(mapSvg.includes("Corrected driver"));
  assert.ok(mapSvg.includes("connected-to"));
  await p
    .getByRole("button", { name: "Automatically arrange component map" })
    .click();
  await p.waitForTimeout(350);
  const beforeZoom = await p
    .locator(".react-flow__viewport")
    .getAttribute("style");
  await p.locator(".react-flow__controls-zoomin").click();
  await p.waitForTimeout(300);
  assert.notEqual(
    await p.locator(".react-flow__viewport").getAttribute("style"),
    beforeZoom,
  );

  await p.getByLabel("My evidence notes", {exact:true}).fill("The revised label matches my side-view observation.");
  await p.getByLabel("Review selected component", {exact:true}).selectOption("consistent");
  await p.getByLabel("Visible evidence", {exact:true}).fill("A changed claim invalidates the previous review.");
  assert.equal(await p.getByLabel("Review selected component", {exact:true}).inputValue(), "pending");
  await p.getByLabel("Visible evidence", {exact:true}).fill("A user-corrected visible driver component.");
  await p.getByLabel("Review selected component", {exact:true}).selectOption("consistent");
  const readableEvent=p.waitForEvent("download");
  await p.getByRole("button",{name:"Readable report",exact:true}).click();
  await (await readableEvent).saveAs(`${artifacts}/exploration.md`);
  const readable=await readFile(`${artifacts}/exploration.md`,"utf8");
  assert(readable.includes("Original model label: Driver gear"));
  assert(readable.includes("matches my side-view observation"));
  assert(!readable.includes("data:image"));

  const jsonEvent = p.waitForEvent("download");
  await p.getByRole("button", { name: "JSON report", exact: true }).click();
  await (await jsonEvent).saveAs(`${artifacts}/analysis-report.json`);
  const analysisReport = JSON.parse(
    await readFile(`${artifacts}/analysis-report.json`, "utf8"),
  );
  assert.equal(analysisReport.analysis.images[0].dataUrl, undefined);
  assert.equal(analysisReport.analysis.relationships.length, 1);
  assert.equal(analysisReport.analysis.relationships[0].origin, "user-added");
  assert.equal(analysisReport.analysis.observations[0].source, "user-edited");
  assert.equal(analysisReport.analysis.observations[0].marker.x, 0.4);
  assert.equal(analysisReport.analysis.observations[0].review.status, "consistent");
  assert.equal(analysisReport.analysis.observations[0].modelSuggestion.name, "Driver gear");
  assert.equal(
    analysisReport.analysis.observations[0].evidence,
    "A user-corrected visible driver component.",
  );
  assert.equal(
    analysisReport.analysis.observations[0].function,
    "A user-suggested driver role, still requiring verification.",
  );
  assert.equal(
    analysisReport.analysis.provenance.provider,
    "TEST-FIXTURE-NOT-LIVE-AI",
  );
  await p.getByLabel("Include my normalized photos in downloads.").check();
  const svgEvent = p.waitForEvent("download");
  await p.getByRole("button", { name: "SVG report", exact: true }).click();
  await (await svgEvent).saveAs(`${artifacts}/analysis-evidence.svg`);
  const svg = await readFile(`${artifacts}/analysis-evidence.svg`, "utf8");
  assert.ok(svg.includes("data:image/jpeg;base64,"));
  assert.ok(!svg.includes("<script"));
  await p
    .locator(".analysis-panel")
    .screenshot({ path: `${artifacts}/analysis-fixture.png` });
  console.log(
    "PASS fixture-only AI UI: real upload/normalization, annotations, corrections, user confirmation gate, photo-free JSON, opt-in image SVG. No real AI call.",
  );

  for (const category of ["furniture", "electronics", "appliance", "natural"]) {
    await p.goto(model.url, { waitUntil: "networkidle" });
    await p.getByRole("tab", { name: /Object explorer/ }).click();
    await p.getByLabel("Upload object photos for analysis").setInputFiles({
      name: "object.png",
      mimeType: "image/png",
      buffer: bytes,
    });
    await p
      .getByLabel("What are you investigating?", { exact: true })
      .fill(`test-category:${category}`);
    await p
      .locator(".lab-check")
      .filter({ hasText: "I agree to send" })
      .getByRole("checkbox")
      .check();
    await p.getByRole("button", { name: "Analyze my photos" }).click();
    await p
      .getByRole("heading", { name: `Fixture ${category} object`, exact: true })
      .waitFor();
    assert.equal(
      await p.getByLabel("Driver teeth", { exact: true }).count(),
      0,
    );
    assert.ok(
      (await p.locator(".object-category-badge").innerText())
        .toLowerCase()
        .includes(category),
    );
    await p.locator(".react-flow__node").first().waitFor();
    await p.getByLabel("Follow-up 1 notes", {exact:true}).fill("The side view shows a visible connection.");
    await p.getByLabel("Follow-up 1 status", {exact:true}).selectOption("recorded");
    const notebookDownload=p.waitForEvent("download");
    await p.getByRole("button",{name:"JSON report",exact:true}).click();
    await (await notebookDownload).saveAs(`${artifacts}/notebook-${category}.json`);
    const notebookReport=JSON.parse(await readFile(`${artifacts}/notebook-${category}.json`,"utf8"));
    assert.equal(notebookReport.analysis.followUpNotes[0].status,"recorded");
    assert.equal(notebookReport.analysis.followUpNotes[0].source,"user-reported");
    await p.getByLabel("Follow-up 1 notes", {exact:true}).fill("I changed my follow-up account.");
    assert.equal(await p.getByLabel("Follow-up 1 status", {exact:true}).inputValue(), "planned");
    if (category === "furniture")
      await p
        .locator(".analysis-panel")
        .screenshot({ path: `${artifacts}/general-object-map.png` });
  }
  await p.locator(".physics-bench > summary").click();
  await p.getByLabel("Load force (newtons)", { exact: true }).fill("100");
  await p.getByLabel("Effort moment arm (meters)", { exact: true }).fill("0.5");
  await p.getByLabel("Load moment arm (meters)", { exact: true }).fill("0.1");
  await p.locator(".physics-bench .lab-check input").check();
  await p.getByRole("button", { name: "Calculate ideal result" }).click();
  await p
    .locator(".physics-result")
    .getByText("20 N", { exact: true })
    .waitFor();
  await p.getByLabel("Physics model", { exact: true }).selectOption("pulley");
  assert.equal(await p.locator(".physics-result").count(), 0);
  assert.equal(
    await p.locator(".physics-bench .lab-check input").isChecked(),
    false,
  );
  await p.getByLabel("Supporting rope strands", { exact: true }).fill("4");
  await p.getByLabel("Desired load lift (meters)", { exact: true }).fill("0.5");
  await p.locator(".physics-bench .lab-check input").check();
  await p.getByRole("button", { name: "Calculate ideal result" }).click();
  await p
    .locator(".physics-result")
    .getByText("25 N", { exact: true })
    .waitFor();
  await p
    .locator(".physics-result")
    .getByText("2 m", { exact: true })
    .waitFor();
  for (const width of [360, 390, 768]) {
    await p.setViewportSize({ width, height: 844 });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `General graph/physics overflow at ${width}`,
    );
  }
  console.log(
    "PASS generalized UI: component graph, user relationship editing, zoom, SVG export, four fixture categories, ideal lever/pulley and mobile layouts. No additional AI calls.",
  );
  assert.deepEqual(errors, []);
  await p.close();
} finally {
  await browser.close();
  for (const { server } of [manual, model])
    await new Promise((r) => {
      server.closeAllConnections();
      server.close(r);
    });
}

import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { createApp } from "../server/src/app.js";
import { scanFixture } from "./helpers/scanFixture.js";
let calls = 0;
const provider = {
  configured: true,
  provider: "TEST-FIXTURE-NOT-LIVE",
  model: "test-bench",
  analyze: async () => scanFixture("mechanism"),
  prepareExperiment: async () => ({
    model: "gears",
    status: "suggested",
    basis: "Test-only direct pair; not live recognition.",
    nextObservations: ["Count both wheels manually."],
    limitations: ["No counts inferred."],
  }),
  planExperiment: async ({ experiment }) => {
    calls++;
    return {
      summary: "Test-only investigation: recheck the moment arms.",
      recommendedAction: experiment.result.comparison?.withinTolerance
        ? "record-agreement"
        : experiment.measurement
          ? "review-setup"
          : "collect-measurement",
      hypotheses: [
        {
          title: "Measurement check",
          basis: "Injected fixture, not a real cause.",
          nextCheck: "Repeat the same unpowered measurement.",
        },
      ],
      limitations: ["No physical experiment has been independently verified."],
    };
  },
};
const server = createApp({ provider, rateLimitEnabled: false }).listen(
  0,
  "127.0.0.1",
);
await new Promise((r) => server.once("listening", r));
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({
  executablePath: "/usr/lib/chromium/chromium",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
  ],
});
const dir = "/tmp/artifacts/bench";
await mkdir(dir, { recursive: true });
try {
  const p = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    reducedMotion: "reduce",
  });
  let errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(origin);
  await p.getByRole("tab",{name:/Experiment bench/}).click();
  await p
    .getByRole("heading", { name: "What are you testing?", exact: true })
    .waitFor();
  assert.equal(
    await p
      .getByRole("button", { name: "Predict behavior", exact: true })
      .isDisabled(),
    true,
  );
  // Real upload flow with an injected source, then handoff to the experiment bench.
  await p.getByRole("button", { name: /Scan a mechanism/ }).click();
  const image = await sharp({
    create: { width: 120, height: 120, channels: 3, background: "#aaaaaa" },
  })
    .png()
    .toBuffer();
  await p.getByLabel("Upload object photos for analysis").setInputFiles({
    name: "fixture.png",
    mimeType: "image/png",
    buffer: image,
  });
  await p
    .locator(".lab-check")
    .filter({ hasText: "I agree to send" })
    .getByRole("checkbox")
    .check();
  await p
    .getByRole("button", { name: "Analyze my photos", exact: true })
    .click();
  await p
    .getByRole("button", { name: /Use these observations in Bench/ })
    .click();
  await p.locator(".bench-source").waitFor();
  await p
    .locator(".bench-source .lab-check")
    .filter({ hasText: "send these photo descriptions" })
    .getByRole("checkbox")
    .check();
  await p
    .getByRole("button", {
      name: "Plan measurements from this scan",
      exact: true,
    })
    .click();
  await p
    .getByRole("button", { name: "Use suggested gears model", exact: false })
    .click();
  assert.equal(
    await p
      .getByRole("button", { name: "Predict behavior", exact: true })
      .isDisabled(),
    true,
  );
  await p
    .getByText("How to collect real measurements", { exact: true })
    .click();
  await p
    .getByText(
      "Count the driver and follower teeth yourself; mark the starting positions.",
      { exact: true },
    )
    .waitFor();
  for (const model of ["gears", "lever", "pulley"]) {
    await p.getByLabel("Bench mechanism model").selectOption(model);
    await p
      .getByRole("button", { name: "Load numerical example", exact: true })
      .click();
    await p
      .locator(".bench-workspace .lab-check")
      .filter({ hasText: "I have checked the inputs" })
      .getByRole("checkbox")
      .check();
    await p
      .getByRole("button", { name: "Predict behavior", exact: true })
      .click();
    await p.locator(".bench-prediction").waitFor();
    await p
      .getByLabel("Bench measured value")
      .fill(model === "gears" ? ".5" : "1.2");
    await p
      .locator(".bench-workspace .lab-check")
      .filter({ hasText: "I recorded this measurement" })
      .getByRole("checkbox")
      .check();
    await p
      .getByRole("button", { name: "Compare & record trial", exact: true })
      .click();
    await p.getByRole("status").filter({ hasText: "Trial recorded" }).waitFor();
    assert.equal(
      await p
        .getByRole("button", { name: "Ask Meta to investigate", exact: true })
        .isDisabled(),
      true,
    );
    await p
      .locator(".bench-workspace .lab-check")
      .filter({ hasText: "I agree to send this setup" })
      .getByRole("checkbox")
      .check();
    await p
      .getByRole("button", { name: "Ask Meta to investigate", exact: true })
      .click();
    await p.locator(".bench-ai-review").waitFor();
  }
  await p
    .getByRole("button", {
      name: "Use this check for next trial",
      exact: false,
    })
    .first()
    .click();
  assert.match(
    await p
      .getByRole("textbox", { name: "Observation notes", exact: true })
      .inputValue(),
    /Next check selected/,
  );
  await p
    .locator(".bench-investigation")
    .screenshot({ path: `${dir}/investigation-fixture.png` });
  assert.equal(calls, 3);
  assert.equal(await p.locator(".bench-history tbody tr").count(), 3);
  await p.getByRole("button", { name: "Save on device", exact: true }).click();
  const dl = p.waitForEvent("download");
  await p.getByRole("button", { name: "Export JSON", exact: true }).click();
  const project = JSON.parse(await readFile(await (await dl).path(), "utf8"));
  assert.equal(project.trials.length, 3);
  assert(project.trials.every((t) => t.investigation));
  assert(!JSON.stringify(project).includes("data:image"));
  const md = p.waitForEvent("download");
  await p
    .getByRole("button", { name: "Export experiment report", exact: true })
    .click();
  assert.match(
    await readFile(await (await md).path(), "utf8"),
    /AI investigation/,
  );
  await p.reload();
  await p.getByRole("tab",{name:/Experiment bench/}).click();
  await p.getByRole("button", { name: "Restore saved", exact: true }).click();
  await p.getByRole("status").filter({ hasText: "Project restored" }).waitFor();
  assert.equal(await p.locator(".bench-history tbody tr").count(), 3);
  assert.equal(
    await p
      .getByRole("button", { name: "Predict behavior", exact: true })
      .isDisabled(),
    true,
  );
  await p.getByLabel("Import Bench project").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await p
    .getByRole("alert")
    .filter({ hasText: "valid RealityLab Bench" })
    .waitFor();
  assert.equal(await p.locator(".bench-history tbody tr").count(), 3);
  await p.getByLabel("Import Bench project").setInputFiles({
    name: "bench.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project)),
  });
  await p.getByRole("status").filter({ hasText: "Project restored" }).waitFor();
  for (const width of [1440, 768, 390, 320]) {
    await p.setViewportSize({ width, height: 1000 });
    assert(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    if (process.env.AXE_PATH) {
      await p.addScriptTag({ path: process.env.AXE_PATH });
      const violations = await p.evaluate(async () => {
        const r = await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        });
        return r.violations.map((x) => ({
          id: x.id,
          nodes: x.nodes.map((n) => n.target),
        }));
      });
      assert.deepEqual(violations, []);
    }
    await p
      .locator(".bench-workspace")
      .screenshot({ path: `${dir}/bench-${width}.png` });
  }
  await p.getByRole("button", { name: "New experiment", exact: true }).click();
  assert.equal(await p.locator(".bench-history tbody tr").count(), 0);
  await p.getByRole("button", { name: "Restore saved", exact: true }).click();
  await p.getByRole("status").filter({ hasText: "Project restored" }).waitFor();
  assert.equal(await p.locator(".bench-history tbody tr").count(), 3);
  assert.deepEqual(errors, []);
  console.log(
    "PASS Bench: photo handoff, all three models, agreement/discrepancy, consent-gated AI, immutable mixed-model trials, JSON/Markdown exports, device save/reload, valid/invalid import, responsive layout and optional WCAG checks. Injected fixtures only.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}

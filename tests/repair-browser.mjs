// Injected assessments exercise the real UI/API path without AI charges.
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { createApp } from "../server/src/app.js";
import { scanFixture } from "./helpers/scanFixture.js";
import { repairFixture } from "./helpers/repairFixture.js";
const scan = scanFixture("mechanism");
scan.objectName = "Manual pencil sharpener";
scan.summary = "Injected unpowered object fixture, not real recognition.";
scan.observations[0].name = "Exterior handle knob";
scan.observations[1].name = "Outer fixing screw";
let calls = 0;
let signalHold;
const holdStarted = new Promise((resolve) => {
  signalHold = resolve;
});
const provider = {
  configured: true,
  provider: "TEST-FIXTURE",
  model: "repair-test-only",
  analyze: async () => structuredClone(scan),
  assessRepair: async ({ request: r, images, signal }) => {
    calls++;
    assert(images[0].dataUrl.startsWith("data:image/jpeg;base64,"));
    if (r.problem === "HOLD") {
      signalHold();
      return new Promise((_, reject) =>
        signal.addEventListener("abort", () => reject(Error("cancelled")), {
          once: true,
        }),
      );
    }
    if (r.answer.includes("screw")) {
      assert(images.some((i) => i.id === "problem-1"));
      return repairFixture(r.source);
    }
    return repairFixture(r.source, "needs-more-evidence");
  },
};
const server = createApp({ provider, rateLimitEnabled: false }).listen(
  0,
  "127.0.0.1",
);
await new Promise((r) => server.once("listening", r));
const browser = await chromium.launch({
  executablePath: "/usr/lib/chromium/chromium",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
  ],
});
const dir = "/tmp/artifacts/repair";
await mkdir(dir, { recursive: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.getByRole("tab", { name: /Object explorer/ }).click();
  const image = await sharp({
    create: { width: 160, height: 120, channels: 3, background: "#becbb4" },
  })
    .png()
    .toBuffer();
  await page.getByLabel("Upload object photos for analysis").setInputFiles({
    name: "object.png",
    mimeType: "image/png",
    buffer: image,
  });
  await page
    .locator(".lab-check")
    .filter({ hasText: "I agree to send these photos and context" })
    .getByRole("checkbox")
    .check();
  await page
    .getByRole("button", { name: "Analyze my photos", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Something's wrong", exact: true })
    .click();
  const repair = page.locator(".repair-guide");
  assert.equal(
    await page
      .getByRole("tab", { name: "Make a study model", exact: true })
      .count(),
    0,
  );
  assert(
    await repair
      .getByRole("button", { name: "Assess the problem", exact: false })
      .isDisabled(),
  );
  await page
    .getByLabel("Describe the repair problem")
    .fill("The exterior handle wobbles.");
  assert(
    await repair
      .getByRole("button", { name: "Assess the problem", exact: false })
      .isDisabled(),
  );
  const consent = repair
    .locator(".lab-check")
    .filter({ hasText: "original scan photos" })
    .getByRole("checkbox");
  await consent.check();
  await repair
    .getByRole("button", { name: "Assess the problem", exact: false })
    .click();
  await page
    .getByRole("heading", {
      name: "Is the outer fixing screw visibly loose?",
      exact: true,
    })
    .waitFor();
  assert.equal(await repair.locator(".repair-steps li").count(), 0);
  await page.getByLabel("Upload repair problem photos").setInputFiles({
    name: "detail.png",
    mimeType: "image/png",
    buffer: image,
  });
  await page
    .getByLabel("Repair follow-up answer")
    .fill("The screw looks loose.");
  await consent.check();
  await repair
    .getByRole("button", { name: "Reassess with this evidence", exact: false })
    .click();
  await repair.locator(".repair-steps").waitFor();
  assert.equal(await repair.locator(".repair-steps>li").count(), 3);
  assert.equal(calls, 2);
  await repair.screenshot({ path: `${dir}/repair-guide-fixture.png` });
  const download = page.waitForEvent("download");
  await repair
    .getByRole("button", { name: "Download repair report", exact: true })
    .click();
  const md = await readFile(await (await download).path(), "utf8");
  assert(md.includes("Exterior handle knob"));
  assert(md.includes("Stop if:"));
  assert(!md.includes("data:image"));
  await repair
    .getByRole("button", {
      name: "Highlight Exterior handle knob in Discover",
      exact: false,
    })
    .click();
  assert.equal(
    await page
      .getByRole("tab", { name: "3D concept", exact: true })
      .getAttribute("aria-selected"),
    "true",
  );
  await page
    .getByRole("button", { name: "Something's wrong", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Describe the repair problem").inputValue(),
    "The exterior handle wobbles.",
  );
  assert.equal(await repair.locator(".repair-steps>li").count(), 3);
  await page
    .getByLabel("Repair follow-up answer")
    .fill("The screw is still loose after a check.");
  assert.equal(await repair.locator(".repair-steps>li").count(), 0);
  await repair
    .getByRole("status")
    .filter({ hasText: "inputs or listed parts have changed" })
    .waitFor();
  await repair
    .getByRole("button", { name: "Start a different problem", exact: true })
    .click();
  await page.getByLabel("Describe the repair problem").fill("HOLD");
  await consent.check();
  await repair
    .getByRole("button", { name: "Assess the problem", exact: false })
    .click();
  await holdStarted;
  await repair
    .getByRole("button", { name: "Cancel repair assessment", exact: true })
    .click();
  await repair.getByRole("alert").filter({ hasText: "cancelled" }).waitFor();
  assert.equal(
    await page.getByLabel("Describe the repair problem").inputValue(),
    "HOLD",
  );
  await repair
    .getByRole("button", { name: "Start a different problem", exact: true })
    .click();
  const beforeHazard = calls;
  await page
    .getByLabel("Describe the repair problem")
    .fill("Smoke is coming from the object.");
  await consent.check();
  await repair
    .getByRole("button", { name: "Assess the problem", exact: false })
    .click();
  await repair
    .getByRole("heading", {
      name: "Stop and arrange qualified help.",
      exact: true,
    })
    .waitFor();
  assert.equal(calls, beforeHazard);
  assert.equal(await repair.locator(".repair-steps li").count(), 0);
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1050 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    if (process.env.AXE_PATH) {
      await page.addScriptTag({ path: process.env.AXE_PATH });
      const violations = await page.evaluate(async () => {
        const r = await window.axe.run(document, {
          runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] },
        });
        return r.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        }));
      });
      assert.deepEqual(violations, []);
    }
    if (width === 390)
      await repair.screenshot({
        path: `${dir}/repair-hazard-mobile-fixture.png`,
      });
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS Repair: scan → text report → follow-up question → detail photo → 3-step guide → part highlight; photo-free export, stale-guide blocking, cancellation, new cases, hazard routing without AI charges, responsive layouts and optional WCAG checks. Injected fixtures only.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}

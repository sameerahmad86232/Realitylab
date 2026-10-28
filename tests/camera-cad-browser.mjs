// Browser integration with a synthetic camera device and test-only AI provider.
// No real camera, robot hardware, remote model resources or AI credits are used.
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { chromium } from "playwright-core";
import sharp from "sharp";
import { createApp } from "../server/src/app.js";
import { makeCadFixture } from "./helpers/cadFixture.js";
const artifacts =
  process.env.CAPTURE_CAD_ARTIFACT_DIR || "/tmp/realitylab-camera-cad-check";
await mkdir(artifacts, { recursive: true });
let calls = 0;
const provider = {
  configured: true,
  provider: "TEST-FIXTURE-NOT-LIVE-AI",
  model: "test-camera-only",
  analyze: async ({ images }) => {
    calls++;
    assert(images[0].dataUrl.startsWith("data:image/jpeg;base64,"));
    return {
      objectName: "Camera browser fixture",
      summary: "Synthetic camera frame, not a real-object recognition run.",
      category: "other",
      recognition: "uncertain",
      observations: [
        {
          id: "a",
          imageId: "image-1",
          name: "Test frame",
          marker: { x: 0.5, y: 0.5 },
          evidence: "Test-only frame.",
        },
      ],
      relationships: [],
      hypotheses: [],
      unknowns: ["Synthetic source; not a real object."],
      nextSteps: [],
      mechanism: { type: "unsupported", gears: [] },
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
  executablePath: process.env.CHROMIUM_PATH || "/usr/lib/chromium/chromium",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
  ],
});
const openCamera = async (p) => {
  await p.getByRole("button", { name: "Take a photo", exact: true }).click();
  await p.getByRole("dialog").waitFor();
  await p.waitForFunction(() => {
    const v = document.querySelector(".camera-dialog video");
    return v?.videoWidth > 0 && v.readyState >= 2;
  });
};
async function meshReport(p, name) {
  const event = p.waitForEvent("download");
  await p.getByRole("button", { name: "Mesh report", exact: true }).click();
  const file = await event;
  await file.saveAs(`${artifacts}/${name}.json`);
  return JSON.parse(await readFile(`${artifacts}/${name}.json`, "utf8"));
}
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1050 },
    reducedMotion: "reduce",
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    const get = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    window.__streams = [];
    window.__constraints = [];
    navigator.mediaDevices.getUserMedia = async (options) => {
      window.__constraints.push(options);
      const stream = await get(options);
      window.__streams.push(stream);
      return stream;
    };
  });
  await page.goto(origin);
  await page.getByRole("tab", { name: /Object explorer/ }).click();
  assert.equal(await page.evaluate(() => window.__streams.length), 0);
  await openCamera(page);
  assert.equal(calls, 0);
  assert.equal(
    await page.evaluate(() => window.__constraints.at(-1).audio),
    false,
  );
  await page
    .getByRole("button", { name: "Switch camera", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      window.__streams.length >= 2 &&
      window.__streams
        .slice(0, -1)
        .every((s) => s.getTracks().every((t) => t.readyState === "ended")),
  );
  await page.waitForFunction(
    () => document.querySelector(".camera-dialog video")?.readyState >= 2,
  );
  await page
    .getByRole("button", { name: "Capture photo", exact: true })
    .click();
  await page.getByAltText("Captured object photo for review").waitFor();
  assert.equal(calls, 0);
  assert(
    await page.evaluate(() =>
      window.__streams.every((s) =>
        s.getTracks().every((t) => t.readyState === "ended"),
      ),
    ),
  );
  await page.getByRole("button", { name: "Retake photo", exact: true }).click();
  await page.waitForFunction(
    () => document.querySelector(".camera-dialog video")?.readyState >= 2,
  );
  await page
    .getByRole("button", { name: "Capture photo", exact: true })
    .click();
  await page.getByAltText("Captured object photo for review").waitFor();
  await page
    .getByRole("dialog")
    .screenshot({ path: `${artifacts}/camera-review.png` });
  await page
    .getByRole("button", { name: "Use this photo", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "detached" });
  assert.equal(await page.locator(".lab-thumbnails img").count(), 1);
  assert.equal(calls, 0);
  assert.equal(
    await page
      .getByRole("button", { name: "Analyze my photos", exact: true })
      .isDisabled(),
    true,
  );
  await page
    .locator(".lab-check")
    .filter({ hasText: "I agree to send" })
    .getByRole("checkbox")
    .check();
  await page
    .getByRole("button", { name: "Analyze my photos", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Camera browser fixture", exact: true })
    .waitFor();
  assert.equal(calls, 1);
  await page.getByRole("button",{name:"Edit scan photos",exact:true}).click();
  await openCamera(page);
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "detached" });
  assert(
    await page.evaluate(() =>
      window.__streams.every((s) =>
        s.getTracks().every((t) => t.readyState === "ended"),
      ),
    ),
  );
  const bytes = await sharp({
    create: { width: 40, height: 30, channels: 3, background: "#788d70" },
  })
    .jpeg()
    .toBuffer();
  await page
    .getByLabel("Upload object photos for analysis", { exact: true })
    .setInputFiles([
      { name: "angle-2.jpg", mimeType: "image/jpeg", buffer: bytes },
      { name: "angle-3.jpg", mimeType: "image/jpeg", buffer: bytes },
    ]);
  assert.equal(await page.locator(".lab-thumbnails img").count(), 3);
  assert(
    await page
      .getByRole("button", { name: "Take a photo", exact: true })
      .isDisabled(),
  );
  assert.equal(calls, 1);
  console.log(
    "PASS camera: local preview, switch, capture, retake, cleanup, capacity, consent gate and one fixture-only analysis.",
  );
  await page.getByRole("tab", { name: /3D model inspector/ }).click();
  await page.locator('.model-canvas canvas[data-engine="webgl"]').waitFor();
  await page
    .locator(".model-summary strong")
    .filter({ hasText: "Text23D cube" })
    .waitFor();
  let report = await meshReport(page, "text23d-study");
  assert.deepEqual(report.bounds.map(Math.round), [40, 40, 40]);
  assert.equal(report.partCount, 1);
  assert(
    await page
      .getByLabel("Model visual separation", { exact: true })
      .isDisabled(),
  );
  await page
    .getByRole("button", { name: "PiCar chassis reference", exact: true })
    .click();
  await page
    .locator(".model-summary strong")
    .filter({ hasText: "PiCar reference" })
    .waitFor();
  report = await meshReport(page, "picar-reference");
  assert.equal(report.partCount, 1);
  assert.equal(report.triangles, 10750);
  await page
    .locator(".model-studio")
    .screenshot({ path: `${artifacts}/picar-inspection.png` });
  await page
    .getByLabel("Import a GLB or STL model", { exact: true })
    .setInputFiles({
      name: "two-part-assembly.glb",
      mimeType: "model/gltf-binary",
      buffer: Buffer.from(makeCadFixture()),
    });
  await page
    .locator(".model-summary strong")
    .filter({ hasText: "two-part-assembly.glb" })
    .waitFor();
  report = await meshReport(page, "assembly-original");
  assert.equal(report.partCount, 2);
  assert.equal(report.triangles, 24);
  assert.deepEqual(report.bounds, [3, 1, 1]);
  await page.getByLabel("Wireframe model", { exact: true }).check();
  await page.getByLabel("Model visual separation", { exact: true }).focus();
  await page.keyboard.press("End");
  await page
    .locator(".model-part-list button")
    .filter({ hasText: "Left" })
    .click();
  await page
    .getByLabel("Model section axis", { exact: true })
    .selectOption("x");
  report = await meshReport(page, "assembly-section");
  assert.equal(report.view.explode, 1);
  assert.equal(report.view.section.axis, "x");
  assert(report.parts.every((p) => p.wireframe));
  assert(report.parts.some((p) => p.opacity === 0.22));
  assert(report.parts.every((p) => p.position.some((v) => v !== 0)));
  assert(Math.abs(report.view.gpuClipPlanes[0].constant) < 0.0001);
  await page
    .getByLabel("Model section axis", { exact: true })
    .selectOption("off");
  report = await meshReport(page, "assembly-unclipped-exploded");
  assert(report.view.gpuClipPlanes.every((p) => p.constant > 1e12));
  await page
    .getByRole("button", { name: "Reset model inspection", exact: true })
    .click();
  report = await meshReport(page, "assembly-reset");
  assert.equal(report.view.explode, 0);
  assert.equal(report.view.section.axis, "off");
  assert(
    report.parts.every(
      (p) =>
        !p.wireframe && p.opacity === 1 && p.position.every((v) => v === 0),
    ),
  );
  const pngEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Model PNG", exact: true }).click();
  await (await pngEvent).saveAs(`${artifacts}/model.png`);
  const meta = await sharp(`${artifacts}/model.png`).metadata();
  assert(meta.width > 200 && meta.height > 200);
  let externalRequests = 0;
  await page.route("https://example.com/**", (route) => {
    externalRequests++;
    return route.abort();
  });
  await page
    .getByLabel("Import a GLB or STL model", { exact: true })
    .setInputFiles({
      name: "external.glb",
      mimeType: "model/gltf-binary",
      buffer: Buffer.from(
        makeCadFixture({
          images: [{ uri: "https://example.com/tracker.png" }],
        }),
      ),
    });
  await page.getByRole("alert").filter({ hasText: "self-contained" }).waitFor();
  assert.equal(externalRequests, 0);
  assert(
    (await page.locator(".model-summary strong").innerText()).includes(
      "two-part-assembly",
    ),
  );
  for (const width of [360, 390, 768]) {
    await page.setViewportSize({ width, height: 950 });
    assert(
      !(await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )),
      `Model overflow at ${width}`,
    );
  }
  await page.setViewportSize({ width: 390, height: 950 });
  await page
    .locator(".model-studio")
    .screenshot({ path: `${artifacts}/model-mobile.png` });
  assert.deepEqual(errors, []);
  assert.equal(calls, 1);
  await page.close();
  console.log(
    "PASS CAD: Text23D study, real PiCar STL, multipart GLB, measured bounds, explode/section GPU parameters, selection, reset, PNG, privacy guard and responsive layout.",
  );
  const denied = await browser.newPage({
    viewport: { width: 390, height: 900 },
    reducedMotion: "reduce",
  });
  await denied.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException("Test denied", "NotAllowedError"));
  });
  await denied.goto(origin);
  await denied.getByRole("tab", { name: /Object explorer/ }).click();
  await denied
    .getByRole("button", { name: "Take a photo", exact: true })
    .click();
  await denied
    .getByRole("alert")
    .filter({ hasText: "Camera access was denied" })
    .waitFor();
  assert.equal(
    await denied
      .getByLabel("Take a photo with device camera", { exact: true })
      .getAttribute("capture"),
    "environment",
  );
  const devicePicker = denied.waitForEvent("filechooser");
  await denied
    .getByRole("button", { name: "Use device camera or photo", exact: true })
    .click();
  await (
    await devicePicker
  ).setFiles({
    name: "device-photo.jpg",
    mimeType: "image/jpeg",
    buffer: bytes,
  });
  assert.equal(await denied.locator(".lab-thumbnails img").count(), 1);
  await denied.getByRole("dialog").waitFor({ state: "detached" });
  await denied.close();
  const late = await browser.newPage({ reducedMotion: "reduce" });
  await late.addInitScript(() => {
    const get = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    window.__lateStreams = [];
    navigator.mediaDevices.getUserMedia = async (options) => {
      const stream = await get(options);
      window.__lateStreams.push(stream);
      await new Promise((r) => setTimeout(r, 350));
      return stream;
    };
  });
  await late.goto(origin);
  await late.getByRole("tab", { name: /Object explorer/ }).click();
  await late.getByRole("button", { name: "Take a photo", exact: true }).click();
  await late.getByRole("button", { name: "Close camera", exact: true }).click();
  await late.waitForFunction(
    () =>
      window.__lateStreams.length > 0 &&
      window.__lateStreams.every((s) =>
        s.getTracks().every((t) => t.readyState === "ended"),
      ),
  );
  await late.close();
  assert.equal(calls, 1);
  console.log(
    "PASS permission-denied recovery and late-permission stream cleanup.",
  );
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}

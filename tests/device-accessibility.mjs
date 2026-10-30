import { chromium, devices } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const origin = process.env.TEST_ORIGIN || "http://localhost:3000";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader"],
});
const results = { origin, providerCalls: 0, emulation: [], physicalDevicesTested: false };

async function prepare(context) {
  await context.route("**/api/health", (route) =>
    route.fulfill({ json: { analysis: { configured: true } } }),
  );
  context.on("request", (request) => {
    if (/\/api\/(scan|learn)/.test(request.url())) results.providerCalls++;
  });
}

try {
  for (const [name, descriptor] of [
    ["Chromium iPhone emulation", devices["iPhone 13"]],
    ["Chromium Android emulation", devices["Pixel 5"]],
  ]) {
    const context = await browser.newContext({ ...descriptor });
    await prepare(context);
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(origin);
    await page.getByRole("heading", { name: "See beyond the surface." }).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.getByRole("button", { name: "Scan object", exact: true }).click();
    await page.getByRole("heading", { name: "Start with a closer look." }).waitFor();
    const targets = page.locator(
      ".upload-actions button, .capture-summary button, .breadcrumb button, .icon-button",
    );
    for (let index = 0; index < (await targets.count()); index++) {
      const target = targets.nth(index);
      if (!(await target.isVisible())) continue;
      const box = await target.boundingBox();
      const label = (await target.getAttribute("aria-label")) || (await target.textContent())?.trim();
      assert.ok(box && box.height >= 44, `${name}: “${label}” is ${box?.height}px high`);
    }
    const axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(axe.violations.map((item) => item.id), []);
    assert.deepEqual(errors, []);
    results.emulation.push({ name, responsive: true, touchTargets: true, axe: true });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await prepare(context);
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "reduce", forcedColors: "active" });
  await page.goto(origin);
  await page.keyboard.press("Tab");
  assert.equal(await page.getByRole("link", { name: "Skip to content" }).evaluate((node) => node === document.activeElement), true);
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), "auto");
  const primary = page.getByRole("button", { name: "Scan object", exact: true }).first();
  assert.notEqual(await primary.evaluate((node) => getComputedStyle(node).borderTopStyle), "none");
  await primary.click();
  const mobileAxe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(mobileAxe.violations.map((item) => item.id), []);
  results.emulation.push({ name: "Chromium forced colors + reduced motion", keyboard: true, axe: true });
  await context.close();

  const noCamera = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  await prepare(noCamera);
  await noCamera.addInitScript(() => {
    Object.defineProperty(navigator, "mediaDevices", { value: undefined, configurable: true });
  });
  const cameraPage = await noCamera.newPage();
  await cameraPage.goto(origin);
  await cameraPage.getByRole("button", { name: "Scan object", exact: true }).click();
  await cameraPage.getByRole("button", { name: "Use camera", exact: true }).click();
  await cameraPage.getByRole("status").filter({ hasText: "Camera access is unavailable" }).waitFor();
  await cameraPage.getByRole("button", { name: "Choose photos instead", exact: true }).waitFor();
  results.emulation.push({ name: "Camera API unavailable", recoverableFilePicker: true });
  await noCamera.close();

  assert.equal(results.providerCalls, 0);
  await mkdir("/tmp/artifacts/phase-7", { recursive: true });
  await writeFile(
    "/tmp/artifacts/phase-7/device-accessibility.json",
    JSON.stringify(results, null, 2),
  );
  console.log("PASS: emulated phone layouts/touch targets, keyboard skip link, forced colors, reduced motion, camera fallback and Axe; zero provider calls. Physical hardware and human AT remain untested.");
} finally {
  await browser.close();
}

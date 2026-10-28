// Real WebGL rendering checks using a keyless local app. No AI calls.
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createApp } from "../server/src/app.js";
const artifactDirectory =
  process.env.SHADER_ARTIFACT_DIR || "/tmp/realitylab-shader-check";
await mkdir(artifactDirectory, { recursive: true });
const server = createApp({
  provider: { configured: false },
  rateLimitEnabled: false,
}).listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  const args = [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
  ];
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/lib/chromium/chromium",
    args,
  });
  try {
    const p = await b.newPage({ viewport: { width: 1440, height: 1120 } });
    const errors = [];
    p.on("pageerror", (e) => errors.push(e.message));
    await p.goto(origin);
    await p.evaluate(() => document.fonts.ready);
    await p.locator(".field-chair img").evaluate((el) => el.decode());
    const canvas = p.locator('.luminous-hero canvas[data-engine="webgl"]');
    await canvas.waitFor();
    const first = await canvas.screenshot();
    await p.waitForTimeout(400);
    const second = await canvas.screenshot();
    assert(!first.equals(second), "Live shader should animate");
    await p
      .getByRole("button", { name: "Pause visual effects", exact: true })
      .click();
    assert.equal(
      await p
        .getByRole("button", { name: "Resume visual effects", exact: true })
        .getAttribute("aria-pressed"),
      "false",
    );
    await p.waitForTimeout(100);
    const still = await canvas.screenshot();
    await p.waitForTimeout(200);
    assert(
      still.equals(await canvas.screenshot()),
      "Pause should hold a stable shader frame",
    );
    await p.screenshot({
      path: `${artifactDirectory}/RealityLab-luminous-desktop.png`,
    });
    for (const width of [360, 390, 768]) {
      await p.setViewportSize({ width, height: 950 });
      assert(
        !(await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        )),
        `Overflow ${width}`,
      );
    }
    await p.setViewportSize({ width: 390, height: 1000 });
    await p.screenshot({
      path: `${artifactDirectory}/RealityLab-luminous-mobile.png`,
    });
    assert.deepEqual(errors, []);
    const reduced = await b.newPage({ reducedMotion: "reduce" });
    await reduced.goto(origin);
    await reduced
      .getByRole("button", { name: "Resume visual effects", exact: true })
      .waitFor();
    await reduced.close();
    console.log(
      "Live animation, pause stability, reduced-motion default, screenshots, responsive widths, and no page errors passed.",
    );
  } finally {
    await b.close();
  }
  const fallback = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/lib/chromium/chromium",
    args: ["--no-sandbox", "--disable-webgl"],
  });
  try {
    const p = await fallback.newPage();
    await p.goto(origin);
    await p
      .locator('.luminous-hero canvas[data-engine="css-fallback"]')
      .waitFor({ state: "attached" });
    assert.equal(
      await p
        .getByRole("button", { name: "Pause visual effects", exact: true })
        .count(),
      0,
    );
    assert(
      await p
        .getByRole("link", { name: "Discover an object", exact: true })
        .isVisible(),
    );
    console.log("No-WebGL CSS fallback passed.");
  } finally {
    await fallback.close();
  }
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}

import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

const origin = process.env.TEST_ORIGIN || "http://localhost:3000";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--enable-unsafe-swiftshader"],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
let inferenceRequests = 0;
page.on("pageerror", (error) => errors.push(error.message));
page.on("request", (request) => {
  if (request.url().includes("/api/scan") || request.url().includes("/api/learn")) {
    inferenceRequests++;
  }
});

async function publicTransport(ctx) {
  if (!origin.startsWith("https:")) return;
  await ctx.route(`${origin}/**`, async (route) => {
    const request = route.request();
    const response = await fetch(request.url(), {
      method: request.method(),
      headers: request.headers(),
      body: ["GET", "HEAD"].includes(request.method())
        ? undefined
        : request.postDataBuffer(),
      signal: AbortSignal.timeout(95000),
    });
    const headers = Object.fromEntries(response.headers);
    for (const name of ["content-encoding", "content-length", "transfer-encoding"]) {
      delete headers[name];
    }
    await route.fulfill({
      status: response.status,
      headers,
      body: Buffer.from(await response.arrayBuffer()),
    });
  });
}

await publicTransport(context);
try {
  await page.goto(origin);
  await page.locator(".matrix-hero").waitFor();
  await page.locator("#matrix-title").waitFor();
  const primaryScan = page
    .getByRole("navigation", { name: "Landing navigation" })
    .getByRole("button", { name: "Scan an object", exact: true });
  assert.equal(await primaryScan.isEnabled(), true);

  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    assert.equal(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      true,
      `Landing overflow at ${width}`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("button", { name: "Scan object", exact: true }).click();
  await page.getByRole("heading", { name: "Start with a closer look.", exact: true }).waitFor();
  assert.equal(new URL(page.url()).hash, "#capture");
  await page.getByRole("button", { name: "RealityLab home", exact: true }).click();
  await page.locator(".matrix-hero").waitFor();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Explore", exact: true })
    .click();
  await page.locator(".explore-page").waitFor();

  const fallback = await browser.newContext({ viewport: { width: 390, height: 900 } });
  await publicTransport(fallback);
  await fallback.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind, ...args) {
      if (String(kind).includes("webgl")) return null;
      return original.call(this, kind, ...args);
    };
  });
  const fallbackPage = await fallback.newPage();
  const fallbackErrors = [];
  fallbackPage.on("pageerror", (error) => fallbackErrors.push(error.message));
  await fallbackPage.goto(origin);
  const fallbackScan = fallbackPage
    .getByRole("navigation", { name: "Landing navigation" })
    .getByRole("button", { name: "Scan an object", exact: true });
  await fallbackScan.waitFor();
  assert.equal(await fallbackScan.isEnabled(), true, "Landing scan action remains usable without WebGL");
  assert.equal(
    await fallbackPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    true,
    "WebGL unavailable mobile landing must not overflow",
  );
  assert.deepEqual(fallbackErrors, []);
  await fallback.close();

  const response = await fetch(origin);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-powered-by"), null);
  const missing = await fetch(`${origin}/not-a-real-route`);
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /Return to RealityLab/);
  assert.match(await response.text(), /property="og:image"/);
  assert.match(await (await fetch(`${origin}/robots.txt`)).text(), /Disallow: \/api\//);
  assert.match(await (await fetch(`${origin}/sitemap.xml`)).text(), /<urlset/);

  await page.goto(`${origin}/not-a-real-route`);
  await page.getByRole("link", { name: "Return to RealityLab", exact: true }).waitFor();
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(accessibility.violations.map((violation) => violation.id), []);
  assert.deepEqual(errors, []);
  assert.equal(inferenceRequests, 0);
  await mkdir("/tmp/artifacts/full-audit", { recursive: true });
  await writeFile(
    `/tmp/artifacts/full-audit/${origin.startsWith("https:") ? "public" : "local"}-regressions.json`,
    JSON.stringify(
      {
        landingNavigation: true,
        scanRoute: true,
        exploreRoute: true,
        mobileWidths: [1440, 390, 320],
        webglUnavailableLanding: true,
        responseHeaders: true,
        missingRouteRecovery: true,
        shareMetadata: true,
        inferenceRequests,
        browserErrors: errors,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: redesigned landing, scan/explore navigation, responsive widths, no-WebGL usability, response headers, 404 recovery, accessibility and metadata. No inference requests.",
  );
} finally {
  await browser.close();
}

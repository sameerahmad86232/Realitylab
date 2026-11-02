// Use the actual server handler response, unmodified, in the real React client.
import { chromium } from "playwright-core";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { readScanResponse } from "../lib/scan-stream.ts";
import { handleScan, scanState } from "../lib/server/scan.ts";
const fixture = JSON.parse(
  await readFile(new URL("./fixtures/analysis.json", import.meta.url), "utf8"),
);
const originalFetch = globalThis.fetch,
  savedKey = process.env.BASETEN_API_KEY,
  savedOrigin = process.env.APP_ORIGIN;
const origin = process.env.TEST_ORIGIN || "http://localhost:3000";
process.env.BASETEN_API_KEY = "test-only-key";
process.env.APP_ORIGIN = origin;
scanState.requests.clear();
scanState.active = 0;
scanState.hourCount = 0;
scanState.hour = Date.now();
globalThis.fetch = async () =>
  Response.json({
    choices: [{ message: { content: JSON.stringify(fixture.analysis) } }],
    usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 },
  });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
  ],
});
const context = await browser.newContext(),
  page = await context.newPage();
let payload;
let scanCalls=0;
await context.route("**/api/health", (r) =>
  r.fulfill({ json: { analysis: { configured: true } } }),
);
await context.route("**/api/scan", async (route) => {
  scanCalls++;
  const req = route.request();
  const response = await handleScan(
    new Request(req.url(), {
      method: "POST",
      headers: req.headers(),
      body: req.postDataBuffer(),
    }),
  );
  const type=response.headers.get("content-type");
  const wire=await response.text();
  payload=JSON.stringify(await readScanResponse(new Response(wire,{status:response.status,headers:{"Content-Type":type}}),()=>{}));
  await route.fulfill({
    status: response.status,
    contentType: type,
    body: wire,
  });
});
try {
  await page.goto(origin);
  await page.getByRole("button", { name: /^(Start diagnosing|Scan object)$/, exact: true }).click();
  const image = await page.screenshot();
  await page
    .locator("input[type=file]")
    .first()
    .setInputFiles([
      { name: "one.png", mimeType: "image/png", buffer: image },
      { name: "two.png", mimeType: "image/png", buffer: image },
    ]);
  await page.waitForFunction(
    () => document.querySelectorAll(".previews img").length === 2,
  );
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Analyze object", exact: true })
    .click();
  await page
    .getByRole("heading", { name: fixture.analysis.object_name, exact: true })
    .waitFor();
  assert.deepEqual(Object.keys(JSON.parse(payload)).sort(), [
    "analysis",
    "meta",
  ]);
  assert.equal(JSON.parse(payload).meta.usage.totalTokens, 150);
  await page.getByText("Request timing and usage", { exact: true }).click();
  await page.getByText("Meta provider", { exact: true }).waitFor();
  assert.match(await page.locator('.timing-breakdown').textContent(),/Total browser wait[\s\S]*Server total[\s\S]*Image normalization[\s\S]*150/);
  await page.getByRole("button", { name: "Blueprint", exact: true }).click();
  await page
    .getByRole("heading", { name: "Conceptual blueprint", exact: true })
    .waitFor();
  const firstRequest=JSON.parse(payload).meta.requestId;
  await page.getByRole('button',{name:'Edit photos',exact:true}).click();
  await page.getByRole('button',{name:'View existing analysis',exact:true}).waitFor();
  await context.setOffline(true);
  await page.getByRole('button',{name:'View existing analysis',exact:true}).click();
  await page.getByRole('heading',{name:fixture.analysis.object_name,exact:true}).waitFor();
  assert.equal(scanCalls,1,'Reopening identical photos/context must not POST or consume another call, even offline');
  assert.equal(JSON.parse(payload).meta.requestId,firstRequest);
  await page.getByRole('button',{name:'Edit photos',exact:true}).click();
  await page.getByRole('textbox',{name:/What should we focus on/}).fill('Inspect a different region');
  assert.equal(await page.getByRole('button',{name:'View existing analysis',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Analyze object',exact:true}).isDisabled(),true,'Changed context requires a fresh online request');
  await context.setOffline(false);
  await page.getByRole('button',{name:'Analyze object',exact:true}).click();
  await page.getByRole('heading',{name:fixture.analysis.object_name,exact:true}).waitFor();
  assert.equal(scanCalls,2);
  assert.notEqual(JSON.parse(payload).meta.requestId,firstRequest);
  await page.getByRole('button',{name:'Edit photos',exact:true}).click();
  await page.getByRole('button',{name:'Remove photo 1',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'View existing analysis',exact:true}).count(),0,'Changing photos invalidates the saved analysis');
  assert.equal(await page.getByRole('button',{name:'Analyze object',exact:true}).isDisabled(),true,'New photos require renewed consent');
  console.log('PASS: actual handler response renders results/blueprint; unchanged scans reopen offline without a request; context/photo changes invalidate reuse and preserve consent. Provider mocked.');
} finally {
  await browser.close();
  globalThis.fetch = originalFetch;
  if (savedKey === undefined) delete process.env.BASETEN_API_KEY;
  else process.env.BASETEN_API_KEY = savedKey;
  if (savedOrigin === undefined) delete process.env.APP_ORIGIN;
  else process.env.APP_ORIGIN = savedOrigin;
}

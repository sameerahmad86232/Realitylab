import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { readFile, mkdir } from "node:fs/promises";
import { handleLearn } from "../lib/server/learn.ts";
import { scanState } from "../lib/server/scan.ts";
const scan = JSON.parse(
  await readFile(new URL("./fixtures/analysis.json", import.meta.url), "utf8"),
);
const lesson = {
  construction: {
    overview:
      "A typical handle and wire assembly; the hidden joint is not verified.",
    stages: [
      {
        title: "Form the working loops",
        description:
          "Wire loops are typically shaped before assembly; this is a conceptual process.",
        component_ids: ["loops"],
      },
      {
        title: "Integrate the handle",
        description:
          "A joint typically holds the loops in the handle; its actual construction is unknown.",
        component_ids: ["handle", "loops"],
      },
    ],
    checks: ["Verify retention and alignment against actual specifications."],
    missing_information: ["Joint design and material grades are not visible."],
  },
  status: "ready",
  title: "A paper motion model",
  answer:
    "An illustrative separate paper analogue, not a replica of the whisk.",
  component_ids: ["loops"],
  materials: [
    {
      item: "paper",
      purpose: "Fold a moving strip.",
      alternative: "cardboard",
    },
  ],
  steps: [
    {
      title: "Fold",
      instruction: "Fold a strip of paper in half.",
      observe: "A crease changes its shape.",
    },
    {
      title: "Move",
      instruction: "Move the strip slowly above another sheet.",
      observe: "Notice its path.",
    },
    {
      title: "Compare",
      instruction: "Compare this strip with a wider sheet.",
      observe: "Their paths differ.",
    },
  ],
  estimated_minutes: 10,
  safety_notes: ["Keep the real object untouched and unpowered."],
  limitations: ["Paper does not recreate the real mechanism."],
};
const originalFetch = globalThis.fetch,
  key = process.env.BASETEN_API_KEY,
  appOrigin = process.env.APP_ORIGIN,
  origin = process.env.TEST_ORIGIN || "http://localhost:3000";
process.env.BASETEN_API_KEY = "test-only";
process.env.APP_ORIGIN = origin;
scanState.requests.clear();
scanState.hour = Date.now();
scanState.hourCount = 0;
scanState.active = 0;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
  ],
});
const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  }),
  page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let mode = "lesson",
  calls = 0,
  scanCalls = 0,
  lastBody = null;
if (origin.startsWith("https:"))
  await context.route(`${origin}/**`, async (route) => {
    const request = route.request(),
      response = await originalFetch(request.url(), {
        method: request.method(),
        headers: request.headers(),
        body: ["GET", "HEAD"].includes(request.method())
          ? undefined
          : request.postDataBuffer(),
        signal: AbortSignal.timeout(95000),
      });
    const headers = Object.fromEntries(response.headers);
    for (const name of [
      "content-encoding",
      "content-length",
      "transfer-encoding",
    ])
      delete headers[name];
    await route.fulfill({
      status: response.status,
      headers,
      body: Buffer.from(await response.arrayBuffer()),
    });
  });
await context.route("**/api/health", (r) =>
  r.fulfill({ json: { analysis: { configured: true } } }),
);
await context.route("**/api/scan", (r) => {
  scanCalls++;
  return r.fulfill({
    json: { ...scan, analysis: { ...scan.analysis, recognition: "uncertain" } },
  });
});
await context.route("**/api/learn", async (route) => {
  calls++;
  if (mode === "pending") {
    await new Promise((r) => setTimeout(r, 1000));
    try {
      await route.abort();
    } catch {}
    return;
  }
  const r = route.request();
  lastBody = JSON.parse(r.postDataBuffer().toString("utf8"));
  const review =
    mode === "review"
      ? {
          lesson_request_id: lastBody.observation_context.lesson_request_id,
          step_index: lastBody.observation_context.step_index,
          prediction_status: "questionable",
          reasoning: "Synthetic browser fixture: the cause is not established.",
          possible_explanations: [
            {
              explanation: "The crease may not have been formed.",
              distinguishing_observation:
                "Inspect the separate strip from the side.",
            },
          ],
          limits: [
            "This fixture is not a physical trial or verified explanation.",
          ],
        }
      : undefined;
  globalThis.fetch = async () =>
    Response.json({
      choices: [
        {
          message: {
            content: JSON.stringify(
              mode === "question" || mode === "review"
                ? {
                    ...lesson,
                    construction: undefined,
                    title: "Why curved wires?",
                    answer:
                      "The photographed loops may create a broad manual mixing path.",
                    materials: [],
                    steps: [],
                    estimated_minutes: null,
                    ...(review ? { observation_review: review } : {}),
                  }
                : lesson,
            ),
          },
        },
      ],
      usage: { total_tokens: 100 },
    });
  const response = await handleLearn(
    new Request(r.url(), {
      method: "POST",
      headers: r.headers(),
      body: r.postDataBuffer(),
    }),
  );
  await route.fulfill({
    status: response.status,
    contentType: "application/json",
    body: await response.text(),
  });
});
async function svgDownload(button) {
  const wait = page.waitForEvent("download");
  await button.click();
  const file = await wait;
  const raw = await readFile(await file.path(), "utf8");
  const result = await page.evaluate((svg) => {
    const d = new DOMParser().parseFromString(svg, "image/svg+xml");
    return {
      errors: d.querySelectorAll("parsererror").length,
      images: d.querySelectorAll("image").length,
      scripts: d.querySelectorAll("script,foreignObject,[onclick]").length,
    };
  }, raw);
  assert.deepEqual(result, { errors: 0, images: 0, scripts: 0 });
  return raw;
}
try {
  await page.goto(origin);
  await page.getByRole("button", { name: "Scan object", exact: true }).click();
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
  await page.locator(".live-results").waitFor();
  await page
    .getByRole("heading", {
      name: "This object needs another look.",
      exact: true,
    })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Add or change a photo", exact: true })
      .count(),
    1,
  );
  await page
    .getByText(
      "The model has not established the object’s identity. Treat these parts and explanations as tentative.",
      { exact: true },
    )
    .waitFor();
  await page
    .getByRole("button", { name: "Add or change a photo", exact: true })
    .click();
  assert.equal(await page.locator(".previews img").count(), 2);
  assert.equal(
    scanCalls,
    1,
    "Recovery must preserve photos without automatic inference",
  );
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("button", { name: "Explore", exact: true })
    .click();
  await page.locator(".live-results").waitFor();
  await page.getByRole("button", { name: "Blueprint", exact: true }).click();
  await page
    .getByRole("button", { name: "Expand blueprint", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "Expanded conceptual blueprint" })
    .waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.getByText("Optional example", { exact: true }).click();
  await page
    .getByRole("button", { name: "Open separate LED circuit", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Close example switch", exact: true })
    .click();
  await page.getByText(/Ideal current ≈ 3.0 mA/).waitFor();
  const diagramSwitch = page.getByRole("button", {
    name: "Toggle example circuit switch",
    exact: true,
  });
  await diagramSwitch.focus();
  await page.keyboard.press("Enter");
  await page.getByText(/Open switch: no complete path/).waitFor();
  assert.equal(
    await diagramSwitch.evaluate((e) => document.activeElement === e),
    true,
  );
  const circuit = await svgDownload(
    page.getByRole("button", { name: "Download diagram SVG", exact: true }),
  );
  assert.match(circuit, /ILLUSTRATIVE EXAMPLE ONLY/);
  await page
    .getByRole("button", { name: "Expand diagram", exact: true })
    .click();
  await page.getByRole("dialog", { name: "Expanded diagram" }).waitFor();
  await page
    .getByRole("button", { name: "Close expanded diagram", exact: true })
    .click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page
    .getByRole("button", { name: "Scanned parts / functional", exact: true })
    .click();
  const functional = await svgDownload(
    page.getByRole("button", { name: "Download diagram SVG", exact: true }),
  );
  assert.match(functional, /not electrical wiring/);
  const generate = page.getByRole("button", {
    name: "Generate build dossier",
    exact: true,
  });
  assert.equal(await generate.isDisabled(), true);
  await page
    .getByRole("checkbox", { name: /Send this analysis and my question/ })
    .check();
  await generate.click();
  await page
    .getByRole("heading", { name: "A paper motion model", exact: true })
    .waitFor();
  assert.equal(calls, 1);
  await page
    .getByRole("heading", { name: "How it comes together.", exact: true })
    .waitFor();
  const construction = await svgDownload(
    page.getByRole("button", {
      name: "Download construction sheet",
      exact: true,
    }),
  );
  assert.match(construction, /CONSTRUCTION STUDY/);
  assert.match(construction, /NO MEASURED DIMENSIONS/);
  await page
    .getByRole("button", { name: "Mark step 1 complete", exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("button", { name: "Mark step 1 complete", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  const journal = page.getByRole("group", {
    name: "Test the prediction for step 1",
    exact: true,
  });
  await journal.locator("summary").click();
  assert.equal(await journal.getByRole("combobox").inputValue(), "not-tested");
  await journal.getByRole("combobox").selectOption("different");
  assert.match(
    await page.locator(".observation-summary").textContent(),
    /0 of 3/,
  );
  await journal
    .getByRole("textbox")
    .fill("The strip stayed flat; I could not reproduce the predicted crease.");
  assert.match(
    await page.locator(".observation-summary").textContent(),
    /1 of 3/,
  );
  assert.equal(calls, 1, "Recording an observation must not call Meta");
  const ask = page.getByRole("button", {
      name: "Ask Meta about this scan",
      exact: true,
    }),
    questionBox = page.getByRole("textbox", {
      name: "Ask about these parts or their principles",
    });
  await page
    .getByRole("checkbox", { name: /Send this analysis and my question/ })
    .uncheck();
  await journal
    .getByRole("button", {
      name: "Draft a question about this result",
      exact: true,
    })
    .click();
  const attachment = page.getByRole("complementary", {
    name: "Attached observation report",
  });
  await attachment.waitFor();
  assert.equal(
    await questionBox.evaluate((item) => document.activeElement === item),
    true,
  );
  assert.equal(calls, 1, "Drafting must not call inference");
  assert.equal(
    await ask.isDisabled(),
    true,
    "Drafting does not bypass consent",
  );
  await attachment
    .getByText("Review exactly what will be sent", { exact: true })
    .click();
  await attachment
    .getByText(
      "The strip stayed flat; I could not reproduce the predicted crease.",
      { exact: true },
    )
    .waitFor();
  await mkdir("/tmp/artifacts/observation-reasoning", { recursive: true });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Attachment overflow at ${width}`,
    );
    const check = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    assert.deepEqual(
      check.violations.map((item) => ({
        id: item.id,
        targets: item.nodes.map((node) => node.target),
      })),
      [],
    );
    if (width !== 320)
      await attachment.screenshot({
        path: `/tmp/artifacts/observation-reasoning/attachment-${width}.png`,
      });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await questionBox.fill("Review this case without assuming the cause.");
  await journal.getByRole("textbox").fill("Temporary change to the report.");
  assert.equal(await ask.isDisabled(), true);
  await journal
    .getByRole("textbox")
    .fill("The strip stayed flat; I could not reproduce the predicted crease.");
  await attachment
    .getByRole("button", { name: "Update attached report", exact: true })
    .click();
  assert.equal(
    await questionBox.inputValue(),
    "Review this case without assuming the cause.",
  );
  assert.equal(calls, 1);
  await page
    .getByRole("checkbox", { name: /Send this analysis and my question/ })
    .check();
  assert.equal(await ask.isEnabled(), true);
  await attachment
    .getByRole("button", { name: "Remove attached observation", exact: true })
    .click();
  assert.equal(await attachment.count(), 0);
  assert.equal(await questionBox.inputValue(), "");
  await journal
    .getByRole("button", {
      name: "Draft a question about this result",
      exact: true,
    })
    .click();
  mode = "review";
  await ask.click();
  await page
    .getByRole("heading", {
      name: "Prediction may be questionable",
      exact: true,
    })
    .waitFor();
  assert.equal(
    lastBody.observation_context.actual,
    "The strip stayed flat; I could not reproduce the predicted crease.",
  );
  assert.equal(
    lastBody.observation_context.prediction,
    lesson.steps[0].observe,
  );
  assert.equal(
    calls,
    2,
    "Sending an observation question makes exactly one additional request",
  );
  mode = "question";
  await page
    .getByRole("textbox", { name: "Ask about these parts or their principles" })
    .fill("Why are the wires curved?");
  await page
    .getByRole("button", { name: "Ask Meta about this scan", exact: true })
    .click();
  await page
    .getByText(
      "The photographed loops may create a broad manual mixing path.",
      { exact: true },
    )
    .last()
    .waitFor();
  await page
    .getByRole("textbox", { name: "Ask about these parts or their principles" })
    .fill("How do I rewire mains power?");
  await page
    .getByRole("button", { name: "Ask Meta about this scan", exact: true })
    .click();
  await page
    .getByText(/I can explain photographed parts and general principles/)
    .waitFor();
  mode = "pending";
  await page
    .getByRole("textbox", { name: "Ask about these parts or their principles" })
    .fill("Explain another principle");
  await page
    .getByRole("button", { name: "Ask Meta about this scan", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancel learning request", exact: true })
    .click();
  await page
    .getByRole("alert")
    .filter({ hasText: "Learning request cancelled" })
    .waitFor();
  const event = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Export learning", exact: true })
    .click();
  const output = await readFile(await (await event).path(), "utf8");
  assert.equal(output.includes("blob:"), false);
  assert.equal(output.includes("data:image"), false);
  assert.equal(JSON.parse(output).completed_steps[0], 0);
  const linked = JSON.parse(output).followups.find(
    (item) => item.observation_context,
  );
  assert.equal(
    linked.observation_context.actual,
    "The strip stayed flat; I could not reproduce the predicted crease.",
  );
  assert.equal(
    linked.result.learning.observation_review.prediction_status,
    "questionable",
  );
  const report = JSON.parse(output).observation_journal;
  assert.equal(report.records[0].source, "user-reported");
  assert.equal(report.records[0].outcome, "different");
  assert.equal(report.records[0].model_prediction, lesson.steps[0].observe);
  assert.equal(
    report.records[0].actual,
    "The strip stayed flat; I could not reproduce the predicted crease.",
  );
  assert.equal(report.records[0].report_status, "logged");
  await mkdir("/tmp/artifacts/phase-6", { recursive: true });
  await page.screenshot({
    path: "/tmp/artifacts/phase-6/learning-desktop.png",
    fullPage: true,
  });
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 950 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Learning overflow at ${width}`,
    );
    assert.ok(
      (
        await page
          .getByRole("group", {
            name: "Test the prediction for step 1",
            exact: true,
          })
          .boundingBox()
      ).width >= 180,
      `Journal too narrow at ${width}`,
    );
    if (width === 390) {
      await page.screenshot({
        path: "/tmp/artifacts/phase-6/learning-mobile.png",
        fullPage: true,
      });
      await page
        .getByRole("region", { name: "Meta observation review", exact: true })
        .screenshot({
          path: "/tmp/artifacts/observation-reasoning/review-mobile.png",
        });
    }
  }
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    axe.violations.map((v) => ({
      id: v.id,
      targets: v.nodes.map((n) => n.target),
    })),
    [],
  );
  const callsBefore = calls;
  await page
    .getByRole("button", { name: "RealityLab home", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resume your exploration", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "A paper motion model", exact: true })
    .waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Mark step 1 complete", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  assert.equal(
    calls,
    callsBefore,
    "Returning to an existing dossier must not call inference",
  );
  await page
    .getByRole("group", { name: "Test the prediction for step 1", exact: true })
    .locator("summary")
    .click();
  assert.equal(
    await page
      .getByRole("group", {
        name: "Test the prediction for step 1",
        exact: true,
      })
      .getByRole("combobox")
      .inputValue(),
    "different",
  );
  assert.equal(
    await page
      .getByRole("group", {
        name: "Test the prediction for step 1",
        exact: true,
      })
      .getByRole("textbox")
      .inputValue(),
    "The strip stayed flat; I could not reproduce the predicted crease.",
  );
  await page
    .getByRole("group", { name: "Test the prediction for step 1", exact: true })
    .screenshot({ path: "/tmp/artifacts/phase-6/observation-journal.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: actual learning-handler envelope, consent, paper lesson, uncertain-scan recovery, progress separate from actual observation journal, explicit report drafting/consent/stale-update checks, structured review, failure export/cache, scoped questions/refusal, cancellation, photo-free export, functional/circuit SVGs, switch simulation, expanded drawings, mobile and accessibility. Provider mocked.",
  );
} finally {
  await browser.close();
  globalThis.fetch = originalFetch;
  if (key === undefined) delete process.env.BASETEN_API_KEY;
  else process.env.BASETEN_API_KEY = key;
  if (appOrigin === undefined) delete process.env.APP_ORIGIN;
  else process.env.APP_ORIGIN = appOrigin;
}

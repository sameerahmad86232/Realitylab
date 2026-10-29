import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const origin = process.env.TEST_ORIGIN || "http://localhost:3000";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--enable-unsafe-swiftshader",
  ],
});
const context = await browser.newContext({
    viewport: { width: 390, height: 900 },
  }),
  page = await context.newPage();
const errors = [];
let inference = 0;
page.on("pageerror", (error) => errors.push(error.message));
for (const path of ["scan", "learn"])
  await context.route(`**/api/${path}`, (route) => {
    inference++;
    return route.fulfill({
      status: 503,
      json: { error: { message: "Inference disabled in recovery test" } },
    });
  });
try {
  await page.goto(origin);
  await page.locator(".recorded-card").first().click();
  await page.locator(".live-results").waitFor();
  await page
    .getByRole("button", { name: "Open recorded build dossier", exact: true })
    .click();
  await page.locator(".lesson-card").waitFor();
  await page.getByRole("button", { name: "Blueprint", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  const saved = await download;
  const savedPath = await saved.path();
  const data = JSON.parse(await readFile(savedPath, "utf8"));
  assert.equal(data.kind, "realitylab-investigation");
  assert.equal(data.version, 1);
  assert.equal(
    data.photos.every(
      (photo) => photo.included === false && photo.data_url === undefined,
    ),
    true,
  );
  assert.equal(data.learning.recorded, true);
  assert.equal(data.workspace.view, "blueprint");
  await page.getByLabel("Embed photos in project file").check();
  const photoDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  const photoPath = await (await photoDownload).path();
  const withPhoto = JSON.parse(await readFile(photoPath, "utf8"));
  assert.equal(withPhoto.photos[0].included, true);
  assert.match(
    withPhoto.photos[0].data_url,
    /^data:image\/(?:jpeg|png);base64,/,
  );
  await page.getByRole("button", { name: "New scan", exact: true }).click();
  let chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  await (await chooser).setFiles(savedPath);
  await page.getByText("Project restored.", { exact: true }).waitFor();
  await page
    .locator(".project-recovery-notice")
    .getByText(/0 of 1 source photos restored/)
    .waitFor();
  await page.locator(".lesson-card").waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Blueprint", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await page
    .getByRole("button", { name: "Photo evidence", exact: true })
    .click();
  assert.match(
    await page.locator(".source-image img").getAttribute("src"),
    /photo-omitted\.svg$/,
  );
  await page.getByText(/saved without this photo/).waitFor();
  assert.equal(
    await page.getByRole("button", { name: "Adjust selected marker" }).count(),
    0,
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
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
  const broken = {
    ...data,
    workspace: { ...data.workspace, selected: "missing" },
  };
  await mkdir("/tmp/artifacts/project-recovery", { recursive: true });
  const brokenPath = "/tmp/artifacts/project-recovery/broken.json";
  await writeFile(brokenPath, JSON.stringify(broken));
  chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Open project", exact: true }).click();
  await (await chooser).setFiles(brokenPath);
  await page
    .getByRole("alert")
    .getByText(/invalid, unsupported or has broken references/)
    .waitFor();
  await page.screenshot({
    path: "/tmp/artifacts/project-recovery/restored-mobile.png",
    fullPage: true,
  });
  assert.equal(inference, 0);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: versioned project save/restore retains workspace and recorded learning, omits photos by default, rejects broken references, mobile/axe pass, no inference.",
  );
} finally {
  await browser.close();
}

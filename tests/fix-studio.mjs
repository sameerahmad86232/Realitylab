import { chromium } from "playwright-core";
import assert from "node:assert/strict";
const origin = process.env.TEST_ORIGIN || "http://localhost:3000";
const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || "/usr/bin/chromium",args:["--no-sandbox","--disable-dev-shm-usage","--enable-unsafe-swiftshader"]});
const context = await browser.newContext({viewport:{width:1240,height:920}});
const page = await context.newPage();
const errors = [];
let scans = 0, images = 0;
page.on("pageerror", error => errors.push(error.message));
const plan = {
 object_name:"Desk fan",problem:"Fan does not start",overview:"Only safe external checks are possible.",
 risk:"caution",risk_reason:"Electrical safety matters.",tools:["Soft cloth"],
 possible_causes:[{title:"Possible obstruction",reason:"Look for visible dirt.",evidence:"hypothesis"}],
 steps:[
  {id:"step-1",title:"Inspect the unplugged guard",instruction:"Unplug and inspect visible dust only.",why:"Dust can obscure the guard.",component_name:"Fan guard",expected_result:"Guard is clear",caution:"Do not open the housing."},
  {id:"step-2",title:"Check the manual",instruction:"Read the maker's instructions.",why:"Check normal controls.",component_name:"Speed control",expected_result:"Settings understood",caution:"Avoid exposed wires."}
 ],
 stop_if:["Sparks or smoke"],verify:["No unusual noise during normal use"]
};
try {
 await context.route("**/api/repair", async route => {scans++; await route.fulfill({json:{plan}});});
 await context.route("**/api/component-image", async route => {images++; await route.fulfill({json:{image:"data:image/png;base64,"+Buffer.from(await page.screenshot()).toString("base64"),conceptual:true}});});
 await page.goto(origin+"/fix");
 await page.getByRole("heading",{name:/From broken/}).waitFor();
 await page.getByRole("button",{name:/See a ready-made example/}).click();
 await page.getByText("Example guide only",{exact:false}).waitFor();
 assert.equal(scans,0,"Fixture should not make a paid inference request");
 await page.getByRole("button",{name:/Check the guard and airflow path/}).click();
 await page.getByRole("button",{name:"Mark step complete"}).click();
 await page.getByText("1 of 4 steps marked complete").waitFor();
 await page.getByRole("button",{name:/New diagnosis/}).first().click();
 const image = await page.screenshot();
 await page.locator("input[type=file]").setInputFiles({name:"sample.png",mimeType:"image/png",buffer:image});
 await page.getByRole("textbox",{name:"What is wrong with your object?"}).fill("My desk fan is humming but does not turn.");
 await page.getByRole("checkbox").check();
 await page.getByRole("button",{name:/Generate repair guide/}).click();
 await page.getByRole("heading",{name:/Desk fan.*repair studio/}).waitFor();
 assert.equal(scans,1,"Only the user's explicit submit triggers a scan");
 assert.equal(images,0,"Concept art is never automatic");
 await page.getByRole("button",{name:/Generate AI visual/}).click();
 await page.getByRole("img",{name:/AI concept illustration/}).waitFor();
 assert.equal(images,1);
 for(const width of [1240,390,320]){
  await page.setViewportSize({width,height:920});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=1,`Horizontal overflow at ${width}px: ${overflow}px`);
 }
 assert.deepEqual(errors,[]);
 console.log("Fix Studio example, consented live flow, on-demand images and mobile layouts passed.");
} finally { await browser.close(); }

import {chromium} from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const origin=process.env.TEST_ORIGIN||'http://localhost:3000';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
const errors=[];let inference=0;page.on('pageerror',error=>errors.push(error.message));
if(origin.startsWith('https:'))await context.route(`${origin}/**`,async route=>{const request=route.request(),response=await fetch(request.url(),{method:request.method(),headers:request.headers(),body:['GET','HEAD'].includes(request.method())?undefined:request.postDataBuffer(),signal:AbortSignal.timeout(95000)});const headers=Object.fromEntries(response.headers);for(const name of ['content-encoding','content-length','transfer-encoding'])delete headers[name];await route.fulfill({status:response.status,headers,body:Buffer.from(await response.arrayBuffer())})});
for(const path of ['scan','learn'])await context.route(`**/api/${path}`,route=>{inference++;return route.fulfill({status:503,json:{error:{message:'Inference disabled in this test'}}})});
try{
 await page.goto(`${origin}/project`);await page.getByRole('heading',{name:'From “what is it?” to “how does it work?”'}).waitFor();
 assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),`${origin.startsWith('https:')?origin:'https://realitylab.onrender.com'}/project`);
 assert.equal(await page.getByRole('link',{name:'View code',exact:true}).getAttribute('href'),'https://github.com/sameerahmad86232/Realitylab/tree/codex/realitylab-live-explorer');assert.equal(await page.getByRole('link',{name:'Public repository',exact:true}).getAttribute('href'),'https://github.com/sameerahmad86232/Realitylab/tree/codex/realitylab-live-explorer');const cards=page.locator('.project-record');assert.equal(await cards.count(),5);
 const ids=['fan','bicycle','compass','furniture','electronics'];
 for(let i=0;i<ids.length;i++){
  const record=JSON.parse(await readFile(new URL(`../public/demos/${ids[i]}.json`,import.meta.url),'utf8'));
  assert.equal(await cards.nth(i).locator('.project-record-name').textContent(),record.analysis.object_name);
  assert.deepEqual(await cards.nth(i).locator('dd').allTextContents(),[String(record.analysis.components.length),`${(record.meta.durationMs/1000).toFixed(2)}s`]);
  assert.equal(await cards.nth(i).getByRole('link',{name:'Inspect recorded JSON'}).getAttribute('href'),`/demos/${ids[i]}.json`);
 }
 await mkdir('/tmp/artifacts/project-evidence',{recursive:true});
 for(const width of [1440,768,390,320]){
  await page.setViewportSize({width,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Project overflow at ${width}`);
  const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],`Project accessibility at ${width}`);
  if(width===1440||width===390){for(const image of await page.locator('.project-record-photo img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(img=>img.decode())}await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await page.screenshot({path:`/tmp/artifacts/project-evidence/project-${width}.png`,fullPage:true})}
 }
 await page.setViewportSize({width:1440,height:1000});await page.getByRole('link',{name:'Watch the guided exploration',exact:true}).click();await page.getByRole('dialog').getByRole('heading',{name:'Vintage GE Table Electric Fan',exact:true}).waitFor();assert.equal(new URL(page.url()).searchParams.has('demo'),false);await page.keyboard.press('Escape');await page.reload();assert.equal(await page.getByRole('dialog').count(),0,'Sharing opens the demo once; refresh does not reopen it');
 await page.goto(`${origin}/project`);await page.getByRole('link',{name:'Open the interactive examples',exact:true}).click();await page.locator('#collection').waitFor();await page.waitForFunction(()=>Math.abs(document.querySelector('#collection').getBoundingClientRect().top)<5);assert.equal(await page.locator('.recorded-card').count(),5);
 await page.getByRole('link',{name:'Project brief & evidence',exact:true}).click();await page.getByRole('link',{name:'Try your own object',exact:true}).click();await page.getByRole('heading',{name:'Start with a closer look.'}).waitFor();assert.equal(inference,0);assert.deepEqual(errors,[]);
 await writeFile(`/tmp/artifacts/project-evidence/${origin.startsWith('https:')?'public':'local'}-verification.json`,JSON.stringify({origin,records:5,metricsMatchSource:true,canonical:true,widths:[320,390,768,1440],axe:true,shareableDemo:true,collectionLink:true,captureLink:true,inferenceRequests:inference,browserErrors:errors},null,2));console.log('PASS: public evidence metrics match five saved responses; responsive/a11y, canonical, shareable demo, collection/capture handoffs; no inference requests.');
}finally{await browser.close()}

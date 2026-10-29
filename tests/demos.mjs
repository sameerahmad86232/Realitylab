import {chromium} from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const origin=process.env.TEST_ORIGIN||'http://localhost:3000';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];let calls=0;
page.on('pageerror',e=>errors.push(e.message));
if(origin.startsWith('https:'))await context.route(`${origin}/**`,async route=>{const request=route.request();const r=await fetch(request.url(),{method:request.method(),headers:request.headers(),body:['GET','HEAD'].includes(request.method())?undefined:request.postDataBuffer(),signal:AbortSignal.timeout(95000)});const headers=Object.fromEntries(r.headers);for(const name of['content-encoding','content-length','transfer-encoding'])delete headers[name];await route.fulfill({status:r.status,headers,body:Buffer.from(await r.arrayBuffer())})});
page.on('request',r=>{if(r.url().includes('/api/scan')||r.url().includes('/api/learn'))calls++});
const out='/tmp/artifacts/phase-7';await mkdir(out,{recursive:true});
try{
 await page.goto(origin);await page.locator('.recorded-card').first().waitFor();
 const broken=async route=>route.fulfill({status:503,body:'Unavailable'});await page.route('**/demos/fan.json',broken);await page.locator('.recorded-card').first().click();await page.getByRole('alert').filter({hasText:'Example unavailable'}).waitFor();await page.unroute('**/demos/fan.json',broken);
 await page.screenshot({path:`${out}/gallery-desktop.png`,fullPage:true});
 for(const id of['fan','bicycle','compass','furniture','electronics']){
  const response=await fetch(`${origin}/demos/${id}.json`);assert.equal(response.status,200);const wire=await response.json();
  await page.locator(`.recorded-card`).nth(['fan','bicycle','compass','furniture','electronics'].indexOf(id)).click();await page.getByRole('heading',{name:wire.analysis.object_name,exact:true}).waitFor();await page.getByText('Recorded Meta scan · Baseten',{exact:true}).waitFor();
  if(id==='fan'){await page.getByRole('button',{name:'Open recorded build dossier',exact:true}).click();await page.getByRole('heading',{name:'How it comes together.',exact:true}).waitFor();await page.getByText('RECORDED META DOSSIER · NO NEW GENERATION',{exact:true}).waitFor()}await page.getByRole('button',{name:'Open blueprint',exact:true}).click();await page.getByRole('heading',{name:'Conceptual blueprint',exact:true}).waitFor();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Export analysis',exact:true}).click();const d=await download;assert.equal(d.suggestedFilename(),'realitylab-analysis-v1.json');
  for(const width of[1440,390,320]){await page.setViewportSize({width,height:950});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${id} overflow at ${width}`)}
  if(id==='compass'){await page.screenshot({path:`${out}/compass-mobile.png`,fullPage:true});const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(a.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[])}
  await page.getByRole('button',{name:'RealityLab home',exact:true}).click();
 }
 assert.equal(calls,0);assert.deepEqual(errors,[]);
 await page.setViewportSize({width:390,height:900});await page.screenshot({path:`${out}/gallery-mobile.png`,fullPage:true});
 const fallback=await browser.newContext();await fallback.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){if(String(kind).includes('webgl'))return null;return original.call(this,kind,...args)}});const p=await fallback.newPage();if(origin.startsWith('https:'))await p.route(`${origin}/**`,async route=>{const r=await fetch(route.request().url());const h=Object.fromEntries(r.headers);delete h['content-encoding'];delete h['content-length'];await route.fulfill({status:r.status,headers:h,body:Buffer.from(await r.arrayBuffer())})});await p.goto(origin);await p.getByRole('button',{name:'Explode',exact:true}).waitFor();await p.waitForFunction(()=>document.querySelector('button[aria-label="Orbit model"]')?.disabled||[...document.querySelectorAll('button')].some(b=>b.textContent==='Explode'&&b.disabled));await fallback.close();
 await writeFile(`${out}/${origin.startsWith('https:')?'public':'local'}-verification.json`,JSON.stringify({origin,recordedExamples:5,newInferenceRequests:calls,mobile:true,accessibility:true,webglFallback:true,browserErrors:errors},null,2));console.log('PASS: five recorded Meta examples, blueprints, exports, mobile widths, accessibility, WebGL fallback; zero inference requests.');
}finally{await browser.close()}

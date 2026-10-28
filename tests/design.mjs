import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream']});
const out='/tmp/artifacts/liquid-gallery';await mkdir(out,{recursive:true});
const errors=[];
const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
try{
await page.goto(process.env.TEST_ORIGIN||'http://localhost:3000');
await page.getByRole('heading',{name:'See beyond the surface.'}).waitFor();
await page.locator('.stage-canvas canvas').waitFor();
await page.waitForTimeout(1200);
await page.screenshot({path:`${out}/landing-desktop.png`,fullPage:true});
await page.getByRole('button',{name:'Explode',exact:true}).click();
assert.equal(await page.getByRole('button',{name:'Explode',exact:true}).getAttribute('aria-pressed'),'true');
await page.getByRole('button',{name:'Explore sample',exact:true}).click();
await page.getByRole('button',{name:'03 Motor housing'}).click();
await page.getByRole('heading',{name:'Motor housing',exact:true}).waitFor();
await page.getByRole('button',{name:'Blueprint',exact:true}).click();
const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download SVG'}).click();assert.equal((await download).suggestedFilename(),'realitylab-conceptual-fan.svg');
await page.screenshot({path:`${out}/explore-desktop.png`,fullPage:true});
await page.getByRole('button',{name:'Scan object',exact:true}).click();
await page.locator('input[type=file]').first().setInputFiles({name:'invalid.txt',mimeType:'text/plain',buffer:Buffer.from('invalid')});await page.getByRole('alert').filter({hasText:'JPEG or PNG'}).waitFor();
const png=await page.screenshot();
await page.locator('input[type=file]').first().setInputFiles({name:'object.png',mimeType:'image/png',buffer:png});await page.locator('.previews img').waitFor();
assert.equal(await page.getByRole('button',{name:'Analyze object',exact:true}).isDisabled(),true);
await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Analyze object',exact:true}).click();await page.getByRole('status').filter({hasText:'Phase 3'}).waitFor();
await page.screenshot({path:`${out}/capture-desktop.png`,fullPage:true});
await page.getByRole('button',{name:'Remove photo 1'}).click();assert.equal(await page.locator('.previews img').count(),0);
for(const screen of ['capture','home','explore']){
 if(screen==='home')await page.getByRole('button',{name:'RealityLab home'}).click();
 if(screen==='explore')await page.getByRole('button',{name:'Explore sample',exact:true}).click();
 for(const width of [1440,390,320]){await page.setViewportSize({width,height:900});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${screen} overflow at ${width}`);if(width===390)await page.screenshot({path:`${out}/${screen}-mobile.png`,fullPage:true});}
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],`${screen} accessibility`);
}
await page.emulateMedia({reducedMotion:'reduce'});await page.reload();await page.locator('.stage-canvas canvas').waitFor();await page.getByRole('button',{name:'Play model animation'}).waitFor();
await context.grantPermissions(['camera'],{origin:process.env.TEST_ORIGIN||'http://localhost:3000'});
await page.getByRole('button',{name:'Scan object',exact:true}).click();await page.getByRole('button',{name:'Use camera',exact:true}).click();await page.getByRole('dialog').waitFor();await page.waitForFunction(()=>{const v=document.querySelector('video');return v&&v.videoWidth>0});await page.getByRole('button',{name:'Take photo',exact:true}).click();await page.getByRole('button',{name:'Use photo',exact:true}).click();await page.locator('.previews img').waitFor();assert.equal(await page.getByRole('dialog').count(),0);
await context.clearPermissions();await context.grantPermissions([],{origin:process.env.TEST_ORIGIN||'http://localhost:3000'});
assert.deepEqual(errors,[]);console.log('PASS: 3D controls, sample selection, SVG export, upload validation, consent, no fake analysis, photo removal, 320/390/1440 layouts, accessibility, reduced motion, no browser exceptions.');
}finally{await browser.close()}

// Functional/accessibility audit with injected AI data; no credits are spent.
// Set AXE_PATH to a local axe-core script to include automated WCAG checks.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { createApp } from '../server/src/app.js';
import { scanFixture } from './helpers/scanFixture.js';
const server=createApp({provider:{configured:true,provider:'TEST-FIXTURE',model:'audit-only',analyze:async()=>scanFixture('furniture')},rateLimitEnabled:false}).listen(0,'127.0.0.1');
await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/lib/chromium/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
const output=process.env.UI_AUDIT_DIR||'/tmp/artifacts/ui-audit';await mkdir(output,{recursive:true});const reports=[];
try{
 const bytes=await sharp({create:{width:120,height:120,channels:3,background:'#aaaaaa'}}).png().toBuffer();
 for(const width of [1440,768,390,320]){
 const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.locator('.skip-link').waitFor();
 await page.bringToFront();
 await page.keyboard.press('Tab');assert.equal(await page.locator('.skip-link').evaluate(e=>e===document.activeElement),true);
 await page.keyboard.press('Enter');
 const explorer=page.getByRole('tab',{name:/Object explorer/});await explorer.focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.getByRole('tab',{name:/3D model inspector/}).getAttribute('aria-selected'),'true');
 await page.keyboard.press('End');assert.equal(await page.getByRole('tab',{name:/Car concept sample/}).getAttribute('aria-selected'),'true');
 await page.getByText('Uploaded photos do not change its parts or specifications.',{exact:false}).waitFor();
 await page.keyboard.press('Home');assert.equal(await page.getByRole('tab',{name:/Experiment bench/}).getAttribute('aria-selected'),'true');await explorer.click();
 await page.getByLabel('Upload object photos for analysis').setInputFiles({name:'audit.png',mimeType:'image/png',buffer:bytes});
 await page.locator('.lab-check').filter({hasText:'I agree to send'}).getByRole('checkbox').check();await page.getByRole('button',{name:'Analyze my photos',exact:true}).click();
 await page.getByRole('button',{name:'Concept GLB',exact:true}).waitFor();
 await page.getByRole('tab',{name:'3D concept',exact:true}).focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.getByRole('tab',{name:'How it works',exact:true}).getAttribute('aria-selected'),'true');
 await page.keyboard.press('Home');
 const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,brokenImages:[...document.images].filter(e=>e.checkVisibility()&&(!e.complete||!e.naturalWidth)).map(e=>e.alt),smallInputs:[...document.querySelectorAll('textarea,select,input:not([type=checkbox]):not([type=file]):not([type=range]):not([type=color])')].filter(e=>e.checkVisibility()&&parseFloat(getComputedStyle(e).fontSize)<16).map(e=>e.getAttribute('aria-label')||e.tagName)}));
 assert(metrics.scrollWidth<=width,`Horizontal overflow at ${width}: ${metrics.scrollWidth}`);assert.deepEqual(metrics.brokenImages,[]);assert.deepEqual(metrics.smallInputs,[]);
 let violations=null;
 if(process.env.AXE_PATH){await page.addScriptTag({path:process.env.AXE_PATH});violations=await page.evaluate(async()=>{const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));});assert.deepEqual(violations,[]);}
 assert.deepEqual(errors,[]);
 await page.screenshot({path:`${output}/result-${width}.png`,fullPage:true});
 await page.locator('.scan-experience').screenshot({path:`${output}/scan-${width}.png`});
 reports.push({...metrics,errors,violations});await page.close();
 console.log(`PASS ${width}px: keyboard tabs, skip link, sample scope, scan result, form readability, overflow${violations?' and axe WCAG checks':''}`);
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
await writeFile(`${output}/verified.json`,JSON.stringify(reports,null,2));
if(!process.env.AXE_PATH)console.log('axe checks not run: set AXE_PATH to include them.');

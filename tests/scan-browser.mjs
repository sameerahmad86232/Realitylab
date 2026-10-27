// Test-only injected concepts; no model credits or recognition claims.
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import sharp from 'sharp';
import { createApp } from '../server/src/app.js';
import { scanFixture } from './helpers/scanFixture.js';
let category='furniture';
const server=createApp({provider:{configured:true,provider:'TEST-FIXTURE',model:'test-only',analyze:async()=>scanFixture(category)},rateLimitEnabled:false}).listen(0,'127.0.0.1');
await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({executablePath:'/usr/lib/chromium/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
const dir='/tmp/artifacts/scan-check'; await mkdir(dir,{recursive:true});
try {
 const bytes=await sharp({create:{width:160,height:160,channels:3,background:'#abcabc'}}).png().toBuffer();
 for(category of ['furniture','electronics','appliance','natural']) {
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 await page.getByRole('tab',{name:/Object explorer/}).click();
 await page.getByLabel('Upload object photos for analysis').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:bytes});
 await page.locator('.lab-check').filter({hasText:'I agree to send'}).getByRole('checkbox').check();
 await page.getByRole('button',{name:'Analyze my photos',exact:true}).click();
 const glb=page.getByRole('button',{name:'Concept GLB',exact:true}); await glb.waitFor();
 await page.waitForFunction(()=>!!document.querySelector('.scan-experience canvas'));
 for(const type of ['GLB','STL']) {
 const download=page.waitForEvent('download'); await page.getByRole('button',{name:`Concept ${type}`,exact:true}).click();
 const d=await download; const b=await readFile(await d.path());
 if(type==='GLB') assert.equal(b.subarray(0,4).toString(),'glTF'); else assert(b.length>84);
 }
 await page.getByLabel('Selected scan part shape').selectOption('ellipsoid');
 await page.getByRole('tab',{name:'How it works',exact:true}).click();
 await page.getByText('Inspect the supporting structure',{exact:true}).waitFor();
 await page.getByRole('tab',{name:'Make a study model',exact:true}).click();
 await page.getByText(`Sketch the ${category} structure`,{exact:true}).waitFor();
 await page.getByRole('tab',{name:'3D concept',exact:true}).click();
 await page.locator('.scan-experience').screenshot({path:`${dir}/${category}.png`});
 await page.close();
 console.log(`${category}: 3D, editable shapes, GLB/STL, explanation and guide passed`);
 }
} finally {await browser.close();await new Promise(r=>server.close(r));}

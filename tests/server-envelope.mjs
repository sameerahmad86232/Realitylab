// Use the actual server handler response, unmodified, in the real React client.
import {chromium} from 'playwright-core';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {handleScan,scanState} from '../lib/server/scan.ts';
const fixture=JSON.parse(await readFile(new URL('./fixtures/analysis.json',import.meta.url),'utf8'));
const originalFetch=globalThis.fetch,savedKey=process.env.BASETEN_API_KEY,savedOrigin=process.env.APP_ORIGIN;
const origin=process.env.TEST_ORIGIN||'http://localhost:3000';process.env.BASETEN_API_KEY='test-only-key';process.env.APP_ORIGIN=origin;
scanState.requests.clear();scanState.active=0;scanState.hourCount=0;scanState.hour=Date.now();
globalThis.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify(fixture.analysis)}}],usage:{prompt_tokens:100,completion_tokens:50,total_tokens:150}});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
const context=await browser.newContext(),page=await context.newPage();let payload;
await context.route('**/api/health',r=>r.fulfill({json:{analysis:{configured:true}}}));
await context.route('**/api/scan',async route=>{const req=route.request();const response=await handleScan(new Request(req.url(),{method:'POST',headers:req.headers(),body:req.postDataBuffer()}));payload=await response.text();await route.fulfill({status:response.status,contentType:'application/json',body:payload})});
try{
 await page.goto(origin);await page.getByRole('button',{name:'Scan object',exact:true}).click();const image=await page.screenshot();await page.locator('input[type=file]').first().setInputFiles([{name:'one.png',mimeType:'image/png',buffer:image},{name:'two.png',mimeType:'image/png',buffer:image}]);await page.waitForFunction(()=>document.querySelectorAll('.previews img').length===2);await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Analyze object',exact:true}).click();await page.getByRole('heading',{name:fixture.analysis.object_name,exact:true}).waitFor();assert.deepEqual(Object.keys(JSON.parse(payload)).sort(),['analysis','meta']);assert.equal(JSON.parse(payload).meta.usage.totalTokens,150);await page.getByRole('button',{name:'Blueprint',exact:true}).click();await page.getByRole('heading',{name:'Conceptual blueprint',exact:true}).waitFor();console.log('PASS: Actual unmodified server response renders results and blueprint in the frontend. Provider mocked; no paid call.');
}finally{await browser.close();globalThis.fetch=originalFetch;if(savedKey===undefined)delete process.env.BASETEN_API_KEY;else process.env.BASETEN_API_KEY=savedKey;if(savedOrigin===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=savedOrigin}

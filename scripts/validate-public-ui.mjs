// Opt-in: actual public app + one real inference request. Uses verified Node HTTPS
// for browser network transport because the cloud Chromium CA store is separate.
import {chromium} from 'playwright-core';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {scanResultSchema} from '../lib/analysis.ts';
if(!process.argv.includes('--live')){console.log('Use --live to verify the public React scan flow with one paid inference request.');process.exit(0)}
const origin=process.env.VALIDATE_ORIGIN||'https://realitylab.onrender.com';
const photoPath='/tmp/artifacts/phase-3/mouse.jpg';await readFile(photoPath); // Public CC0 test photo downloaded by validate-live.mjs.
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1440,height:1000}});const page=await context.newPage();let wire,scanStatus,calls=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
await context.route(`${origin}/**`,async route=>{
 try{const request=route.request(),method=request.method();const response=await fetch(request.url(),{method,headers:request.headers(),body:['GET','HEAD'].includes(method)?undefined:request.postDataBuffer(),signal:AbortSignal.timeout(95000)});const bytes=Buffer.from(await response.arrayBuffer());const headers=Object.fromEntries(response.headers);delete headers['content-encoding'];delete headers['content-length'];delete headers['transfer-encoding'];if(new URL(request.url()).pathname==='/api/scan'){calls++;scanStatus=response.status;wire=JSON.parse(bytes.toString('utf8'))}await route.fulfill({status:response.status,headers,body:bytes})}catch(e){await route.abort();throw e}
});
try{
 await page.goto(origin);await page.getByRole('button',{name:'Scan object',exact:true}).click();await page.locator('input[type=file]').first().setInputFiles(photoPath);await page.locator('.previews img').waitFor();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Analyze object',exact:true}).click();await page.locator('.live-results').waitFor({timeout:95000});assert.equal(scanStatus,200);assert.equal(scanResultSchema.safeParse(wire).success,true);assert.deepEqual(Object.keys(wire).sort(),['analysis','meta']);await page.getByRole('heading',{name:wire.analysis.object_name,exact:true}).waitFor();await page.getByRole('button',{name:'Blueprint',exact:true}).click();await page.getByRole('heading',{name:'Conceptual blueprint',exact:true}).waitFor();assert.equal(calls,1);assert.deepEqual(errors,[]);await mkdir('/tmp/artifacts/scan-response-fix',{recursive:true});await page.screenshot({path:'/tmp/artifacts/scan-response-fix/public-results.png',fullPage:true});const result={origin,scanStatus,frontendAccepted:true,resultsRendered:true,blueprintRendered:true,calls,object:wire.analysis.object_name,components:wire.analysis.components.length,requestId:wire.meta.requestId};await writeFile('/tmp/artifacts/scan-response-fix/public-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await browser.close()}

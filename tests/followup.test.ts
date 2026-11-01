import {test,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {handleResearch,retrieveManual,manualURL} from '../lib/server/research.ts';
import {handleVerify} from '../lib/server/verify.ts';
import {scanState} from '../lib/server/scan.ts';
import {researchResponseSchema,verificationResponseSchema} from '../lib/followup.ts';
const fixture=JSON.parse(await readFile(new URL('./fixtures/analysis.json',import.meta.url),'utf8'));
const sourceCaseId=randomUUID();
const analysis={...fixture.analysis,components:fixture.analysis.components.map((part:{observed:boolean})=>({...part,...(part.observed?{image_index:0}:{})})),repair_assessment:{status:'guided-inspection',possible_cause:'A visible joint may be loose.',explanation:'The photo does not establish its condition.',risk:'low',component_ids:[],check_first:'Keep the object stationary.',tools:[],steps:[{title:'Observe joint',instruction:'Look at the visible joint without operating the object.',checkpoint:'A gap is visible at the joint.',component_ids:[]}],stop_conditions:['Stop if any hazard is visible.'],missing_evidence:[]}};
const comparison={status:'inconclusive',summary:'The angle does not show the same joint.',observations:[{source:'after',detail:'The joint is outside the visible region.'}],missingEvidence:['A view of the same joint.'],limitations:['A photo cannot establish repair success or safety.']};
const original=globalThis.fetch,savedKey=process.env.BASETEN_API_KEY,savedOrigin=process.env.APP_ORIGIN;
beforeEach(()=>{process.env.BASETEN_API_KEY='test-only';process.env.APP_ORIGIN='http://localhost';scanState.requests.clear();scanState.active=0;scanState.hour=Date.now();scanState.hourCount=0;});
afterEach(()=>{globalThis.fetch=original;if(savedKey===undefined)delete process.env.BASETEN_API_KEY;else process.env.BASETEN_API_KEY=savedKey;if(savedOrigin===undefined)delete process.env.APP_ORIGIN;else process.env.APP_ORIGIN=savedOrigin;});
async function verificationRequest({consent='true',report='The gap still looks the same.',before=true,signal,source=analysis}:{consent?:string;report?:string;before?:boolean;signal?:AbortSignal;source?:typeof analysis}={}){
 const png=await sharp({create:{width:20,height:20,channels:3,background:'white'}}).png().toBuffer();const form=new FormData();form.set('consent',consent);form.set('input',JSON.stringify({analysis:source,sourceCaseId,stepIndex:0,report}));
 if(before)form.set('before',new File([new Uint8Array(png)],'before.png',{type:'image/png'}));form.set('after',new File([new Uint8Array(png)],'after.png',{type:'image/png'}));
 return new Request('http://localhost/api/verify',{method:'POST',headers:{Origin:'http://localhost'},body:form,signal});
}
test('manual URL boundary rejects private hosts, credentials, ports, queries and redirect escapes',async()=>{
 for(const url of ['http://support.apple.com/doc','https://127.0.0.1/doc','https://support.apple.com.evil.test/doc','https://user:pass@support.apple.com/doc','https://support.apple.com:444/doc','https://support.apple.com/doc?redirect=http://127.0.0.1'])assert.throws(()=>manualURL(url));
 let calls=0;globalThis.fetch=async()=>{calls++;return new Response(null,{status:302,headers:{Location:'https://127.0.0.1/private'}});};
 await assert.rejects(retrieveManual('https://support.apple.com/doc','iPhone 12',new AbortController().signal));assert.equal(calls,1);
});
test('manual lookup returns bounded cited HTML text, no script content, and actual research trace without model calls',async()=>{
 let calls=0;globalThis.fetch=async(url)=>{calls++;assert.equal(String(url),'https://support.apple.com/doc');return new Response('<title>iPhone 12 User Guide</title><nav>Ignore navigation</nav><main><script>secret-script</script><h1>iPhone 12</h1><p>'+('Read the documentation. '.repeat(300))+'</p></main>',{headers:{'Content-Type':'text/html'}});};
 const response=await handleResearch(new Request('http://localhost/api/research',{method:'POST',headers:{Origin:'http://localhost','Content-Type':'application/json'},body:JSON.stringify({sourceCaseId,model:'iPhone 12',url:'https://support.apple.com/doc'})}));
 assert.equal(response.status,200);const result=researchResponseSchema.parse(await response.json());assert.equal(result.modelMentioned,true);assert.equal(result.excerpt.includes('secret-script'),false);assert.equal(result.excerpt.includes('Ignore navigation'),false);assert.ok(result.excerpt.split(/\s+/).length<=160);assert.equal(result.orchestration.budget.callsUsed,0);assert.ok(result.orchestration.events.some(event=>event.stage==='research'&&event.status==='completed'));assert.equal(calls,1);assert.equal(scanState.active,0);
});
test('manual lookup rejects PDF and empty/unreadable content honestly',async()=>{
 globalThis.fetch=async()=>new Response('%PDF-', {headers:{'Content-Type':'application/pdf'}});
 await assert.rejects(retrieveManual('https://support.apple.com/doc','unknown model',new AbortController().signal),/PDF/);
 globalThis.fetch=async()=>new Response('<main>Different product instructions.</main>',{headers:{'Content-Type':'text/html'}});
 assert.equal((await retrieveManual('https://support.apple.com/doc','iPhone 12',new AbortController().signal)).modelMentioned,false);
});
test('follow-up requires consent, both photos and existing low-risk checkpoint before any paid call',async()=>{
 let calls=0;globalThis.fetch=async()=>{calls++;throw Error('must not call');};
 for(const options of [{consent:'false'},{before:false},{source:{...analysis,repair_assessment:{...analysis.repair_assessment,steps:[]}}}])assert.equal((await handleVerify(await verificationRequest(options))).status,400);
 assert.equal(calls,0);assert.equal(scanState.active,0);
});
test('hazard in follow-up report vetoes a low-risk source without spending a model call',async()=>{
 globalThis.fetch=async()=>{throw Error('must not call');};
 const response=await handleVerify(await verificationRequest({report:'The battery is swollen.'}));assert.equal(response.status,200);
 const result=verificationResponseSchema.parse(await response.json());assert.equal(result.verification.status,'professional-help');assert.equal(result.orchestration.budget.callsUsed,0);assert.equal(scanState.active,0);
});
test('follow-up sends distinct normalized photos and checkpoint, caps output, reserves shared quota, and validates comparison',async()=>{
 let calls=0;globalThis.fetch=async(_url,options)=>{calls++;const payload=JSON.parse(options?.body as string);assert.equal(payload.max_tokens,1400);const content=payload.messages[1].content;assert.equal(content.length,3);assert.match(content[1].image_url.url,/^data:image\/jpeg;base64,/);assert.deepEqual(JSON.parse(content[0].text).photoOrder,['before','after']);return Response.json({choices:[{message:{content:JSON.stringify(comparison)}}],usage:{prompt_tokens:100,completion_tokens:50,total_tokens:150}});};
 const response=await handleVerify(await verificationRequest());assert.equal(response.status,200);const result=verificationResponseSchema.parse(await response.json());assert.equal(result.sourceCaseId,sourceCaseId);assert.equal(result.verification.status,'inconclusive');assert.equal(result.orchestration.budget.callsUsed,1);assert.equal(result.orchestration.budget.maxOutputTokens,1400);assert.equal(calls,1);assert.equal(scanState.hourCount,1);assert.equal(scanState.active,0);assert.equal(JSON.stringify(result).includes('data:image/'),false);
});
test('invalid comparison and exhausted quota fail closed and release slots',async()=>{
 globalThis.fetch=async()=>Response.json({choices:[{message:{content:JSON.stringify({...comparison,status:'consistent-with-checkpoint',observations:[]})}}]});
 assert.equal((await handleVerify(await verificationRequest())).status,502);assert.equal(scanState.active,0);
 scanState.hourCount=50;globalThis.fetch=async()=>{throw Error('must not call');};assert.equal((await handleVerify(await verificationRequest())).status,429);assert.equal(scanState.active,0);
});

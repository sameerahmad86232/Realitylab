import {test, beforeEach, afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {analysisSchema, scanResultSchema} from '../lib/analysis.ts';
import {orchestrationSchema, type StageEvent} from '../lib/orchestration.ts';
import {FixCoreCase, applySafetyGate} from '../lib/server/orchestrator.ts';
import {handleScan, scanState} from '../lib/server/scan.ts';
import {readScanResponse} from '../lib/scan-stream.ts';
const fixture = JSON.parse(await readFile(new URL('./fixtures/analysis.json', import.meta.url), 'utf8'));
const base = analysisSchema.parse({...fixture.analysis,components:fixture.analysis.components.map((part: {observed:boolean})=>({...part,...(part.observed?{image_index:0}:{})}))});
const repair = {status:'guided-inspection' as const, possible_cause:'A visible joint may be loose.', explanation:'Passive observation can help clarify the symptom.', risk:'low' as const, component_ids:[], check_first:'Keep stationary.', tools:[], steps:[{title:'Observe', instruction:'Look at the visible joint without touching it.', checkpoint:'Check whether a gap is visible.', component_ids:[]}], stop_conditions:['Stop if damage is visible.'], missing_evidence:[]};
const originalFetch = globalThis.fetch;
const saved = {key:process.env.BASETEN_API_KEY, origin:process.env.APP_ORIGIN};
beforeEach(()=>{process.env.BASETEN_API_KEY='test-only';process.env.APP_ORIGIN='http://localhost';scanState.active=0;scanState.hour=Date.now();scanState.hourCount=0;scanState.requests.clear();});
afterEach(()=>{globalThis.fetch=originalFetch;for(const [key,value] of Object.entries({BASETEN_API_KEY:saved.key,APP_ORIGIN:saved.origin})) {if(value===undefined)delete process.env[key];else process.env[key]=value;}});
async function request(context='', consent='true') {
 const form=new FormData();form.set('context',context);form.set('consent',consent);
 const png=await sharp({create:{width:10,height:10,channels:3,background:'white'}}).png().toBuffer();
 form.append('images',new File([new Uint8Array(png)],'photo.png',{type:'image/png'}));
 return new Request('http://localhost/api/scan',{method:'POST',headers:{Origin:'http://localhost',Accept:'application/x-ndjson'},body:form});
}
function modelResponse() {return Response.json({choices:[{message:{content:JSON.stringify({...base,repair_assessment:repair})}}],usage:{prompt_tokens:100,completion_tokens:50,total_tokens:150}});}
test('case state uses real transitions, bounded calls, and cancellation before reservation',()=>{
 let time=0;const flow=new FixCoreCase(randomUUID(),()=>{},()=>time);
 flow.queue();flow.event('analysis','running');time=40;flow.event('analysis','completed');
 assert.equal(flow.events.at(-1)?.durationMs,40);
 assert.throws(()=>flow.event('analysis','running'),/transition/);
 flow.reserveCall(new AbortController().signal);assert.throws(()=>flow.reserveCall(new AbortController().signal),/budget/);
 const other=new FixCoreCase(randomUUID());const abort=new AbortController();abort.abort();assert.throws(()=>other.reserveCall(abort.signal));assert.equal(other.callsUsed,0);
 const trace=flow.finish('failed');assert.equal([...new Map(trace.events.map(event=>[event.stage,event])).values()].some(event=>event.status==='queued'||event.status==='running'),false);
 assert.equal(orchestrationSchema.safeParse(trace).success,true);
});
test('independent safety veto removes low-risk model instructions for hazardous context and actions',()=>{
 const source=analysisSchema.parse({...base,repair_assessment:repair});
 for(const context of ['gas boiler leaking','mains wiring','swollen battery','vehicle brakes']) {
  const gated=applySafetyGate(source,context);assert.equal(gated.safety.decision,'refer',context);assert.deepEqual(gated.analysis.repair_assessment?.steps,[]);assert.deepEqual(gated.analysis.repair_assessment?.tools,[]);
 }
 const unsafe=analysisSchema.parse({...source,repair_assessment:{...repair,steps:[{...repair.steps[0],instruction:'Drill through the housing.'}]}});
 assert.equal(applySafetyGate(unsafe,'').safety.decision,'refer');
 assert.equal(source.repair_assessment?.steps.length,1,'gate must not mutate model evidence');
 assert.equal(applySafetyGate(source,'').safety.decision,'allow');
 const missing=applySafetyGate(base,'');assert.equal(missing.safety.decision,'request-evidence');
});
test('real handler streams progress while inference is pending, then validates safety trace and budget',async()=>{
 const pending=Promise.withResolvers<Response>();let calls=0;
 globalThis.fetch=async(_url,options)=>{calls++;assert.equal(JSON.parse(options?.body as string).max_tokens,6000);return pending.promise;};
 const response=await handleScan(await request('gas boiler leaking'));
 const events:StageEvent[]=[];const started=Promise.withResolvers<void>();
 const result=readScanResponse(response,event=>{events.push(event);if(event.stage==='analysis'&&event.status==='running')started.resolve();});
 await started.promise;
 assert.equal(calls,1);assert.equal(events.some(event=>event.stage==='analysis'&&event.status==='completed'),false);
 pending.resolve(modelResponse());
 const body=scanResultSchema.parse(await result);
 assert.equal(body.analysis.repair_assessment?.status,'professional-help');
 assert.equal(body.meta.orchestration?.budget.callsUsed,1);
 assert.equal(body.meta.orchestration?.safety?.decision,'refer');
 assert.equal(body.meta.orchestration?.events.find(event=>event.stage==='research'&&event.status==='skipped')?.reason,'Manual retrieval is not connected');
 assert.deepEqual(body.meta.orchestration?.events,events);
 assert.equal(body.meta.orchestration?.caseId,body.meta.requestId);
 assert.equal(JSON.stringify(body).includes('data:image/'),false);assert.equal(scanState.active,0);
});
test('stream errors preserve consent gate, mark failed stages, and do not call provider',async()=>{
 globalThis.fetch=async()=>{throw Error('must not call');};
 const events:StageEvent[]=[];
 await assert.rejects(readScanResponse(await handleScan(await request('','false')),event=>events.push(event)),/Consent/);
 assert.equal(events.some(event=>event.stage==='validation'&&event.status==='failed'),true);assert.equal(scanState.active,0);
});
test('stream disconnect aborts inference and releases the concurrency slot',async()=>{
 const stopped=Promise.withResolvers<void>();
 globalThis.fetch=async(_url,options)=>new Promise((_resolve,reject)=>{options!.signal!.addEventListener('abort',()=>{stopped.resolve();reject(new DOMException('cancelled','AbortError'));},{once:true});});
 const response=await handleScan(await request());const reader=response.body!.getReader();const decoder=new TextDecoder();let seen='';
 while(!seen.includes('"stage":"analysis","status":"running"')) {const chunk=await reader.read();seen+=decoder.decode(chunk.value);}
 await reader.cancel();await stopped.promise;
 // The provider rejection must unwind the handler before its global slot is released.
 await new Promise(resolve=>setImmediate(resolve));assert.equal(scanState.active,0);
});
test('client handles fragmented UTF-8 and refuses truncated or mismatched streams',async()=>{
 const id=randomUUID();const event={caseId:id,sequence:1,stage:'analysis',status:'running',elapsedMs:0};
 const payload=JSON.stringify({type:'stage',event})+'\n'+JSON.stringify({type:'result',result:{meta:{requestId:id},text:'é'}})+'\n';
 const bytes=new TextEncoder().encode(payload);
 const response=new Response(new ReadableStream({start(controller){for(const byte of bytes)controller.enqueue(new Uint8Array([byte]));controller.close();}}),{headers:{'Content-Type':'application/x-ndjson'}});
 assert.deepEqual(await readScanResponse(response,()=>{}),{meta:{requestId:id},text:'é'});
 const stream=(text:string)=>new Response(text,{headers:{'Content-Type':'application/x-ndjson'}});
 await assert.rejects(readScanResponse(stream(JSON.stringify({type:'stage',event})+'\n'),()=>{}),/ended before/);
 await assert.rejects(readScanResponse(stream(JSON.stringify({type:'stage',event})+'\n'+JSON.stringify({type:'result',result:{meta:{requestId:randomUUID()}}})+'\n'),()=>{}),/match/);
});

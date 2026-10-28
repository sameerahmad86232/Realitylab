import sharp from 'sharp';
import {randomUUID} from 'node:crypto';
import {analyzePhotos,configuration,ScanError} from './provider.ts';
import {scanResultSchema} from '../analysis.ts';
type ScanState={active:number;hour:number;hourCount:number;lastSuccess:string|null;requests:Map<string,{start:number;count:number}>};
const globalScan=globalThis as typeof globalThis & {__realitylabScanState?:ScanState};
export const scanState=globalScan.__realitylabScanState??=( {active:0,hour:0,hourCount:0,lastSuccess:null,requests:new Map()} );
const MAX_BODY=15*1024*1024+64*1024;
function json(body:unknown,status=200){return Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(status===429?{'Retry-After':'60'}:{})}})}
async function readForm(request:Request,signal:AbortSignal){
 const size=Number(request.headers.get('content-length'));
 if(Number.isFinite(size)&&size>MAX_BODY)throw new ScanError(413,'The upload is too large. Use up to three photos, at most 5 MB each.');
 if(!request.headers.get('content-type')?.startsWith('multipart/form-data;'))throw new ScanError(415,'Send photos as a multipart form.');
 const reader=request.body?.getReader();if(!reader)throw new ScanError(400,'Upload one to three photos.');
 let total=0;const chunks:Uint8Array[]=[];
 const cancel=()=>{void reader.cancel().catch(()=>{})};signal.addEventListener('abort',cancel,{once:true});
 try{while(true){signal.throwIfAborted();const{done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>MAX_BODY){await reader.cancel();throw new ScanError(413,'The upload is too large. Use smaller photos.')}chunks.push(value)}}finally{signal.removeEventListener('abort',cancel);reader.releaseLock()}
 signal.throwIfAborted();
 try{return await new Response(Buffer.concat(chunks),{headers:{'Content-Type':request.headers.get('content-type')!}}).formData()}catch{throw new ScanError(400,'The photo upload could not be read. Please choose the files again.')}
}
export async function normalize(file:File){
 if(!file.size||file.size>5*1024*1024)throw new ScanError(413,'Each photo must be nonempty and at most 5 MB.');
 if(!['image/jpeg','image/png'].includes(file.type))throw new ScanError(415,'Use JPEG or PNG photos.');
 try{
 const source=sharp(Buffer.from(await file.arrayBuffer()),{limitInputPixels:20_000_000,failOn:'error'});
 const meta=await source.metadata();if(!['jpeg','png'].includes(meta.format||'')||(meta.pages||1)>1)throw new ScanError(415,'Use still JPEG or PNG photos.');
 const clean=await source.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality:85}).toBuffer();
 return `data:image/jpeg;base64,${clean.toString('base64')}`;
 }catch(e){if(e instanceof ScanError)throw e;throw new ScanError(415,'One photo is corrupt, unsupported or exceeds 20 megapixels. Choose another photo.')}
}
export async function handleScan(request:Request){
 const requestId=randomUUID(),start=Date.now();let stage='validation',acquired=false,timer:ReturnType<typeof setTimeout>|undefined;
 try{
 const origin=request.headers.get('origin');const expected=process.env.APP_ORIGIN||process.env.RENDER_EXTERNAL_URL;
 const host=request.headers.get('host')||new URL(request.url).host;
 let trusted=false;try{trusted=!!origin&&(expected?new URL(origin).origin===new URL(expected).origin:new URL(origin).host===host)}catch{}
 if(!trusted)throw new ScanError(403,'This scan must be submitted from the RealityLab website.');
 if(!configuration().configured)throw new ScanError(503,'Live analysis is not configured on the server. Your photos remain available.');
 const now=Date.now();const client=request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()||'local';
 for(const[key,value]of scanState.requests)if(now-value.start>60_000)scanState.requests.delete(key);
 const bucket=scanState.requests.get(client);if(bucket&&bucket.count>=6)throw new ScanError(429,'Too many scans. Wait a minute before trying again.');
 if(scanState.requests.size>=1000&&!bucket)throw new ScanError(429,'The scan service is busy. Please try later.');
 scanState.requests.set(client,{start:bucket?.start||now,count:(bucket?.count||0)+1});
 if(scanState.active>=2)throw new ScanError(429,'Two scans are already running. Please try again shortly.');
 if(now-scanState.hour>=3_600_000){scanState.hour=now;scanState.hourCount=0}
 if(scanState.hourCount>=50)throw new ScanError(429,'The demo has reached its hourly scan limit. Please return later.');
 scanState.active++;acquired=true;
 const abort=new AbortController();timer=setTimeout(()=>abort.abort(new DOMException('Scan timed out','TimeoutError')),80_000);
 const signal=AbortSignal.any([request.signal,abort.signal]);
 stage='upload';const form=await readForm(request,signal);signal.throwIfAborted();
 if(form.get('consent')!=='true')throw new ScanError(400,'Consent to send these photos to Baseten is required.');
 const context=form.get('context')||'';if(typeof context!=='string'||context.length>500)throw new ScanError(400,'Object context must be at most 500 characters.');
 if([...form.keys()].some(k=>!['images','consent','context'].includes(k)))throw new ScanError(400,'The scan form contains unsupported fields.');
 const files=form.getAll('images');if(files.length<1||files.length>3||files.some(f=>!(f instanceof File)))throw new ScanError(400,'Upload one to three photos.');
 stage='normalization';const images:string[]=[];for(const file of files){signal.throwIfAborted();images.push(await normalize(file as File))}
 signal.throwIfAborted();scanState.hourCount++;
 stage='inference';const result=await analyzePhotos(images,context,signal);signal.throwIfAborted();
 const analyzedAt=new Date().toISOString(),durationMs=Date.now()-start;
 const payload=scanResultSchema.parse({analysis:result.analysis,meta:{requestId,provider:configuration().provider,model:configuration().model,durationMs,analyzedAt,usage:result.usage}});
 scanState.lastSuccess=analyzedAt;
 console.info(JSON.stringify({event:'scan_complete',requestId,durationMs,photoCount:images.length,model:configuration().model,tokens:result.usage.totalTokens}));
 return json(payload);
 }catch(error){
 const aborted=request.signal.aborted;const timeout=error instanceof Error&&['TimeoutError','AbortError'].includes(error.name);
 const status=error instanceof ScanError?error.status:aborted?499:timeout?504:502;
 const message=error instanceof ScanError?error.message:aborted?'Scan cancelled. Your photos are preserved.':timeout?'Analysis timed out. Your photos are preserved; try again with fewer photos.':'The scan could not be completed. Your photos are preserved. Please retry.';
 console.info(JSON.stringify({event:'scan_error',requestId,status,stage,errorType:error instanceof Error?error.name:'unknown',networkCode:error instanceof Error?(error.cause as {code?:string}|undefined)?.code:undefined,durationMs:Date.now()-start}));
 return json({error:{message,requestId}},status);
 }finally{if(timer)clearTimeout(timer);if(acquired)scanState.active--}
}

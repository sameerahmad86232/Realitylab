import {assertPaidAccess} from "./access.ts";
import {ScanError} from "./provider.ts";
import {scanState} from "./scan.ts";
export function assertCaseOrigin(request:Request){
 const expected=process.env.APP_ORIGIN||process.env.RENDER_EXTERNAL_URL;
 let trusted=false;try{const origin=request.headers.get("origin");trusted=!!origin&&(expected?new URL(origin).origin===new URL(expected).origin:new URL(origin).host===(request.headers.get("host")||new URL(request.url).host));}catch{}
 if(!trusted)throw new ScanError(403,"Submit this request from RealityLab.");
 assertPaidAccess(request);
}
export function acquireCaseRequest(request:Request){
 const now=Date.now(),client=request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()||"local";
 for(const [key,value] of scanState.requests)if(now-value.start>60000)scanState.requests.delete(key);
 const bucket=scanState.requests.get(client);
 if((bucket&&bucket.count>=6)||(!bucket&&scanState.requests.size>=1000)||scanState.active>=2)throw new ScanError(429,"The service is busy. Wait a minute before trying again.");
 scanState.requests.set(client,{start:bucket?.start||now,count:(bucket?.count||0)+1});scanState.active++;
 let released=false;return ()=>{if(!released){released=true;scanState.active--;}};
}
export async function readCaseBody(request:Request,limit:number,signal:AbortSignal){
 if(Number(request.headers.get("content-length"))>limit)throw new ScanError(413,"The request is too large.");
 const reader=request.body?.getReader();if(!reader)throw new ScanError(400,"A request body is required.");
 const chunks:Uint8Array[]=[];let size=0;
 const abort=()=>{void reader.cancel().catch(()=>{});};signal.addEventListener("abort",abort,{once:true});
 try{while(true){signal.throwIfAborted();const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new ScanError(413,"The request is too large.");}chunks.push(value);}}finally{signal.removeEventListener("abort",abort);reader.releaseLock();}
 signal.throwIfAborted();return Buffer.concat(chunks);
}
export function caseError(error:unknown,request:Request){
 const status=request.signal.aborted?499:error instanceof ScanError?error.status:error instanceof Error&&["AbortError","TimeoutError"].includes(error.name)?504:502;
 return {status,message:error instanceof ScanError?error.message:status===499?"Request cancelled. Your scan remains available.":status===504?"The request timed out. Your scan remains available.":"This stage could not be completed. Your scan remains available."};
}

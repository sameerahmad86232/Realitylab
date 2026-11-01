import {randomUUID} from "node:crypto";
import {load} from "cheerio";
import {researchRequestSchema,researchResponseSchema} from "../followup.ts";
import {FixCoreCase} from "./orchestrator.ts";
import {ScanError} from "./provider.ts";
import {assertCaseOrigin,acquireCaseRequest,readCaseBody,caseError} from "./case-request.ts";
// Exact vendor-controlled documentation hosts only. No caller-selected fetch headers or credentials.
export const manualHosts=new Set(["support.apple.com","support.google.com","support.microsoft.com","support.hp.com","www.dell.com","support.lenovo.com","www.samsung.com","www.lg.com","www.bosch-home.com","www.sony.com"]);
export function manualURL(value:string){const url=new URL(value);if(url.protocol!=="https:"||url.port||url.username||url.password||!manualHosts.has(url.hostname)||url.search)throw new ScanError(400,"Use an HTTPS documentation page from a supported manufacturer, without query parameters.");url.hash="";return url;}
export async function retrieveManual(value:string,model:string,signal:AbortSignal){
 let url=manualURL(value),response:Response|undefined;
 for(let redirects=0;redirects<=3;redirects++){
  signal.throwIfAborted();response=await fetch(url,{signal,redirect:"manual",headers:{Accept:"text/html,text/plain"}});
  if([301,302,303,307,308].includes(response.status)){const location=response.headers.get("location");await response.body?.cancel();if(!location||redirects===3)throw new ScanError(502,"The documentation page redirected too many times.");url=manualURL(new URL(location,url).href);continue;}break;
 }
 if(!response?.ok){await response?.body?.cancel();throw new ScanError(502,"The manufacturer documentation could not be retrieved. Check the link or open it directly.");}
 if(!/text\/(html|plain)/i.test(response.headers.get("content-type")||"")){await response.body?.cancel();throw new ScanError(415,"Use an HTML documentation page. PDF manuals are not supported yet.");}
 const reader=response.body?.getReader();if(!reader)throw new ScanError(502,"The documentation page was empty.");
 const chunks:Uint8Array[]=[];let bytes=0;
 try{while(true){signal.throwIfAborted();const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>1024*1024){await reader.cancel();throw new ScanError(413,"The documentation page exceeds the retrieval limit.");}chunks.push(value);}}finally{reader.releaseLock();}
 const $=load(Buffer.concat(chunks).toString("utf8"));$("script,style,noscript,nav,header,footer,form,svg").remove();
 const title=$("title").first().text().trim().slice(0,300)||url.hostname;
 const main=$("main,article,[role=main]").first();
 const body=(main.length?main.text():$("body").text()).replace(/\s+/g," ").trim();
 if(!body)throw new ScanError(422,"No readable documentation text was found on this page.");
 const normalized=(s:string)=>s.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
 const modelMentioned=normalized(title+" "+body).includes(normalized(model));
 const excerpt=body.split(/\s+/).slice(0,160).join(" ").slice(0,1900);
 return {url:url.href,title,excerpt,modelMentioned,retrievedAt:new Date().toISOString()};
}
export async function handleResearch(request:Request){
 const flow=new FixCoreCase(randomUUID());flow.queue();flow.event("validation","running");let release:(()=>void)|undefined;
 const signal=AbortSignal.any([request.signal,AbortSignal.timeout(20000)]);
 try{
  assertCaseOrigin(request);if(!request.headers.get("content-type")?.includes("application/json"))throw new ScanError(415,"Send a JSON documentation request.");
  const body=await readCaseBody(request,8192,signal);let raw;try{raw=JSON.parse(body.toString("utf8"));}catch{throw new ScanError(400,"The documentation request could not be read.");}
  const parsed=researchRequestSchema.safeParse(raw);if(!parsed.success)throw new ScanError(400,"Provide the exact model, source case and official documentation URL.");
  manualURL(parsed.data.url);release=acquireCaseRequest(request);flow.event("validation","completed");
  for(const stage of ["normalization","quota","analysis","safety","verification"] as const)flow.event(stage,"skipped","Documentation lookup uses no model call or repair procedure");
  flow.event("research","running");const document=await retrieveManual(parsed.data.url,parsed.data.model,signal);flow.event("research","completed");flow.event("complete","running");
  const payload=researchResponseSchema.parse({...document,model:parsed.data.model,sourceCaseId:parsed.data.sourceCaseId,orchestration:flow.finish("completed")});
  flow.event("complete","completed");payload.orchestration=flow.finish("completed");return Response.json(payload,{headers:{"Cache-Control":"no-store"}});
 }catch(error){const failed=caseError(error,request);return Response.json({error:{message:failed.message},orchestration:flow.finish(request.signal.aborted?"cancelled":"failed")},{status:failed.status,headers:{"Cache-Control":"no-store"}});}finally{release?.();}
}

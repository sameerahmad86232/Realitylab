// Offline by default. Live evaluation requires --live and an explicit limit <= 4.
import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {evaluationManifestSchema,reviewsSchema,classifyResponse,digest,responseDigest,summarizeEvaluation,evaluationRecordSchema} from '../lib/evaluation.ts';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),options={};
for(let i=0;i<args.length;i++){
 const key=args[i];
 if(key==='--live'){options.live=true;continue}
 if(!['--mode','--limit','--cases','--out','--origin','--reviews','--report'].includes(key)||!args[i+1]||args[i+1].startsWith('--'))throw Error(`Invalid argument: ${key}`);
 options[key.slice(2)]=args[++i];
}
const mode=options.mode||'archived';
if(!['archived','plan','live','review'].includes(mode))throw Error('Mode must be archived, plan, live or review.');
if(mode==='live'&&(!options.live||!/^([1-4])$/.test(options.limit||'')))throw Error('Live mode requires --live --limit 1..4. This limits requests, not dollars.');
if(mode!=='live'&&options.live)throw Error('--live is only accepted in live mode.');
if(mode==='review'){
 if(!options.report||!options.reviews||!options.out)throw Error('Review mode requires --report, --reviews and a fresh --out path. No inference is made.');
 const sourcePath=resolve(options.report),raw=await readFile(sourcePath,'utf8'),report=JSON.parse(raw);
 if(report.version!==1||!Array.isArray(report.records)||report.records.length>100)throw Error('Invalid evaluation report.');
 const records=report.records.map(row=>evaluationRecordSchema.parse(row));
 for(const record of records){
  if(record.response_sha256&&record.response_sha256!==responseDigest(record.payload))throw Error(`${record.case_id}: response digest mismatch`);
  if(record.image_sha256?.length){
   const actual=[];for(let i=0;i<record.image_sha256.length;i++)actual.push(digest(await readFile(resolve(dirname(sourcePath),'inputs',`${record.case_id}-view-${i+1}.jpg`))));
   if(JSON.stringify(actual)!==JSON.stringify(record.image_sha256)||digest(JSON.stringify(actual))!==record.input_sha256)throw Error(`${record.case_id}: submitted-input digest mismatch`);
  }
 }
 const reviews=reviewsSchema.parse(JSON.parse(await readFile(resolve(options.reviews),'utf8'))).reviews;
 const output={...report,records,summary:summarizeEvaluation(records,reviews),review_source_sha256:digest(raw),review_http_requests:0,reviewed_at:new Date().toISOString()};
 await writeFile(resolve(options.out),JSON.stringify(output,null,2),{flag:'wx'});console.log(JSON.stringify({report:resolve(options.out),summary:output.summary,review_http_requests:0},null,2));process.exit(0);
}
const manifest=evaluationManifestSchema.parse(JSON.parse(await readFile(resolve(root,'evaluation/manifest.json'),'utf8')));
const reviewFile=options.reviews?resolve(options.reviews):resolve(root,'evaluation/reviews.json');
const reviews=reviewsSchema.parse(JSON.parse(await readFile(reviewFile,'utf8'))).reviews;
const requested=options.cases?.split(',');
if(requested&&(new Set(requested).size!==requested.length||requested.some(id=>!manifest.cases.some(item=>item.id===id))))throw Error('Case selection contains unknown or duplicate IDs.');
let cases=manifest.cases.filter(item=>requested?requested.includes(item.id):mode==='live'||mode==='plan'?item.split==='controlled-challenge':true);
if(mode==='live')cases=cases.slice(0,Number(options.limit));
if(!cases.length)throw Error('No cases selected.');
const origin=options.origin||'https://realitylab.onrender.com';
if(!['https://realitylab.onrender.com','http://localhost:3000','http://127.0.0.1:3000'].includes(origin))throw Error('Use the deployed RealityLab origin or the local test server; photos will not be sent to another host.');
const runId=`${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,8)}`;
const out=resolve(options.out||`/tmp/artifacts/evaluation/${mode}-${runId}`);
await mkdir(dirname(out),{recursive:true});await mkdir(out);await mkdir(resolve(out,'inputs'));await mkdir(resolve(out,'responses'));
async function localFile(relative){const path=await realpath(resolve(root,relative));if(!path.startsWith(root+sep))throw Error('Evaluation paths must stay inside the repository.');return readFile(path)}
async function inputFor(input){
 if(input.transform==='blank')return sharp({create:{width:960,height:720,channels:3,background:'#b8bdc3'}}).jpeg({quality:85}).toBuffer();
 const source=await localFile(input.path),normalized=await sharp(source,{limitInputPixels:20_000_000,failOn:'error'}).rotate().toBuffer();let image=sharp(normalized);
 if(input.transform==='darken')image=image.linear(.12,0);
 if(input.transform==='center-crop'){const {width,height}=await sharp(normalized).metadata();const w=Math.round(width*.28),h=Math.round(height*.28);image=image.extract({left:Math.floor((width-w)/2),top:Math.floor((height-h)/2),width:w,height:h})}
 if(input.transform==='rotate90')image=image.rotate(90);
 return image.resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality:85}).toBuffer();
}
async function boundedText(response){
 if(!response.body)return '';const reader=response.body.getReader();const chunks=[];let bytes=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;bytes+=value.byteLength;if(bytes>512*1024){await reader.cancel();throw Error('Evaluation response exceeded 512 KiB.')}chunks.push(value)}}finally{reader.releaseLock()}
 return Buffer.concat(chunks).toString('utf8');
}
let health=null,httpRequests=0;
if(mode==='live'){
 try{const response=await fetch(`${origin}/api/health`,{signal:AbortSignal.timeout(20000)});health=await response.json();if(!response.ok||health.analysis?.configured!==true||health.analysis?.model!=='meta-models/muse-spark-open-1026')throw Error('The target does not report the configured hackathon model.');}catch(error){await writeFile(resolve(out,'setup-failure.json'),JSON.stringify({mode,origin,http_requests:0,error:error instanceof Error?error.message:'Health check failed'},null,2));throw Error('Target setup failed; no scans were sent. See setup-failure.json.')}
}
const records=[];
for(const item of cases){
 const record={case_id:item.id,split:item.split,execution:'not-run',input_sha256:null,response_sha256:null,outcome:'not-run',http_status:null,elapsed_ms:null,payload:null,expected_technical_outcome:item.expected_technical_outcome,technical_expectation_met:null,input_binding:mode==='live'?'captured-client-upload-before-server-normalization':'declared-historical-association',http_request_sent:false};
 const start=Date.now();
 try{
  const images=await Promise.all([item.input,...item.additional_views].map(inputFor));record.image_sha256=images.map(digest);record.input_sha256=digest(JSON.stringify(record.image_sha256));for(let i=0;i<images.length;i++)await writeFile(resolve(out,'inputs',`${item.id}-view-${i+1}.jpg`),images[i]);
  if(mode==='plan'){records.push(record);continue}
  if(mode==='archived'){
   if(!item.archived_response){records.push(record);continue}
   record.execution='historical';record.http_status=200;record.payload=JSON.parse((await localFile(item.archived_response)).toString('utf8'));
  }else{
   record.execution='live';
   const form=new FormData();form.set('consent','true');form.set('context','Explain the main object in these photos. Distinguish visible evidence from inferred hidden mechanisms. If identity is unclear, say so.');images.forEach((image,i)=>form.append('images',new Blob([image],{type:'image/jpeg'}),`${item.id}-view-${i+1}.jpg`));
   httpRequests++;record.http_request_sent=true;
   const response=await fetch(`${origin}/api/scan`,{method:'POST',headers:{Origin:origin},body:form,signal:AbortSignal.timeout(95000)});record.http_status=response.status;
   const raw=await boundedText(response);await writeFile(resolve(out,'responses',`${item.id}.raw.txt`),raw);
   try{record.payload=JSON.parse(raw)}catch{record.payload={unreadable_response:true}}
  }
  record.response_sha256=responseDigest(record.payload);record.outcome=classifyResponse(record.http_status,record.payload,images.length);
  record.technical_expectation_met=item.expected_technical_outcome==='either'?['valid-result','no-object-rejection'].includes(record.outcome):item.expected_technical_outcome==='result'?record.outcome==='valid-result':record.outcome==='no-object-rejection';
 }catch(error){record.outcome=error?.name==='TimeoutError'?'timeout':'setup-error';record.error=error instanceof Error?error.message:'Evaluation failed';if(record.execution==='not-run')record.execution=mode==='live'?'live':'historical'}
 record.elapsed_ms=Date.now()-start;
 records.push(record);await writeFile(resolve(out,'responses',`${item.id}.json`),JSON.stringify(record,null,2));
 console.log(JSON.stringify({case:record.case_id,execution:record.execution,outcome:record.outcome,status:record.http_status,elapsedMs:record.elapsed_ms}));
}
const report={version:1,run_id:runId,mode,origin:mode==='live'?origin:null,server:health?{release:health.release,sourceRevision:health.sourceRevision||null,model:health.analysis.model}:null,manifest_sha256:digest(JSON.stringify(manifest)),request_limit:mode==='live'?Number(options.limit):0,http_requests:httpRequests,automatic_retries:0,technical_expectation_failures:records.filter(row=>row.technical_expectation_met===false).map(row=>row.case_id),local_prompt_file_sha256:digest(await readFile(resolve(root,'lib/server/provider.ts'))),historical_prompt_version:'unknown; do not infer from the current local prompt',cases:cases.map(item=>({id:item.id,label:item.label,split:item.split,input:item.input,additional_views:item.additional_views,source:item.source,reference_identity:item.reference_identity})),records,summary:summarizeEvaluation(records,reviews)};
await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
await writeFile(resolve(out,'review-template.json'),JSON.stringify({version:1,reviews:[]},null,2));
console.log(JSON.stringify({report:resolve(out,'report.json'),summary:report.summary,http_requests:httpRequests},null,2));
if(records.some(row=>row.technical_expectation_met===false||['http-error','invalid-envelope','timeout','setup-error'].includes(row.outcome)))process.exitCode=1;

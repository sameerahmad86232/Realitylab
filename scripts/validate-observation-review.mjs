// Explicitly opt-in: exactly one learning request on a hypothetical software report.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {learningResponseSchema,validLearning} from '../lib/learning.ts';
import {makeObservationFollowup} from '../lib/observation-followup.ts';
if(!process.argv.includes('--live')){console.log('Use --live for one paid Meta observation-review request. The input is hypothetical; no physical trial is performed.');process.exit(0)}
const origin=process.env.VALIDATE_ORIGIN||'https://realitylab.onrender.com';
if(!['https://realitylab.onrender.com','http://localhost:3000'].includes(origin))throw Error('Use the deployed app or local server.');
const healthResponse=await fetch(`${origin}/api/health`,{signal:AbortSignal.timeout(20000)}),health=await healthResponse.json();
if(!healthResponse.ok||health.release!=='observation-reasoning-v20'||!health.analysis?.configured)throw Error('The observation-review release is not ready. No learning request was sent.');
const scan={result:JSON.parse(await readFile('public/demos/fan.json','utf8')),photos:[]},lesson=JSON.parse(await readFile('public/demos/fan-learning.json','utf8'));
const record={lesson_request_id:lesson.meta.requestId,step_index:0,outcome:'different',actual:'Hypothetical software probe only, not a physical trial: one folded corner touches first and the cardboard base rocks instead of lying flat.',updated_at:new Date().toISOString()};
const draft=makeObservationFollowup(scan,lesson,record);if(!draft)throw Error('Could not bind the hypothetical test context.');
const input={analysis:scan.result.analysis,source_request_id:scan.result.meta.requestId,kind:'question',question:draft.question,consent:true,observation_context:{...draft.context,report_type:'hypothetical-test'}};
const out=`/tmp/artifacts/observation-reasoning/live-${Date.now()}`;await mkdir(out,{recursive:true});await writeFile(`${out}/request.json`,JSON.stringify(input,null,2));
const start=Date.now();const response=await fetch(`${origin}/api/learn`,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(95000)});const payload=await response.json();await writeFile(`${out}/response.json`,JSON.stringify(payload,null,2));
const parsed=learningResponseSchema.safeParse(payload),accepted=response.ok&&parsed.success&&payload.source_request_id===input.source_request_id&&validLearning(payload.learning,input);
const result={origin,sourceRevision:health.sourceRevision,status:response.status,frontendAccepted:accepted,structuredReview:!!payload.learning?.observation_review,lessonAndStepBound:payload.learning?.observation_review?.lesson_request_id===input.observation_context.lesson_request_id&&payload.learning?.observation_review?.step_index===input.observation_context.step_index,reportType:'hypothetical-test',physicalTrialPerformed:false,qualityImprovementEstablished:false,learningRequests:1,automaticRetries:0,elapsedMs:Date.now()-start,model:payload.meta?.model||null,usage:payload.meta?.usage||null};
await writeFile(`${out}/verification.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({out,...result},null,2));if(!accepted)process.exitCode=1;

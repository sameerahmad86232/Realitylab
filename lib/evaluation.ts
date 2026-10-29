import {z} from 'zod';
import {createHash} from 'node:crypto';
import {scanResultSchema} from './analysis.ts';

const safePath=z.string().regex(/^(?:public\/demos|evaluation\/(?:assets|records))\/[a-zA-Z0-9_-]+\.(?:jpg|png|json)$/);
const inputSchema=z.object({path:safePath.nullable(),transform:z.enum(['none','darken','center-crop','rotate90','blank'])}).strict();
export const caseSchema=z.object({
 id:z.string().regex(/^[a-z0-9-]+$/),
 split:z.enum(['curated','known-failure','controlled-challenge','held-out']),
 label:z.string().min(1).max(200),
 input:inputSchema,additional_views:z.array(inputSchema).max(2).default([]),
 source:z.object({description:z.string().min(1),author:z.string().min(1),license:z.string().min(1),url:z.url().nullable()}).strict(),
 reference_identity:z.string().nullable(),
 archived_response:safePath.nullable(),
 expected_technical_outcome:z.enum(['result','no-object','either']),
}).strict().superRefine((item,ctx)=>{
 for(const input of [item.input,...item.additional_views]){
 if((input.transform==='blank')!==(input.path===null))ctx.addIssue({code:'custom',message:'Only a synthetic blank may omit its input path.'});
 if(input.path&&!/\.(jpg|png)$/.test(input.path))ctx.addIssue({code:'custom',message:'Inputs must be image files.'});
 }
 if(item.archived_response&&!item.archived_response.endsWith('.json'))ctx.addIssue({code:'custom',message:'Archived responses must be JSON files.'});
 if(item.split==='held-out'&&item.archived_response)ctx.addIssue({code:'custom',message:'An already-recorded case is not held out.'});
});
export const evaluationManifestSchema=z.object({version:z.literal(1),description:z.string().min(1),cases:z.array(caseSchema).min(1).max(100)}).strict().superRefine((m,ctx)=>{
 if(new Set(m.cases.map(c=>c.id)).size!==m.cases.length)ctx.addIssue({code:'custom',message:'Case IDs must be unique.'});
});
const rating=z.enum(['correct','incorrect','uncertain','not-reviewed']);
export const reviewSchema=z.object({
 case_id:z.string(),response_sha256:z.string().regex(/^[a-f0-9]{64}$/),input_sha256:z.string().regex(/^[a-f0-9]{64}$/),
 reviewer_id:z.string().min(1).max(100),reviewer_type:z.literal('human'),reviewed_at:z.string().datetime(),
 identity:rating,
 parts:z.array(z.object({part_id:z.string(),identity:rating,evidence_label:rating,marker:z.enum(['on-part','off-part','not-applicable','not-reviewed'])}).strict()).max(8),
 notes:z.string().min(1).max(3000),
}).strict();
export const reviewsSchema=z.object({version:z.literal(1),reviews:z.array(reviewSchema).max(1000)}).strict();
export type EvaluationCase=z.infer<typeof caseSchema>;
export type HumanReview=z.infer<typeof reviewSchema>;
export type EvaluationOutcome='valid-result'|'no-object-rejection'|'http-error'|'invalid-envelope'|'timeout'|'setup-error'|'not-run';
export type EvaluationRecord={case_id:string;split:EvaluationCase['split'];execution:'historical'|'live'|'not-run';input_sha256:string|null;response_sha256:string|null;outcome:EvaluationOutcome;http_status:number|null;elapsed_ms:number|null;payload:unknown;error?:string};
export const evaluationRecordSchema=z.object({case_id:z.string().regex(/^[a-z0-9-]+$/),split:caseSchema.shape.split,execution:z.enum(['historical','live','not-run']),input_sha256:z.string().regex(/^[a-f0-9]{64}$/).nullable(),response_sha256:z.string().regex(/^[a-f0-9]{64}$/).nullable(),outcome:z.enum(['valid-result','no-object-rejection','http-error','invalid-envelope','timeout','setup-error','not-run']),http_status:z.number().int().min(100).max(599).nullable(),elapsed_ms:z.number().nonnegative().nullable(),payload:z.unknown(),image_sha256:z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1).max(3).optional()}).passthrough().superRefine((row,ctx)=>{if(row.outcome==='valid-result'&&!scanResultSchema.safeParse(row.payload).success)ctx.addIssue({code:'custom',message:'A structural result must contain a valid frontend envelope.'})});
export function digest(value:string|Uint8Array){return createHash('sha256').update(value).digest('hex')}
export function responseDigest(payload:unknown){return digest(JSON.stringify(payload))}
export function classifyResponse(status:number,payload:unknown,photoCount=1):EvaluationOutcome{
 if(status===422&&typeof payload==='object'&&payload!==null&&'error' in payload){const error=(payload as {error?:{message?:unknown}}).error;if(typeof error?.message==='string'&&error.message.startsWith('No clear object was found.'))return 'no-object-rejection'}
 if(status<200||status>=300)return 'http-error';
 const parsed=scanResultSchema.safeParse(payload);
 if(!parsed.success||parsed.data.analysis.recognition==='no-object'||parsed.data.analysis.components.some(p=>p.image_index!==null&&p.image_index>=photoCount))return 'invalid-envelope';
 return 'valid-result';
}
export function summarizeEvaluation(records:EvaluationRecord[],reviews:HumanReview[]=[]){
 const reviewIssues:string[]=[],rated=new Map<string,HumanReview>(),duplicates=new Set<string>();
 for(const candidate of reviews){
  const checked=reviewSchema.safeParse(candidate);if(!checked.success){reviewIssues.push('Invalid review schema; excluded from counts');continue}const review=checked.data;
  const record=records.find(row=>row.case_id===review.case_id);
  if(!record||record.response_sha256!==review.response_sha256||record.input_sha256!==review.input_sha256||record.outcome!=='valid-result'){reviewIssues.push(`${review.case_id}: missing result or stale image/response binding`);continue}
  const parsed=scanResultSchema.safeParse(record.payload);
  if(!parsed.success||review.parts.some(p=>!parsed.data.analysis.components.some(part=>part.id===p.part_id))||new Set(review.parts.map(p=>p.part_id)).size!==review.parts.length){reviewIssues.push(`${review.case_id}: invalid part references`);continue}
  if(duplicates.has(review.case_id))continue;
  if(rated.has(review.case_id)){duplicates.add(review.case_id);reviewIssues.push(`${review.case_id}: duplicate case review; excluded from counts`);rated.delete(review.case_id);continue}
  rated.set(review.case_id,review);
 }
 const executed=records.filter(row=>row.execution!=='not-run'),live=records.filter(row=>row.execution==='live');
 const byOutcome=Object.fromEntries(['valid-result','no-object-rejection','http-error','invalid-envelope','timeout','setup-error','not-run'].map(key=>[key,records.filter(row=>row.outcome===key).length]));
 const identity=Object.fromEntries(['correct','incorrect','uncertain','not-reviewed'].map(key=>[key,[...rated.values()].filter(row=>row.identity===key).length]));
 const accepted=executed.filter(row=>row.outcome==='valid-result');
 const tokenCounts=executed.map(row=>{const parsed=scanResultSchema.safeParse(row.payload);return parsed.success?parsed.data.meta.usage.totalTokens:null});
 const durations=accepted.map(row=>scanResultSchema.parse(row.payload).meta.durationMs).sort((a,b)=>a-b);
 return {
  selected_cases:records.length,executed_cases:executed.length,historical_cases:executed.length-live.length,live_attempts:live.length,
  splits:Object.fromEntries(['curated','known-failure','controlled-challenge','held-out'].map(split=>[split,records.filter(row=>row.split===split).length])),
  outcomes:byOutcome,
  structural_results:accepted.length,token_usage:{known_total_tokens:tokenCounts.reduce<number>((sum,value)=>sum+(value??0),0),unknown_executed_cases:tokenCounts.filter(value=>value===null).length,notice:'Unknown usage is not zero usage; no dollar cost is inferred.'},
  human_identity_ratings:identity,human_reviewed_cases:rated.size,human_identity_reviewed_cases:[...rated.values()].filter(row=>row.identity!=='not-reviewed').length,identity_pending_results:accepted.length-[...rated.values()].filter(row=>row.identity!=='not-reviewed').length,review_issues:reviewIssues,
  server_ms:durations.length?{min:durations[0],max:durations.at(-1),median:durations.length%2?durations[(durations.length-1)/2]:(durations[durations.length/2-1]+durations[durations.length/2])/2}:null,
  accuracy_claim:null,
  notices:['A valid envelope is not a correct identification or mechanical explanation.','Curated examples and transforms of them are not independent held-out evidence.','Source-file identity references are not human correctness reviews.','Human-review counts exclude unknown, stale, invalid and duplicate bindings; no measured accuracy is asserted.','A no-object rejection is an API behavior, not an expert judgment about the image.'],
 };
}

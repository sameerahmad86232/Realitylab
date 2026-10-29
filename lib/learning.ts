import {z} from 'zod';
import {analysisSchema,scanResultSchema} from './analysis.ts';
const text=(max=1200)=>z.string().trim().min(1).max(max);
export const observationContextSchema=z.object({
 source_request_id:z.string().uuid(),lesson_request_id:z.string().uuid(),step_index:z.number().int().min(0).max(6),
 step_title:text(100),instruction:text(700),prediction:text(500),
 actual:z.string().min(1).max(600).refine(value=>value.trim().length>0,'An actual observation is required.'),
 outcome:z.enum(['matched','different','unclear']),reported_at:z.string().datetime(),
 report_type:z.enum(['user-reported','hypothetical-test']).default('user-reported'),
 component_ids:z.array(text(40)).min(1).max(8),
}).strict();
export type ObservationContext=z.infer<typeof observationContextSchema>;
export const observationReviewSchema=z.object({
 lesson_request_id:z.string().uuid(),step_index:z.number().int().min(0).max(6),
 prediction_status:z.enum(['consistent-with-report','questionable','insufficient-evidence']),
 reasoning:text(900),
 possible_explanations:z.array(z.object({explanation:text(500),distinguishing_observation:text(400)}).strict()).min(1).max(3),
 limits:z.array(text(600)).min(1).max(5),
}).strict();
export const learningRequestSchema=z.object({analysis:analysisSchema,source_request_id:z.string().uuid(),kind:z.enum(['lesson','question']),question:z.string().trim().max(600).default(''),consent:z.literal(true),observation_context:observationContextSchema.optional()}).strict().superRefine((r,ctx)=>{
 if(r.kind==='question'&&!r.question)ctx.addIssue({code:'custom',message:'A question is required.'});
 const context=r.observation_context;if(!context)return;
 if(r.kind!=='question'||context.source_request_id!==r.source_request_id)ctx.addIssue({code:'custom',message:'Observation context must belong to this scan and a question.'});
 const ids=new Set(r.analysis.components.map(part=>part.id));if(new Set(context.component_ids).size!==context.component_ids.length||context.component_ids.some(id=>!ids.has(id)))ctx.addIssue({code:'custom',message:'Observation context must reference supplied scan components.'});
});
export const craftMaterials=['paper','cardboard','pencil','thread','adhesive tape','paper straw','craft sticks','string','rubber bands','binder clips','paper fasteners','paper cup'] as const;
const materialSchema=z.object({item:z.enum(craftMaterials),purpose:text(300),alternative:z.enum(craftMaterials)}).strict();
export const constructionSchema=z.object({overview:text(1500),stages:z.array(z.object({title:text(100),description:text(600),component_ids:z.array(text(40)).max(8)}).strict()).min(2).max(6),checks:z.array(text(400)).min(1).max(5),missing_information:z.array(text(400)).min(1).max(5)}).strict();
export const learningSchema=z.object({observation_review:observationReviewSchema.optional(),construction:constructionSchema.optional(),status:z.enum(['ready','observation-only']),title:text(150),answer:text(2200),component_ids:z.array(text(40)).max(8),materials:z.array(materialSchema).max(8),steps:z.array(z.object({title:text(100),instruction:text(700),observe:text(500)}).strict()).max(7),estimated_minutes:z.number().int().min(1).max(60).nullable(),safety_notes:z.array(text(600)).min(1).max(5),limitations:z.array(text(600)).min(1).max(5)}).strict();
export const learningResponseSchema=z.object({learning:learningSchema,source_request_id:z.string().uuid(),meta:scanResultSchema.shape.meta}).strict();
export type LearningRequest=z.infer<typeof learningRequestSchema>;
export type Learning=z.infer<typeof learningSchema>;
export type LearningResponse=z.infer<typeof learningResponseSchema>;
export function validLearning(learning:Learning,request:LearningRequest){
 const context=request.observation_context,review=learning.observation_review;
 if(review&&(!context||request.kind!=='question'||review.lesson_request_id!==context.lesson_request_id||review.step_index!==context.step_index))return false;
 if(context&&learning.status==='ready'&&!review)return false;
 const ids=new Set(request.analysis.components.map(p=>p.id));if(learning.construction?.stages.some(s=>s.component_ids.some(id=>!ids.has(id))))return false;if(new Set(learning.component_ids).size!==learning.component_ids.length)return false;if(learning.component_ids.some(id=>!ids.has(id)))return false;if(request.kind==='lesson'&&learning.status==='ready'&&!learning.construction)return false;if(request.kind==='question'&&(learning.construction||learning.materials.length||learning.steps.length||learning.estimated_minutes!==null))return false;if(learning.status==='observation-only'&&(learning.steps.length||learning.materials.length||learning.estimated_minutes!==null))return false;if(request.kind==='lesson'&&learning.status==='ready'&&!learning.component_ids.length)return false;
 if(learning.steps.some(s=>/\b(solder|melt|burn|pressuriz\w*|disassembl\w*|rewir\w*|puncture|ignite)\b|\b(connect|attach|plug)\b.{0,70}\b(mains|battery|capacitor|wall outlet)\b/i.test(s.instruction)))return false;
 if(request.kind==='lesson'&&learning.status==='ready'&&(learning.steps.length<3||learning.steps.length>7||!learning.materials.length||learning.estimated_minutes===null))return false;return true}
export function blockedLearningQuestion(question:string){return /\b(mains|high[- ]voltage|lithium|explosive|weapon|firearm|gun|ammunition|gas\s+(?:line|pipe)|rewir\w*|bypass\w*|capacitor\s+discharg\w*|battery\s+(?:open|puncture)|medical\s+(?:diagnos\w*|treatment))\b/i.test(question)}
export function observationOnly():Learning{return {status:'observation-only',title:'Keep this exploration observational',answer:'I can explain photographed parts and general principles, or suggest a separate paper model. I cannot provide wiring, hazardous fabrication, diagnosis, or instructions to open or modify this device.',component_ids:[],materials:[],steps:[],estimated_minutes:null,safety_notes:['Do not open, energize or alter the scanned object for this lesson.'],limitations:['Photos do not establish hidden wiring, stored energy, safe operating condition or exact specifications.']}}

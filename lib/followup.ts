import {z} from "zod";
import {orchestrationSchema} from "./orchestration.ts";
const text=(max:number)=>z.string().trim().min(1).max(max);
export const researchRequestSchema=z.object({model:text(120),url:z.string().url().max(2048),sourceCaseId:z.string().uuid()}).strict();
export const researchResponseSchema=z.object({sourceCaseId:z.string().uuid(),model:text(120),url:z.string().url(),title:text(300),excerpt:text(2000),modelMentioned:z.boolean(),retrievedAt:z.string().datetime(),orchestration:orchestrationSchema}).strict();
export const verificationSchema=z.object({status:z.enum(["consistent-with-checkpoint","inconsistent-with-checkpoint","inconclusive","professional-help"]),summary:text(900),observations:z.array(z.object({source:z.enum(["before","after","user-report"]),detail:text(500)}).strict()).max(6),missingEvidence:z.array(text(500)).max(5),limitations:z.array(text(500)).min(1).max(5)}).strict().superRefine((value,ctx)=>{
 if(value.status==="consistent-with-checkpoint"&&!value.observations.some(item=>item.source==="after"))ctx.addIssue({code:"custom",message:"A consistent checkpoint requires an after-photo observation."});
});
export const verificationResponseSchema=z.object({sourceCaseId:z.string().uuid(),stepIndex:z.number().int().min(0).max(2),verification:verificationSchema,orchestration:orchestrationSchema,usage:z.object({inputTokens:z.number().int().nonnegative().nullable(),outputTokens:z.number().int().nonnegative().nullable(),totalTokens:z.number().int().nonnegative().nullable()}).strict()}).strict();
export type ResearchResult=z.infer<typeof researchResponseSchema>;
export type VerificationResult=z.infer<typeof verificationResponseSchema>;

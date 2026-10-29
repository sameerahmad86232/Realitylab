import {z} from 'zod';
import type {LearningResponse} from './learning.ts';

export const outcomeSchema=z.enum(['not-tested','matched','different','unclear']);
export type ObservationOutcome=z.infer<typeof outcomeSchema>;
export const observationSchema=z.object({
 lesson_request_id:z.string().uuid(),
 step_index:z.number().int().min(0).max(6),
 outcome:outcomeSchema,
 actual:z.string().max(600),
 updated_at:z.string().datetime(),
}).strict();
export type Observation=z.infer<typeof observationSchema>;

// A completion checkbox is never evidence that the predicted effect happened.
export function observationsFor(lesson:LearningResponse|null,records:Observation[]){
 if(!lesson)return [];
 const seen=new Set<number>();
 return records.flatMap(record=>{
  const parsed=observationSchema.safeParse(record);
  if(!parsed.success||record.lesson_request_id!==lesson.meta.requestId||record.step_index>=lesson.learning.steps.length||seen.has(record.step_index))return [];
  seen.add(record.step_index);
  return [parsed.data];
 });
}
export function hasObservation(record:Observation){return record.outcome!=='not-tested'&&record.actual.trim().length>0}
export function observationExport(lesson:LearningResponse|null,records:Observation[]){
 return {
  notice:'User-reported observations, not independent verification. Step completion does not establish physical success. No observations have been inferred by the model.',
  records:observationsFor(lesson,records).map(record=>({
   report_status:hasObservation(record)?'logged':'draft',
   ...record,
   source:'user-reported' as const,
   step_title:lesson!.learning.steps[record.step_index].title,
   model_prediction:lesson!.learning.steps[record.step_index].observe,
  })),
 };
}

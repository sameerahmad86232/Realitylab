import {observationContextSchema,type LearningResponse} from './learning.ts';
import {hasObservation,observationsFor,type Observation} from './observations.ts';
import type {ScanView} from './analysis.ts';

// This binds browser-supplied context, not proof that a physical trial took place.
export function makeObservationFollowup(scan:ScanView,lesson:LearningResponse|null,record:Observation|undefined){
 if(!lesson||!record||lesson.source_request_id!==scan.result.meta.requestId)return null;
 const valid=observationsFor(lesson,[record])[0];if(!valid||!hasObservation(valid))return null;
 const ids=new Set(scan.result.analysis.components.map(part=>part.id));
 if(!lesson.learning.component_ids.length||lesson.learning.component_ids.some(id=>!ids.has(id)))return null;
 const step=lesson.learning.steps[record.step_index];
 const context=observationContextSchema.safeParse({source_request_id:scan.result.meta.requestId,lesson_request_id:lesson.meta.requestId,step_index:record.step_index,step_title:step.title,instruction:step.instruction,prediction:step.observe,actual:record.actual,outcome:record.outcome,reported_at:record.updated_at,report_type:'user-reported',component_ids:lesson.learning.component_ids});
 if(!context.success)return null;
 return {
  question:'Review this separate craft-study report. Compare the prediction with the reported result, challenge any questionable assumption, and suggest a safe observation that could distinguish possible explanations. The report is not independent verification.',
  context:context.data,
 };
}

import type {Observation} from './observations.ts';
import type {LearningResponse,ObservationContext} from './learning.ts';
export type LearningAnswer={question:string;result:LearningResponse;observation_context?:ObservationContext};
export type LearningDraft={recorded?:boolean;observations?:Observation[];lesson:LearningResponse|null;answers:LearningAnswer[];completed:number[]};
// Tab-memory only. No photos, localStorage, server persistence or cross-user cache.
const drafts=new Map<string,LearningDraft>();
export function getLearningDraft(id:string){return drafts.get(id)}
export function saveLearningDraft(id:string,draft:LearningDraft){drafts.delete(id);drafts.set(id,draft);while(drafts.size>6)drafts.delete(drafts.keys().next().value!)}

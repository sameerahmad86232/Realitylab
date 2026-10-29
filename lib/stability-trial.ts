import {z} from 'zod';
export const stabilityProtocolId='cardboard-support-comparison-v1';
export const trialOutcomes=['not-tried','stayed-upright','tipped','slid','unclear'] as const;
export const trialRowSchema=z.object({
 trial:z.number().int().min(1).max(3),
 narrow:z.enum(trialOutcomes),wide:z.enum(trialOutcomes),
 edge_lift:z.string().max(60),notes:z.string().max(600),reported_at:z.string().datetime().nullable(),
}).strict();
export type TrialRow=z.infer<typeof trialRowSchema>;
export const trialSetupSchema=z.object({narrow_base:z.string().max(120),wide_base:z.string().max(120),upright_height:z.string().max(120),conditions:z.string().max(1000)}).strict();
export type TrialSetup=z.infer<typeof trialSetupSchema>;
export function emptyTrialRows():TrialRow[]{return [1,2,3].map(trial=>({trial,narrow:'not-tried',wide:'not-tried',edge_lift:'',notes:'',reported_at:null}))}
export function isReportedTrial(row:TrialRow){return row.narrow!=='not-tried'&&row.wide!=='not-tried'&&row.notes.trim().length>0}
export function exportStabilityTrial(setup:TrialSetup,rows:TrialRow[]){
 const checkedSetup=trialSetupSchema.parse(setup),checkedRows=z.array(trialRowSchema).length(3).parse(rows);
 if(new Set(checkedRows.map(row=>row.trial)).size!==3)throw Error('Each of the three trials must appear once.');
 const reported=checkedRows.filter(isReportedTrial).length,hasDraft=checkedRows.some(row=>row.narrow!=='not-tried'||row.wide!=='not-tried'||row.notes.trim()||row.edge_lift.trim());
 return {
  version:1,protocol_id:stabilityProtocolId,authored_by:'RealityLab',protocol_kind:'App-authored separate craft-study procedure; not a Meta-generated scan result.',
  hypothesis:'Broader support may resist tipping under the same board tilt. This procedure does not isolate footprint from mass, friction or joint differences.',
  generated_at:new Date().toISOString(),results_status:reported===3?'user-reported-complete':hasDraft?'partial-self-report':'planning-only',
  independently_verified:false,reported_trial_count:reported,planned_trial_count:3,
  setup:checkedSetup,trials:checkedRows.map(row=>({...row,record_status:isReportedTrial(row)?'reported':'draft'})),
  limits:['The protocol has not been physically validated by RealityLab.','Reports are user statements, not independent verification or proof of the scanned object’s behavior.','Hand-controlled tilt, added base mass, friction, tape and construction variation can change the outcome.','Do not infer an exact tipping threshold or a causal width-only effect from this small comparison.'],
 };
}

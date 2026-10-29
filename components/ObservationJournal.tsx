'use client';
import {Eye,FlaskConical} from 'lucide-react';
import type {Observation,ObservationOutcome} from '../lib/observations';
const outcomes=[['not-tested','Not tested'],['matched','Matched the prediction'],['different','Different from the prediction'],['unclear','Could not tell']] as const;
export default function ObservationJournal({index,prediction,record,onChange}:{index:number;prediction:string;record?:Observation;onChange:(outcome:ObservationOutcome,actual:string)=>void}){
 const outcome=record?.outcome||'not-tested',actual=record?.actual||'',prefix=`observation-${index}`;
 return <div className="observation-journal" role="group" aria-label={`Test the prediction for step ${index+1}`}>
  <details ><summary><span>Record your test result</span><small>{outcome==='not-tested'?'Not tested':actual.trim()?'User observation logged':'Observation needed'}</small></summary><p className="observation-kicker"><FlaskConical size={14}/>TEST THE PREDICTION</p>
  <div className="observation-prediction"><Eye size={15}/><div><strong>Meta’s expected observation</strong><p>{prediction}</p></div></div>
  <label htmlFor={`${prefix}-outcome`}>Step {index+1}: What happened?<select id={`${prefix}-outcome`} value={outcome} onChange={event=>onChange(event.target.value as ObservationOutcome,actual)}>{outcomes.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
  <label htmlFor={`${prefix}-actual`}>Step {index+1}: Your actual observation<textarea id={`${prefix}-actual`} value={actual} maxLength={600} rows={3} placeholder="After trying the separate craft model, describe what you actually saw, including anything that failed." onChange={event=>onChange(outcome,event.target.value)}/></label>
  <div className="observation-footnote"><span>{actual.length} / 600</span><span>{outcome==='not-tested'?'No test result reported.':actual.trim()?'User report saved in this tab.':'Describe what happened to log this result.'}</span></div>
  <p className="observation-caveat">For your separate craft study only. Self-reported results do not verify the original object or the model’s explanation. Refreshing clears this journal; export learning to keep a copy.</p>
 </details></div>
}

import {wrapSvgText} from './svg-text.ts';
import type {Analysis} from './analysis.ts';
import type {Learning} from './learning.ts';
import {xmlText} from './blueprint.ts';
export function constructionSvg(plan:NonNullable<Learning['construction']>,analysis:Analysis){
 const titleLines=wrapSvgText(analysis.object_name,924,25),overviewLines=wrapSvgText(plan.overview,924,12),overviewY=115+(titleLines.length-1)*30;const rows=plan.stages.map(stage=>({stage,lines:wrapSvgText(stage.description,820,12),titles:wrapSvgText(stage.title,820,17),references:wrapSvgText(stage.component_ids.map(id=>analysis.components.find(p=>p.id===id)?.name||id).join(' / '),820,10)}));let y=overviewY+overviewLines.length*17+40;
 const text=(x:number,y:number,v:string,size=13,color='#233c4b')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}">${xmlText(v)}</text>`;
 const body:string[]=[];
 for(const [i,{stage,lines,titles,references}] of rows.entries()){const h=Math.max(124,82+lines.length*18+(titles.length-1)*20+Math.max(0,references.length-1)*14);body.push(`<rect x="38" y="${y}" width="924" height="${h}" rx="10" fill="#fff" stroke="#ccd8df"/><circle cx="76" cy="${y+32}" r="17" fill="#173d50"/>`,text(66,y+37,String(i+1).padStart(2,'0'),12,'#e6f7ff'),...titles.map((t,n)=>text(108,y+37+n*20,t,17)),...lines.map((l,n)=>text(108,y+65+(titles.length-1)*20+n*18,l,12)),...references.map((line,n)=>text(108,y+h-16-(references.length-1-n)*14,line,10,'#4d6b7c')));y+=h+20}
 const notes=[...plan.checks.map(s=>`CHECK / ${s}`),...plan.missing_information.map(s=>`NEEDED / ${s}`)].flatMap(s=>wrapSvgText(s,924,11));const height=y+100+notes.length*18;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="${height}" viewBox="0 0 1000 ${height}" role="img" aria-label="Conceptual construction sequence, not a manufacturing drawing" font-family="Arial, sans-serif"><title>${xmlText(analysis.object_name)} / construction study</title><rect width="1000" height="${height}" fill="#f4f5f0"/><path d="M38 55H962" stroke="#bac9cb"/>${text(38,38,'REALITYLAB / CONSTRUCTION STUDY',11,'#4c6a75')}${titleLines.map((l,i)=>text(38,97+i*30,l,25)).join('')}${overviewLines.map((l,i)=>text(38,overviewY+i*17,l,12)).join('')}${body.join('')}${text(38,y+19,'CONCEPTUAL / UNVERIFIED ASSEMBLY · NO MEASURED DIMENSIONS',11)}${notes.map((l,i)=>text(38,y+50+i*18,l,11,'#4c6571')).join('')}</svg>`;
}

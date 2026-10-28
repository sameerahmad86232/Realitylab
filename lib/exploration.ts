import type {Analysis} from './analysis.ts';
export type Component=Analysis['components'][number];
export type EvidenceFilter='all'|'observed'|'inferred';
export type Marker={x:number;y:number};
export function filterComponents(parts:Component[],filter:EvidenceFilter,query:string){
 const term=query.trim().toLocaleLowerCase();
 return parts.filter(p=>(filter==='all'||p.observed===(filter==='observed'))&&(!term||[p.name,p.function,p.evidence,...p.material_candidates].some(value=>value.toLocaleLowerCase().includes(term))));
}
/** Connections have no edge evidence in this contract: never infer certainty or direction. */
export function componentEdges(parts:Component[]){
 const ids=new Set(parts.map(p=>p.id)),seen=new Set<string>();
 const edges:{source:string;target:string}[]=[];
 for(const part of parts)for(const target of part.connections){
  if(target===part.id||!ids.has(target))continue;
  const key=JSON.stringify([part.id,target].sort());
  if(seen.has(key))continue;
  seen.add(key);edges.push({source:part.id,target});
 }
 return edges;
}
export function componentPositions(parts:Component[]){
 return new Map(parts.map((p,i)=>{
  if(parts.length===1)return [p.id,{x:360,y:220}] as const;
  if(parts.length===2)return [p.id,{x:i===0?200:520,y:220}] as const;
  const angle=-Math.PI/2+(i/parts.length)*Math.PI*2;
  return [p.id,{x:360+Math.cos(angle)*235,y:225+Math.sin(angle)*140}] as const;
 }));
}
export function clampMarker(marker:Marker):Marker{
 return {x:Math.round(Math.min(1,Math.max(0,marker.x))*10000)/10000,y:Math.round(Math.min(1,Math.max(0,marker.y))*10000)/10000};
}

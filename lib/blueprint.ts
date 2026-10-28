import type {Analysis,ScanResult} from './analysis.ts';
import type {Component,Marker} from './exploration.ts';
import {clampMarker} from './exploration.ts';

export type BlueprintTheme='paper'|'classic';
export type BlueprintItem={part:Component;number:number;kind:'located'|'other-view'|'unlocated'|'inferred';placement:'model-suggested'|'user-adjusted'|null;anchor:Marker|null;box:{x:number;y:number;width:number;height:number}};
export type BlueprintModel={width:number;height:number;items:BlueprintItem[];photoBox:{x:number;y:number;width:number;height:number};drawingBottom:number;view:number;photoCount:number;totalParts:number;locatedCount:number;activeCount:number;title:string};
const finite=(n:number)=>Number.isFinite(n)&&n>0;
export function blueprintLayout(analysis:Analysis,view:number,photoCount:number,dimensions:{width:number;height:number},visibleIds:Set<string>,adjustments:Record<string,Marker>={}):BlueprintModel{
 const active=analysis.components.filter(p=>visibleIds.has(p.id));
 const located=active.filter(p=>p.observed&&p.image_index===view&&(adjustments[p.id]||p.marker));
 const marker=(p:Component)=>clampMarker(adjustments[p.id]||p.marker!);
 const ordered=[...located].sort((a,b)=>marker(a).x-marker(b).x||analysis.components.indexOf(a)-analysis.components.indexOf(b));
 const left=ordered.slice(0,Math.ceil(ordered.length/2)).sort((a,b)=>marker(a).y-marker(b).y);
 const right=ordered.slice(Math.ceil(ordered.length/2)).sort((a,b)=>marker(a).y-marker(b).y);
 const drawingHeight=Math.max(390,Math.max(left.length,right.length)*94);
 const area={x:300,y:160,width:500,height:drawingHeight};
 const ratio=finite(dimensions.width)&&finite(dimensions.height)?dimensions.width/dimensions.height:1;
 const w=Math.min(area.width,area.height*ratio),h=w/ratio;
 const photoBox={x:area.x+(area.width-w)/2,y:area.y+(area.height-h)/2,width:w,height:h};
 const items:BlueprintItem[]=[];
 for(const [side,group]of [['left',left],['right',right]] as const)group.forEach((part,i)=>{
  const p=marker(part);items.push({part,number:analysis.components.indexOf(part)+1,kind:'located',placement:adjustments[part.id]?'user-adjusted':'model-suggested',anchor:{x:photoBox.x+p.x*photoBox.width,y:photoBox.y+p.y*photoBox.height},box:{x:side==='left'?26:838,y:area.y+i*(drawingHeight/group.length)+(drawingHeight/group.length-78)/2,width:236,height:78}});
 });
 const drawingBottom=area.y+drawingHeight;
 const unlocated=active.filter(p=>!located.includes(p));
 const railStart=drawingBottom+88;
 unlocated.forEach((part,i)=>items.push({part,number:analysis.components.indexOf(part)+1,kind:!part.observed?'inferred':part.image_index!==view?'other-view':'unlocated',placement:null,anchor:null,box:{x:26+(i%2)*536,y:railStart+Math.floor(i/2)*88,width:512,height:76}}));
 const height=railStart+(unlocated.length?Math.ceil(unlocated.length/2)*88:0)+146;
 return {width:1100,height,items,photoBox,drawingBottom,view,photoCount,totalParts:analysis.components.length,locatedCount:located.length,activeCount:active.length,title:analysis.object_name};
}
export function xmlText(value:string){return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function lines(value:string,max=30,count=2){
 const words=value.replace(/\s+/g,' ').trim().match(new RegExp(`.{1,${max}}(?:\\s|$)|.{1,${max}}`,'g'))||[''];
 const result=words.slice(0,count).map(s=>s.trim());if(words.length>count)result[result.length-1]=result[result.length-1].replace(/.{0,2}$/,'…');return result;
}
const palettes={paper:{bg:'#f9fbff',grid:'#dfe8f4',ink:'#243c61',muted:'#526681',line:'#6e8fb8',card:'#ffffff',accent:'#1457f5',selected:'#edf3ff',inferred:'#fffaf0'},classic:{bg:'#102b4b',grid:'#1d3d60',ink:'#eff7ff',muted:'#b6cce3',line:'#6b9cc7',card:'#153553',accent:'#80deff',selected:'#214b70',inferred:'#263c4a'}};
export function blueprintSvg(model:BlueprintModel,options:{theme:BlueprintTheme;selected?:string;interactive?:boolean;photoDataUrl?:string;meta:ScanResult['meta']}):string{
 const {theme,selected='',interactive=false,photoDataUrl,meta}=options,p=palettes[theme];
 if(photoDataUrl&&(!/^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(photoDataUrl)||photoDataUrl.length>8*1024*1024))throw Error('Only a prepared JPEG or PNG can be included in this SVG.');
 const text=(x:number,y:number,value:string,size=12,color=p.ink,extra='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" ${extra}>${xmlText(value)}</text>`;
 const wrapped=(x:number,y:number,value:string,max=30,count=2,size=13,color=p.ink)=>lines(value,max,count).map((line,i)=>text(x,y+i*(size+3),line,size,color)).join('');
 const metadata={format:'RealityLab conceptual photo-marker blueprint',notToScale:true,view:model.view+1,photoCount:model.photoCount,activeParts:model.activeCount,totalParts:model.totalParts,photoIncluded:!!photoDataUrl,requestId:meta.requestId,provider:meta.provider,model:meta.model,analyzedAt:meta.analyzedAt,placements:model.items.map(i=>({id:i.part.id,kind:i.kind,source:i.placement})),notice:'Symbolic component positions, not measured geometry. Inferred parts have no photo location. Solid leaders label parts; they are not physical connections.'};
 const output=[`<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="${model.height}" viewBox="0 0 1100 ${model.height}" role="${interactive?'group':'img'}" aria-label="Conceptual blueprint of ${xmlText(model.title)}. Not to scale." font-family="Arial, Helvetica, sans-serif">`,
 `<title>${xmlText(model.title)} — conceptual blueprint, not to scale</title><desc>Photo-positioned component symbols and labels. No reconstructed outlines, dimensions or inferred internals are drawn. ${model.activeCount} of ${model.totalParts} components in this filtered scope. ${photoDataUrl?'Source photo is included.':'Photo excluded.'}</desc><metadata>${xmlText(JSON.stringify(metadata))}</metadata>`,
 `<defs><pattern id="bp-grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="${p.grid}" stroke-width=".7"/></pattern></defs><rect width="1100" height="${model.height}" fill="${p.bg}"/><rect x="14" y="14" width="1072" height="${model.height-28}" rx="4" fill="url(#bp-grid)" stroke="${p.line}" stroke-width=".7"/>`,
 text(28,39,'REALITYLAB / CONCEPTUAL BLUEPRINT',10,p.muted,'letter-spacing="2"'),wrapped(28,73,model.title,64,2,22),
 `<rect x="874" y="28" width="198" height="30" rx="4" fill="${p.card}" stroke="${p.line}"/>`,text(973,48,'NOT TO SCALE',12,p.ink,'text-anchor="middle" letter-spacing="1"'),
 text(28,126,`VIEW ${model.view+1} OF ${model.photoCount}  /  ${model.activeCount} OF ${model.totalParts} PARTS IN SCOPE`,11,p.muted),
 text(1070,126,'SYMBOLIC PARTS · IMAGE-RELATIVE POSITIONS',10,p.muted,'text-anchor="end"'),
 `<rect x="${model.photoBox.x}" y="${model.photoBox.y}" width="${model.photoBox.width}" height="${model.photoBox.height}" fill="${p.card}" fill-opacity=".45" stroke="${p.line}" stroke-width="1" stroke-dasharray="3 5"/>`];
 if(photoDataUrl)output.push(`<image x="${model.photoBox.x}" y="${model.photoBox.y}" width="${model.photoBox.width}" height="${model.photoBox.height}" href="${photoDataUrl}" aria-hidden="true" opacity="${theme==='classic'?'.35':'.28'}"/>`);
 if(!model.locatedCount)output.push(text(550,model.photoBox.y+model.photoBox.height/2,'No part locations established in this view.',14,p.muted,'text-anchor="middle"'));
 for(const item of model.items){const {part,box,anchor}=item,active=selected===part.id;const color=active?p.accent:p.line;
  output.push(`<g${interactive?` role="button" tabindex="0" data-bp-part="${xmlText(part.id)}" aria-label="Blueprint: ${xmlText(part.name)}, ${part.observed?'observed':'inferred'}" aria-pressed="${active}"`:''}><title>${xmlText(`${part.name}: ${part.evidence}`)}</title>`);
  if(anchor){const left=box.x<model.photoBox.x;const edge=left?box.x+box.width:box.x;const elbow=left?model.photoBox.x-14:model.photoBox.x+model.photoBox.width+14;output.push(`<path d="M${edge} ${box.y+box.height/2}H${elbow}V${anchor.y}H${anchor.x}" fill="none" stroke="${color}" stroke-width="${active?2:1}"/><circle cx="${anchor.x}" cy="${anchor.y}" r="14" fill="${p.card}" stroke="${color}" stroke-width="${active?2:1}"/>`,text(anchor.x,anchor.y+4,String(item.number),11,p.ink,'text-anchor="middle"'));}
  output.push(`<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="5" fill="${active?p.selected:part.observed?p.card:p.inferred}" stroke="${color}" stroke-width="${active?2:1}"${part.observed?'':' stroke-dasharray="5 4"'}/>`,text(box.x+12,box.y+17,`${String(item.number).padStart(2,'0')} / ${item.kind==='located'?'OBSERVED':item.kind==='other-view'?`OBSERVED · VIEW ${part.image_index!+1}`:item.kind==='unlocated'?'OBSERVED · LOCATION UNAVAILABLE':'INFERRED · NO PHOTO LOCATION'}`,9,p.muted),wrapped(box.x+12,box.y+37,part.name,anchor?28:56,2,13),text(box.x+12,box.y+67,item.kind==='located'?(item.placement==='user-adjusted'?'Location adjusted by you':'Location suggested by model'):item.kind==='other-view'?'Separate source view; not projected here':item.kind==='unlocated'?'No coordinate has been invented':'Hypothesis only; not drawn inside the object',9,p.muted),'</g>');
 }
 output.push(text(28,model.drawingBottom+37,'Solid leaders label photo positions only. They are not physical connections or dimensions.',11,p.muted));
 if(model.items.some(i=>!i.anchor))output.push(text(28,model.drawingBottom+71,'UNLOCATED IN THIS VIEW / INFERRED PARTS',10,p.muted,'letter-spacing="1.5"'));
 const footerY=model.height-108;
 output.push(`<path d="M28 ${footerY-20}H1072" stroke="${p.line}" stroke-width=".8"/>`,text(28,footerY,'OBSERVED = visible in a supplied photo  /  INFERRED = model hypothesis',11,p.muted),text(28,footerY+22,interactive?`Screen photo guide ${photoDataUrl?'visible':'hidden'}. Downloads exclude photos unless explicitly selected.`:`Export ${photoDataUrl?'includes your source photo':'excludes photos'}. Shapes are label symbols; object outlines and internals are not reconstructed.`,10,p.muted),text(28,footerY+45,`Model: ${meta.model} via ${meta.provider}`,10,p.muted),text(28,footerY+64,`Request: ${meta.requestId} / ${meta.analyzedAt}`,9,p.muted),'</svg>');
 return output.join('');
}

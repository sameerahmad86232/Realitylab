// Explicitly opt-in: three real inference requests, no automatic retries.
import {readFile,writeFile} from 'node:fs/promises';
import sharp from 'sharp';
import {scanResultSchema} from '../lib/analysis.ts';
if(!process.argv.includes('--live'))throw Error('Pass --live to spend credits on three curated scans.');
const sources=JSON.parse(await readFile('public/demos/sources.json','utf8'));
const manifest=JSON.parse(await readFile('public/demos/manifest.json','utf8')).filter(entry=>!['fan','bicycle','compass'].includes(entry.id));
for(const [id,label,sourceId] of [['fan','The desk fan','fan'],['bicycle','The bicycle','bicycle'],['compass','The compass','clock']]){
 const bytes=await readFile(`public/demos/${id}.jpg`),{width,height}=await sharp(bytes).metadata();
 const form=new FormData();form.set('consent','true');form.set('context','Explain the main foreground object. Distinguish visible evidence from inferred hidden mechanisms. Do not assume specifications.');form.append('images',new Blob([bytes],{type:'image/jpeg'}),`${id}.jpg`);
 const origin=process.env.VALIDATE_ORIGIN||'https://realitylab.onrender.com';
 const response=await fetch(`${origin}/api/scan`,{method:'POST',headers:{Origin:origin},body:form,signal:AbortSignal.timeout(95000)});const body=await response.json();
 if(!response.ok||!scanResultSchema.safeParse(body).success)throw Error(`${id}: HTTP ${response.status}; response did not pass frontend schema. No example substituted.`);
 await writeFile(`public/demos/${id}.json`,JSON.stringify(body,null,2));
 const source=sources.find(s=>s.id===sourceId);manifest.push({id,label,width,height,source:{page:source.page,author:source.author,license:source.license,licenseUrl:source.licenseUrl},analyzedAt:body.meta.analyzedAt});
 await writeFile('public/demos/manifest.json',JSON.stringify(manifest,null,2));
 console.log(JSON.stringify({id,object:body.analysis.object_name,components:body.analysis.components.length,durationMs:body.meta.durationMs,tokens:body.meta.usage.totalTokens}));
}

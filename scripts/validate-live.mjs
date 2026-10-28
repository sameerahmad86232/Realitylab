// Opt-in: one real inference request; consumes Baseten credits. No automatic retry.
import {mkdir,writeFile} from 'node:fs/promises';
import {scanResultSchema} from '../lib/analysis.ts';
if(!process.argv.includes('--live')){console.log('Use --live to make one real Meta inference call through Baseten.');process.exit(0)}
const origin=process.env.VALIDATE_ORIGIN||'http://localhost:3000';
const source={url:'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/ComputerMouseCloseup.jpg/960px-ComputerMouseCloseup.jpg',page:'https://commons.wikimedia.org/wiki/File:ComputerMouseCloseup.jpg',author:'Raysonho @ Open Grid Scheduler / Grid Engine',license:'CC0'};
const photo=await fetch(source.url,{signal:AbortSignal.timeout(30000)});if(!photo.ok)throw Error(`Photo fetch failed: ${photo.status}`);const image=await photo.arrayBuffer();if(image.byteLength>5*1024*1024)throw Error('Photo too large');
const form=new FormData();form.set('consent','true');form.set('context','Explore this computer mouse. Distinguish photographed details from typical hidden components.');form.append('images',new Blob([image],{type:'image/jpeg'}),'mouse.jpg');
const start=Date.now();const response=await fetch(`${origin}/api/scan`,{method:'POST',headers:{Origin:origin},body:form,signal:AbortSignal.timeout(95000)});const body=await response.json();const frontendAccepted=response.ok&&scanResultSchema.safeParse(body).success;
await mkdir('/tmp/artifacts/phase-3',{recursive:true});await writeFile('/tmp/artifacts/phase-3/live-result.json',JSON.stringify({source,status:response.status,frontendAccepted,elapsedMs:Date.now()-start,...body},null,2));await writeFile('/tmp/artifacts/phase-3/mouse.jpg',new Uint8Array(image));
console.log(JSON.stringify({status:response.status,frontendAccepted,object:body.analysis?.object_name,components:body.analysis?.components?.length,elapsedMs:Date.now()-start,error:body.error?.message}));if(!frontendAccepted)process.exitCode=1;

import {scanResultSchema,type ScanView} from './analysis';
type Entry={id:string;width:number;height:number;source:{page:string;author:string;license:string}};
export async function loadRecordedExample(id:string,signal:AbortSignal):Promise<ScanView>{
 if(!['fan','bicycle','compass','furniture','electronics'].includes(id))throw Error('Example unavailable.');
 const responses=await Promise.all([fetch('/demos/manifest.json',{signal}),fetch(`/demos/${id}.json`,{signal})]);if(responses.some(r=>!r.ok))throw Error('Example unavailable. Please retry or scan your own object.');
 const [manifest,body]=await Promise.all(responses.map(r=>r.json()));const entry=Array.isArray(manifest)?(manifest as Entry[]).find(e=>e.id===id):undefined;if(!entry||!Number.isFinite(entry.width)||!Number.isFinite(entry.height))throw Error('Example metadata unavailable.');
 const result=scanResultSchema.parse(body);signal.throwIfAborted();return {result,photos:[{id:`demo-${id}`,url:`/demos/${id}.jpg`,width:entry.width,height:entry.height}],recorded:{sourceUrl:entry.source.page,author:entry.source.author,license:entry.source.license}};
}

'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {scanResultSchema,type ScanView} from '../lib/analysis';
const examples=[['fan','01 / AIR & MOTION','The desk fan'],['bicycle','02 / MOTION & TRANSMISSION','The bicycle'],['compass','03 / DIRECTION & MAGNETISM','The compass']];
type Entry={id:string;width:number;height:number;source:{page:string;author:string;license:string}};
export default function DemoGallery({onResult}:{onResult:(scan:ScanView)=>void}){
 const [loading,setLoading]=useState(''),[error,setError]=useState('');const pending=useRef<AbortController|null>(null);
 useEffect(()=>()=>pending.current?.abort(),[]);
 async function open(id:string){pending.current?.abort();const controller=new AbortController();pending.current=controller;setLoading(id);setError('');const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(15000)]);
  try{const responses=await Promise.all([fetch('/demos/manifest.json',{signal}),fetch(`/demos/${id}.json`,{signal})]);if(responses.some(r=>!r.ok))throw Error('Example unavailable. Please retry or scan your own object.');
   const [manifest,body]=await Promise.all(responses.map(r=>r.json()));const entry=(manifest as Entry[]).find(e=>e.id===id);if(!entry||!Number.isFinite(entry.width)||!Number.isFinite(entry.height))throw Error('Example metadata unavailable.');const result=scanResultSchema.parse(body);if(controller.signal.aborted)return;
   onResult({result,photos:[{id:`demo-${id}`,url:`/demos/${id}.jpg`,width:entry.width,height:entry.height}],recorded:{sourceUrl:entry.source.page,author:entry.source.author,license:entry.source.license}});
  }catch(e){if(!controller.signal.aborted){setError(e instanceof Error&&e.message.startsWith('Example')?e.message:'This recorded example could not be loaded. Please retry.');setLoading('')}}
 }
 return <><div className="collection">{examples.map(([id,kicker,label])=><button key={id} className="sample-card available recorded-card" onClick={()=>open(id)} aria-busy={loading===id}><img src={`/demos/${id}.jpg`} alt="" loading="lazy"/><div className="card-caption"><span><small>{kicker}</small><strong>{label}</strong></span><span className="round-arrow"><ArrowUpRight/></span></div><span className="card-badge">{loading===id?'Opening…':'Recorded Meta scan'}</span></button>)}</div><p className="demo-notice">Real model responses, recorded in advance. Opening an example makes no new AI call. Photos: CC0; attribution inside each result.</p>{error&&<p role="alert">{error}</p>}</>;
}

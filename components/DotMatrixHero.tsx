"use client";

import { useEffect, useRef } from "react";

const SOURCE="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261030_025250_100df7b8-31fd-4614-aa4a-c1b7d5b6b273.png&w=1600&q=85";
const crops=[[0,.06,.47,.40],[.53,.06,.47,.40],[0,.55,.47,.40],[.53,.55,.47,.40]] as const;
const partners=[["FixCore","M10 1l8 4.5v9L10 19l-8-4.5v-9zM10 6l-4 2.3v4.4L10 15l4-2.3V8.3z"],["FixVision","M3 15c0-7 5-12 14-12-1 9-6 14-13 13l-1 2-2-1z"],["FixSafety","M10 1a9 9 0 110 18 9 9 0 010-18zm0 3a6 6 0 100 12 6 6 0 000-12zm0 3a3 3 0 110 6 3 3 0 010-6z"],["FixRepair","M1 17L7 6l3 5 3-7 6 13z"],["FixVisual","M10 1l9 4-9 4-9-4zm-9 8l9 4 9-4v3l-9 4-9-4zm0 5l9 4 9-4v2l-9 4-9-4z"]] as const;

export default function DotMatrixHero({onStart,onDemo}:{onStart:()=>void;onDemo:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const el=canvas.current!;
  const ctx=el.getContext("2d")!;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W=0,H=0,step=7,rowStep=14,cols=1,rows=1,raf=0,running=true,loaded=false,start=performance.now();
  let tiles:HTMLCanvasElement[]=[];
  const fA=document.createElement("canvas"),fB=document.createElement("canvas");
  const aCtx=fA.getContext("2d",{willReadFrequently:true})!,bCtx=fB.getContext("2d",{willReadFrequently:true})!;
  const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=(a:number,b:number,x:number)=>{const v=clamp((x-a)/(b-a));return v*v*(3-2*v)};
  const hash=(a:number,b:number)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v)};
  const mixAt=(t:number,on:number,off:number,dur:number)=>smooth(on,on+dur,t)*(1-smooth(off,off+dur,t));
  function resize(){
   const box=el.getBoundingClientRect();W=Math.max(1,box.width);H=Math.max(1,box.height);const dpr=Math.min(2,devicePixelRatio||1);
   el.width=Math.round(W*dpr);el.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
   step=Math.max(5,W/205);rowStep=step*2.05;cols=Math.ceil(W/step);rows=Math.ceil(H/rowStep);fA.width=fB.width=cols;fA.height=fB.height=rows;
  }
  function drawHand(field:CanvasRenderingContext2D,tile:HTMLCanvasElement,left:boolean,t:number){
   const portrait=H>W,loop=20,a=Math.PI*2*t/loop,ph=left?0:Math.PI;
   const hw=W*(portrait ? .66 : .53),hh=hw*((.40*1520)/(.47*2688)),cy=H*(portrait ? .66 : .54);
   const reach=(.035*Math.sin(a+ph)+.012*Math.sin(2*a+1.3+ph))*W;
   const x=left?reach-W*.045:W-hw+W*.045-reach,scale=1+.07*Math.sin(a+.9+ph),rot=(left?1:-1)*.045*Math.sin(a+2.1+ph),pivot=left?0:W;
   field.save();field.scale(cols/W,rows/H);field.translate(pivot,cy);field.rotate(rot);field.scale(scale,scale);field.translate(-pivot,-cy);field.drawImage(tile,x,cy-hh/2,hw,hh);field.restore();
  }
  function render(seconds:number){
   if(!running)return;const t=(reduced?0:seconds)%20,tick=Math.floor(t*7),R=step*.46;
   ctx.clearRect(0,0,W,H);
   if(!loaded){ctx.fillStyle="#0d0d0d";ctx.globalAlpha=.08;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)if(hash(i,j)>.68)ctx.beginPath(),ctx.arc((i+.5)*step,(j+.5)*rowStep,R*.3,0,Math.PI*2),ctx.fill();ctx.globalAlpha=1;return}
   aCtx.fillStyle=bCtx.fillStyle="#fff";aCtx.fillRect(0,0,cols,rows);bCtx.fillRect(0,0,cols,rows);
   drawHand(aCtx,tiles[0],true,t);drawHand(aCtx,tiles[1],false,t);drawHand(bCtx,tiles[2],true,t);drawHand(bCtx,tiles[3],false,t);
   const A=aCtx.getImageData(0,0,cols,rows).data,B=bCtx.getImageData(0,0,cols,rows).data,mL=mixAt(t,6.2,14.6,1.6),mR=mixAt(t,2.4,10.4,1.6),levels=[0,.26,.52,.78,1];
   ctx.fillStyle="#0d0d0d";
   for(let j=0;j<rows;j++){const shift=hash(j,tick)>.965?Math.round((hash(tick,j)-.5)*8):0;for(let i=0;i<cols;i++){
    const sample=Math.max(0,Math.min(cols-1,i-shift)),idx=(j*cols+sample)*4,seed=.55*hash(i,j)+.45*hash(j*3.1,7.7),m=i<cols/2?mL:mR,useB=seed<m;
    let v=clamp((1-(useB?B[idx]:A[idx])/255-.16)/.42);v*=.86+.14*Math.sin(t*3.2+seed*40);
    const cx=Math.abs((i+.5)/cols-.5),portrait=H>W;v*=smooth(.035,.11,cx);const ex=cx/(portrait ? .44 : .2),ey=((j+.5)*rowStep/H-(portrait ? .33 : .385))/.085;v*=smooth(.85,1.25,Math.hypot(ex,ey));
    if(m>.001&&m<.999&&Math.abs(seed-m)<.12){v*=Math.abs(seed-m)/.12;if(hash(i+tick,j)<=.4)v*=.3}
    let level=0;for(const q of levels)if(v>=q-.13)level=q;if(!level)continue;const radius=R*(level===.26?.38:level);ctx.beginPath();ctx.arc((i+.5)*step,(j+.5)*rowStep,radius,0,Math.PI*2);ctx.fill();
   }}
  }
  function frame(now:number){render((now-start)/1000);if(running&&!reduced)raf=requestAnimationFrame(frame)}
  const img=new Image();img.crossOrigin="anonymous";img.onload=()=>{tiles=crops.map(([x,y,w,h])=>{const tile=document.createElement("canvas"),tw=420,th=Math.round(tw*(h*img.height)/(w*img.width));tile.width=tw;tile.height=th;const c=tile.getContext("2d")!;c.imageSmoothingEnabled=true;c.imageSmoothingQuality="high";c.drawImage(img,x*img.width,y*img.height,w*img.width,h*img.height,0,0,tw,th);return tile});loaded=true;render(0)};img.src=SOURCE;
  const observer=new IntersectionObserver(([entry])=>{running=entry.isIntersecting;if(running){start=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame)}else cancelAnimationFrame(raf)},{threshold:.02});observer.observe(el);
  const ro=new ResizeObserver(()=>{resize();render(0)});ro.observe(el);resize();raf=requestAnimationFrame(frame);
  return()=>{running=false;cancelAnimationFrame(raf);observer.disconnect();ro.disconnect()};
 },[]);
 return <section className="matrix-hero" aria-labelledby="matrix-title">
  <canvas ref={canvas} className="matrix-canvas" aria-hidden="true"/>
  <nav className="matrix-nav" aria-label="Landing navigation"><button className="matrix-brand" onClick={()=>scrollTo({top:0,behavior:"smooth"})} aria-label="RealityLab home"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4.2a4.8 4.8 0 1 1 0 9.6 4.8 4.8 0 0 1 0-9.6Zm0 2.4a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8Z"/></svg>RealityLab</button><div className="matrix-links"><a href="#how-it-works">How it works</a><a href="#collection">Examples</a><button onClick={onDemo}>Interactive demo</button></div><button className="matrix-signin" onClick={onStart}>Start diagnosis</button></nav>
  <div className="matrix-copy"><p>AI FOR THE PHYSICAL WORLD</p><h1 id="matrix-title"><span>See the problem.</span>Understand the fault.<br/><em>Fix it.</em></h1><div className="matrix-sub">Upload a photo, explore the components, and follow a safer path toward repair.</div><div className="matrix-cta"><button onClick={onStart}>Start diagnosing</button></div><button className="matrix-demo" onClick={onDemo}>Explore interactive demo →</button></div>
  <div className="matrix-partners" aria-label="RealityLab orchestration teams">{partners.map(([name,path])=><span key={name}><svg viewBox="0 0 20 20" aria-hidden="true"><path d={path}/></svg>{name}</span>)}</div>
 </section>
}

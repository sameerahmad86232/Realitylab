'use client';
import { useEffect, useRef, useState } from 'react';
import type { BufferGeometry, Group, Material } from 'three';
import { Expand, Layers3, Rotate3D, Pause, Play } from 'lucide-react';
export default function FanStage() {
 const host = useRef<HTMLDivElement>(null);
 const [explode,setExplode] = useState(false), [motion,setMotion] = useState(true), [error,setError]=useState(false);
 const state = useRef({explode:false,motion:true});
 useEffect(()=>{state.current={explode,motion}},[explode,motion]);
 useEffect(()=>{
  let cleanup=()=>{}, cancelled=false;
  (async()=>{
   const T=await import('three'); const {OrbitControls}=await import('three/addons/controls/OrbitControls.js');
   if(cancelled||!host.current)return;
   try{
    const el=host.current, scene=new T.Scene();
    const renderer=new T.WebGLRenderer({antialias:true,alpha:true}); renderer.setPixelRatio(Math.min(devicePixelRatio,1.75)); renderer.setClearColor(0xffffff,0); renderer.outputColorSpace=T.SRGBColorSpace; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.35; el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label','Prepared 3D desk fan: drag to rotate and scroll to zoom'); renderer.domElement.setAttribute('role','img');
    const camera=new T.PerspectiveCamera(34,1,.1,100); camera.position.set(5.3,2.4,7.6);
    const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.05,0);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=5;controls.maxDistance=13;controls.maxPolarAngle=Math.PI*.75;
    scene.add(new T.HemisphereLight(0xe3edff,0x797e90,3));
    [[4,6,5,9],[-5,3,-3,7],[0,-2,5,3]].forEach(([x,y,z,i])=>{const l=new T.DirectionalLight(0xffffff,i);l.position.set(x,y,z);scene.add(l)});
    // Procedural studio environment: no external assets or network dependencies.
    const studio=new T.Scene();studio.background=new T.Color('#c9ced8');
    [[0,5,0,0],[0,-5,0,0],[5,0,0,Math.PI/2],[-5,0,0,Math.PI/2],[0,0,-5,0]].forEach(([x,y,z,r],i)=>{const p=new T.Mesh(new T.PlaneGeometry(7,9),new T.MeshBasicMaterial({color:i%2?'#596478':'#ffffff',side:T.DoubleSide}));p.position.set(x,y,z);p.rotation.y=r;if(y)p.rotation.x=Math.PI/2;studio.add(p)});
    const pmrem=new T.PMREMGenerator(renderer),env=pmrem.fromScene(studio,.1);scene.environment=env.texture;
    const chrome=new T.MeshStandardMaterial({color:0xcdd1d8,metalness:1,roughness:.22});const dark=new T.MeshStandardMaterial({color:0x313b4c,metalness:.8,roughness:.3});const bladeMat=new T.MeshStandardMaterial({color:0xbfc9d9,metalness:.95,roughness:.2,side:T.DoubleSide});
    const fan=new T.Group();scene.add(fan);fan.rotation.y=-.22;
    function mesh(g:BufferGeometry,m=chrome,parent=fan){const n=new T.Mesh(g,m);parent.add(n);return n}
    const base=mesh(new T.CylinderGeometry(.86,1,.15,80));base.position.y=-1.9;
    const foot=mesh(new T.CylinderGeometry(.48,.65,.1,64));foot.position.y=-1.78;
    const stem=mesh(new T.CylinderGeometry(.10,.15,1.75,32));stem.position.y=-.9;
    const back=new T.Group(), front=new T.Group(), rotor=new T.Group();fan.add(back,front,rotor);back.position.y=front.position.y=rotor.position.y=.65;
    function ring(radius:number,z:number,parent:Group,thickness=.016){const n=mesh(new T.TorusGeometry(radius,thickness,6,100),chrome,parent);n.position.z=z;return n}
    [back,front].forEach((g,i)=>{
     const z=i?.38:-.22;
     for(let r=.26;r<=1.37;r+=.13)ring(r,z,g,.009);
     ring(1.4,z,g,.035);
     for(let k=0;k<36;k++){const a=k/36*Math.PI*2;const curve=new T.CatmullRomCurve3([new T.Vector3(.18*Math.cos(a),.18*Math.sin(a),z+.12),new T.Vector3(.85*Math.cos(a),.85*Math.sin(a),z+.09),new T.Vector3(1.4*Math.cos(a),1.4*Math.sin(a),z)]);mesh(new T.TubeGeometry(curve,12,.009,4,false),chrome,g)}
    });
    for(let i=0;i<3;i++){const shape=new T.Shape();shape.moveTo(.13,0);shape.bezierCurveTo(.4,-.18,1.35,-.23,1.25,.43);shape.bezierCurveTo(1.1,.8,.5,.65,.13,.18);shape.closePath();const blade=mesh(new T.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:true,bevelThickness:.018,bevelSize:.025,bevelSegments:2,steps:1}),bladeMat,rotor);blade.rotation.z=i*Math.PI*2/3;}
    const hub=mesh(new T.SphereGeometry(.22,32,24),chrome,front);hub.scale.z=.5;hub.position.z=.55;
    const motor=mesh(new T.CylinderGeometry(.37,.37,.55,48),dark,back);motor.rotation.x=Math.PI/2;motor.position.z=-.48;
    let frame=0,phase=0,last=0;const reduced=matchMedia('(prefers-reduced-motion: reduce)');if(reduced.matches)setMotion(false);
    const resize=()=>{const {width,height}=el.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix()};const observer=new ResizeObserver(resize);observer.observe(el);resize();
    const render=(now:number)=>{frame=requestAnimationFrame(render);if(now-last<32)return;const dt=Math.min((now-last)/1000,.05);last=now;const target=state.current.explode?1:0;phase+=(target-phase)*.09;front.position.z=phase*.95;back.position.z=-phase*.65;rotor.position.z=phase*.15;if(state.current.motion&&!reduced.matches&&document.visibilityState==='visible')rotor.rotation.z+=dt*.5;controls.update();renderer.render(scene,camera)};frame=requestAnimationFrame(render);
    cleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose()}});[chrome,dark,bladeMat].forEach(m=>m.dispose());studio.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();(o.material as Material).dispose()}});env.dispose();pmrem.dispose();renderer.dispose();renderer.domElement.remove()};
   }catch{setError(true)}
  })();return()=>{cancelled=true;cleanup()}
 },[]);
 return <div className="fan-stage"><div className="stage-canvas" ref={host}/>{error&&<div className="stage-fallback"><span>◎</span><p>Interactive 3D isn’t available in this browser.<br/>Explore the component guide below.</p></div>}<div className="object-note"><span className="dot"/> DESK FAN <span className="note-sub">/ Prepared concept model</span></div><div className="fan-callout"><span className="callout-point"/><strong>Small parts.<br/>A bigger picture.</strong><span>Explore what makes it work.</span></div><div className="stage-controls"><button aria-pressed={!explode} onClick={()=>setExplode(false)}><Rotate3D size={17}/>Orbit</button><button aria-pressed={explode} onClick={()=>setExplode(v=>!v)}><Layers3 size={17}/>Explode</button><button aria-label={motion?'Pause model animation':'Play model animation'} onClick={()=>setMotion(v=>!v)}>{motion?<Pause size={16}/>:<Play size={16}/>}</button></div><span className="drag-hint"><Expand size={12}/> Drag to rotate · Scroll to zoom</span></div>
}

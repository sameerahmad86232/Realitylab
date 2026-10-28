'use client';
import { useEffect,useRef } from 'react';
export default function Shader({paused}:{paused:boolean}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const c=ref.current;if(!c)return;const gl=c.getContext('webgl',{alpha:true,antialias:false});if(!gl)return;
  const shaders:WebGLShader[]=[];let program:WebGLProgram|null=null,buffer:WebGLBuffer|null=null,frame=0,observer:ResizeObserver|null=null,intersection:IntersectionObserver|null=null,inView=true;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const dispose=()=>{cancelAnimationFrame(frame);observer?.disconnect();intersection?.disconnect();if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);shaders.forEach(s=>gl.deleteShader(s))};
  try{
   const shader=(type:number,source:string)=>{const s=gl.createShader(type);if(!s)throw Error('Shader unavailable');shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader compilation unavailable');return s};
   const vs=shader(gl.VERTEX_SHADER,'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}');
   const fs=shader(gl.FRAGMENT_SHADER,`precision mediump float;uniform vec2 r;uniform float t;void main(){vec2 uv=gl_FragCoord.xy/r;float y=uv.y+.06*sin(uv.x*7.+t*.2);float ribbon=sin((y+sin(uv.x*3.+t*.13)*.20)*22.);float spec=pow(abs(ribbon),18.);float edge=smoothstep(.44,.98,abs(uv.x-.5)*2.);float fade=(1.-smoothstep(.08,.48,uv.y))* .8+smoothstep(.76,1.,uv.y)*.5;vec3 color=mix(vec3(.58,.65,.76),vec3(.98,.99,1.),spec);color=mix(color,vec3(.91,.95,1.),.3);float a=edge*fade*.45;gl_FragColor=vec4(color*a,a);}`);
   program=gl.createProgram();if(!program)throw Error('Shader program unavailable');gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader linking unavailable');gl.useProgram(program);
   buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const attribute=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(attribute);gl.vertexAttribPointer(attribute,2,gl.FLOAT,false,0,0);
   const sizeUniform=gl.getUniformLocation(program,'r'),timeUniform=gl.getUniformLocation(program,'t');let last=0;
   const draw=(time:number)=>{if(!inView||document.hidden||gl.isContextLost()||!c.width||!c.height)return;gl.uniform1f(timeUniform,paused||reduced.matches?0:time*.001);gl.drawArrays(gl.TRIANGLES,0,6)};
   const tick=(time:number)=>{if(time-last>=32){last=time;draw(time)}if(!paused&&!reduced.matches&&!document.hidden&&inView)frame=requestAnimationFrame(tick)};
   const start=()=>{cancelAnimationFrame(frame);draw(performance.now());if(!paused&&!reduced.matches&&!document.hidden&&inView)frame=requestAnimationFrame(tick)};
   const resize=()=>{const width=Math.max(1,Math.min(c.clientWidth,1200)),height=Math.max(1,Math.min(c.clientHeight,900));if(c.width!==width)c.width=width;if(c.height!==height)c.height=height;gl.viewport(0,0,width,height);gl.uniform2f(sizeUniform,width,height);draw(performance.now())};
   observer=new ResizeObserver(resize);observer.observe(c);intersection=new IntersectionObserver(entries=>{inView=entries.some(e=>e.isIntersecting);start()});intersection.observe(c);resize();document.addEventListener('visibilitychange',start);reduced.addEventListener('change',start);start();
   return()=>{document.removeEventListener('visibilitychange',start);reduced.removeEventListener('change',start);dispose()};
  }catch{dispose();return}
 },[paused]);return <><svg className="silver-ribbon" viewBox="0 0 1400 740" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f5f8fd"/><stop offset=".22" stopColor="#a0afc2"/><stop offset=".32" stopColor="#fff"/><stop offset=".43" stopColor="#708298"/><stop offset=".49" stopColor="#edf4ff"/><stop offset=".55" stopColor="#fff"/><stop offset=".67" stopColor="#adbed4"/><stop offset=".8" stopColor="#f5f8fc"/><stop offset="1" stopColor="#d3deec"/></linearGradient></defs><path d="M-170 360C-80 500 -60 590 40 620S180 610 255 760" fill="none" stroke="url(#chrome)" strokeWidth="75"/><path d="M1450 -100C1290 40 1510 185 1420 325S1210 520 1440 620" fill="none" stroke="url(#chrome)" strokeWidth="100"/><path d="M-170 355C-80 495 -60 585 40 615S180 605 255 755M1455 -100C1295 40 1515 185 1425 325S1215 520 1445 620" fill="none" stroke="#ffffffaa" strokeWidth="3"/></svg><canvas ref={ref} className="shader" aria-hidden="true"/></>;
}

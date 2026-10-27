// Original illustrative geometry and browser renderer; no Loböle app source is used.
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';

function gearGeometry(teeth,radius){
  const shape=new THREE.Shape();
  for(let i=0;i<teeth*4;i++){
    const angle=i/(teeth*4)*Math.PI*2;
    const r=radius+((i%4===1||i%4===2) ? .12 : -.12);
    const x=Math.cos(angle)*r,y=Math.sin(angle)*r;
    if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);
  }
  shape.closePath();const hole=new THREE.Path();hole.absarc(0,0,.24,0,Math.PI*2,true);shape.holes.push(hole);
  return new THREE.ExtrudeGeometry(shape,{depth:.3,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:32});
}
export function createStudioScene(host,{onLighting,onFailure}){
  let disposed=false,lost=false,playing=false,visible=true,frame=0,last=0,angle=0;
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-label','Interactive illustrative gear assembly. Drag to orbit. Use the camera buttons for keyboard-accessible views.');canvas.setAttribute('role','img');canvas.dataset.engine='initializing';
  let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});}catch{canvas.dataset.engine='fallback';onFailure();return {dispose(){}};}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.setClearColor('#151d12');host.appendChild(canvas);
  const scene=new THREE.Scene();scene.up.set(0,0,1);
  const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.up.set(0,0,1);camera.position.set(5,-7,8);
  const controls=new OrbitControls(camera,canvas);controls.target.set(0,0,.05);controls.enableDamping=false;controls.enablePan=false;controls.enableZoom=false;controls.minDistance=5;controls.maxDistance=20;controls.maxPolarAngle=Math.PI*.48;
  const ambient=new THREE.HemisphereLight('#dfeccc','#26331d',2.2);ambient.position.set(0,0,9);scene.add(ambient);
  const key=new THREE.DirectionalLight('#fff5dd',4);key.position.set(-3,-4,8);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=5;key.shadow.camera.bottom=-5;key.shadow.camera.near=.5;key.shadow.camera.far=20;key.shadow.bias=-.0005;scene.add(key);
  const rim=new THREE.DirectionalLight('#c1e993',2);rim.position.set(5,4,6);scene.add(rim);
  const bodyA=new THREE.MeshStandardMaterial({color:'#a9c58c',metalness:.78,roughness:.32});
  const bodyB=new THREE.MeshStandardMaterial({color:'#b6bfa9',metalness:.88,roughness:.28});
  const mountMat=new THREE.MeshStandardMaterial({color:'#283321',metalness:.35,roughness:.56});
  const shaftMat=new THREE.MeshStandardMaterial({color:'#aeb5a3',metalness:.93,roughness:.2});
  const floorMat=new THREE.MeshStandardMaterial({color:'#1a2514',metalness:.15,roughness:.83});
  const edgeMaterial=new THREE.LineBasicMaterial({color:'#d7e7b7',transparent:true,opacity:.42});
  const base=new THREE.Mesh(new THREE.BoxGeometry(7,4.7,.16),mountMat);base.position.set(-.1,0,-.34);base.receiveShadow=true;scene.add(base);
  const platformEdge=new THREE.LineSegments(new THREE.EdgesGeometry(base.geometry),new THREE.LineBasicMaterial({color:'#71865a',transparent:true,opacity:.4}));platformEdge.position.copy(base.position);scene.add(platformEdge);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(40,40),floorMat);floor.position.z=-.45;floor.receiveShadow=true;scene.add(floor);
  const grid=new THREE.GridHelper(24,48,'#62794a','#394b2a');grid.rotation.x=Math.PI/2;grid.position.z=-.444;grid.material.transparent=true;grid.material.opacity=.22;scene.add(grid);
  const edgeLines=[];
  function addGear(teeth,radius,x,material){
    const group=new THREE.Group();group.position.set(x,0,0);
    const mesh=new THREE.Mesh(gearGeometry(teeth,radius),material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    const edge=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,28),edgeMaterial);edge.visible=false;group.add(edge);edgeLines.push(edge);
    const hub=new THREE.Mesh(new THREE.RingGeometry(.27,.37,48),shaftMat);hub.position.z=.335;group.add(hub);
    for(let i=0;i<6;i++){const a=i*Math.PI/3,bolt=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.04,6),shaftMat);bolt.rotation.x=Math.PI/2;bolt.position.set(Math.cos(a)*radius*.56,Math.sin(a)*radius*.56,.335);bolt.castShadow=true;group.add(bolt);}
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.76,24),shaftMat);shaft.rotation.x=Math.PI/2;shaft.position.set(x,0,.015);shaft.castShadow=true;scene.add(shaft);
    scene.add(group);return group;
  }
  const driver=addGear(12,1,-1.8,bodyA),follower=addGear(24,2,1.2,bodyB);const phase=Math.PI/24;follower.rotation.z=phase;
  let environmentTarget=null;const pmrem=new THREE.PMREMGenerator(renderer);pmrem.compileEquirectangularShader();
  function render(){if(!disposed&&!lost){renderer.render(scene,camera);canvas.dataset.engine='webgl';}}
  function tick(now){frame=0;if(disposed||lost||!playing||!visible||document.hidden)return;const delta=last?Math.min((now-last)/1000,.05):0;last=now;angle+=delta*.45;driver.rotation.z=angle;follower.rotation.z=phase-angle*.5;render();frame=requestAnimationFrame(tick);}
  function resume(){if(playing&&visible&&!document.hidden&&!frame&&!disposed&&!lost){last=0;frame=requestAnimationFrame(tick);}}
  function pauseFrames(){cancelAnimationFrame(frame);frame=0;last=0;}
  controls.addEventListener('change',render);
  function resize(){if(disposed||lost)return;const r=host.getBoundingClientRect();if(r.width<1||r.height<1)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();render();}
  const observer=new ResizeObserver(resize);observer.observe(host);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){render();resume();}else pauseFrames();});intersection.observe(host);
  function visibility(){if(document.hidden)pauseFrames();else resume();}document.addEventListener('visibilitychange',visibility);
  function contextLost(event){event.preventDefault();lost=true;pauseFrames();canvas.dataset.engine='fallback';onFailure();}canvas.addEventListener('webglcontextlost',contextLost);
  onLighting('loading');
  new HDRLoader().load(`${import.meta.env.BASE_URL}environments/brown_photostudio_02_2k.hdr`,texture=>{
    if(disposed||lost){texture.dispose();return;}
    environmentTarget=pmrem.fromEquirectangular(texture);scene.environment=environmentTarget.texture;scene.environmentIntensity=.85;texture.dispose();onLighting('hdri');canvas.dataset.lighting='hdri';render();
  },undefined,()=>{if(!disposed){onLighting('direct');canvas.dataset.lighting='direct';render();}});
  resize();controls.update();render();
  return {
    setView(view){camera.up.set(0,0,1);if(view==='top'){camera.position.set(0,0,12);camera.up.set(0,1,0);}else if(view==='front')camera.position.set(0,-11,3.2);else camera.position.set(5,-7,8);controls.target.set(0,0,.05);camera.lookAt(controls.target);controls.update();render();},
    setFinish(finish){const clay=finish==='clay';bodyA.color.set(clay?'#e0dfce':'#a9c58c');bodyB.color.set(clay?'#c3c6b4':'#b6bfa9');for(const mat of [bodyA,bodyB]){mat.metalness=clay?0:.85;mat.roughness=clay?.82:.3;mat.wireframe=finish==='technical';mat.needsUpdate=true;}render();},
    setEdges(show){edgeLines.forEach(e=>{e.visible=show;});render();},
    setGrid(show){grid.visible=show;render();},
    setPlaying(value){playing=value;if(playing)resume();else pauseFrames();},
    select(part){bodyA.emissive.set(part==='driver'?'#49602b':'#000000');bodyB.emissive.set(part==='follower'?'#49602b':'#000000');mountMat.emissive.set(part==='base'?'#263919':'#000000');for(const m of [bodyA,bodyB,mountMat])m.emissiveIntensity=.3;render();},
    zoom(direction){camera.position.sub(controls.target).multiplyScalar(direction==='in'?.85:1.15).clampLength(5,20).add(controls.target);camera.updateProjectionMatrix();controls.update();render();},
    still(){render();canvas.toBlob(blob=>{if(!blob||disposed)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='realitylab-3d-study.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);},'image/png');},
    dispose(){disposed=true;pauseFrames();observer.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('webglcontextlost',contextLost);controls.removeEventListener('change',render);controls.dispose();environmentTarget?.dispose();pmrem.dispose();const geometries=new Set(),materials=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material){for(const m of Array.isArray(object.material)?object.material:[object.material])materials.add(m);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());renderer.dispose();canvas.remove();}
  };
}

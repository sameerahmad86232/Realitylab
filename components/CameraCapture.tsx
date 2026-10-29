'use client';
import {useEffect,useRef,useState} from 'react';
import {Camera,RefreshCw,X,Check,RotateCcw,Upload} from 'lucide-react';
export default function CameraCapture({onClose,onUse,onChoose}:{onClose:()=>void;onUse:(file:File)=>Promise<void>;onChoose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null),video=useRef<HTMLVideoElement>(null),stream=useRef<MediaStream|null>(null);
 const [devices,setDevices]=useState<MediaDeviceInfo[]>([]),[device,setDevice]=useState(''),[ready,setReady]=useState(false),[error,setError]=useState(''),[retry,setRetry]=useState(0),[shot,setShot]=useState<{file:File;url:string}|null>(null),[saving,setSaving]=useState(false);
 const shotRef=useRef<string|null>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.showModal();const hide=()=>{if(document.visibilityState==='hidden')onClose()};document.addEventListener('visibilitychange',hide);return()=>{document.body.style.overflow=overflow;document.removeEventListener('visibilitychange',hide);if(shotRef.current)URL.revokeObjectURL(shotRef.current);previous?.focus()}},[onClose]);
 useEffect(()=>{
  if(shot)return;
  let cancelled=false,timeout:ReturnType<typeof setTimeout>;
  setReady(false);setError('');
  const stop=()=>{stream.current?.getTracks().forEach(t=>t.stop());stream.current=null};
  timeout=setTimeout(()=>{cancelled=true;stop();setError('Camera startup timed out. Retry or choose a photo instead.');setReady(false)},15000);
  (async()=>{try{
   if(!navigator.mediaDevices?.getUserMedia)throw new DOMException('Camera unavailable','NotSupportedError');
   const media=await navigator.mediaDevices.getUserMedia({video:device?{deviceId:{exact:device}}:{facingMode:{ideal:'environment'},width:{ideal:1600}},audio:false});
   if(cancelled){media.getTracks().forEach(t=>t.stop());return}
   stream.current=media;
   if(video.current){video.current.srcObject=media;await video.current.play()}
   if(cancelled)return;
   clearTimeout(timeout);setReady(true);
   try{const list=await navigator.mediaDevices.enumerateDevices();if(!cancelled)setDevices(list.filter(d=>d.kind==='videoinput'))}catch{/* Capture still works if device enumeration is unavailable. */}
   media.getVideoTracks()[0]?.addEventListener('ended',()=>{if(!cancelled){setReady(false);setError('The camera disconnected. Retry or choose a photo instead.')}});
  }catch(e){if(cancelled)return;clearTimeout(timeout);stop();const name=e instanceof DOMException?e.name:'';setError(name==='NotAllowedError'?'Camera permission was denied. Allow it in browser settings, then retry, or choose photos instead.':name==='NotFoundError'?'No camera was found. Connect a camera or choose photos instead.':name==='NotReadableError'?'The camera is busy. Close other camera apps and retry, or choose photos instead.':'Camera access is unavailable. Retry or choose photos instead.')}})();
  return()=>{cancelled=true;clearTimeout(timeout);stop()};
 },[device,retry,shot]);
 function retake(){if(shotRef.current)URL.revokeObjectURL(shotRef.current);shotRef.current=null;setShot(null)}
 function capture(){const v=video.current;if(!ready||!v?.videoWidth)return;setReady(false);const c=document.createElement('canvas');const ratio=Math.min(1,1600/Math.max(v.videoWidth,v.videoHeight));c.width=Math.round(v.videoWidth*ratio);c.height=Math.round(v.videoHeight*ratio);const ctx=c.getContext('2d');if(!ctx){setError('Could not capture this photo. Please retry.');setReady(true);return}ctx.drawImage(v,0,0,c.width,c.height);c.toBlob(b=>{if(!dialog.current?.open)return;if(!b){setError('Could not capture this photo. Please retry.');setReady(true);return}const url=URL.createObjectURL(b);shotRef.current=url;setShot({file:new File([b],'camera-photo.jpg',{type:'image/jpeg'}),url})},'image/jpeg',.9)}
 return <dialog ref={dialog} className="camera-modal camera-dialog" aria-labelledby="camera-title" onCancel={e=>{e.preventDefault();if(!saving)onClose()}}><div><div><p className="eyebrow">A NEW PERSPECTIVE</p><h2 id="camera-title">{shot?'How does it look?':'Bring it into focus.'}</h2></div><button className="icon-button" aria-label="Close camera" disabled={saving} onClick={onClose}><X/></button></div>{shot?<img className="camera-review" src={shot.url} alt="Review your captured object photo"/>:<video ref={video} autoPlay playsInline muted aria-label="Live camera preview"/>}<p className="camera-help" role="status">{error|| (shot?'Review your photo before adding it. The camera is now off.':ready?'Keep the whole object in frame, with even lighting.':'Starting camera…')}</p><div className="camera-buttons">{shot?<><button className="secondary" onClick={retake} disabled={saving}><RotateCcw size={16}/>Retake</button><button className="primary" disabled={saving} onClick={async()=>{setSaving(true);try{await onUse(shot.file);onClose()}finally{setSaving(false)}}}><Check size={16}/>{saving?'Preparing…':'Use photo'}</button></>:<>{devices.length>1&&<button className="secondary" disabled={!ready} onClick={()=>{const current=stream.current?.getVideoTracks()[0]?.getSettings().deviceId;const index=devices.findIndex(d=>d.deviceId===current);setDevice(devices[(index+1)%devices.length].deviceId)}}><RefreshCw size={16}/>Switch camera</button>}{error?<button className="secondary" onClick={()=>setRetry(n=>n+1)}><RefreshCw size={16}/>Retry camera</button>:<button className="primary" disabled={!ready} onClick={capture}><Camera size={16}/>Take photo</button>}</>}<button className="text-link" disabled={saving} onClick={()=>{onClose();requestAnimationFrame(onChoose)}}><Upload size={14}/>Choose photos instead</button></div></dialog>
}

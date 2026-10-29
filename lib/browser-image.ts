/** Blob decoding with an HTML image fallback for browsers with incomplete ImageBitmap support. */
export async function decodeBrowserImage(blob:Blob,signal?:AbortSignal){
 signal?.throwIfAborted();
 if(typeof createImageBitmap==='function'){
  try{const source=await createImageBitmap(blob,{imageOrientation:'from-image'});if(signal?.aborted){source.close();signal.throwIfAborted()}return {source,width:source.width,height:source.height,close:()=>source.close()}}catch(error){if(signal?.aborted)throw error}
 }
 const url=URL.createObjectURL(blob),source=new Image();
 const release=()=>{source.src='';URL.revokeObjectURL(url)};
 try{await new Promise<void>((resolve,reject)=>{const cleanup=()=>{source.onload=null;source.onerror=null;signal?.removeEventListener('abort',abort)};const abort=()=>{cleanup();reject(signal?.reason||new DOMException('Cancelled','AbortError'))};source.onload=()=>{cleanup();resolve()};source.onerror=()=>{cleanup();reject(Error('Photo could not be decoded'))};signal?.addEventListener('abort',abort,{once:true});source.src=url});signal?.throwIfAborted();return {source,width:source.naturalWidth,height:source.naturalHeight,close:release}}catch(error){release();throw error}
}

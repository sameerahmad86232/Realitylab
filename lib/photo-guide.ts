import {decodeBrowserImage} from './browser-image';
// Bounded, browser-local edge visualization. This traces image contrast, not parts or hidden geometry.
export async function preparePhotoGuide(url:string,signal:AbortSignal){
 const response=await fetch(url,{signal});if(!response.ok)throw Error('Source image unavailable');
 const blob=await response.blob();signal.throwIfAborted();
 const bitmap=await decodeBrowserImage(blob,signal);
 try{
  const scale=Math.min(1,900/Math.max(bitmap.width,bitmap.height)),width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('Image preview unavailable');
  ctx.drawImage(bitmap.source,0,0,width,height);const photo=canvas.toDataURL('image/jpeg',.84);const input=ctx.getImageData(0,0,width,height),gray=new Float32Array(width*height),output=ctx.createImageData(width,height);
  for(let i=0;i<gray.length;i++)gray[i]=input.data[i*4]*.2126+input.data[i*4+1]*.7152+input.data[i*4+2]*.0722;
  for(let y=1;y<height-1;y++){if(y%64===0){await new Promise(resolve=>setTimeout(resolve,0));signal.throwIfAborted()}for(let x=1;x<width-1;x++){
   const i=y*width+x,gx=-gray[i-width-1]+gray[i-width+1]-2*gray[i-1]+2*gray[i+1]-gray[i+width-1]+gray[i+width+1],gy=-gray[i-width-1]-2*gray[i-width]-gray[i-width+1]+gray[i+width-1]+2*gray[i+width]+gray[i+width+1];
   const alpha=Math.min(220,Math.max(0,(Math.hypot(gx,gy)-42)*1.5));output.data[i*4]=131;output.data[i*4+1]=220;output.data[i*4+2]=255;output.data[i*4+3]=alpha;
  }
  }
  signal.throwIfAborted();ctx.putImageData(output,0,0);return {photo,outline:canvas.toDataURL('image/png')};
 }finally{bitmap.close()}
}

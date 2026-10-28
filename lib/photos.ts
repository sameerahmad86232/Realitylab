export const MAX_PHOTOS = 3;
export const MAX_BYTES = 5 * 1024 * 1024;
export type Photo = { id: string; file: File; url: string; width: number; height: number; originalName: string };

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') return createImageBitmap(file, { imageOrientation: 'from-image' });
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally { URL.revokeObjectURL(url); }
}

/** Validate actual bytes, normalize orientation/size, and drop source metadata. */
export async function preparePhoto(file: File): Promise<Photo> {
  if (file.size > MAX_BYTES) throw Error('Each photo must be at most 5 MB. Choose a smaller photo.');
  if (!file.size) throw Error('This photo is empty. Choose another photo.');
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const png = [137,80,78,71,13,10,26,10].every((n,i)=>header[i] === n);
  if (!jpeg && !png) throw Error('Choose a JPEG or PNG photo. Renaming another file will not convert it.');
  if (file.type && !['image/jpeg', 'image/png'].includes(file.type)) throw Error('Choose a JPEG or PNG photo.');
  if (png) {
    const bytes = new DataView(await file.arrayBuffer());
    if (bytes.byteLength >= 24 && bytes.getUint32(16) * bytes.getUint32(20) > 20_000_000)
      throw Error('Choose photos of at most 20 megapixels.');
    let offset = 8;
    while (offset + 12 <= bytes.byteLength) {
      const size = bytes.getUint32(offset);
      const type = String.fromCharCode(...new Uint8Array(bytes.buffer, offset + 4, 4));
      if (type === 'acTL') throw Error('Use a still photo rather than an animated PNG.');
      offset += 12 + size;
      if (type === 'IDAT' || type === 'IEND') break;
    }
  }
  if (jpeg) {
    const bytes = new DataView(await file.arrayBuffer());
    let offset = 2;
    while (offset + 4 < bytes.byteLength) {
      if (bytes.getUint8(offset++) !== 0xff) break;
      while (offset < bytes.byteLength && bytes.getUint8(offset) === 0xff) offset++;
      if (offset >= bytes.byteLength) break;
      const marker = bytes.getUint8(offset++);
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > bytes.byteLength) break;
      const length = bytes.getUint16(offset);
      if (length < 2 || offset + length > bytes.byteLength) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && length >= 7) {
        if (bytes.getUint16(offset + 3) * bytes.getUint16(offset + 5) > 20_000_000)
          throw Error('Choose photos of at most 20 megapixels.');
        break;
      }
      offset += length;
    }
  }
  let image: ImageBitmap | HTMLImageElement;
  try { image = await decode(file); } catch { throw Error('This photo could not be read. Try another JPEG or PNG.'); }
  try {
    const width = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
    const height = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
    if (!width || !height || width * height > 20_000_000) throw Error('Choose photos of at most 20 megapixels.');
    const scale = Math.min(1, 1600 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw Error('Image processing is unavailable in this browser. Try another browser.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not prepare this photo. Please try again.')), 'image/jpeg', .88));
    const clean = new File([blob], 'object-view.jpg', {type:'image/jpeg'});
    return {id:crypto.randomUUID(), file:clean, url:URL.createObjectURL(blob), width:canvas.width, height:canvas.height, originalName:file.name};
  } finally { if ('close' in image) image.close(); }
}

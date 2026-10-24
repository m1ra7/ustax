// Keep browser uploads small enough for request gateways while preserving original small files.
export const PHOTO_UPLOAD_TARGET = 3 * 1024 * 1024;
export async function preparePhoto(file: File): Promise<File> {
 if (!file.size || file.size > 30 * 1024 * 1024) throw new Error('Fotoğraf en fazla 30 MB olabilir.');
 const supported=/^(image\/(jpeg|png|webp|heic|heif))$/i.test(file.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
 if (!supported) throw new Error('JPEG, PNG veya WebP fotoğraf seçin.');
 const heic=/heic|heif/i.test(file.type+' '+file.name);
 if (!heic && file.size <= PHOTO_UPLOAD_TARGET) return file;
 const url=URL.createObjectURL(file);
 try {
  const image=new Image();image.src=url;
  try {await image.decode();} catch {throw new Error('Bu fotoğraf açılamadı. JPEG veya PNG olarak tekrar seçin.');}
  let ratio=Math.min(1,2200/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');
  for (let attempt=0;attempt<4;attempt++) {
   canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
   const context=canvas.getContext('2d');if(!context)throw new Error('Fotoğraf hazırlanamadı.');
   context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
   const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',0.84-attempt*0.06));
   if(blob && blob.size<=PHOTO_UPLOAD_TARGET){canvas.width=1;canvas.height=1;return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});}
   ratio*=0.75;
  }
  throw new Error('Fotoğraf küçültülemedi. Daha küçük bir dosya seçin.');
 } finally {URL.revokeObjectURL(url);}
}
export function uploadFailure(status:number,text:string):string {
 if(status===413)return 'Fotoğraf sunucu sınırını aşıyor. Daha küçük bir fotoğraf seçin.';
 try {const body=JSON.parse(text);return body.errorKey||body.error||'Fotoğraf yüklenemedi. Tekrar deneyin.';}
 catch {return 'Fotoğraf yüklenemedi. Depolama bağlantısını kontrol edin.';}
}

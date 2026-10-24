import {Buffer} from 'node:buffer';

/** Preserve a known body length across Next.js fetch handling. */
export async function putSignedObject(signed: Request, bytes: Uint8Array): Promise<Response> {
 const body=Buffer.from(bytes);
 const headers=new Headers(signed.headers);
 headers.delete('transfer-encoding');
 headers.set('Content-Length',String(body.byteLength));
 return fetch(signed.url,{
  method:'PUT',headers,body,cache:'no-store',redirect:'error',signal:AbortSignal.timeout(45000),
 });
}

export function storageFailure(status:number,code?:string):string {
 if(status===501||code==='NotImplemented')return 'Depolama sunucusu yükleme biçimini desteklemiyor. Güncel sunucu kodunu kullanın.';
 if(status===401||status===403)return 'Depolama erişimi reddedildi. Yazma yetkisini ve bölge ayarını kontrol edin.';
 if(status===404||code==='NoSuchBucket')return 'Fotoğraf depolama kovası bulunamadı. Kova adını ve sunucu adresini kontrol edin.';
 return 'Fotoğraf yüklenemedi. Depolama bağlantısını kontrol edin.';
}

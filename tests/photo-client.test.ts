import {test} from 'node:test';import assert from 'node:assert/strict';import {preparePhoto,uploadFailure} from '../lib/photo-client';
test('small supported photos keep their original bytes; invalid and oversized inputs fail before upload',async()=>{
 const photo=new File([new Uint8Array([255,216,255,1,2,3,4,5,6,7,8,9])],'photo.jpg',{type:'image/jpeg'});
 assert.equal(await preparePhoto(photo),photo);
 await assert.rejects(preparePhoto(new File([],'empty.jpg',{type:'image/jpeg'})));
 await assert.rejects(preparePhoto(new File(['<script/>'],'script.svg',{type:'image/svg+xml'})));
 await assert.rejects(preparePhoto(new File([new Uint8Array(30*1024*1024+1)],'huge.jpg',{type:'image/jpeg'})));
});
test('gateway failures and structured server errors remain understandable',()=>{
 assert.match(uploadFailure(413,'Payload too large'),/sunucu sınırını/);
 assert.equal(uploadFailure(503,JSON.stringify({errorKey:'Fotoğraf depolama bağlantısı henüz yapılandırılmadı.'})),'Fotoğraf depolama bağlantısı henüz yapılandırılmadı.');
 assert.match(uploadFailure(502,'<html>Bad Gateway</html>'),/Depolama/);
});

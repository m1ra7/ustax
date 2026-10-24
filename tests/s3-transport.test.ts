import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {putSignedObject,storageFailure} from '../lib/s3-transport';

test('signed upload sends fixed-length bytes even when the incoming request body is a stream',async()=>{
 const payload=Buffer.from([255,216,255,1,2,3,4,5,6,7,8,9]);let received:Buffer|undefined;
 const server=createServer(async(req,res)=>{
  if(req.headers['transfer-encoding']||!req.headers['content-length']){res.writeHead(501);res.end('<Error><Code>NotImplemented</Code></Error>');return;}
  assert.equal(req.headers['content-length'],String(payload.length));assert.equal(req.headers['content-type'],'image/jpeg');
  const chunks:Buffer[]=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));received=Buffer.concat(chunks);res.writeHead(200);res.end();
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');const address=server.address();assert(address&&typeof address!=='string');
 const url=`http://127.0.0.1:${address.port}/private/photo.jpg?X-Amz-Signature=unit-test`;
 try {
  const old=new Request(url,{method:'PUT',headers:{'Content-Type':'image/jpeg'},body:new ReadableStream({start(c){c.enqueue(payload);c.close();}}),duplex:'half'} as RequestInit);
  const response=await fetch(old);assert.equal(response.status,501);await response.text();
  const signed=new Request(url,{method:'PUT',headers:{'Content-Type':'image/jpeg'},body:payload});
  const fixed=await putSignedObject(signed,payload);assert.equal(fixed.status,200);await fixed.text();assert.deepEqual(received,payload);
 } finally {server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
test('storage error categories preserve actionable diagnostics',()=>{
 assert.match(storageFailure(501,'NotImplemented'),/yükleme biçimini/);
 assert.match(storageFailure(403,'AccessDenied'),/Yazma yetkisini/);
 assert.match(storageFailure(404,'NoSuchBucket'),/kovası/);
});

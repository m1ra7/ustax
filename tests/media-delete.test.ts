import {test} from 'node:test';import assert from 'node:assert/strict';import {deleteStoredPhoto} from '../lib/media';
const names=['AWS_ENDPOINT_URL_S3','AWS_ACCESS_KEY_ID','AWS_SECRET_ACCESS_KEY','AWS_REGION','S3_BUCKET','CLOUDINARY_CLOUD_NAME','CLOUDINARY_API_KEY','CLOUDINARY_API_SECRET'];
test('S3 deletion signs an empty DELETE and preserves a cleanup failure for retry',async()=>{
 const original=globalThis.fetch;const previous=names.map(name=>process.env[name]);
 try {
  Object.assign(process.env,{AWS_ENDPOINT_URL_S3:'https://storage.example.test',AWS_ACCESS_KEY_ID:'test-id',AWS_SECRET_ACCESS_KEY:'test-secret',AWS_REGION:'eu-central-1',S3_BUCKET:'repair-photos'});
  let count=0;
  globalThis.fetch=async(input,init)=>{count++;assert.equal(new URL(String(input)).pathname,'/repair-photos/ustax/record/photo.jpg');assert.equal(init?.method,'DELETE');assert.equal(init?.body,undefined);return new Response(null,{status:204});};
  await deleteStoredPhoto('s3:ustax/record/photo.jpg');assert.equal(count,1);
  globalThis.fetch=async()=>new Response(null,{status:403});await assert.rejects(()=>deleteStoredPhoto('s3:ustax/record/photo.jpg'));
 }finally {globalThis.fetch=original;names.forEach((name,i)=>{if(previous[i]===undefined)delete process.env[name];else process.env[name]=previous[i];});}
});
test('Cloudinary deletes authenticated media with signed invalidation and accepts a repeated deletion',async()=>{
 const original=globalThis.fetch;const previous=names.map(name=>process.env[name]);
 try {
  Object.assign(process.env,{CLOUDINARY_CLOUD_NAME:'test-cloud',CLOUDINARY_API_KEY:'test-id',CLOUDINARY_API_SECRET:'test-secret'});
  globalThis.fetch=async(input,init)=>{assert.equal(String(input),'https://api.cloudinary.com/v1_1/test-cloud/image/destroy');assert.equal(init?.method,'POST');const body=init?.body as URLSearchParams;assert.equal(body.get('type'),'authenticated');assert.equal(body.get('invalidate'),'true');assert.equal(body.get('public_id'),'private/photo');assert.match(body.get('signature')!,/^[a-f0-9]{40}$/);return Response.json({result:'not found'});};
  await deleteStoredPhoto('private/photo');
 }finally {globalThis.fetch=original;names.forEach((name,i)=>{if(previous[i]===undefined)delete process.env[name];else process.env[name]=previous[i];});}
});

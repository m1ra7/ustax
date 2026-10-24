import {test} from 'node:test';import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';import {readFileSync,readdirSync} from 'node:fs';
import {removeRecordPhoto,removePhotoStatement} from '../lib/photo-deletion';
import {sampleRecords} from '../lib/sample';import {publicRecord,checkRole} from '../lib/domain';
test('deleting a photo revokes staff/customer projections, retains cleanup key privately and allows safe retry',()=>{
 const record=structuredClone(sampleRecords[0]);record.photos=[{id:'one',publicId:'s3:private/key',format:'jpg',phase:'Kabul',visible:true},{id:'two',publicId:'s3:private/other',format:'jpg',phase:'Kabul',visible:false}];
 const updated=removeRecordPhoto(record,'one','Technician');assert.equal(record.photos.length,2);assert.deepEqual(updated.photos.map(p=>p.id),['two']);
 assert(!publicRecord(updated).photos.some(p=>p.id==='one'));assert(!JSON.stringify(publicRecord(updated)).includes('private/key'));
 assert.deepEqual(updated.quotes,record.quotes);assert.equal(updated.status,record.status);assert.equal(updated.events.at(-1)?.internal,true);
 assert.equal(updated.photoDeletionQueue?.[0].publicId,'s3:private/key');assert.deepEqual(removeRecordPhoto(updated,'one','Technician'),updated);
 assert.throws(()=>removeRecordPhoto(record,'other-record-photo','Technician'));
 for(const role of ['admin','technician'])assert(checkRole(role,'records'));
 for(const role of ['customer','visitor',''])assert(!checkRole(role,'records'));
});
test('photo removal and audit are atomic, and stale revisions cannot delete another photo',async()=>{
 const pg=new PGlite();try {
  for(const file of readdirSync('db/migrations').filter(f=>f.endsWith('.sql')).sort())await pg.exec(readFileSync('db/migrations/'+file,'utf8'));
  const record=structuredClone(sampleRecords[0]);record.id='photo-record';record.photos=[{id:'photo',publicId:'s3:key',format:'jpg',phase:'Kabul',visible:true}];
  await pg.query('INSERT INTO service_records(id,token_hash,data) VALUES($1,$2,$3)',[record.id,'photo-token',JSON.stringify(record)]);
  const updated=removeRecordPhoto(record,'photo','Technician');const first=removePhotoStatement(record.id,0,updated,'tech','photo','audit-photo');assert.equal((await pg.query(first.text,first.params)).rows.length,1);
  const stale=removePhotoStatement(record.id,0,updated,'tech','photo','audit-stale');assert.equal((await pg.query(stale.text,stale.params)).rows.length,0);
  assert.equal((await pg.query('SELECT * FROM audit_log')).rows.length,1);
  const result=await pg.query<{data:typeof record;revision:number}>('SELECT data,revision FROM service_records');assert.equal(result.rows[0].revision,1);assert.equal(result.rows[0].data.photos.length,0);assert.equal(result.rows[0].data.photoDeletionQueue?.length,1);
 }finally{await pg.close();}
});

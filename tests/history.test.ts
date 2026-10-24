import {test} from 'node:test';import assert from 'node:assert/strict';
import {hideHistoryEvent,hideHistoryStatement} from '../lib/history';import {publicRecord} from '../lib/domain';import {sampleRecords} from '../lib/sample';
import {PGlite} from '@electric-sql/pglite';import {readFileSync,readdirSync} from 'node:fs';
test('hiding a history event preserves original data and workflow but removes it from customer projection',()=>{
 const record=structuredClone(sampleRecords[0]);const entry=record.events[0];entry.internal=false;
 const updated=hideHistoryEvent(record,entry.id,'admin-1','2026-10-23T12:00:00Z');
 assert.equal(updated.status,record.status);assert.deepEqual(updated.quotes,record.quotes);
 assert.equal(record.events[0].deletedAt,undefined);assert.equal(updated.events[0].text,entry.text);
 assert.equal(updated.events[0].deletedBy,'admin-1');assert(!publicRecord(updated).events.some(event=>event.id===entry.id));
 assert.throws(()=>hideHistoryEvent(updated,entry.id,'admin-1'));
 assert.throws(()=>hideHistoryEvent(record,'other-record-event','admin-1'));
});
test('history update and audit commit together and a stale revision cannot remove another event',async()=>{
 const pg=new PGlite();try {
  for(const f of readdirSync('db/migrations').filter(f=>f.endsWith('.sql')).sort())await pg.exec(readFileSync('db/migrations/'+f,'utf8'));
  const record=structuredClone(sampleRecords[0]);record.id='r-history';const id=record.events[0].id;
  await pg.query('INSERT INTO service_records(id,token_hash,data) VALUES($1,$2,$3)',['r-history','history-token',JSON.stringify(record)]);
  const data=hideHistoryEvent(record,id,'admin-1');const statement=hideHistoryStatement(record.id,0,data,'admin-1',id,'audit-1');
  assert.equal((await pg.query(statement.text,statement.params)).rows.length,1);
  const stale=hideHistoryStatement(record.id,0,data,'admin-1',id,'audit-2');assert.equal((await pg.query(stale.text,stale.params)).rows.length,0);
  assert.equal((await pg.query('SELECT * FROM audit_log')).rows.length,1);
  const saved=await pg.query<{data:typeof record;revision:number}>('SELECT data,revision FROM service_records');
  assert.equal(saved.rows[0].revision,1);assert.equal(saved.rows[0].data.events[0].text,record.events[0].text);assert.equal(saved.rows[0].data.events[0].deletedBy,'admin-1');
 }finally {await pg.close();}
});

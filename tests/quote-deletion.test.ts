import {test} from 'node:test';import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';import {readFileSync,readdirSync} from 'node:fs';
import {removeQuote,removeQuoteStatement} from '../lib/quote-deletion';import {activeQuote,publicRecord,canTransition,canDeleteQuote} from '../lib/domain';import {sampleRecords} from '../lib/sample';
import {quote as createQuote} from '../lib/service';
const fixture=()=>structuredClone(sampleRecords[0]);
test('deleting the current quote invalidates approval without reactivating an older approved quote or reusing its version',()=>{
 const r=fixture();r.status='Fiyat onayı bekliyor';r.quotes=[{...r.quotes[0],version:1,decision:'approved'},{...r.quotes[0],version:2,decision:'pending'}];
 const removed=removeQuote(r,2,'tech','Technician');assert.equal(removed.status,'İnceleniyor');assert.equal(activeQuote(removed),undefined);assert.equal(publicRecord(removed).quotes.length,0);assert.equal(canTransition(removed,'Tamir ediliyor'),false);
 assert.equal(removed.quotes[0].decision,'approved');assert.equal(r.quotes[1].deletedAt,undefined);assert.equal(removed.quotes[1].deletedBy,'tech');assert.deepEqual(removeQuote(removed,2,'tech','Technician'),removed);
 createQuote(removed,{diagnosis:'Ekran arızası',work:'Ekran değişimi',parts:[],labor:100},'Technician');assert.equal(activeQuote(removed)?.version,3);assert.equal(activeQuote(removed)?.decision,'pending');
});
test('ongoing and completed repair estimates remain protected while obsolete historical estimates can be removed',()=>{
 for(const status of ['Tamir ediliyor','Parça bekleniyor','Teslime hazır','Teslim edildi'] as const){const r=fixture();r.status=status;r.quotes[0].decision='approved';assert(!canDeleteQuote(r,r.quotes[0]));assert.throws(()=>removeQuote(r,1,'tech','Technician'));
 r.quotes.push({...r.quotes[0],version:2});const updated=removeQuote(r,1,'tech','Technician');assert.equal(activeQuote(updated)?.version,2);assert.equal(updated.status,status);assert.equal(publicRecord(updated).quotes.length,1);assert.equal(updated.quotes[0].decision,'approved');}
 assert.throws(()=>removeQuote(fixture(),999,'tech','Technician'));
});
test('deletion, OTP invalidation and audit commit together and reject stale revisions',async()=>{
 const pg=new PGlite();try{
  for(const f of readdirSync('db/migrations').filter(f=>f.endsWith('.sql')).sort())await pg.exec(readFileSync('db/migrations/'+f,'utf8'));
  const r=fixture();r.id='quote-record';const version=r.quotes[0].version;
  await pg.query('INSERT INTO service_records(id,token_hash,data) VALUES($1,$2,$3)',[r.id,'quote-token',JSON.stringify(r)]);
  await pg.query("INSERT INTO verification_codes(id,record_id,version,hash,expires_at) VALUES('code-current',$1,$2,'hash',now()+interval '10 minutes'),('code-next',$1,$3,'hash2',now()+interval '10 minutes')",[r.id,version,version+1]);
  const updated=removeQuote(r,version,'tech','Technician');const stmt=removeQuoteStatement(r.id,0,updated,'tech',version,'audit-quote');assert.equal((await pg.query(stmt.text,stmt.params)).rows.length,1);
  const stale=removeQuoteStatement(r.id,0,updated,'tech',version+1,'audit-stale');assert.equal((await pg.query(stale.text,stale.params)).rows.length,0);
  const codes=await pg.query<{id:string;used:boolean}>('SELECT id,used FROM verification_codes ORDER BY id');assert.equal(codes.rows.find(c=>c.id==='code-current')?.used,true);assert.equal(codes.rows.find(c=>c.id==='code-next')?.used,false);
  assert.equal((await pg.query('SELECT * FROM audit_log')).rows.length,1);
  const stored=await pg.query<{data:typeof r;revision:number}>('SELECT data,revision FROM service_records');assert.equal(stored.rows[0].revision,1);assert.equal(stored.rows[0].data.quotes[0].deletedBy,'tech');
 }finally{await pg.close();}
});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {intakeSchema,publicRecord} from '../lib/domain';
import {sampleRecords} from '../lib/sample';
import {localizedMoney} from '../lib/i18n/core';
test('intake accepts EUR TRY USD, defaults legacy clients to TRY and rejects other currencies',()=>{
 const input={name:'Test User',phone:'05551234567',kind:'Telefon',brand:'Apple',model:'iPhone',fault:'Ekran kırık',technician:'Test'};
 assert.equal(intakeSchema.parse(input).currency,'TRY');
 for(const currency of ['EUR','TRY','USD'])assert.equal(intakeSchema.parse({...input,currency}).currency,currency);
 assert.equal(intakeSchema.safeParse({...input,currency:'GBP'}).success,false);
});
test('public tracking carries denomination and formatting never changes integer amounts',()=>{
 const record=structuredClone(sampleRecords[0]); const original=record.quotes[0].total;
 assert.equal(publicRecord(record).currency,'TRY');
 for(const currency of ['EUR','TRY','USD'] as const){record.currency=currency;const projected=publicRecord(record);assert.equal(projected.currency,currency);assert.equal(projected.quotes[0].total,original);
 for(const language of ['tr','en','de'] as const)assert.equal(localizedMoney(language,12345,currency),new Intl.NumberFormat(language==='tr'?'tr-TR':language==='de'?'de-DE':'en-GB',{style:'currency',currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(123.45));}
});

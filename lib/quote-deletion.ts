import {canDeleteQuote,type RecordData} from './domain';import {HttpError} from './security';
export function removeQuote(record:RecordData,version:number,actorId:string,actorName:string,at=new Date().toISOString()):RecordData {
 const data=structuredClone(record);const quote=data.quotes.find(q=>q.version===version);
 if(!quote)throw new HttpError(404,'Teklif bulunamadı.');if(quote.deletedAt)return data;
 if(!canDeleteQuote(data,quote))throw new HttpError(409,'Devam eden veya tamamlanan tamire ait güncel teklif silinemez.');
 quote.deletedAt=at;quote.deletedBy=actorId;
 const current=data.quotes.at(-1)?.version===version;
 if(current){if(['Fiyat onayı bekliyor','Teklif reddedildi'].includes(data.status))data.status='İnceleniyor';data.eta='';}
 data.updatedAt=at;data.events.push({id:crypto.randomUUID(),at,actor:actorName,text:'Fiyat teklifi geri çekildi.',internal:!current});return data;
}
export function removeQuoteStatement(recordId:string,revision:number,data:RecordData,actorId:string,version:number,auditId:string){return {
 text:`WITH changed AS (UPDATE service_records SET data=$3::jsonb,revision=revision+1 WHERE id=$1 AND revision=$2 RETURNING id),
 invalidated AS (UPDATE verification_codes SET used=true WHERE record_id=$1 AND version=$7 AND used=false AND EXISTS(SELECT 1 FROM changed) RETURNING id)
 INSERT INTO audit_log(id,actor_id,action,target_id) SELECT $4,$5,'record.quote_deleted',$6 FROM changed RETURNING id`,
 params:[recordId,revision,JSON.stringify(data),auditId,actorId,recordId+':quote:'+version,version]};}

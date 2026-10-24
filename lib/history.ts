import type {RecordData} from './domain';
import {HttpError} from './security';
export function hideHistoryEvent(record:RecordData,eventId:string,actorId:string,at=new Date().toISOString()):RecordData {
 const copy=structuredClone(record);const item=copy.events.find(event=>event.id===eventId&&!event.deletedAt);
 if(!item)throw new HttpError(404,'Geçmiş adımı bulunamadı.');
 item.deletedAt=at;item.deletedBy=actorId;copy.updatedAt=at;return copy;
}
export function hideHistoryStatement(recordId:string,revision:number,data:RecordData,actorId:string,eventId:string,auditId:string){
 return {text:`WITH changed AS (
 UPDATE service_records SET data=$3::jsonb,revision=revision+1 WHERE id=$1 AND revision=$2 RETURNING id
 ) INSERT INTO audit_log(id,actor_id,action,target_id)
 SELECT $4,$5,'record.event_hidden',$6 FROM changed RETURNING id`,
 params:[recordId,revision,JSON.stringify(data),auditId,actorId,recordId+':'+eventId]};
}

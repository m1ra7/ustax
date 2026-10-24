import type {RecordData} from './domain';
import {HttpError} from './security';
export function removeRecordPhoto(record:RecordData,photoId:string,actor:string,at=new Date().toISOString()):RecordData {
 const data=structuredClone(record);const photo=data.photos.find(p=>p.id===photoId);
 if(!photo){if(data.photoDeletionQueue?.some(p=>p.id===photoId))return data;throw new HttpError(404,'Fotoğraf bulunamadı.');}
 data.photos=data.photos.filter(p=>p.id!==photoId);
 data.photoDeletionQueue=[...(data.photoDeletionQueue??[]),{id:photo.id,publicId:photo.publicId,format:photo.format}];
 data.events.push({id:crypto.randomUUID(),at,actor,text:'Fotoğraf silindi.',internal:true});data.updatedAt=at;return data;
}
export function removePhotoStatement(recordId:string,revision:number,data:RecordData,actorId:string,photoId:string,auditId:string){
 return {text:`WITH changed AS (UPDATE service_records SET data=$3::jsonb,revision=revision+1 WHERE id=$1 AND revision=$2 RETURNING id)
 INSERT INTO audit_log(id,actor_id,action,target_id) SELECT $4,$5,'record.photo_deleted',$6 FROM changed RETURNING id`,
 params:[recordId,revision,JSON.stringify(data),auditId,actorId,recordId+':'+photoId]};
}

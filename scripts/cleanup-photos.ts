import {db} from '../lib/db';
import {records} from '../db/schema';
import {deleteStoredPhoto} from '../lib/media';
import {mutate} from '../lib/service';
let cleaned=0,failed=0;
for(const row of await db().select({id:records.id,data:records.data}).from(records)){
 for(const photo of row.data.photoDeletionQueue??[]){
  try {await deleteStoredPhoto(photo.publicId);await mutate(row.id,'storage-cleanup',r=>{r.photoDeletionQueue=(r.photoDeletionQueue??[]).filter(p=>p.id!==photo.id);});cleaned++;}
  catch {failed++;}
 }
}
console.log({cleaned,failed});if(failed)process.exitCode=1;

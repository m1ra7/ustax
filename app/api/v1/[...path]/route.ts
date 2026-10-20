import {verifyPassword} from '../../../../lib/password';
import {requestLanguage,translate} from '../../../../lib/i18n/core';
import {verificationEmail} from '../../../../lib/i18n/email';
import {decisionStatement} from '../../../../lib/decision';
import {db,sqlClient} from '../../../../lib/db';
import {users,records,codes,tokens,audit,credentials} from '../../../../db/schema';
import {eq,and} from 'drizzle-orm';
import {z,ZodError} from 'zod';
import {staff,sameOrigin,rate,hash,randomToken,HttpError} from '../../../../lib/security';
import {getRecord,createRecord,mutate,move,quote,event} from '../../../../lib/service';
import {statuses,publicRecord,checkRole,type RecordData} from '../../../../lib/domain';
import {uploadPhoto,downloadPhoto,mediaReady} from '../../../../lib/media';
export const dynamic='force-dynamic';
function baseJson(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'}});}
async function run(req:Request,ctx:{params:Promise<{path:string[]}>}){const language=requestLanguage(req.headers);const json=(data:unknown,status=200)=>{if(data&&typeof data==='object'&&!Array.isArray(data)){const d={...data} as Record<string,unknown>;for(const key of ['error','message','warning'])if(typeof d[key]==='string'){d[key+'Key']=d[key];d[key]=translate(language,d[key] as string);}return baseJson(d,status);}return baseJson(data,status);};try{const p=(await ctx.params).path;const method=req.method;const url=new URL(req.url);sameOrigin(req);
if(p[0]==='health')return json({database:!!process.env.DATABASE_URL,photos:mediaReady(),email:!!(process.env.RESEND_API_KEY&&process.env.EMAIL_FROM),auth:'email-password',mode:process.env.DATABASE_URL?'live':'setup'});
if(!process.env.DATABASE_URL)throw new HttpError(503,'Kurulum gerekli: PostgreSQL bağlantısı henüz eklenmedi. Örnek görünüm gerçek müşteri verisi içermez.');
if(p[0]==='auth'){
const cookie=(value:string,maxAge:number)=>`ustax-session=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV==='production'?'; Secure':''}`;
if(p[1]==='login'&&method==='POST'){
await rate(req,'login',10);const b=z.object({email:z.string().email().max(254),password:z.string().min(1).max(200)}).parse(await req.json());await rate(req,'login-email:'+b.email.toLowerCase(),10);
const u=(await db().select().from(users).where(eq(users.email,b.email.toLowerCase())))[0];const c=u?(await db().select().from(credentials).where(eq(credentials.staffId,u.id)))[0]:undefined;
const valid=await verifyPassword(b.password,c?.passwordHash);if(!u?.active||!valid)throw new HttpError(401,'E-posta veya parola hatalı.');
const token=randomToken();await db().batch([db().insert(tokens).values({hash:await hash(token),staffId:u.id,expiresAt:new Date(Date.now()+8*3600000)}),db().insert(audit).values({id:crypto.randomUUID(),actorId:u.id,action:'session.login',targetId:u.id})]);const res=json({ok:true});res.headers.set('Set-Cookie',cookie(token,28800));return res;}
if(p[1]==='logout'&&method==='POST'){const token=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('ustax-session='))?.slice(14);if(token)await db().delete(tokens).where(eq(tokens.hash,await hash(token)));const res=json({ok:true});res.headers.set('Set-Cookie',cookie('',0));return res;}throw new HttpError(404,'Uç nokta bulunamadı.');}
if(p[0]==='track'){
 await rate(req,'track',80);const row=await getRecord(p[1],true);const r=row.data;
 if(method==='GET')return json(publicRecord(r));
 if(p[2]==='code'&&method==='POST'){
 await rate(req,'code:'+r.id,5);const q=r.quotes.at(-1);if(!q||q.decision!=='pending')throw new HttpError(409,'Onay bekleyen teklif bulunmuyor.');if(!r.email)throw new HttpError(409,'Servis çalışanı doğrulama için e-posta adresinizi eklemelidir.');if(!process.env.RESEND_API_KEY||!process.env.EMAIL_FROM)throw new HttpError(503,'E-posta doğrulama altyapısı yapılandırılmadı. Servisinizle iletişime geçin.');
 const array=new Uint32Array(1);let n;do{crypto.getRandomValues(array);n=array[0];}while(n>=4294000000);const code=String(n%1000000).padStart(6,'0');const id=crypto.randomUUID();await db().insert(codes).values({id,recordId:r.id,version:q.version,hash:await hash(id+':'+code),expiresAt:new Date(Date.now()+10*60000)});
 const sent=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':id},body:JSON.stringify({from:process.env.EMAIL_FROM,to:[r.email],...verificationEmail(language,r.number,q.version,code)})});if(!sent.ok){await db().delete(codes).where(eq(codes.id,id));throw new HttpError(502,'E-posta gönderilemedi. Tekrar deneyin.');}return json({challengeId:id,message:'Doğrulama kodu kayıtlı e-posta adresinize gönderildi.'});}
 if(p[2]==='decision'&&method==='POST'){
 await rate(req,'decision:'+r.id,10);const b=z.object({challengeId:z.string().uuid(),code:z.string().regex(/^\d{6}$/),decision:z.enum(['approved','rejected']),version:z.number().int().positive()}).parse(await req.json());const q=r.quotes.at(-1);if(q?.version!==b.version)throw new HttpError(409,'Teklif güncellendi. Sayfayı yenileyin.');if(q.decision!=='pending'){if(q.decision===b.decision)return json({ok:true,alreadyRecorded:true});throw new HttpError(409,'Bu teklif için daha önce farklı bir karar kaydedildi.');}
 const sql=sqlClient();const attempts=await sql`UPDATE verification_codes SET attempts=attempts+1 WHERE id=${b.challengeId} AND record_id=${r.id} AND version=${b.version} AND used=false AND expires_at>now() AND attempts<5 RETURNING hash`;if(!attempts.length||attempts[0].hash!==await hash(b.challengeId+':'+b.code))throw new HttpError(400,'Kod geçersiz, süresi dolmuş veya deneme sınırına ulaşılmış.');
 q.decision=b.decision;q.decidedAt=new Date().toISOString();r.status=b.decision==='rejected'?'Teklif reddedildi':r.status;r.updatedAt=q.decidedAt;event(r,'Müşteri',`Teklif v${b.version} ${b.decision==='approved'?'onaylandı':'reddedildi'}.`);
 const statement=decisionStatement(b.challengeId,r.id,row.revision,r);const changed=await sql.query(statement.text,statement.params);
 if(!changed.length)throw new HttpError(409,'Kayıt değişti veya kod kullanıldı. Yenileyip tekrar deneyin.');return json({ok:true});}
 throw new HttpError(404,'Uç nokta bulunamadı.');}
if(p[0]==='photos'&&method==='GET'){
 const token=url.searchParams.get('token');const row=await getRecord(token||p[1],!!token);const photo=row.data.photos.find(x=>x.id===p[2]);if(!photo||token&&!photo.visible)throw new HttpError(404,'Fotoğraf bulunamadı.');if(!token)await staff(req);const resp=await fetch(await downloadPhoto(photo.publicId,photo.format));if(!resp.ok)throw new HttpError(502,'Fotoğraf alınamadı.');return new Response(resp.body,{headers:{'Content-Type':resp.headers.get('Content-Type')||'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
await rate(req,'staff',180);const u=await staff(req);if(!checkRole(u.role,p[0]))throw new HttpError(403,'Bu işlem için yönetici yetkisi gerekiyor.');
if(p[0]==='me')return json(u);
if(p[0]==='users'){
 if(method==='GET')return json(await db().select().from(users));
 if(method==='POST'){const b=z.object({email:z.string().email(),name:z.string().min(2).max(100),role:z.enum(['admin','technician'])}).parse(await req.json());const created=await db().insert(users).values({...b,email:b.email.toLowerCase(),id:crypto.randomUUID()}).returning();await db().insert(audit).values({id:crypto.randomUUID(),actorId:u.id,action:'staff.created',targetId:created[0].id});return json(created[0],201);}
 if(method==='PATCH'){const b=z.object({id:z.string(),active:z.boolean().optional(),role:z.enum(['admin','technician']).optional()}).refine(x=>x.active!==undefined||x.role!==undefined).parse(await req.json());if(b.id===u.id)throw new HttpError(409,'Kendi yetkinizi veya erişiminizi değiştiremezsiniz.');await db().update(users).set({...(b.active!==undefined?{active:b.active}:{}),...(b.role?{role:b.role}:{})}).where(eq(users.id,b.id));await db().insert(audit).values({id:crypto.randomUUID(),actorId:u.id,action:b.role?'staff.role_changed':b.active?'staff.activated':'staff.deactivated',targetId:b.id});return json({ok:true});}}
if(p[0]==='tokens'&&method==='POST'){const b=z.object({staffId:z.string(),days:z.number().int().min(1).max(30)}).parse(await req.json());const token=randomToken();await db().insert(tokens).values({hash:await hash(token),staffId:b.staffId,expiresAt:new Date(Date.now()+b.days*86400000)});await db().insert(audit).values({id:crypto.randomUUID(),actorId:u.id,action:'api_token.created',targetId:b.staffId});return json({token,warning:'Yalnızca bir kez gösterilir. Keychain içinde saklayın.'},201);}
if(p[0]==='tokens'&&method==='DELETE'){const b=z.object({staffId:z.string()}).parse(await req.json());await db().delete(tokens).where(eq(tokens.staffId,b.staffId));await db().insert(audit).values({id:crypto.randomUUID(),actorId:u.id,action:'api_token.revoked',targetId:b.staffId});return json({ok:true});}
if(p[0]==='customers'&&method==='GET')return json(await db().query.customers.findMany());
if(p[0]==='records'){
 if(p.length===1&&method==='GET'){const rows=await db().select({data:records.data}).from(records);return json(rows.map(x=>x.data).sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));}
 if(p.length===1&&method==='POST')return json(await createRecord(await req.json(),u.name),201);
 const id=p[1];if(method==='GET')return json((await getRecord(id)).data);
 if(p[2]==='rotate'&&method==='POST'){if(u.role!=='admin')throw new HttpError(403,'Yönetici yetkisi gerekiyor.');const token=randomToken();const row=await getRecord(id);event(row.data,u.name,'Takip bağlantısı yenilendi.',true);const changed=await db().update(records).set({tokenHash:await hash(token),data:row.data,revision:row.revision+1}).where(and(eq(records.id,id),eq(records.revision,row.revision))).returning();if(!changed.length)throw new HttpError(409,'Kayıt değişti. Tekrar deneyin.');return json({token});}
 if(p[2]==='photos'&&method==='POST'){await getRecord(id);const f=await req.formData();const file=f.get('file');if(!(file instanceof File))throw new HttpError(400,'Fotoğraf seçin.');const phase=z.enum(['Kabul','Tamir öncesi','Tamir sonrası']).parse(f.get('phase'));const photo=await uploadPhoto(file,id);return json(await mutate(id,u.name,r=>{r.photos.push({...photo,phase,visible:f.get('visible')==='true'});event(r,u.name,'Fotoğraf eklendi.',true);}));}
 if(p[2]==='photos'&&method==='PATCH'){const b=z.object({id:z.string(),visible:z.boolean()}).parse(await req.json());return json(await mutate(id,u.name,r=>{const photo=r.photos.find(p=>p.id===b.id);if(!photo)throw new HttpError(404,'Fotoğraf yok.');photo.visible=b.visible;event(r,u.name,'Fotoğraf görünürlüğü değiştirildi.',true);}));}
 if(method==='PATCH'){const b=z.record(z.unknown()).parse(await req.json());return json(await mutate(id,u.name,r=>{
 if(p[2]==='status')move(r,z.enum(statuses).parse(b.status),u.name);
 else if(p[2]==='notes'){const v=z.object({text:z.string().min(1).max(5000),internal:z.boolean()}).parse(b);event(r,u.name,v.text,v.internal);}
 else if(p[2]==='quote')quote(r,b,u.name);
 else if(p[2]==='email'){r.email=z.string().email().parse(b.email);event(r,u.name,'Müşteri e-posta adresi güncellendi.',true);}
 else if(p[2]==='complete'){const v=z.object({work:z.string().min(3).max(3000),parts:z.string().max(2000),fee:z.number().int().min(0),warranty:z.string().max(3000)}).parse(b);if(r.status!=='Tamir ediliyor'||r.quotes.at(-1)?.decision!=='approved'||v.fee!==r.quotes.at(-1)?.total)throw new HttpError(409,'Tamir ve onaylı teklif tutarı kontrol edilmeli. Fiyat değişiyorsa yeni teklif hazırlayın.');r.completion={...v,completedAt:new Date().toISOString()};move(r,'Teslime hazır',u.name);}
 else if(p[2]==='deliver'){if(r.status!=='Teslime hazır'||!r.completion)throw new HttpError(409,'Cihaz henüz teslime hazır değil.');r.completion.deliveredAt=new Date().toISOString();r.completion.deliveryNote=z.string().max(2000).parse(b.note);move(r,'Teslim edildi',u.name);}
 else throw new HttpError(404,'Uç nokta bulunamadı.');}));}}
throw new HttpError(404,'Uç nokta bulunamadı.');
}catch(e){if(e instanceof ZodError)return json({error:'Bilgileri kontrol edin.',fields:e.flatten()},400);if(e instanceof HttpError)return json({error:e.message},e.status);return json({error:e instanceof Error&&e.message==='SETUP_REQUIRED'?'Kurulum gerekli.':'İşlem tamamlanamadı. Bağlantıyı ve sunucu yapılandırmasını kontrol edin.'},503);}}
export const GET=run;export const POST=run;export const PATCH=run;export const DELETE=run;

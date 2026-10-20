import {passwordHash} from '../lib/password';
import {db} from '../lib/db';import {users,audit,credentials} from '../db/schema';
const email=process.env.ADMIN_EMAIL?.toLowerCase();const name=process.env.ADMIN_NAME;
if(!email||!name||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))throw new Error('ADMIN_EMAIL ve ADMIN_NAME ortam değişkenleri gerekli.');
const password=process.env.ADMIN_PASSWORD;if(!password||password.length<12||password.length>200)throw new Error('ADMIN_PASSWORD en az 12, en fazla 200 karakter olmalıdır.');const secret=await passwordHash(password);
const id=crypto.randomUUID();await db().batch([db().insert(users).values({id,email,name,role:'admin',active:true}),db().insert(credentials).values({staffId:id,passwordHash:secret}),db().insert(audit).values({id:crypto.randomUUID(),actorId:'bootstrap-cli',action:'admin.bootstrap',targetId:email})]);
console.log('Yönetici hesabı tanımlandı. E-posta ve parolanızla giriş yapın.');

import { pgTable,text,jsonb,integer,timestamp,boolean } from 'drizzle-orm/pg-core';
import type {RecordData} from '../lib/domain';
export const users=pgTable('staff',{id:text('id').primaryKey(),email:text('email').notNull().unique(),name:text('name').notNull(),role:text('role').notNull(),active:boolean('active').notNull().default(true)});
export const customers=pgTable('customers',{id:text('id').primaryKey(),phone:text('phone').notNull().unique(),name:text('name').notNull(),email:text('email').notNull()});
export const devices=pgTable('devices',{id:text('id').primaryKey(),customerId:text('customer_id').notNull().references(()=>customers.id),serial:text('serial'),kind:text('kind').notNull(),brand:text('brand').notNull(),model:text('model').notNull()});
export const records=pgTable('service_records',{id:text('id').primaryKey(),tokenHash:text('token_hash').notNull().unique(),revision:integer('revision').notNull().default(0),data:jsonb('data').$type<RecordData>().notNull()});
export const tokens=pgTable('api_tokens',{hash:text('hash').primaryKey(),staffId:text('staff_id').notNull().references(()=>users.id),expiresAt:timestamp('expires_at',{withTimezone:true}).notNull()});
export const codes=pgTable('verification_codes',{id:text('id').primaryKey(),recordId:text('record_id').notNull().references(()=>records.id),version:integer('version').notNull(),hash:text('hash').notNull(),expiresAt:timestamp('expires_at',{withTimezone:true}).notNull(),attempts:integer('attempts').notNull().default(0),used:boolean('used').notNull().default(false)});
export const rates=pgTable('rate_limits',{key:text('key').primaryKey(),count:integer('count').notNull(),expiresAt:timestamp('expires_at',{withTimezone:true}).notNull()});
export const audit=pgTable('audit_log',{id:text('id').primaryKey(),actorId:text('actor_id').notNull(),action:text('action').notNull(),targetId:text('target_id').notNull(),at:timestamp('at',{withTimezone:true}).notNull().defaultNow()});

export const credentials=pgTable('staff_credentials',{staffId:text('staff_id').primaryKey().references(()=>users.id),passwordHash:text('password_hash').notNull()});

import {neon} from '@neondatabase/serverless';
import {drizzle} from 'drizzle-orm/neon-http';
import * as schema from '../db/schema';
export function db(){if(!process.env.DATABASE_URL)throw new Error('SETUP_REQUIRED');return drizzle(neon(process.env.DATABASE_URL),{schema});}
export function sqlClient(){if(!process.env.DATABASE_URL)throw new Error('SETUP_REQUIRED');return neon(process.env.DATABASE_URL);}

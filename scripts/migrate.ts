// Use a direct Neon URL for migrations; keep the pooled URL for runtime.
if(process.env.DIRECT_DATABASE_URL)process.env.DATABASE_URL=process.env.DIRECT_DATABASE_URL;
import {migrate} from 'drizzle-orm/neon-http/migrator';import {db} from '../lib/db';await migrate(db(),{migrationsFolder:'./db/migrations'});console.log('Migration tamamlandı.');

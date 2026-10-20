import {randomBytes,scrypt as derive,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive);
export async function passwordHash(password:string){const salt=randomBytes(16).toString('hex');const key=await scrypt(password,salt,64) as Buffer;return salt+':'+key.toString('hex');}
export async function verifyPassword(password:string,stored?:string){const [salt,hex]=(stored||'00000000000000000000000000000000:'+ '00'.repeat(64)).split(':');const key=await scrypt(password,salt,64) as Buffer;const expected=Buffer.from(hex||'','hex');return !!stored&&key.length===expected.length&&timingSafeEqual(key,expected);}

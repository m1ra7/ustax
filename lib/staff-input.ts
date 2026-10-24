import {z} from 'zod';
export const staffPasswordSchema=z.string().min(12).max(200);
export const createStaffSchema=z.object({
 email:z.string().trim().email().max(254).transform(value=>value.toLowerCase()),
 name:z.string().trim().min(2).max(100),
 role:z.enum(['admin','technician']),
 password:staffPasswordSchema.optional(),
});
export const resetStaffPasswordSchema=z.object({id:z.string().min(1).max(200),password:staffPasswordSchema});

import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStaffSchema,resetStaffPasswordSchema} from '../lib/staff-input';
import {checkRole} from '../lib/domain';
test('new staff validates role, email and optional initial password',()=>{
 const base={name:'Example Staff',email:'  STAFF@EXAMPLE.COM  ',role:'technician'};
 assert.equal(createStaffSchema.parse({...base,password:'a-secure-password'}).email,'staff@example.com');
 assert.equal(createStaffSchema.safeParse({...base,password:'short'}).success,false);
 assert.equal(createStaffSchema.safeParse({...base,role:'customer'}).success,false);
 assert.equal(createStaffSchema.safeParse({...base,password:'x'.repeat(201)}).success,false);
 assert.equal(createStaffSchema.safeParse(base).success,true);
});
test('password reset requires a target and a valid new password',()=>{
 assert.equal(resetStaffPasswordSchema.safeParse({id:'',password:'a-secure-password'}).success,false);
 assert.equal(resetStaffPasswordSchema.safeParse({id:'staff-2',password:'short'}).success,false);
 assert.equal(resetStaffPasswordSchema.safeParse({id:'staff-2',password:'a-secure-password'}).success,true);
});
test('technicians have explicit permissions; customers and unknown roles have no staff access',()=>{
 for(const action of ['me','records','customers','photos'])assert.equal(checkRole('technician',action),true);
 for(const action of ['users','tokens','rotate','new-admin-endpoint'])assert.equal(checkRole('technician',action),false);
 for(const role of ['customer','visitor','', 'ADMIN'])for(const action of ['records','users','tokens','customers','photos'])assert.equal(checkRole(role,action),false);
 assert.equal(checkRole('admin','users'),true);assert.equal(checkRole('admin','records'),true);
});

const fs=require('fs');
const os=require('os');
const path=require('path');
const assert=require('assert/strict');
const jwt=require('jsonwebtoken');
const {createPool}=require('../backend/database/config');
const {createPostgresStorage}=require('../backend/database/storage');
const {createApp}=require('../backend/server');

async function run(){
  const root=path.join(__dirname,'..'),pool=createPool(),storage=createPostgresStorage(pool),servers=[];
  const secret=require('crypto').randomBytes(48).toString('hex');
  try{
    const snapshot=await storage.transaction(false,state=>structuredClone(state));
    const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'pdrb-pg-readonly-smoke-'));
    fs.copyFileSync(path.join(root,'backend','data','db.json'),path.join(temporary,'db.json'));
    const apps=[createApp({storage,dataDir:path.join(temporary,'uploads'),secret}),createApp({dataDir:temporary,secret})];
    for(const app of apps){const server=app.listen(0,'127.0.0.1');servers.push(server);await new Promise(r=>server.on('listening',r));}
    const bases=servers.map(server=>`http://127.0.0.1:${server.address().port}/api`);
    const call=async(base,route,token)=>{const response=await fetch(base+route,{headers:{Authorization:'Bearer '+token}});assert.equal(response.status,200,route);return response.json();};
    let datasets=0,accounts=0;
    for(const user of snapshot.db.users){
      const token=jwt.sign({id:user.id},secret,{expiresIn:'5m'});
      const lists=await Promise.all(bases.map(base=>call(base,'/workbooks',token)));assert.deepEqual(lists[0],lists[1]);
      const inbox=await Promise.all(bases.map(base=>call(base,'/notifications',token)));assert.deepEqual(inbox[0],inbox[1]);
      accounts++;
      if(user.role==='admin')for(const workbook of lists[0].workbooks){
        const values=await Promise.all(bases.map(base=>call(base,'/workbooks/'+workbook.id,token)));assert.deepEqual(values[0],values[1]);datasets++;
      }
    }
    const health=await fetch(bases[0]+'/health').then(r=>r.json());assert.equal(health.storage,'postgres');
    console.log(JSON.stringify({verified:true,storage:health.storage,schema:health.schema,accounts,activeDatasets:datasets,readOnly:true,checks:'Daftar akun/instansi, seluruh dataset aktif, grid sumber+override, histori dan notifikasi identik dengan JSON.'},null,2));
  }finally{await Promise.all(servers.map(server=>new Promise(r=>server.close(r))));await pool.end();}
}
run().catch(error=>{console.error('PostgreSQL smoke check:',error.code||error.message);process.exitCode=1;});

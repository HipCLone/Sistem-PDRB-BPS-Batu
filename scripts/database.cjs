const fs=require('fs');
const path=require('path');
const {createHash}=require('crypto');
const {createPool,connectionConfig}=require('../backend/database/config');
const {flatten,restore}=require('../backend/database/model');
const {lockWrites,migrate,loadRows,importState,verifyState}=require('../backend/database/repository');
const root=path.join(__dirname,'..');
const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
function source(){
  const seedPath=path.join(root,'backend','data','workbooks.json'),dbPath=path.join(root,'backend','data','db.json');
  const seedBuffer=fs.readFileSync(seedPath),dbBuffer=fs.readFileSync(dbPath);
  const seed=JSON.parse(seedBuffer),db=JSON.parse(dbBuffer);
  return {seed,db,seedBuffer,dbBuffer,seedPath,dbPath,hashes:{seed:hash(seedBuffer),db:hash(dbBuffer)}};
}
async function check(client){
  const identity=(await client.query("SELECT current_database() AS database,current_user AS username,current_setting('server_version') AS version,has_database_privilege(current_user,current_database(),'CREATE') AS can_create_schema,EXISTS(SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname='pdrb') AS pdrb_exists")).rows[0];
  if(identity.database!=='db_magang'||identity.username!=='magang')throw new Error('Target harus db_magang dengan user magang. Operasi dibatalkan.');
  const tables=(await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema='pdrb' ORDER BY table_name")).rows.map(row=>row.table_name);
  return {...identity,schema:'pdrb',tables};
}
async function presensiFingerprint(client){
  const rows=(await client.query("SELECT c.relname,c.relkind,a.attnum,a.attname,pg_catalog.format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull FROM pg_catalog.pg_namespace n JOIN pg_catalog.pg_class c ON c.relnamespace=n.oid LEFT JOIN pg_catalog.pg_attribute a ON a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped WHERE n.nspname='presensi' ORDER BY c.relname,c.relkind,a.attnum")).rows;
  return hash(JSON.stringify(rows));
}
async function run(){
  const command=process.argv[2]||'check';
  if(!['check','migrate','import','verify','inventory'].includes(command))throw new Error('Perintah database tidak dikenal.');
  let input;
  if(['import','verify','inventory'].includes(command)){
    input=source();const rows=flatten(input.seed,input.db);
    require('assert').deepStrictEqual(restore(rows),{seed:input.seed,db:input.db});
    if(command==='inventory'){console.log(JSON.stringify({sourceHashes:input.hashes,counts:Object.fromEntries(Object.entries(rows).map(([name,values])=>[name,values.length]))},null,2));return;}
  }
  const config=connectionConfig(),pool=createPool();let client,begun=false;
  try{
    client=await pool.connect();
    const identity=await check(client);
    const presensiBefore=await presensiFingerprint(client);
    console.log(JSON.stringify({connection:{host:config.host,port:config.port,...identity}},null,2));
    if(command==='check')return;
    await client.query(command==='verify'?'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY':'BEGIN');begun=true;
    await client.query("SET LOCAL lock_timeout='10s'");
    await client.query("SET LOCAL statement_timeout='30s'");
    if(command!=='verify'){await lockWrites(client);await migrate(client);}
    if(command==='import'){
      const backup=path.join(root,'.local-backups','postgres-'+new Date().toISOString().replace(/[:.]/g,'-'));
      fs.mkdirSync(backup,{recursive:true,mode:0o700});
      fs.writeFileSync(path.join(backup,'workbooks.json'),input.seedBuffer,{flag:'wx',mode:0o600});
      fs.writeFileSync(path.join(backup,'db.json'),input.dbBuffer,{flag:'wx',mode:0o600});
      fs.writeFileSync(path.join(backup,'hashes.json'),JSON.stringify(input.hashes,null,2),{flag:'wx',mode:0o600});
      const result=await importState(client,input.seed,input.db,input.hashes);
      if(hash(fs.readFileSync(input.seedPath))!==input.hashes.seed||hash(fs.readFileSync(input.dbPath))!==input.hashes.db)throw new Error('JSON berubah selama import. Hentikan backend lama lalu ulangi.');
      if(await presensiFingerprint(client)!==presensiBefore)throw new Error('Struktur presensi berubah selama import. Transaksi dibatalkan.');
      await client.query('COMMIT');begun=false;
      console.log(JSON.stringify({...result,backup,presensiStructureUnchanged:true,presensiFingerprint:presensiBefore},null,2));return;
    }
    if(command==='verify')console.log(JSON.stringify({verified:true,counts:await verifyState(client,input.seed,input.db)},null,2));
    if(await presensiFingerprint(client)!==presensiBefore)throw new Error('Struktur presensi berubah selama operasi. Transaksi dibatalkan.');
    await client.query('COMMIT');begun=false;
    console.log(command==='migrate'?'Schema pdrb versi 2 siap; presensi tidak diubah.':'Verifikasi isi JSON terhadap PostgreSQL lulus.');
  }catch(error){if(client&&begun)await client.query('ROLLBACK').catch(()=>{});throw error;}
  finally{client?.release();await pool.end();}
}
run().catch(error=>{console.error('Database:',error.code||error.message);process.exitCode=1;});

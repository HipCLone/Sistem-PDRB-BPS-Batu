const fs=require('fs');
const path=require('path');
const {isDeepStrictEqual}=require('util');
const {definitions,flatten,restore,rowKey}=require('./model');

async function lockWrites(client){await client.query("SELECT pg_catalog.pg_advisory_xact_lock(706452,1)");}
async function migrate(client){
  const exists=await client.query("SELECT pg_catalog.to_regclass('pdrb.schema_migrations') AS relation");
  if(exists.rows[0].relation){
    const version=await client.query('SELECT max(version) AS version FROM pdrb.schema_migrations');
    const current=Number(version.rows[0].version);
    if(![1,2].includes(current))throw new Error('Versi schema pdrb tidak didukung; tidak mengubah schema yang ada.');
    if(current===2)return;
  }else{
    const occupied=await client.query("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='pdrb') AS occupied");
    if(occupied.rows[0].occupied)throw new Error('Schema pdrb sudah berisi tabel yang tidak dikenal. Migrasi dihentikan.');
    await client.query(fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8'));
  }
  await client.query(fs.readFileSync(path.join(__dirname,'revision.sql'),'utf8'));
  for(const table of Object.keys(definitions))await client.query(`CREATE TRIGGER pdrb_revision AFTER INSERT OR UPDATE OR DELETE ON pdrb.${table} FOR EACH ROW EXECUTE FUNCTION pdrb.bump_revision()`);
}
async function loadRows(client){
  const result={};
  for(const [table,{columns}]of Object.entries(definitions)){
    result[table]=(await client.query(`SELECT ${[...columns,'path','data'].join(',')} FROM pdrb.${table}${table==='app_metadata'?" WHERE key='layout'":''}`)).rows;
  }
  return result;
}
function normalized(row,table){
  const copy={};for(const column of [...definitions[table].columns,'path','data']){
    copy[column]=row[column] instanceof Date?row[column].toISOString():row[column];
  }
  return copy;
}
async function writeChanges(client,before,after){
  const names=Object.keys(definitions);
  for(const table of [...names].reverse()){
    const keys=new Set(after[table].map(row=>rowKey(table,row))),definition=definitions[table];
    for(const row of before[table])if(!keys.has(rowKey(table,row))){
      await client.query(`DELETE FROM pdrb.${table} WHERE ${definition.key.map((key,i)=>`${key}=$${i+1}`).join(' AND ')}`,definition.key.map(key=>row[key]));
    }
  }
  for(const table of names){
    const old=new Map(before[table].map(row=>[rowKey(table,row),normalized(row,table)])),definition=definitions[table];
    const columns=[...definition.columns,'path','data'];
    for(const row of after[table]){
      if(isDeepStrictEqual(old.get(rowKey(table,row)),normalized(row,table)))continue;
      const params=columns.map(column=>column==='path'||column==='data'?JSON.stringify(row[column]):row[column]);
      await client.query(`INSERT INTO pdrb.${table} (${columns.join(',')}) VALUES (${columns.map((_,i)=>'$'+(i+1)).join(',')}) ON CONFLICT (${definition.key.join(',')}) DO UPDATE SET ${columns.filter(column=>!definition.key.includes(column)).map(column=>`${column}=EXCLUDED.${column}`).join(',')}`,params);
    }
  }
}
async function verifyState(client,seed,db){
  const rows=await loadRows(client),actual=restore(rows);
  if(!isDeepStrictEqual(actual,{seed,db}))throw new Error('Verifikasi isi PostgreSQL berbeda dari JSON. Transaksi dibatalkan.');
  return Object.fromEntries(Object.entries(rows).map(([table,items])=>[table,items.length]));
}
async function importState(client,seed,db,sourceHashes){
  const rows=flatten(seed,db),id=require('crypto').createHash('sha256').update(JSON.stringify(sourceHashes)).digest('hex');
  const previous=await client.query('SELECT id FROM pdrb.imports WHERE id=$1',[id]);
  if(previous.rows.length)return {alreadyImported:true,id};
  for(const table of Object.keys(definitions)){
    const occupied=await client.query(`SELECT EXISTS (SELECT 1 FROM pdrb.${table}${table==='app_metadata'?" WHERE key<>'revision'":''}) AS occupied`);
    if(occupied.rows[0].occupied)throw new Error('Schema pdrb sudah berisi data. Import tidak menimpa data server.');
  }
  const empty=Object.fromEntries(Object.keys(definitions).map(table=>[table,[]]));
  await writeChanges(client,empty,rows);
  const counts=await verifyState(client,seed,db);
  await client.query('INSERT INTO pdrb.imports (id,source_hashes,counts) VALUES ($1,$2,$3)',[id,JSON.stringify(sourceHashes),JSON.stringify(counts)]);
  return {alreadyImported:false,id,counts};
}
module.exports={lockWrites,migrate,loadRows,writeChanges,verifyState,importState};

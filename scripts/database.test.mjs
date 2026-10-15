import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {PGlite} from '@electric-sql/pglite';
const require=createRequire(import.meta.url);
const {flatten,restore,definitions}=require('../backend/database/model');
const {migrate,importState,loadRows,verifyState,lockWrites}=require('../backend/database/repository');
const {createPostgresStorage}=require('../backend/database/storage');
const {createApp}=require('../backend/server');
const seed=JSON.parse(fs.readFileSync(new URL('../backend/data/workbooks.json',import.meta.url),'utf8'));

function fixture(){
  return {
    users:[{id:'admin',username:'admin',name:'Administrator',role:'admin',institution:null,passwordHash:require('bcryptjs').hashSync('test-admin',4)},{id:'bulog',username:'bulog',name:'BULOG',role:'institution',institution:'BULOG',passwordHash:require('bcryptjs').hashSync('test-bulog',4)},{id:'bapenda',username:'bapenda',name:'Bapenda',role:'institution',institution:'Bapenda',passwordHash:require('bcryptjs').hashSync('test-bapenda',4)}],
    overrides:{},addedRows:{},addedColumns:{},uploadedWorkbooks:[],audit:[],notifications:[],extraSheets:{},tableState:{},workbookDetails:{},deletedWorkbooks:{},editedRows:{},legacyMetadata:{retain:true}
  };
}
async function embeddedPool(){
  const db=new PGlite();let queue=Promise.resolve(),rejectAuditInsert=false;
  const query=async(text,values)=>{
    if(rejectAuditInsert&&text.startsWith('INSERT INTO pdrb.audit_events')){rejectAuditInsert=false;throw Object.assign(new Error('forced write failure'),{code:'XX001'});}
    if(text==='SELECT pg_catalog.pg_advisory_xact_lock(706452,1)')return {rows:[]};
    if(!values&&(text.includes('CREATE TABLE')||text.includes('CREATE OR REPLACE FUNCTION'))){await db.exec(text);return {rows:[]};}
    return db.query(text,values);
  };
  return {db,rejectNextAuditInsert(){rejectAuditInsert=true;},async connect(){const previous=queue;let release;queue=new Promise(r=>{release=r;});await previous;return {query,release};},async end(){await queue;await db.close();}};
}

test('relational mapping round-trips every JSON field, empty container, source grid and legacy event',()=>{
  const db=fixture(),datasetId=seed.workbooks[0].id;
  db.overrides[datasetId]={'0:1:1':{v:0,t:'number',calc:null,fmt:'General'}};
  db.addedRows[datasetId]={0:[['Legacy',0,null]],1:[]};db.addedColumns[datasetId]={0:[{label:'Catatan',headerRow:0,tableId:'blok-1'}]};
  db.extraSheets[datasetId]=[{id:'extra-test',name:'Tabel baru',rows:[['Indikator','Nilai'],['Beras',null]],maxCol:2,maxRow:2,mergedRanges:[]}];
  db.tableState[datasetId]={0:{'blok-1':{deletedRows:[2],deletedColumns:[3],columnLabels:{1:'Tahun'},label:'Nama baru'}}};
  db.workbookDetails[datasetId]={title:'Judul baru',institution:'BULOG'};db.deletedWorkbooks[datasetId]={at:'2026-10-09T00:00:00Z',user:'admin'};
  db.editedRows[datasetId]={0:[{rowIndex:1,tableId:'blok-1'}]};db.audit=[{at:'2026-10-09T00:00:00Z',user:'admin',action:'EDIT_CELL',details:{workbookId:datasetId}}];
  db.notifications=[{id:'notice',recipientId:'bulog',readAt:'2026-10-09T00:00:00Z',workbookId:datasetId}];
  assert.deepEqual(restore(flatten(seed,db)),{seed,db});
  const duplicate=structuredClone(db);duplicate.uploadedWorkbooks=[seed.workbooks[0]];assert.throws(()=>flatten(seed,duplicate),/duplikat/);
});

test('SQL migration/import is lossless, idempotent, refuses overwrite and never changes presensi',async()=>{
  const pool=await embeddedPool(),client=await pool.connect(),db=fixture();
  try{
    await pool.db.exec("CREATE SCHEMA presensi; CREATE TABLE presensi.sentinel (id integer PRIMARY KEY, value text); INSERT INTO presensi.sentinel VALUES(1,'untouched');");
    await client.query('BEGIN');await migrate(client);const result=await importState(client,seed,db,{seed:'fixture',db:'fixture'});await client.query('COMMIT');
    assert.equal(result.counts.datasets,37);assert.equal(result.counts.sheets,95);assert.deepEqual(restore(await loadRows(client)),{seed,db});
    await client.query('BEGIN');await migrate(client);assert((await importState(client,seed,db,{seed:'fixture',db:'fixture'})).alreadyImported);await client.query('COMMIT');
    await client.query('BEGIN');await assert.rejects(importState(client,seed,db,{seed:'different',db:'different'}),/tidak menimpa/);await client.query('ROLLBACK');
    assert.deepEqual((await pool.db.query('SELECT * FROM presensi.sentinel')).rows,[{id:1,value:'untouched'}]);
    await verifyState(client,seed,db);
    assert.equal(Object.keys(definitions).length,14);
  }finally{client.release();await pool.end();}
});

test('PostgreSQL adapter preserves API permissions, concurrent edits, uploads, notification reads and atomic rollback',async()=>{
  const pool=await embeddedPool(),client=await pool.connect(),db=fixture();
  try{await client.query('BEGIN');await migrate(client);await importState(client,seed,db,{seed:'api',db:'api'});await client.query('COMMIT');}finally{client.release();}
  const storage=createPostgresStorage(pool),directory=fs.mkdtempSync(path.join(os.tmpdir(),'pdrb-pg-api-'));
  const app=createApp({storage,dataDir:directory,secret:'postgres-test-secret'}),server=app.listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const call=async(url,token,body,method='GET')=>{const response=await fetch(base+url,{method,headers:{Authorization:'Bearer '+(token||''),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json()};};
  try{
    const login=async(username,password)=>(await call('/auth/login','',{username,password},'POST')).data.token;
    const admin=await login('admin','test-admin'),bulog=await login('bulog','test-bulog'),bapenda=await login('bapenda','test-bapenda');
    assert.equal((await call('/health')).data.storage,'postgres');assert.equal((await call('/workbooks')).status,401);
    const body={title:'Dataset PG',institution:'BULOG',table:{label:'Stok',columns:['Indikator','Nilai','Catatan'],rowLabels:['Beras','Jagung']}};
    const created=await call('/workbooks',admin,body,'POST');assert.equal(created.status,201);const url='/workbooks/'+created.data.workbook.id;
    const edits=await Promise.all([call(url+'/cell',bulog,{sheetIndex:0,rowIndex:1,colIndex:1,value:0},'PATCH'),call(url+'/cell',bulog,{sheetIndex:0,rowIndex:2,colIndex:2,value:'Tersimpan bersamaan'},'PATCH')]);assert(edits.every(r=>r.status===200));
    const workbook=(await call(url,bulog)).data.workbook;assert.equal(workbook.sheets[0].rows[1][1].v,0);assert.equal(workbook.sheets[0].rows[2][2].v,'Tersimpan bersamaan');
    assert.equal((await call(url,bapenda)).status,403);assert.equal((await call(url+'/table',bulog,body.table,'POST')).status,403);
    assert.equal((await call(url+'/table',admin,body.table,'POST')).status,201);
    assert.equal((await call(url+'/column',admin,{sheetIndex:0,tableId:'blok-1',label:'Tambahan'},'POST')).status,200);
    assert.equal((await call(url+'/row',admin,{sheetIndex:0,tableId:'blok-1',values:['Padi',null,null,null]},'POST')).status,200);
    assert.equal((await call(url+'/table',admin,{sheetIndex:0,tableId:'blok-1',kind:'renameColumn',colIndex:1,label:'Nilai baru'},'PATCH')).status,200);
    const own=(await call('/notifications/inbox',bulog)).data;assert.equal(own.unreadCount,2);
    assert.equal((await call('/notifications/'+own.notifications[0].id+'/read',bapenda,null,'PATCH')).status,404);
    assert.equal((await call('/notifications/read-all',bulog,{throughId:own.notifications[0].id},'POST')).status,200);
    assert.equal((await call('/notifications/inbox',bulog)).data.unreadCount,0);
    assert.equal((await call('/notifications/inbox',admin)).data.unreadCount,2);
    const original=await storage.transaction(false,state=>structuredClone(state.db));
    const otherStorage=createPostgresStorage(pool);
    assert.deepEqual(await otherStorage.transaction(false,state=>state.db),original);
    await assert.rejects(storage.transaction(true,state=>{state.db.audit.unshift({id:'bad',action:'BAD'});storage.markDirty();throw new Error('forced rollback');}),/forced rollback/);
    assert.deepEqual(await storage.transaction(false,state=>state.db),original);
    pool.rejectNextAuditInsert();
    const failed=await call(url+'/cell',bulog,{sheetIndex:0,rowIndex:1,colIndex:1,value:999},'PATCH');assert.equal(failed.status,503);assert.match(failed.data.message,/belum tersimpan/);
    assert.deepEqual(await storage.transaction(false,state=>state.db),original);
    await assert.rejects(storage.transaction(true,state=>{state.db.notifications.unshift({id:'bad-fk',recipientId:'missing'});storage.markDirty();}),/foreign key/i);
    assert.deepEqual(await storage.transaction(false,state=>state.db),original);
    const form=new FormData();form.append('file',new Blob(['Indikator,Nilai\nPajak,20\n']),'template.csv');form.append('title','Upload PG');
    const uploaded=await call('/upload',bapenda,form,'POST');assert.equal(uploaded.status,200);assert.equal((await call('/workbooks/'+uploaded.data.workbook.id+'/cell',bapenda,{sheetIndex:0,rowIndex:1,colIndex:1,value:2},'PATCH')).status,403);
    assert.equal((await call(url,admin,null,'DELETE')).status,200);assert.equal((await call(url,bulog)).status,404);
    const another=createPostgresStorage(pool);assert.equal(await another.transaction(false,state=>state.db.deletedWorkbooks[created.data.workbook.id].user),'admin');
    assert.equal(await otherStorage.transaction(false,state=>state.db.deletedWorkbooks[created.data.workbook.id].user),'admin');
    const position=await storage.transaction(false,state=>state.db.overrides[created.data.workbook.id]['0:1:1'].v);assert.equal(position,0);
    await pool.db.query("UPDATE pdrb.cell_overrides SET data=$1 WHERE dataset_id=$2 AND sheet_index=0 AND row_index=1 AND col_index=1",[JSON.stringify({v:77,t:'number',calc:null,fmt:'General'}),created.data.workbook.id]);
    assert.equal(await storage.transaction(false,state=>state.db.overrides[created.data.workbook.id]['0:1:1'].v),77);
    assert.equal(fs.existsSync(path.join(directory,'db.json')),false);
  }finally{await new Promise(r=>server.close(r));await pool.end();}
});

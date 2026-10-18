import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {detectBlocks} from '../src/lib/sheetPresentation.mjs';
import {parsePeriod,matchesPeriod,filterBlockPeriod} from '../src/lib/periods.mjs';
import {datasetTitle,sheetLabel} from '../src/lib/datasetLabels.mjs';
import {assessDrasticChange} from '../src/lib/drasticChanges.mjs';
const require=createRequire(import.meta.url),{createApp}=require('../backend/server.js');
const XLSX=require('xlsx'),{readSheets}=require('../backend/import-workbook.js');

test('drastic changes use exact preceding periods and matching measures, not neighbouring columns',()=>{
  const make=(columns,rows)=>({id:'test',institution:'BULOG',file:'test.xlsx',sheets:[{name:'Stok',manualHeaders:true,rows:[columns,...rows],maxCol:columns.length,maxRow:rows.length+1,mergedRanges:[]}]});
  const w=make(['Indikator','2025 Triwulan IV Volume','2025 Triwulan IV Rupiah','2026 Triwulan I Volume','2026 Triwulan I Rupiah'],[['Beras',100,1000,null,null]]);
  const assess=value=>assessDrasticChange(w,{sheetIndex:0,rowIndex:1,colIndex:3,value});
  assert.equal(assess(200).direction,'increase');assert.equal(assess(50).direction,'decrease');assert.equal(assess(0).percentage,-100);
  assert.equal(assess('200').previous.value,100);assert.equal(assess(199.99),null);assert.equal(assess(50.01),null);
  assert.equal(assessDrasticChange(w,{sheetIndex:0,rowIndex:1,colIndex:4,value:500}).previous.value,1000);
  assert.equal(assessDrasticChange(make(['Indikator','2025 Triwulan I','2025 Triwulan III'],[['Beras',100,null]]),{sheetIndex:0,rowIndex:1,colIndex:2,value:200}),null);
  for(const previous of [0,null,-100,{t:'formula',v:'B2',calc:null}]){
    assert.equal(assessDrasticChange(make(['Indikator','2025','2026'],[['Beras',previous,null]]),{sheetIndex:0,rowIndex:1,colIndex:2,value:200}),null);
  }
  const annual=make(['Tahun','Nilai'],[[2025,100],[2026,null]]);
  assert.equal(assessDrasticChange(annual,{sheetIndex:0,rowIndex:2,colIndex:1,value:200}).previous.value,100);
  const monthly=make(['Indikator','Nilai 2026'],[['Beras',100]]);monthly.sheets[0].name='Januari';
  monthly.sheets.push({...structuredClone(monthly.sheets[0]),name:'Februari',rows:[['Indikator','Nilai 2026'],['Beras',null]]});
  assert.equal(assessDrasticChange(monthly,{sheetIndex:1,rowIndex:1,colIndex:1,value:200}).previous.period,'2026 Bulan 1');
  const other=structuredClone(monthly);other.id='duplicate';
  assert.equal(assessDrasticChange(monthly,{sheetIndex:1,rowIndex:1,colIndex:1,value:200},[monthly,other]),null);
  const last=make(['Indikator','Realisasi 2025'],[['Beras',100]]);last.id='last';last.file='LRA 2025 TW 4.xlsx';
  const next=make(['Indikator','Realisasi 2026'],[['Beras',null]]);next.file='LRA 2026 TW 1.xlsx';
  assert.equal(assessDrasticChange(next,{sheetIndex:0,rowIndex:1,colIndex:1,value:200},[last,next]).previous.period,'2025 Triwulan 4');
  last.institution='Bapenda';assert.equal(assessDrasticChange(next,{sheetIndex:0,rowIndex:1,colIndex:1,value:200},[last,next]),null);
});

test('institution drastic edits require a current explanation and persist audit plus admin notification',async()=>{
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'pdrb-drastic-api-'));
  const server=createApp({dataDir,secret:'drastic-test-secret'}).listen(0,'127.0.0.1');
  await new Promise(resolve=>server.on('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const call=async(url,token,body,method=body?'POST':'GET')=>{
    const r=await fetch(base+url,{method,headers:{Authorization:`Bearer ${token||''}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    return {status:r.status,data:await r.json()};
  };
  try{
    const admin=(await call('/auth/login',null,{username:'admin',password:'admin123'})).data.token;
    const bulog=(await call('/auth/login',null,{username:'bulog',password:'123456'})).data.token;
    const created=await call('/workbooks',admin,{title:'Uji perubahan drastis',institution:'BULOG',table:{label:'Stok',columns:['Indikator','2025 Triwulan IV','2026 Triwulan I'],rowLabels:['Beras']}});
    assert.equal(created.status,201);
    const url='/workbooks/'+created.data.workbook.id,edit={sheetIndex:0,rowIndex:1,colIndex:2,value:200};
    assert.equal((await call(url+'/cell',admin,{...edit,colIndex:1,value:100},'PATCH')).status,200);
    const before=(await call('/notifications',admin)).data;
    let attempt=await call(url+'/cell',bulog,edit,'PATCH');assert.equal(attempt.status,422);
    assert.equal(attempt.data.code,'DRASTIC_CHANGE_REASON_REQUIRED');assert.equal(attempt.data.change.previous.value,100);
    assert.equal((await call(url,bulog)).data.workbook.sheets[0].rows[1][2],null);
    assert.equal((await call('/notifications',admin)).data.audit.length,before.audit.length);
    const oldToken=attempt.data.change.comparisonToken;
    assert.equal((await call(url+'/cell',bulog,{...edit,reason:'   ',comparisonToken:oldToken},'PATCH')).status,422);
    assert.equal((await call(url+'/cell',bulog,{...edit,reason:'x'.repeat(2001),comparisonToken:oldToken},'PATCH')).status,422);
    await call(url+'/cell',admin,{...edit,colIndex:1,value:90},'PATCH');
    attempt=await call(url+'/cell',bulog,{...edit,reason:'Permintaan meningkat',comparisonToken:oldToken},'PATCH');assert.equal(attempt.status,422);
    assert.notEqual(attempt.data.change.comparisonToken,oldToken);
    const reason='Permintaan meningkat karena panen';
    assert.equal((await call(url+'/cell',bulog,{...edit,reason,comparisonToken:attempt.data.change.comparisonToken},'PATCH')).status,200);
    const history=(await call('/notifications',admin)).data;
    assert.equal(history.audit[0].details.drasticChange.reason,reason);assert.equal(history.audit[0].details.drasticChange.previous.value,90);
    assert.equal(history.notifications[0].title,'Perubahan data drastis');assert(history.notifications[0].message.includes(reason));
    assert.equal((await call('/notifications',bulog)).data.audit[0].details.drasticChange.reason,reason);
    assert.equal((await call(url+'/cell',bulog,{...edit,value:45},'PATCH')).data.change.direction,'decrease');
    assert.equal((await call(url+'/cell',bulog,{...edit,value:'300'},'PATCH')).status,422);
    assert.equal((await call(url+'/cell',admin,{...edit,value:1000},'PATCH')).status,200);
    const persisted=JSON.parse(fs.readFileSync(path.join(dataDir,'db.json'),'utf8'));
    assert(persisted.audit.some(a=>a.details.drasticChange?.reason===reason));
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('all source datasets have readable titles without filenames',()=>{
  const seed=JSON.parse(fs.readFileSync(new URL('../backend/data/workbooks.json',import.meta.url),'utf8'));
  for(const workbook of seed.workbooks){const title=datasetTitle(workbook,workbook.sheets.map(detectBlocks));assert(title.length>5);assert(!/\.xlsx?|\.csv/i.test(title));assert.notEqual(title,'Data pelaporan instansi');}
  assert.equal(datasetTitle({title:'Pendapatan bulanan'}),'Pendapatan bulanan');
  assert.equal(datasetTitle({file:'nama-teknis-0923.xlsx'},[[{label:'Sheet1 · Tabel 1'}]]),'Data pelaporan instansi');
  assert.equal(sheetLabel('jan'),'Januari');assert.equal(sheetLabel('Growth'),'Pertumbuhan');
});

test('Excel upload reader preserves merges, zeros and cached/error formulas',()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'pdrb-import-test-')),filename=path.join(dir,'import.xlsx');
  const wb=XLSX.utils.book_new(),ws=XLSX.utils.aoa_to_sheet([['Indikator','2026',null],['Uraian','Nilai','Hasil'],['Stok',0,12],['Pendapatan',3,null]]);
  ws['!merges']=[XLSX.utils.decode_range('B1:C1')];ws.C3={t:'n',v:12,f:'B3+12'};ws.C4={t:'e',v:7,f:'B4/0'};
  XLSX.utils.book_append_sheet(wb,ws,'Data');XLSX.writeFile(wb,filename);
  const [sheet]=readSheets(filename,'import-test');
  assert(sheet.mergedRanges.includes('B1:C1'));assert.equal(sheet.rows[2][1].v,0);assert.equal(sheet.rows[2][2].calc,12);assert.equal(sheet.rows[2][2].t,'formula');assert.equal(sheet.rows[3][2].t,'error');
});

test('period filters keep descriptors and distinguish year/quarter',()=>{
  assert.deepEqual(parsePeriod('2026 · Triwulan II'),{year:'2026',quarter:'2'});
  assert.deepEqual(parsePeriod('Nama indikator','2026'),{year:null,quarter:null});
  assert(matchesPeriod({periods:[{year:'2026',quarter:'2'}]},'2026','2'));
  assert(!matchesPeriod({periods:[{year:'2026',quarter:'2'}]},'2025','2'));
  const b={columns:[0,1,2],labels:['Nama','2025 · Triwulan I','2026 · Triwulan II'],headerPaths:[['Nama'],['2025','Triwulan I'],['2026','Triwulan II']]};
  assert.deepEqual(filterBlockPeriod(b,'2026','2').columns,[0,2]);
});

test('isolated API enforces roles, validates writes, targets tables and persists',async()=>{
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'pdrb-api-test-'));
  const server=createApp({dataDir,secret:'isolated-test-secret'}).listen(0,'127.0.0.1');
  await new Promise(resolve=>server.on('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const call=async(url,token,body,method)=>{const res=await fetch(base+url,{method:method||(body?'POST':'GET'),headers:{...(token?{Authorization:`Bearer ${token}`} :{}),...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()};};
  try{
    assert.equal((await call('/workbooks')).status,401);
    assert.equal((await call('/unknown')).status,404);
    const login=async username=>(await call('/auth/login',null,{username,password:username==='admin'?'admin123':'123456'})).data;
    const admin=await login('admin'),bulog=await login('bulog'),bapenda=await login('bapenda');
    const all=(await call('/workbooks',admin.token)).data.workbooks,own=(await call('/workbooks',bulog.token)).data.workbooks;
    assert.equal(all.length,37);assert(own.every(w=>w.institution==='BULOG'));assert(all.every(w=>w.title&&!/\.xlsx?/i.test(w.title)));
    assert.equal((await call('/workbooks/'+all.find(w=>w.institution!=='BULOG').id,bulog.token)).status,403);
    const record=all.find(w=>w.institution==='Dinas Pendidikan'),url='/workbooks/'+record.id;
    const sheet=(await call(url,admin.token)).data.workbook.sheets[0],blocks=detectBlocks(sheet);
    assert.equal(blocks.length,3);
    assert.equal((await call(url+'/row',bulog.token,{sheetIndex:0,tableId:blocks[0].id,values:['test']})).status,403);
    assert.equal((await call(url+'/cell',admin.token,{sheetIndex:0,rowIndex:-1,colIndex:0,value:1},'PATCH')).status,400);
    assert.equal((await call(url+'/cell',admin.token,{sheetIndex:0,rowIndex:0,colIndex:0,value:{}},'PATCH')).status,400);
    assert.equal((await call(url+'/column',admin.token,{sheetIndex:0,tableId:'missing',label:'Tes'})).status,400);
    const values=Array(sheet.maxCol).fill(null);values[blocks[0].schemaColumns[0]]='Baris uji terisolasi';
    const added=await call(url+'/row',admin.token,{sheetIndex:0,tableId:blocks[0].id,values});assert.equal(added.status,200);
    let updated=(await call(url,admin.token)).data.workbook.sheets[0],after=detectBlocks(updated);
    assert.equal(after[0].rowIndexes.length,blocks[0].rowIndexes.length+1);assert.equal(after[1].rowIndexes.length,blocks[1].rowIndexes.length);
    assert.equal((await call(url+'/column',admin.token,{sheetIndex:0,tableId:blocks[0].id,label:'Catatan verifikasi'})).status,200);
    assert.equal((await call(url+'/cell',admin.token,{sheetIndex:0,rowIndex:added.data.rowIndex,colIndex:sheet.maxCol,value:'Tersimpan'},'PATCH')).status,200);
    updated=(await call(url,admin.token)).data.workbook.sheets[0];after=detectBlocks(updated);
    assert(after[0].labels.includes('Catatan verifikasi'));assert(!after[1].schemaLabels.includes('Catatan verifikasi'));
    const form=()=>{const f=new FormData();f.append('file',new Blob(['Indikator,Nilai 2026\nPendapatan,125\n'],{type:'text/csv'}),'uji.csv');return f;};
    assert.equal((await call('/upload',bulog.token,form())).status,403);
    const forged=form();forged.append('institution','BULOG');assert.equal((await call('/upload',bapenda.token,forged)).status,403);
    const oversized=form();oversized.append('title','a'.repeat(161));assert.equal((await call('/upload',bapenda.token,oversized)).status,400);
    const named=form();named.append('title','Pendapatan daerah bulanan');const upload=await call('/upload',bapenda.token,named);assert.equal(upload.status,200);assert.equal(upload.data.workbook.institution,'Bapenda');assert.equal(upload.data.workbook.title,'Pendapatan daerah bulanan');
    const audit=(await call('/notifications',admin.token)).data.audit;assert.equal(audit.length,4);assert(audit.every(item=>item.details.dataTitle&&!/\.xlsx?|\.csv/i.test(item.details.dataTitle)));
    const saved=JSON.parse(fs.readFileSync(path.join(dataDir,'db.json'),'utf8'));assert.equal(saved.addedRows[record.id][0][0].tableId,blocks[0].id);
    const restarted=createApp({dataDir,secret:'isolated-test-secret'}).listen(0,'127.0.0.1');await new Promise(resolve=>restarted.on('listening',resolve));
    try{const persisted=await fetch(`http://127.0.0.1:${restarted.address().port}/api${url}`,{headers:{Authorization:`Bearer ${admin.token}`}}).then(r=>r.json());assert.equal(persisted.workbook.sheets[0].rows[added.data.rowIndex][sheet.maxCol].v,'Tersimpan');}finally{await new Promise(resolve=>restarted.close(resolve));}
    console.log('API database isolated at '+dataDir+'; user database untouched.');
  }finally{await new Promise(resolve=>server.close(resolve));}
});

test('admin CRUD, institution cell editing, and append-only Bapenda templates persist',async()=>{
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'pdrb-crud-test-')),secret='crud-test-secret';
  const server=createApp({dataDir,secret}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const call=async(url,token,body,method='GET')=>{const res=await fetch(base+url,{method,headers:{Authorization:`Bearer ${token}`,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()};};
  try{
    const login=async username=>(await call('/auth/login','',{username,password:username==='admin'?'admin123':'123456'},'POST')).data.token;
    const admin=await login('admin'),bulog=await login('bulog'),bapenda=await login('bapenda'),pendidikan=await login('pendidikan');
    const sourceRecord=(await call('/workbooks',bulog)).data.workbooks[0],sourceUrl='/workbooks/'+sourceRecord.id;
    const sourceSheet=(await call(sourceUrl,bulog)).data.workbook.sheets[0],sourceBlocks=detectBlocks(sourceSheet);
    const sourceBlock=sourceBlocks.find(b=>b.rowIndexes.some(r=>!b.sectionRows.includes(r))),sourceRow=sourceBlock.rowIndexes.find(r=>!sourceBlock.sectionRows.includes(r));
    assert.equal((await call(sourceUrl+'/cell',bulog,{sheetIndex:0,rowIndex:sourceRow,colIndex:sourceBlock.columns[0],value:'Nilai instansi uji'},'PATCH')).status,200);
    const remainingIds=sourceBlocks.slice(1).map(b=>b.id);
    assert.equal((await call(sourceUrl+'/table',admin,{sheetIndex:0,tableId:sourceBlock.id,kind:'delete'},'PATCH')).status,200);
    assert.deepEqual(detectBlocks((await call(sourceUrl,admin)).data.workbook.sheets[0]).map(b=>b.id),remainingIds);
    const template={label:'Stok triwulanan',columns:['Indikator','2026 Triwulan III'],rowLabels:['Stok beras','Stok jagung']};
    const body={title:'Data mandiri BULOG',institution:'BULOG',table:template};
    assert.equal((await call('/workbooks',bulog,body,'POST')).status,403);
    assert.equal((await call('/workbooks',admin,{...body,table:{...template,columns:['Nilai','Nilai']}},'POST')).status,400);
    const created=await call('/workbooks',admin,body,'POST');assert.equal(created.status,201);
    const url='/workbooks/'+created.data.workbook.id;
    const edit={sheetIndex:0,rowIndex:1,colIndex:1,value:0};
    assert.equal((await call(url+'/cell',bulog,edit,'PATCH')).status,200);
    assert.equal((await call(url+'/cell',pendidikan,edit,'PATCH')).status,403);
    assert.equal((await call(url+'/cell',bulog,{...edit,rowIndex:0,value:'Judul disusupi'},'PATCH')).status,403);
    assert.equal((await call(url+'/row',bulog,{sheetIndex:0,tableId:'blok-1',values:['Tidak boleh']},'POST')).status,403);
    assert.equal((await call(url+'/column',bulog,{sheetIndex:0,tableId:'blok-1',label:'Tidak boleh'},'POST')).status,403);
    assert.equal((await call(url,bulog,{title:'Tidak boleh',institution:'BULOG'},'PATCH')).status,403);
    assert.equal((await call(url,bulog,null,'DELETE')).status,403);
    const manage=operation=>call(url+'/table',admin,{sheetIndex:0,tableId:'blok-1',...operation},'PATCH');
    assert.equal((await call(url+'/table',bulog,{sheetIndex:0,tableId:'blok-1',kind:'delete'},'PATCH')).status,403);
    assert.equal((await manage({kind:'renameColumn',colIndex:1,label:'2026 Triwulan IV'})).status,200);
    assert.equal((await manage({kind:'rename',label:'Stok akhir tahun'})).status,200);
    assert.equal((await call(url+'/column',admin,{sheetIndex:0,tableId:'blok-1',label:'Catatan instansi'},'POST')).status,200);
    assert.equal((await call(url+'/cell',bulog,{...edit,colIndex:2,value:'Diisi petugas'},'PATCH')).status,200);
    let wb=(await call(url,bulog)).data.workbook;assert.equal(wb.sheets[0].rows[1][1].v,0);assert.equal(wb.sheets[0].rows[1][2].v,'Diisi petugas');
    assert.equal(detectBlocks(wb.sheets[0])[0].label,'Stok akhir tahun');
    for(const colIndex of [0,1,2])assert.equal((await call(url+'/cell',bulog,{...edit,colIndex,value:null},'PATCH')).status,200);
    wb=(await call(url,bulog)).data.workbook;assert(detectBlocks(wb.sheets[0])[0].editableRowIndexes.includes(1));
    assert.equal((await call(url+'/cell',bulog,{...edit,value:0},'PATCH')).status,200);
    assert.equal((await call(url+'/cell',bulog,{...edit,colIndex:0,value:'Stok beras'},'PATCH')).status,200);
    assert.equal((await manage({kind:'deleteRow',rowIndex:2})).status,200);
    assert.equal((await call(url+'/cell',bulog,{...edit,rowIndex:2},'PATCH')).status,403);
    assert.equal((await manage({kind:'deleteColumn',colIndex:2})).status,200);
    assert.equal((await call(url+'/cell',bulog,{...edit,colIndex:2},'PATCH')).status,403);
    const extra=await call(url+'/table',admin,{...template,label:'Tabel kedua'},'POST');assert.equal(extra.status,201);assert.equal(extra.data.sheetIndex,1);
    assert.equal((await manage({kind:'delete'})).status,200);
    wb=(await call(url,bulog)).data.workbook;assert.equal(detectBlocks(wb.sheets[0]).length,0);assert.equal(detectBlocks(wb.sheets[1]).length,1);
    assert.equal((await call(url,admin,{title:'Data dipindahkan',institution:'Dinas Pendidikan'},'PATCH')).status,200);
    assert.equal((await call(url,bulog)).status,403);assert.equal((await call(url,pendidikan)).status,200);
    const upload=async csv=>{const form=new FormData();form.append('file',new Blob([csv]),'template-sama.csv');return call('/upload',bapenda,form,'POST');};
    const first=await upload('Indikator,Nilai 2026\nPendapatan,125\n'),second=await upload('Jenis,Volume,Harga\nPajak,2,300\n');
    assert.equal(first.status,200);assert.equal(second.status,200);assert.notEqual(first.data.workbook.id,second.data.workbook.id);
    const uploadUrl='/workbooks/'+first.data.workbook.id;
    const updateTitle=await call(uploadUrl,admin,{title:'Template pertama Bapenda',institution:'Bapenda'},'PATCH');assert.equal(updateTitle.status,200);
    assert.equal((await call(uploadUrl+'/cell',admin,{...edit,value:130},'PATCH')).status,200);
    const events=(await call('/notifications',admin)).data.audit;assert(events.some(e=>e.action==='EDIT_CELL'&&e.details.workbookId===first.data.workbook.id&&e.details.dataTitle==='Template pertama Bapenda'));
    assert.equal((await call(uploadUrl+'/cell',bapenda,edit,'PATCH')).status,403);
    assert.equal((await call(uploadUrl+'/table',bapenda,template,'POST')).status,403);
    assert.equal((await call(uploadUrl,bapenda,null,'DELETE')).status,403);
    const listed=(await call('/workbooks',bapenda)).data.workbooks;assert(listed.some(w=>w.id===first.data.workbook.id));assert(listed.some(w=>w.id===second.data.workbook.id));
    assert.equal((await call(url,admin,null,'DELETE')).status,200);assert.equal((await call(url,admin)).status,404);
    const listing=(await call('/workbooks',admin)).data;assert(!listing.workbooks.some(w=>w.id===created.data.workbook.id));assert(listing.institutions.includes('BULOG'));
    const restarted=createApp({dataDir,secret}).listen(0,'127.0.0.1');await new Promise(r=>restarted.on('listening',r));
    try{
      const next=`http://127.0.0.1:${restarted.address().port}/api`;
      assert.equal((await fetch(next+url,{headers:{Authorization:`Bearer ${admin}`}})).status,404);
      const persisted=await fetch(next+uploadUrl,{headers:{Authorization:`Bearer ${bapenda}`}}).then(r=>r.json());assert.equal(persisted.workbook.sheets[0].rows[1][1].v,130);
      const saved=JSON.parse(fs.readFileSync(path.join(dataDir,'db.json'),'utf8'));assert(saved.deletedWorkbooks[created.data.workbook.id]);assert.equal(saved.overrides[created.data.workbook.id]['0:1:1'].v,0);assert(saved.audit.some(a=>a.action==='DELETE_DATASET'&&a.details.dataTitle==='Data dipindahkan'));
    }finally{await new Promise(r=>restarted.close(r));}
  }finally{await new Promise(r=>server.close(r));}
});

test('notification recipients, read states, concurrent arrivals and history survive restart',async()=>{
  const dataDir=fs.mkdtempSync(path.join(os.tmpdir(),'pdrb-notification-test-')),secret='notification-test-secret';
  const server=createApp({dataDir,secret}).listen(0,'127.0.0.1');await new Promise(r=>server.on('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/api`;
  const call=async(url,token,body,method='GET')=>{const res=await fetch(base+url,{method,headers:{Authorization:`Bearer ${token}`,...(body&&!(body instanceof FormData)?{'Content-Type':'application/json'}:{})},body:body instanceof FormData?body:body?JSON.stringify(body):undefined});return {status:res.status,data:await res.json()};};
  try{
    const login=async username=>(await call('/auth/login','',{username,password:username==='admin'?'admin123':'123456'},'POST')).data.token;
    const admin=await login('admin'),bulog=await login('bulog'),esda=await login('esda'),bapenda=await login('bapenda');
    assert.equal((await call('/notifications/inbox',bulog)).data.unreadCount,0);
    const table={label:'Tabel notifikasi pertama',columns:['Indikator','Nilai'],rowLabels:['Beras']};
    const created=(await call('/workbooks',admin,{title:'Data uji pemberitahuan',institution:'BULOG',table},'POST')).data.workbook;
    const url='/workbooks/'+created.id;
    let own=(await call('/notifications',bulog)).data;
    assert.equal(own.unreadCount,1);assert(own.notifications[0].message.includes(table.label));assert(own.notifications[0].href.endsWith('?bagian=0'));
    assert.equal((await call('/notifications/inbox',esda)).data.notifications.length,0);
    assert.equal((await call('/notifications/inbox',admin)).data.notifications.length,0);
    const first=own.notifications[0].id;
    assert.equal((await call('/notifications/'+first+'/read',esda,null,'PATCH')).status,404);
    assert.equal((await call('/notifications/'+first+'/read',admin,null,'PATCH')).status,404);
    assert.equal((await call('/notifications/'+first+'/read',bulog,null,'PATCH')).status,200);
    assert.equal((await call('/notifications/inbox',bulog)).data.unreadCount,0);
    const edit={sheetIndex:0,rowIndex:1,colIndex:1,value:25};
    assert.equal((await call(url+'/cell',bulog,edit,'PATCH')).status,200);
    let adminInbox=(await call('/notifications/inbox',admin)).data;
    assert.equal(adminInbox.unreadCount,1);assert(adminInbox.notifications[0].message.includes('BULOG'));assert.equal(adminInbox.notifications[0].dataTitle,created.title);
    assert.equal((await call(url+'/cell',admin,{...edit,value:26},'PATCH')).status,200);
    assert.equal((await call('/notifications/inbox',admin)).data.notifications.length,1);
    await call(url+'/table',admin,{...table,label:'Tabel kedua'},'POST');
    const snapshot=(await call('/notifications/inbox',bulog)).data.notifications[0];assert(snapshot.href.endsWith('?bagian=1'));
    await call(url+'/table',admin,{...table,label:'Tabel ketiga'},'POST');
    const before=(await call('/notifications',bulog)).data.audit.length;
    assert.equal((await call('/notifications/read-all',esda,{throughId:snapshot.id},'POST')).status,404);
    assert.equal((await call('/notifications/read-all',bulog,{throughId:snapshot.id},'POST')).status,200);
    own=(await call('/notifications',bulog)).data;
    assert.equal(own.unreadCount,1);assert.equal(own.notifications[0].readAt,null);assert(own.notifications[1].readAt);assert.equal(own.audit.length,before);
    const latest=own.notifications[0].id;await call('/notifications/'+latest+'/read',bulog,null,'PATCH');
    const form=new FormData();form.append('file',new Blob(['Indikator,Nilai\nPajak,10\n']),'notif.csv');form.append('title','Pelaporan Bapenda');
    assert.equal((await call('/upload',bapenda,form,'POST')).status,200);
    adminInbox=(await call('/notifications/inbox',admin)).data;assert.equal(adminInbox.unreadCount,2);assert(adminInbox.notifications[0].message.includes('Bapenda'));assert.equal(adminInbox.notifications[0].dataTitle,'Pelaporan Bapenda');
    await call(url,admin,null,'DELETE');own=(await call('/notifications',bulog)).data;
    assert(own.notifications.every(n=>n.href===null));assert(own.notifications.every(n=>n.readAt));assert(own.audit.some(a=>a.action==='DELETE_DATASET'));
    const restarted=createApp({dataDir,secret}).listen(0,'127.0.0.1');await new Promise(r=>restarted.on('listening',r));
    try{
      const next=`http://127.0.0.1:${restarted.address().port}/api/notifications`;
      const persisted=await fetch(next,{headers:{Authorization:`Bearer ${bulog}`}}).then(r=>r.json());assert.equal(persisted.unreadCount,0);assert.equal(persisted.notifications.length,3);assert(persisted.notifications.every(n=>n.readAt));assert.equal(persisted.audit.length,own.audit.length);
      const adminPersisted=await fetch(next+'/inbox',{headers:{Authorization:`Bearer ${admin}`}}).then(r=>r.json());assert.equal(adminPersisted.unreadCount,2);
    }finally{await new Promise(r=>restarted.close(r));}
  }finally{await new Promise(r=>server.close(r));}
});

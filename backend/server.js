const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { randomUUID, createHash } = require('crypto');
const { readSheets } = require('./import-workbook.js');
const presentation=import('../src/lib/sheetPresentation.mjs');
const periodsModule=import('../src/lib/periods.mjs');
const labelsModule=import('../src/lib/datasetLabels.mjs');
const drasticModule=import('../src/lib/drasticChanges.mjs');
const quarterStatusModule=import('../src/lib/quarterStatus.mjs');

function createApp(options={}) {
if(!options.storage&&!options.dataDir)throw new Error('Penyimpanan PostgreSQL wajib untuk runtime. JSON hanya tersedia pada pengujian terisolasi.');
const JWT_SECRET = options.secret || process.env.JWT_SECRET || 'pdrb-local-development-secret-change-me';
const ROOT = __dirname;
const DATA_DIR = options.dataDir || process.env.PDRB_DATA_DIR || path.join(ROOT, 'data');
const SEED_PATH = options.seedPath || path.join(ROOT, 'data', 'workbooks.json');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const seed = options.storage?.seed || JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));

const institutionUsers = [
  ['admin','admin123','Administrator','admin'],
  ['dinas-pertanian','123456','Dinas Pertanian dan Ketahanan Pangan','institution'],
  ['esda','123456','ESDA','institution'],
  ['diskoperindag','123456','Diskoperindag','institution'],
  ['pln','123456','PLN','institution'],
  ['dlh','123456','Dinas Lingkungan Hidup','institution'],
  ['pdam','123456','PDAM','institution'],
  ['pupr','123456','Dinas PUPR','institution'],
  ['dpmptsp','123456','DPMPTSP','institution'],
  ['pertamina','123456','Pertamina Patra Niaga','institution'],
  ['dishub','123456','Dinas Perhubungan','institution'],
  ['pos','123456','PT Pos Indonesia dan Shopee Xpress','institution'],
  ['bulog','123456','BULOG','institution'],
  ['bpjs-kesehatan','123456','BPJS Kesehatan','institution'],
  ['bpjs-ketenagakerjaan','123456','BPJS Ketenagakerjaan','institution'],
  ['pegadaian','123456','PT Pegadaian','institution'],
  ['bkad','123456','Badan Keuangan dan Aset Daerah','institution'],
  ['dp3ap2kb','123456','DP3AP2KB','institution'],
  ['pendidikan','123456','Dinas Pendidikan','institution'],
  ['dinkes','123456','Dinas Kesehatan','institution'],
  ['bakesbangpol','123456','Bakesbangpol','institution'],
  ['pariwisata','123456','Dinas Pariwisata','institution'],
  ['bapenda','123456','Bapenda','institution'],
  ['atv','123456','Agropolitan TV','institution']
];

function loadDb() {
  if (!fs.existsSync(DB_PATH)) {
    const users = institutionUsers.map(([username,password,name,role]) => ({
      id: username,
      username,
      name,
      institution: role === 'admin' ? null : name,
      role,
      passwordHash: bcrypt.hashSync(password, 10)
    }));
    const db = { users, overrides: {}, addedRows: {}, uploadedWorkbooks: [], audit: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    return db;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
const db = options.storage?.db || loadDb();
function saveDb(){
  if(options.storage){options.storage.markDirty();return;}
  const pending=DB_PATH+'.tmp';
  fs.writeFileSync(pending,JSON.stringify(db,null,2));
  fs.renameSync(pending,DB_PATH);
}

function tokenFor(user){ return jwt.sign({ id:user.id, username:user.username, role:user.role, institution:user.institution }, JWT_SECRET, { expiresIn:'12h' }); }
function auth(req,res,next){
  const h=req.headers.authorization||'';
  const token=h.startsWith('Bearer ')?h.slice(7):null;
  if(!token) return res.status(401).json({message:'Autentikasi diperlukan'});
  try {
    const tokenUser=jwt.verify(token,JWT_SECRET,{algorithms:['HS256']});
    const current=db.users.find(u=>u.id===tokenUser.id);
    if(!current)return res.status(401).json({message:'Akun tidak tersedia'});
    const {passwordHash,...safe}=current;req.user=safe;next();
  } catch { return res.status(401).json({message:'Sesi tidak valid atau sudah kedaluwarsa'}); }
}
const validIndex=value=>Number.isInteger(value)&&value>=0;
const validValue=value=>value===null||typeof value==='boolean'||(typeof value==='number'&&Number.isFinite(value))||(typeof value==='string'&&value.length<=20000);
const admin=(req,res,next)=>req.user.role==='admin'?next():res.status(403).json({message:'Hanya administrator yang dapat mengubah data'});
function canAccessWorkbook(user, wb){ return user.role==='admin' || wb.institution===user.institution; }
const institutions=()=>[...new Set([...seed.workbooks.map(w=>w.institution),...db.users.map(u=>u.institution)].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
function findWorkbook(id){
  if(db.deletedWorkbooks?.[id])return undefined;
  const wb=seed.workbooks.find(w=>w.id===id)||db.uploadedWorkbooks.find(w=>w.id===id);
  return wb?{...wb,...db.workbookDetails?.[id]}:undefined;
}
const allWorkbooks=()=>[...seed.workbooks,...db.uploadedWorkbooks].map(w=>findWorkbook(w.id)).filter(Boolean);
function applyOverrides(wb){
  const copy=JSON.parse(JSON.stringify(wb));
  copy.sheets.push(...JSON.parse(JSON.stringify(db.extraSheets?.[wb.id]||[])));
  const columns=db.addedColumns?.[wb.id]||{};
  for(const si of Object.keys(columns)){
    const sheet=copy.sheets[Number(si)];
    if(!sheet) continue;
    for(const column of columns[si]){
      const colIndex=sheet.maxCol;
      sheet.rows.forEach((row,index)=>{while(row.length<colIndex)row.push(null);row[colIndex]=index===column.headerRow?column.label:null;});
      if(column.tableId){sheet.tableColumns||=[];sheet.tableColumns.push({...column,colIndex});}
      sheet.maxCol+=1;
    }
  }
  const adds=db.addedRows[wb.id]||{};
  for(const si of Object.keys(adds)){
    const sheet=copy.sheets[Number(si)];
    if(!sheet) continue;
    for(const added of adds[si]){
      const row=Array.isArray(added)?added:added.values;
      const normalized=row.slice(0,sheet.maxCol);
      while(normalized.length<sheet.maxCol) normalized.push(null);
      if(added.tableId){sheet.tableRows||=[];sheet.tableRows.push({rowIndex:sheet.rows.length,tableId:added.tableId,...(added.beforeRowIndex!=null?{beforeRowIndex:added.beforeRowIndex}:{})});}
      sheet.rows.push(normalized);
    }
  }
  const changes=db.overrides[wb.id]||{};
  for(const key of Object.keys(changes)){
    const [si,r,c]=key.split(':').map(Number);
    if(copy.sheets[si] && copy.sheets[si].rows[r] && c < copy.sheets[si].rows[r].length){
      copy.sheets[si].rows[r][c] = changes[key];
    }
  }
  copy.sheets.forEach((sheet,si)=>{sheet.maxRow=sheet.rows.length;sheet.tableState=db.tableState?.[wb.id]?.[si]||{};sheet.editedRows=db.editedRows?.[wb.id]?.[si]||[];});
  return copy;
}
const localMetadataCache=new Map();
const metadataCache=options.storage?new Proxy({}, {get:(_,name)=>{const cache=options.storage.cache();const value=cache[name];return typeof value==='function'?value.bind(cache):value;}}):localMetadataCache;
async function meta(w){
  if(metadataCache.has(w.id))return metadataCache.get(w.id);
  const {detectBlocks}=await presentation;
  const {workbookPeriods}=await periodsModule;
  const {datasetTitle}=await labelsModule;
  const blocksBySheet=w.sheets.map(detectBlocks);
  const periods=w.reportingYear&&w.reportingQuarter?[{year:String(w.reportingYear),quarter:String(w.reportingQuarter)}]:workbookPeriods(w,blocksBySheet);
  const years=[...new Set(periods.map(p=>p.year))];
  const result={id:w.id,file:w.file,title:datasetTitle(w,blocksBySheet),institution:w.institution,sector:w.sector,periods,
    periodYear:years.length===1?years[0]:null,periodQuarter:periods.length===1?periods[0].quarter:null};
  metadataCache.set(w.id,result);return result;
}
function audit(user, action, details){
  const source=details.workbookId?findWorkbook(details.workbookId):allWorkbooks().find(w=>w.file===details.workbook);
  if(source){details={workbookId:source.id,institution:source.institution,dataTitle:source.title||metadataCache.get(source.id)?.title||'Data pelaporan instansi',...details};}
  const event={id:randomUUID(),at:new Date().toISOString(),user:user.username,userName:user.name,userInstitution:user.institution,action,details};
  db.audit.unshift(event);db.audit=db.audit.slice(0,1000);
  let recipients=[],title='',message='';
  if(user.role==='admin'&&['CREATE_DATASET','ADD_TABLE'].includes(action)){
    recipients=db.users.filter(u=>u.role!=='admin'&&u.institution===details.institution);
    title='Tabel baru dari admin';message=`Admin menambahkan tabel ${details.sheet||details.dataTitle||'pelaporan'} pada ${details.dataTitle||'data instansi Anda'}.`;
  }else if(user.role!=='admin'&&['EDIT_CELL','UPLOAD_FILE','SUBMIT_REPORT'].includes(action)){
    recipients=db.users.filter(u=>u.role==='admin');
    title=action==='EDIT_CELL'?'Data instansi diperbarui':'Upload baru dari instansi';
    message=`${user.institution||user.name} ${action==='EDIT_CELL'?'mengisi atau mengedit data':'mengunggah data baru'} pada ${details.dataTitle||'data pelaporan instansi'}.`;
    if(action==='SUBMIT_REPORT'){title='Laporan dikumpulkan';message=`${user.institution} mengumpulkan laporan tahun ${details.year}, triwulan ${details.quarter}.`;}
    if(details.drasticChange){
      title='Perubahan data drastis';
      const change=details.drasticChange;
      message=`${user.institution||user.name}: ${change.indicator}, ${change.currentPeriod}, ${change.currentValue} dibanding ${change.previous.value} pada ${change.previous.period}. Alasan: ${change.reason}`;
    }
  }
  if(recipients.length){
    db.notifications||=[];
    for(const recipient of recipients)db.notifications.unshift({id:randomUUID(),eventId:event.id,recipientId:recipient.id,at:event.at,readAt:null,title,message,actorName:user.name,actorInstitution:user.institution,workbookId:details.workbookId,dataTitle:details.dataTitle,sheet:details.sheet,sheetIndex:details.sheetIndex});
    db.notifications=db.notifications.slice(0,5000);
  }
  metadataCache.clear();saveDb();
}
const textValid=(value,max)=>typeof value==='string'&&value.trim().length>0&&value.length<=max;
function templateSheet(body,id){
  const {label,columns,rowLabels}=body||{};
  if(!textValid(label,160)||!Array.isArray(columns)||columns.length<2||columns.length>100||!columns.every(c=>textValid(c,200))||new Set(columns.map(c=>c.trim().toLowerCase())).size!==columns.length||!Array.isArray(rowLabels)||!rowLabels.length||rowLabels.length>1000||!rowLabels.every(r=>textValid(r,200)))return null;
  const rows=[columns.map(c=>c.trim()),...rowLabels.map(r=>[r.trim(),...Array(columns.length-1).fill(null)])];
  return {id,name:label.trim(),manualHeaders:true,rows,maxCol:columns.length,maxRow:rows.length,mergedRanges:[]};
}
function tableState(wb,si,tableId){
  db.tableState||={};db.tableState[wb.id]||={};db.tableState[wb.id][si]||={};
  return db.tableState[wb.id][si][tableId]||=( {} );
}

const app=express();
app.use(cors());
app.use(express.json({limit:'20mb'}));
if(options.storage)app.use('/api',options.storage.middleware());
const upload=multer({dest:UPLOAD_DIR,limits:{fileSize:25*1024*1024}});

app.get('/api/health',(req,res)=>res.json({ok:true,service:'pdrb-local-api',storage:options.storage?.kind||'json-test',schema:options.storage?'pdrb':null,workbooks:allWorkbooks().length}));
app.post('/api/auth/login',(req,res)=>{
  const {username,password}=req.body||{};
  const user=db.users.find(u=>u.username===username);
  if(typeof username!=='string'||typeof password!=='string'||username.length>100||password.length>200||!user || !bcrypt.compareSync(password,user.passwordHash)) return res.status(401).json({message:'Username atau password salah'});
  const safe={id:user.id,username:user.username,name:user.name,institution:user.institution,role:user.role};
  res.json({token:tokenFor(safe),user:safe});
});
app.get('/api/me',auth,(req,res)=>res.json({user:req.user}));

const reportingPeriod=body=>['string','number'].includes(typeof body?.year)&&['string','number'].includes(typeof body?.quarter)&&/^20\d{2}$/.test(String(body.year))&&/^[1-4]$/.test(String(body.quarter));
function recordSubmission(user,wb,year,quarter){
  db.submissions||={};
  db.submissions[wb.institution]||={};
  db.submissions[wb.institution][`${year}:${quarter}`]||={};
  db.submissions[wb.institution][`${year}:${quarter}`][wb.id]={year:String(year),quarter:String(quarter),at:new Date().toISOString(),by:user.name,workbookId:wb.id};
}
app.get('/api/reporting-status',auth,async(req,res)=>{
  const year=String(req.query.year||new Date().getFullYear());
  if(!/^20\d{2}$/.test(year))return res.status(400).json({message:'Tahun tidak valid'});
  const names=req.user.role==='admin'?institutions():[req.user.institution];
  const {quarterStatus}=await quarterStatusModule;
  const workbooks=allWorkbooks().filter(w=>canAccessWorkbook(req.user,w)).map(w=>({id:w.id,institution:w.institution,quarters:quarterStatus(applyOverrides(w),year)}));
  const rows=names.map(institution=>({institution,quarters:[1,2,3,4].map(q=>{
    const entries=workbooks.filter(w=>w.institution===institution).map(w=>w.quarters[q-1]);
    const status=entries.some(entry=>entry.status==='filled')?'filled':entries.some(entry=>entry.status==='unknown')?'unknown':'empty';
    return {quarter:q,submitted:status==='filled',status};
  })}));
  res.json({year,rows,workbooks});
});
app.post('/api/workbooks/:id/submit',auth,(req,res)=>{
  const wb=findWorkbook(req.params.id);
  if(!wb)return res.status(404).json({message:'Dataset tidak ditemukan'});
  if(!canAccessWorkbook(req.user,wb))return res.status(403).json({message:'Pengumpulan manual tidak tersedia untuk instansi lain'});
  if(!reportingPeriod(req.body))return res.status(400).json({message:'Pilih tahun dan triwulan laporan'});
  recordSubmission(req.user,wb,req.body.year,req.body.quarter);
  audit(req.user,'SUBMIT_REPORT',{workbookId:wb.id,institution:wb.institution,year:String(req.body.year),quarter:String(req.body.quarter)});
  res.json({ok:true});
});

app.get('/api/workbooks',auth,async(req,res)=>{
  const all=allWorkbooks();
  const filtered=all.filter(w=>canAccessWorkbook(req.user,w));
  const workbooks=await Promise.all(filtered.map(w=>meta(applyOverrides(w))));
  res.json({workbooks,count:workbooks.length,...(req.user.role==='admin'?{institutions:institutions()}: {})});
});

app.post('/api/workbooks',auth,admin,async(req,res)=>{
  const {title,institution,table}=req.body||{},id=`manual-${randomUUID()}`;
  const sheet=templateSheet(table,`${id}-0`);
  if(!textValid(title,160)||!institutions().includes(institution)||!sheet)return res.status(400).json({message:'Isi judul, instansi, nama tabel, minimal dua kolom unik, dan minimal satu indikator baris.'});
  const wb={id,title:title.trim(),file:`${id}.json`,institution,sector:'Tabel admin',sheets:[sheet]};
  db.uploadedWorkbooks.push(wb);audit(req.user,'CREATE_DATASET',{workbookId:wb.id,workbook:wb.file,dataTitle:wb.title,institution,sheet:sheet.name,sheetIndex:0});
  res.status(201).json({workbook:await meta(wb)});
});

app.patch('/api/workbooks/:id',auth,admin,(req,res)=>{
  const wb=findWorkbook(req.params.id);if(!wb)return res.status(404).json({message:'Dataset tidak ditemukan'});
  const {title,institution}=req.body||{};
  if(!textValid(title,160)||!institutions().includes(institution))return res.status(400).json({message:'Judul dan instansi terdaftar wajib diisi'});
  db.workbookDetails||={};db.workbookDetails[wb.id]={title:title.trim(),institution};
  audit(req.user,'UPDATE_DATASET',{workbookId:wb.id,workbook:wb.file,dataTitle:title.trim(),institution,previousInstitution:wb.institution});res.json({ok:true});
});

app.delete('/api/workbooks/:id',auth,admin,async(req,res)=>{
  const wb=findWorkbook(req.params.id);if(!wb)return res.status(404).json({message:'Dataset tidak ditemukan'});
  const {datasetTitle}=await labelsModule;
  db.deletedWorkbooks||={};db.deletedWorkbooks[wb.id]={at:new Date().toISOString(),user:req.user.username};
  audit(req.user,'DELETE_DATASET',{workbookId:wb.id,workbook:wb.file,dataTitle:datasetTitle(wb),institution:wb.institution});res.json({ok:true});
});

app.get('/api/workbooks/:id',auth,async(req,res)=>{
  const wb=findWorkbook(req.params.id);
  if(!wb) return res.status(404).json({message:'Dataset tidak ditemukan'});
  if(!canAccessWorkbook(req.user,wb)) return res.status(403).json({message:'Anda tidak memiliki akses ke instansi lain'});
  const workbook=applyOverrides(wb);
  res.json({workbook:{...workbook,...await meta(workbook),...(req.user.role==='admin'?{institutions:institutions()}: {})}});
});

app.patch('/api/workbooks/:id/cell',auth,async(req,res)=>{
  const wb=findWorkbook(req.params.id); if(!wb) return res.status(404).json({message:'Dataset tidak ditemukan'});
  if(!canAccessWorkbook(req.user,wb)) return res.status(403).json({message:'Akses ditolak'});
  const {sheetIndex,rowIndex,colIndex,value,reason,comparisonToken}=req.body||{};
  if(!validIndex(sheetIndex)||!validIndex(rowIndex)||!validIndex(colIndex)||!validValue(value)) return res.status(400).json({message:'Lokasi atau nilai sel tidak valid'});
  const sheet=applyOverrides(wb).sheets[sheetIndex];
  if(!sheet || !sheet.rows[rowIndex]) return res.status(400).json({message:'Cell tidak ditemukan'});
  if(colIndex>=sheet.maxCol) return res.status(400).json({message:'Kolom tidak ditemukan'});
  const {detectBlocks,mergedCells}=await presentation;
  const block=detectBlocks(sheet).find(b=>b.editableRowIndexes.includes(rowIndex)&&b.schemaColumns.includes(colIndex)&&!b.sectionRows.includes(rowIndex));
  if(!block)return res.status(403).json({message:'Hanya sel pada baris data aktif yang dapat diedit. Judul dan struktur dikelola admin.'});
  const merge=mergedCells(sheet).find(m=>rowIndex>=m.r&&rowIndex<=m.endRow&&colIndex>=m.c&&colIndex<=m.endCol);
  if(merge&&(rowIndex!==merge.r||colIndex!==merge.c))return res.status(400).json({message:'Edit nilai sel utama pada area gabungan'});
  const clean = value === '' ? null : value;
  let drasticChange=null;
  if(req.user.role!=='admin'){
    const {assessDrasticChange}=await drasticModule;
    const current=applyOverrides(wb);
    const change=assessDrasticChange(current,{sheetIndex,rowIndex,colIndex,value:clean},allWorkbooks().filter(w=>w.institution===wb.institution).map(applyOverrides));
    if(change){
      const token=createHash('sha256').update(JSON.stringify({workbookId:wb.id,sheetIndex,rowIndex,colIndex,change})).digest('hex');
      if(typeof reason!=='string'||!reason.trim()||reason.length>2000||comparisonToken!==token){
        return res.status(422).json({code:'DRASTIC_CHANGE_REASON_REQUIRED',message:'Perubahan drastis memerlukan alasan. Periksa nilai pembanding sebelum menyimpan.',change:{...change,comparisonToken:token}});
      }
      drasticChange={...change,reason:reason.trim()};
    }
  }
  if(!db.overrides[wb.id]) db.overrides[wb.id]={};
  db.overrides[wb.id][`${sheetIndex}:${rowIndex}:${colIndex}`] = typeof clean === 'number' ? {v:clean,t:'number',calc:null,fmt:'General'} : {v:clean,t:'string',calc:null,fmt:'General'};
  db.editedRows||={};db.editedRows[wb.id]||={};db.editedRows[wb.id][sheetIndex]||=[];
  if(!db.editedRows[wb.id][sheetIndex].some(r=>r.rowIndex===rowIndex))db.editedRows[wb.id][sheetIndex].push({rowIndex,tableId:block.id});
  audit(req.user,'EDIT_CELL',{workbookId:wb.id,workbook:wb.file,institution:wb.institution,sheet:sheet.name,sheetIndex,row:rowIndex+1,col:colIndex+1,...(drasticChange?{drasticChange}:{})});
  res.json({ok:true});
});

app.post('/api/workbooks/:id/row',auth,admin,async(req,res)=>{
  const wb=findWorkbook(req.params.id); if(!wb) return res.status(404).json({message:'Dataset tidak ditemukan'});
  if(req.user.role!=='admin') return res.status(403).json({message:'Hanya administrator yang dapat menambahkan baris'});
  if(!canAccessWorkbook(req.user,wb)) return res.status(403).json({message:'Akses ditolak'});
  const {sheetIndex,values,tableId,beforeRowIndex}=req.body||{}; const sheet=applyOverrides(wb).sheets[sheetIndex];
  if(!validIndex(sheetIndex)||!sheet || !Array.isArray(values)||!values.every(validValue)||!values.some(v=>v!==null&&String(v).trim()!=='')) return res.status(400).json({message:'Isi sedikitnya satu nilai pada baris baru'});
  const {detectBlocks}=await presentation;
  const block=detectBlocks(sheet).find(b=>b.id===tableId);
  if(!block)return res.status(400).json({message:'Pilih tabel tujuan yang valid'});
  if(beforeRowIndex!=null&&(!validIndex(beforeRowIndex)||!block.editableRowIndexes.includes(beforeRowIndex)))return res.status(400).json({message:'Pilih posisi baris yang tersedia pada tabel tujuan'});
  if(values.some((v,c)=>v!==null&&String(v).trim()!==''&&!block.schemaColumns.includes(c)))return res.status(400).json({message:'Nilai berada di luar kolom tabel tujuan'});
  const columnCount=sheet.maxCol;
  const row=values.slice(0,columnCount).map(v=>v===''?null:{v,t:typeof v==='number'?'number':'string',calc:null,fmt:'General'});
  while(row.length<columnCount) row.push(null);
  if(!db.addedRows[wb.id]) db.addedRows[wb.id]={};
  if(!db.addedRows[wb.id][sheetIndex]) db.addedRows[wb.id][sheetIndex]=[];
  const rowIndex=sheet.rows.length;
  db.addedRows[wb.id][sheetIndex].push({values:row,tableId,...(beforeRowIndex!=null?{beforeRowIndex}:{})});
  audit(req.user,'ADD_ROW',{workbookId:wb.id,workbook:wb.file,sheet:sheet.name,table:block.label});
  res.json({ok:true,rowIndex});
});

app.post('/api/workbooks/:id/column',auth,admin,async(req,res)=>{
  const wb=findWorkbook(req.params.id); if(!wb) return res.status(404).json({message:'Dataset tidak ditemukan'});
  if(req.user.role!=='admin') return res.status(403).json({message:'Hanya administrator yang dapat menambahkan kolom'});
  const {sheetIndex,label,tableId}=req.body||{}; const sheet=applyOverrides(wb).sheets[sheetIndex];
  if(!validIndex(sheetIndex)||!sheet||typeof label!=='string'||!label.trim()||label.length>200) return res.status(400).json({message:'Nama kolom wajib diisi, maksimal 200 karakter'});
  const {detectBlocks}=await presentation;
  const block=detectBlocks(sheet).find(b=>b.id===tableId);
  if(!block)return res.status(400).json({message:'Pilih tabel tujuan yang valid'});
  if(block.schemaLabels.some(existing=>existing.toLowerCase()===label.trim().toLowerCase()))return res.status(400).json({message:'Nama kolom sudah digunakan pada tabel ini'});
  const headerRow=block.headerRows[0]??-1;
  if(!db.addedColumns) db.addedColumns={};
  if(!db.addedColumns[wb.id]) db.addedColumns[wb.id]={};
  if(!db.addedColumns[wb.id][sheetIndex]) db.addedColumns[wb.id][sheetIndex]=[];
  db.addedColumns[wb.id][sheetIndex].push({headerRow,label:label.trim(),tableId});
  audit(req.user,'ADD_COLUMN',{workbookId:wb.id,workbook:wb.file,sheet:sheet.name,label:String(label).trim()});
  res.json({ok:true});
});

app.post('/api/workbooks/:id/table',auth,admin,(req,res)=>{
  const wb=findWorkbook(req.params.id);if(!wb)return res.status(404).json({message:'Dataset tidak ditemukan'});
  const sheet=templateSheet(req.body,`table-${randomUUID()}`);
  if(!sheet)return res.status(400).json({message:'Isi nama tabel, minimal dua kolom unik, dan minimal satu indikator baris'});
  db.extraSheets||={};db.extraSheets[wb.id]||=[];const sheetIndex=wb.sheets.length+db.extraSheets[wb.id].length;
  db.extraSheets[wb.id].push(sheet);audit(req.user,'ADD_TABLE',{workbookId:wb.id,workbook:wb.file,institution:wb.institution,sheet:sheet.name,sheetIndex});
  res.status(201).json({ok:true,sheetIndex});
});

app.patch('/api/workbooks/:id/table',auth,admin,async(req,res)=>{
  const wb=findWorkbook(req.params.id);if(!wb)return res.status(404).json({message:'Dataset tidak ditemukan'});
  const {sheetIndex,tableId,kind,label,rowIndex,colIndex}=req.body||{};
  const sheet=validIndex(sheetIndex)?applyOverrides(wb).sheets[sheetIndex]:null;
  const {detectBlocks}=await presentation;const block=sheet&&detectBlocks(sheet).find(b=>b.id===tableId);
  if(!block)return res.status(400).json({message:'Tabel tujuan tidak tersedia'});
  const valid=['rename','delete','deleteRow','deleteColumn','renameColumn','renameRow'];
  if(!valid.includes(kind))return res.status(400).json({message:'Tindakan tidak valid'});
  if(['rename','renameColumn','renameRow'].includes(kind)&&!textValid(label,200))return res.status(400).json({message:'Nama wajib diisi, maksimal 200 karakter'});
  if(['deleteRow','renameRow'].includes(kind)&&(!validIndex(rowIndex)||!block.editableRowIndexes.includes(rowIndex)||block.sectionRows.includes(rowIndex)))return res.status(400).json({message:'Pilih baris data yang tersedia'});
  if(['deleteColumn','renameColumn'].includes(kind)&&(!validIndex(colIndex)||!block.schemaColumns.includes(colIndex)))return res.status(400).json({message:'Pilih kolom yang tersedia'});
  if(kind==='deleteColumn'&&block.schemaColumns.length<=1)return res.status(400).json({message:'Kolom terakhir tidak dapat dihapus. Hapus tabel jika tidak diperlukan.'});
  if(kind==='renameColumn'&&block.schemaLabels.some((name,i)=>block.schemaColumns[i]!==colIndex&&name.toLowerCase()===label.trim().toLowerCase()))return res.status(400).json({message:'Nama kolom sudah digunakan pada tabel ini'});
  const state=tableState(wb,sheetIndex,tableId);
  if(kind==='rename')state.label=label.trim();
  if(kind==='delete')state.deleted=true;
  if(kind==='deleteRow'){state.deletedRows||=[];state.deletedRows.push(rowIndex);}
  if(kind==='deleteColumn'){state.deletedColumns||=[];state.deletedColumns.push(colIndex);}
  if(kind==='renameColumn'){state.columnLabels||={};state.columnLabels[colIndex]=label.trim();}
  if(kind==='renameRow'){
    const descriptor=/^(no\.?|nomor|kode rekening)$/i.test(block.schemaLabels[0]||'')&&block.schemaColumns.length>1?block.schemaColumns[1]:block.schemaColumns[0];
    db.overrides[wb.id]||={};db.overrides[wb.id][`${sheetIndex}:${rowIndex}:${descriptor}`]={v:label.trim(),t:'string',calc:null,fmt:'General'};
  }
  audit(req.user,{rename:'RENAME_TABLE',delete:'DELETE_TABLE',deleteRow:'DELETE_ROW',deleteColumn:'DELETE_COLUMN',renameColumn:'RENAME_COLUMN',renameRow:'RENAME_ROW'}[kind],{workbookId:wb.id,workbook:wb.file,institution:wb.institution,sheet:sheet.name,table:block.label,row:rowIndex,col:colIndex,label});
  res.json({ok:true});
});

app.post('/api/upload',auth,(req,res,next)=>req.user.role==='admin'||req.user.institution==='Bapenda'?next():res.status(403).json({message:'Upload hanya tersedia untuk admin dan Bapenda'}),upload.single('file'),async(req,res)=>{
  if(!req.file) return res.status(400).json({message:'File tidak ditemukan'});
  const removeTemporaryFile=()=>{ try{fs.unlinkSync(req.file.path)}catch{} };
  const extension=path.extname(req.file.originalname).toLowerCase();
  const title=req.body.title;
  if(!reportingPeriod(req.body)){removeTemporaryFile();return res.status(400).json({message:'Pilih tahun dan triwulan pelaporan sebelum mengunggah'});}
  if(title!==undefined&&(typeof title!=='string'||title.length>160)){removeTemporaryFile();return res.status(400).json({message:'Judul data maksimal 160 karakter'});}
  if(!['.xlsx','.xls','.csv'].includes(extension)) { removeTemporaryFile(); return res.status(400).json({message:'Format file harus Excel (.xlsx/.xls) atau CSV'}); }
  if(req.user.role!=='admin' && req.user.institution!=='Bapenda') { removeTemporaryFile(); return res.status(403).json({message:'Upload file hanya tersedia untuk Bapenda'}); }
  if(req.user.role!=='admin' && req.body.institution&&req.body.institution!==req.user.institution) { removeTemporaryFile(); return res.status(403).json({message:'Instansi upload tidak sesuai akun'}); }
  const institution=req.user.role==='admin'?(req.body.institution||'Belum dipetakan'):req.user.institution;
  if(!seed.workbooks.some(w=>w.institution===institution)){removeTemporaryFile();return res.status(400).json({message:'Pilih instansi tujuan yang terdaftar'});}
  try{
    const id=`upload-${randomUUID()}`;
    const sheets=readSheets(req.file.path,id);
    if(!sheets.some(s=>s.rows.length))throw new Error('File kosong. Pilih file yang memiliki judul atau data.');
    const {detectBlocks}=await presentation;
    sheets.forEach(sheet=>{sheet.headerGroups=detectBlocks(sheet).map(block=>block.headerRows);});
    const record={id,file:req.file.originalname,title:title?.trim()||undefined,institution,pdrbCode:null,sector:'Upload lokal',reportingYear:String(req.body.year),reportingQuarter:String(req.body.quarter),sheets};
    db.uploadedWorkbooks.push(record);recordSubmission(req.user,record,req.body.year,req.body.quarter); audit(req.user,'UPLOAD_FILE',{file:req.file.originalname,workbookId:id,institution,dataTitle:(await meta(record)).title,year:record.reportingYear,quarter:record.reportingQuarter});
    removeTemporaryFile(); res.json({ok:true,workbook:await meta(record)});
  }catch(e){ removeTemporaryFile(); res.status(400).json({message:`Gagal membaca Excel: ${e.message}`}); }
});

async function presentAudit(items,user){
  const sources=new Map(allWorkbooks().map(w=>[w.file,w]));
  const {datasetTitle}=await labelsModule;
  return Promise.all(items.map(async item=>{
    const source=item.details?.workbookId?findWorkbook(item.details.workbookId):sources.get(item.details?.workbook||item.details?.file);
    return {...item,userName:item.userName||db.users.find(u=>u.username===item.user)?.name||item.user,details:{...item.details,dataTitle:item.details?.dataTitle||(source&&canAccessWorkbook(user,source)?datasetTitle(source):'Data pelaporan instansi')}};
  }));
}
function auditFor(user){
  if(user.role==='admin')return db.audit;
  const ownIds=new Set(db.users.filter(u=>u.institution===user.institution).map(u=>u.username));
  const ownFiles=new Set(allWorkbooks().filter(w=>w.institution===user.institution).map(w=>w.file));
  return db.audit.filter(x=>x.details?.institution?x.details.institution===user.institution:(ownIds.has(x.user)||ownFiles.has(x.details?.workbook)));
}
function inboxFor(user){
  const own=(db.notifications||[]).filter(n=>n.recipientId===user.id),latest=auditFor(user)[0];
  const notifications=own.slice(0,200).map(({recipientId,...notification})=>{
    const wb=findWorkbook(notification.workbookId);
    return {...notification,href:wb&&canAccessWorkbook(user,wb)?`/data/${encodeURIComponent(wb.id)}${validIndex(notification.sheetIndex)?'?bagian='+notification.sheetIndex:''}`:null};
  });
  return {notifications,unreadCount:own.filter(n=>!n.readAt).length,historyVersion:latest?.id||latest?.at||''};
}
app.get('/api/notifications/inbox',auth,(req,res)=>res.json(inboxFor(req.user)));
app.get('/api/notifications',auth,async(req,res)=>{
  res.json({...inboxFor(req.user),audit:await presentAudit(auditFor(req.user),req.user)});
});
app.patch('/api/notifications/:id/read',auth,(req,res)=>{
  const notification=(db.notifications||[]).find(n=>n.id===req.params.id&&n.recipientId===req.user.id);
  if(!notification)return res.status(404).json({message:'Notifikasi tidak ditemukan'});
  if(!notification.readAt){notification.readAt=new Date().toISOString();saveDb();}
  res.json({ok:true});
});
app.post('/api/notifications/read-all',auth,(req,res)=>{
  const notifications=db.notifications||[],index=notifications.findIndex(n=>n.id===req.body?.throughId&&n.recipientId===req.user.id);
  if(index<0)return res.status(404).json({message:'Daftar notifikasi berubah. Muat ulang sebelum menandai dibaca.'});
  const at=new Date().toISOString();
  notifications.slice(index).forEach(n=>{if(n.recipientId===req.user.id&&!n.readAt)n.readAt=at;});saveDb();res.json({ok:true});
});

app.get('/api/admin/audit',auth,(req,res)=>{ if(req.user.role!=='admin') return res.status(403).json({message:'Admin only'}); res.json({audit:db.audit}); });

app.use('/api',(req,res)=>res.status(404).json({message:'Endpoint tidak ditemukan'}));
app.use((error,req,res,next)=>{
  if(req.file?.path&&fs.existsSync(req.file.path))fs.unlinkSync(req.file.path);
  if(error instanceof multer.MulterError)return res.status(400).json({message:error.code==='LIMIT_FILE_SIZE'?'Ukuran file maksimal 25 MB':'Unggah satu file Excel atau CSV'});
  if(error.type==='entity.parse.failed')return res.status(400).json({message:'Format permintaan tidak valid'});
  console.error(error);
  res.status(500).json({message:'Data belum dapat diproses. Coba lagi.'});
});
const dist=path.join(__dirname,'..','dist');
if(fs.existsSync(dist)){ app.use(express.static(dist)); app.use((req,res)=>req.method==='GET'&&req.accepts('html')?res.sendFile(path.join(dist,'index.html')):res.status(404).end()); }
return app;
}
module.exports={createApp};
async function start(){
  const {createPool,jwtSecret}=require('./database/config');
  const {createPostgresStorage}=require('./database/storage');
  const pool=createPool(),storage=createPostgresStorage(pool);
  try{
    await storage.transaction(false,()=>{});
    const port=process.env.PORT||5012,host=process.env.HOST||'127.0.0.1';
    const server=createApp({storage,secret:jwtSecret()}).listen(port,host,()=>console.log(`PDRB API running at http://${host}:${server.address().port} (PostgreSQL, schema pdrb)`));
    server.on('error',async error=>{console.error('API gagal dijalankan:',error.code);await pool.end();process.exitCode=1;});
    const shutdown=()=>{server.close(async()=>{await pool.end();process.exit(0);});};
    process.once('SIGINT',shutdown);process.once('SIGTERM',shutdown);
    return server;
  }catch(error){await pool.end();throw error;}
}
module.exports.start=start;
if(require.main===module)start().catch(error=>{console.error('Backend gagal dijalankan:',error.code||error.message);process.exitCode=1;});

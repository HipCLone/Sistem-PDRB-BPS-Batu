const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const XLSX = require('xlsx');

const PORT = process.env.PORT || 8787;
const JWT_SECRET = process.env.JWT_SECRET || 'pdrb-local-development-secret-change-me';
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const SEED_PATH = path.join(DATA_DIR, 'workbooks.json');
const DB_PATH = path.join(DATA_DIR, 'db.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));

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
let db = loadDb();
function saveDb(){ fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

function tokenFor(user){ return jwt.sign({ id:user.id, username:user.username, role:user.role, institution:user.institution }, JWT_SECRET, { expiresIn:'12h' }); }
function auth(req,res,next){
  const h=req.headers.authorization||'';
  const token=h.startsWith('Bearer ')?h.slice(7):null;
  if(!token) return res.status(401).json({message:'Autentikasi diperlukan'});
  try { req.user=jwt.verify(token,JWT_SECRET); next(); } catch { return res.status(401).json({message:'Sesi tidak valid atau sudah kedaluwarsa'}); }
}
function canAccessWorkbook(user, wb){ return user.role==='admin' || wb.institution===user.institution; }
function findWorkbook(id){ return seed.workbooks.find(w=>w.id===id) || db.uploadedWorkbooks.find(w=>w.id===id); }
function applyOverrides(wb){
  const copy=JSON.parse(JSON.stringify(wb));
  const changes=db.overrides[wb.id]||{};
  for(const key of Object.keys(changes)){
    const [si,r,c]=key.split(':').map(Number);
    if(copy.sheets[si] && copy.sheets[si].rows[r] && c < copy.sheets[si].rows[r].length){
      copy.sheets[si].rows[r][c] = changes[key];
    }
  }
  const adds=db.addedRows[wb.id]||{};
  for(const si of Object.keys(adds)) copy.sheets[Number(si)].rows.push(...adds[si]);
  return copy;
}
function meta(w){ return {id:w.id,file:w.file,institution:w.institution,pdrbCode:w.pdrbCode,sector:w.sector,status:w.status,sheetCount:w.sheets.length,sheets:w.sheets.map(s=>({id:s.id,name:s.name,rows:s.maxRow,cols:s.maxCol}))}; }
function audit(user, action, details){ db.audit.unshift({at:new Date().toISOString(),user:user.username,action,details}); db.audit=db.audit.slice(0,1000); saveDb(); }

const app=express();
app.use(cors());
app.use(express.json({limit:'20mb'}));
const upload=multer({dest:UPLOAD_DIR,limits:{fileSize:25*1024*1024}});

app.get('/api/health',(req,res)=>res.json({ok:true,service:'pdrb-local-api',workbooks:seed.workbooks.length+db.uploadedWorkbooks.length}));
app.post('/api/auth/login',(req,res)=>{
  const {username,password}=req.body||{};
  const user=db.users.find(u=>u.username===username);
  if(!user || !bcrypt.compareSync(password||'',user.passwordHash)) return res.status(401).json({message:'Username atau password salah'});
  const safe={id:user.id,username:user.username,name:user.name,institution:user.institution,role:user.role};
  res.json({token:tokenFor(safe),user:safe});
});
app.get('/api/me',auth,(req,res)=>res.json({user:req.user}));

app.get('/api/workbooks',auth,(req,res)=>{
  const all=[...seed.workbooks,...db.uploadedWorkbooks];
  const filtered=all.filter(w=>canAccessWorkbook(req.user,w));
  const q=(req.query.q||'').toLowerCase();
  const result=filtered.filter(w=>!q || `${w.file} ${w.institution} ${w.sector} ${w.pdrbCode||''}`.toLowerCase().includes(q));
  res.json({workbooks:result.map(meta),count:result.length});
});

app.get('/api/workbooks/:id',auth,(req,res)=>{
  const wb=findWorkbook(req.params.id);
  if(!wb) return res.status(404).json({message:'Dataset tidak ditemukan'});
  if(!canAccessWorkbook(req.user,wb)) return res.status(403).json({message:'Anda tidak memiliki akses ke instansi lain'});
  res.json({workbook:applyOverrides(wb)});
});

app.patch('/api/workbooks/:id/cell',auth,(req,res)=>{
  const wb=findWorkbook(req.params.id); if(!wb) return res.status(404).json({message:'Dataset tidak ditemukan'});
  if(!canAccessWorkbook(req.user,wb)) return res.status(403).json({message:'Akses ditolak'});
  const {sheetIndex,rowIndex,colIndex,value}=req.body||{};
  if(!Number.isInteger(sheetIndex)||!Number.isInteger(rowIndex)||!Number.isInteger(colIndex)) return res.status(400).json({message:'Lokasi cell tidak valid'});
  const sheet=wb.sheets[sheetIndex]; if(!sheet || !sheet.rows[rowIndex]) return res.status(400).json({message:'Cell tidak ditemukan'});
  if(colIndex>=sheet.rows[rowIndex].length) return res.status(400).json({message:'Kolom tidak ditemukan'});
  const clean = value === '' ? null : value;
  if(!db.overrides[wb.id]) db.overrides[wb.id]={};
  db.overrides[wb.id][`${sheetIndex}:${rowIndex}:${colIndex}`] = typeof clean === 'number' ? {v:clean,t:'number',calc:null,fmt:'General'} : {v:clean,t:'string',calc:null,fmt:'General'};
  audit(req.user,'EDIT_CELL',{workbook:wb.file,sheet:sheet.name,row:rowIndex+1,col:colIndex+1});
  res.json({ok:true});
});

app.post('/api/workbooks/:id/row',auth,(req,res)=>{
  const wb=findWorkbook(req.params.id); if(!wb) return res.status(404).json({message:'Dataset tidak ditemukan'});
  if(!canAccessWorkbook(req.user,wb)) return res.status(403).json({message:'Akses ditolak'});
  const {sheetIndex,values}=req.body||{}; const sheet=wb.sheets[sheetIndex];
  if(!sheet || !Array.isArray(values)) return res.status(400).json({message:'Data baris tidak valid'});
  const row=values.map(v=>v===''?null:{v,t:typeof v==='number'?'number':'string',calc:null,fmt:'General'});
  if(!db.addedRows[wb.id]) db.addedRows[wb.id]={};
  if(!db.addedRows[wb.id][sheetIndex]) db.addedRows[wb.id][sheetIndex]=[];
  db.addedRows[wb.id][sheetIndex].push(row);
  audit(req.user,'ADD_ROW',{workbook:wb.file,sheet:sheet.name});
  res.json({ok:true});
});

app.post('/api/upload',auth,upload.single('file'),(req,res)=>{
  if(!req.file) return res.status(400).json({message:'File tidak ditemukan'});
  if(req.user.role!=='admin' && req.body.institution!==req.user.institution) return res.status(403).json({message:'Instansi upload tidak sesuai akun'});
  const institution=req.user.role==='admin'?(req.body.institution||'Belum dipetakan'):req.user.institution;
  try{
    const wb=XLSX.readFile(req.file.path,{cellFormula:true,cellNF:true,cellDates:true});
    const id=`upload-${Date.now()}-${req.file.originalname.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`;
    const sheets=wb.SheetNames.map((name,i)=>{
      const ws=wb.Sheets[name]; const range=XLSX.utils.decode_range(ws['!ref']||'A1'); const rows=[];
      for(let r=range.s.r;r<=range.e.r;r++){
        const row=[]; for(let c=range.s.c;c<=range.e.c;c++){
          const addr=XLSX.utils.encode_cell({r,c}); const cell=ws[addr];
          if(!cell){row.push(null);continue;} const val=cell.f?`=${cell.f}`:cell.v;
          row.push({v:val??null,t:cell.f?'formula':(cell.t==='n'?'number':cell.t==='b'?'boolean':'string'),calc:null,fmt:cell.z||'General'});
        } rows.push(row);
      }
      return {id:`${id}-${i}`,name,rows,maxRow:rows.length,maxCol:range.e.c-range.s.c+1,mergedRanges:[]};
    });
    const record={id,file:req.file.originalname,institution,pdrbCode:null,sector:'Upload lokal',status:'on-progress',sheets};
    db.uploadedWorkbooks.push(record); audit(req.user,'UPLOAD_FILE',{file:req.file.originalname,institution});
    fs.unlinkSync(req.file.path); res.json({ok:true,workbook:meta(record)});
  }catch(e){ try{fs.unlinkSync(req.file.path)}catch{}; res.status(400).json({message:`Gagal membaca Excel: ${e.message}`}); }
});

app.get('/api/notifications',auth,(req,res)=>{
  if(req.user.role==='admin') return res.json({audit:db.audit});
  const ownIds=new Set(db.users.filter(u=>u.institution===req.user.institution).map(u=>u.username));
  const ownFiles=new Set([...seed.workbooks,...db.uploadedWorkbooks].filter(w=>w.institution===req.user.institution).map(w=>w.file));
  const audit=db.audit.filter(x=>ownIds.has(x.user)||ownFiles.has(x.details?.workbook));
  res.json({audit});
});

app.get('/api/admin/audit',auth,(req,res)=>{ if(req.user.role!=='admin') return res.status(403).json({message:'Admin only'}); res.json({audit:db.audit}); });

// Serve production frontend when built.
const dist=path.join(__dirname,'..','dist');
if(fs.existsSync(dist)){ app.use(express.static(dist)); app.use((req,res)=>res.sendFile(path.join(dist,'index.html'))); }
app.listen(PORT,()=>console.log(`PDRB API running at http://127.0.0.1:${PORT}`));

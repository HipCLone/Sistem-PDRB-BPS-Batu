const path = require('path');
const fs = require('fs');
require('dotenv').config({path:path.join(__dirname,'..','..','.env'),quiet:true});

function connectionConfig(){
  const port=Number(process.env.PGPORT||15432),max=Number(process.env.PGPOOL_MAX||5);
  if(!Number.isInteger(port)||port<1||port>65535||!Number.isInteger(max)||max<1||max>20)throw new Error('PGPORT atau PGPOOL_MAX tidak valid.');
  let password=process.env.PGPASSWORD;
  if(!password&&process.env.PDRB_CREDENTIALS_FILE){
    const credentials=require('dotenv').parse(fs.readFileSync(process.env.PDRB_CREDENTIALS_FILE,'utf8'));
    password=credentials.PGPASSWORD;
  }
  if(!password)throw new Error('Isi PGPASSWORD atau PDRB_CREDENTIALS_FILE pada .env lokal. Jangan masukkan password ke source/Git.');
  return {host:process.env.PGHOST||'127.0.0.1',port,database:process.env.PGDATABASE||'db_magang',user:process.env.PGUSER||'magang',password,max,connectionTimeoutMillis:Math.max(1000,Number(process.env.PGCONNECT_TIMEOUT||5)*1000),idleTimeoutMillis:30000,application_name:'pdrb-portal'};
}
function jwtSecret(){
  if(process.env.JWT_SECRET){if(process.env.JWT_SECRET.length<32)throw new Error('JWT_SECRET harus minimal 32 karakter.');return process.env.JWT_SECRET;}
  const filename=path.join(__dirname,'..','data','jwt-secret');
  fs.mkdirSync(path.dirname(filename),{recursive:true});
  try{fs.writeFileSync(filename,require('crypto').randomBytes(48).toString('hex'),{flag:'wx',mode:0o600});}catch(error){if(error.code!=='EEXIST')throw error;}
  const value=fs.readFileSync(filename,'utf8').trim();
  if(value.length<32)throw new Error('File JWT secret tidak valid.');return value;
}
function createPool(){
  const {Pool}=require('pg');
  const pool=new Pool(connectionConfig());
  pool.on('error',error=>console.error('Koneksi PostgreSQL terputus:',error.code||error.name));
  return pool;
}
module.exports={connectionConfig,createPool,jwtSecret};

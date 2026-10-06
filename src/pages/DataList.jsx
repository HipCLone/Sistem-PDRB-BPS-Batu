import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { api, getUser } from '../lib/api';
import { useAsyncData } from '../lib/useAsyncData';
import { matchesPeriod } from '../lib/periods.mjs';
import { periodLabel } from '../lib/format';
import { datasetTitle } from '../lib/datasetLabels.mjs';
import { Empty, Loading, PageIntro, RouteFeedback } from '../components/ui';
import { TemplateModal, UploadModal } from '../components/modals';

export default function DataList(){
  const navigate=useNavigate(),[params,setParams]=useSearchParams(),[uploading,setUploading]=useState(false),[creating,setCreating]=useState(false);
  const user=getUser(),isAdmin=user?.role==='admin',canUpload=isAdmin||user?.institution==='Bapenda';
  const {data,error,loading,retry}=useAsyncData(()=>api('/workbooks'),[]);
  const workbooks=data?.workbooks||[];
  const year=params.get('tahun')||'all',quarter=params.get('triwulan')||'all',institution=isAdmin?(params.get('instansi')||'all'):'all';
  const years=[...new Set(workbooks.flatMap(w=>w.periods?.map(p=>p.year)||[w.periodYear]).filter(Boolean))].sort().reverse();
  const institutions=data?.institutions||[...new Set(workbooks.map(w=>w.institution))].sort((a,b)=>a.localeCompare(b,'id'));
  const filtered=workbooks.filter(w=>matchesPeriod(w,year,quarter)&&(institution==='all'||w.institution===institution));
  const setFilter=(key,value)=>{const next=new URLSearchParams(params);value==='all'?next.delete(key):next.set(key,value);setParams(next,{replace:true});};
  const clear=()=>setParams({},{replace:true});
  if(error)return <RouteFeedback title="Daftar data belum dapat dimuat" text={error} onRetry={retry}/>;
  return <>
    <PageIntro title="Data PDRB" text="Pilih tahun, triwulan, atau instansi, lalu tekan Buka data untuk membaca tabel." actions={canUpload&&<div className="action-group">{isAdmin&&<button className="secondary-btn" disabled={loading} onClick={()=>setCreating(true)}>Buat data</button>}<button className="primary-btn" disabled={loading} onClick={()=>setUploading(true)}>Upload Excel/CSV</button></div>}/>
    <section className="panel data-list-panel" aria-label="Daftar data PDRB">
      <div className="filterbar">
        <label>Triwulan<select value={quarter} onChange={e=>setFilter('triwulan',e.target.value)}><option value="all">Semua triwulan</option>{[1,2,3,4].map(q=><option key={q} value={q}>Triwulan {q}</option>)}</select></label>
        <label>Tahun<select value={year} onChange={e=>setFilter('tahun',e.target.value)}><option value="all">Semua tahun</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></label>
        {isAdmin&&<label>Instansi<select value={institution} onChange={e=>setFilter('instansi',e.target.value)}><option value="all">Semua instansi</option>{institutions.map(name=><option key={name} value={name}>{name}</option>)}</select></label>}
        {(year!=='all'||quarter!=='all'||institution!=='all')&&<button className="text-btn" onClick={clear}>Reset filter</button>}
      </div>
      {loading?<Loading text="Memuat daftar data..."/>:filtered.length?<>
        <div className="table-caption"><span>{filtered.length} dari {workbooks.length} data</span><span>Satu data dapat memuat beberapa tabel dan periode.</span></div>
        <div className="table-wrap"><table className="list-table"><thead><tr><th scope="col">Instansi</th><th scope="col">Data pelaporan</th><th scope="col">Periode</th><th scope="col">Buka tabel</th></tr></thead><tbody>{filtered.map(w=><tr key={w.id}><td data-label="Instansi">{w.institution}</td><td data-label="Data pelaporan"><strong>{datasetTitle(w)}</strong></td><td data-label="Periode">{periodLabel(w)}</td><td><Link className="row-link" to={`/data/${encodeURIComponent(w.id)}${params.size?'?'+params.toString():''}`} state={{from:'/data'+(params.size?'?'+params.toString():'')}}>Buka data<span className="sr-only"> {datasetTitle(w)} {periodLabel(w)}</span></Link></td></tr>)}</tbody></table></div>
      </>:<Empty title={workbooks.length?'Tidak ada data untuk filter ini':'Data belum tersedia'} text={workbooks.length?'Ubah periode atau instansi untuk melihat data lainnya.':'Admin dapat menambahkan data pelaporan instansi.'} action={workbooks.length&&<button className="secondary-btn" onClick={clear}>Reset filter</button>}/>}
    </section>
    {uploading&&<UploadModal institution={isAdmin?(institution==='all'?'':institution):user.institution} institutions={isAdmin?institutions:undefined} onClose={()=>setUploading(false)} onUpload={async(file,target,title)=>{const body=new FormData();body.append('file',file);body.append('institution',target);if(title)body.append('title',title);await api('/upload',{method:'POST',body});setUploading(false);retry();}}/>}
    {creating&&<TemplateModal institutions={institutions} institution={institution==='all'?'':institution} onClose={()=>setCreating(false)} onSubmit={async body=>{const result=await api('/workbooks',{method:'POST',body:JSON.stringify(body)});setCreating(false);navigate(`/data/${encodeURIComponent(result.workbook.id)}`);}}/>}
  </>;
}

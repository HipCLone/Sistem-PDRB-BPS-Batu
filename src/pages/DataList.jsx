import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api, getUser } from '../lib/api';
import { useAsyncData } from '../lib/useAsyncData';
import { currentReportingPeriod, matchesPeriod } from '../lib/periods.mjs';
import { periodLabel } from '../lib/format';
import { datasetTitle } from '../lib/datasetLabels.mjs';
import { Empty, Loading, PageIntro, RouteFeedback } from '../components/ui';
import { TemplateModal, UploadModal } from '../components/modals';

export default function DataList(){
  const navigate=useNavigate(),[params,setParams]=useSearchParams(),[uploading,setUploading]=useState(false),[creating,setCreating]=useState(false);
  const [currentPeriod,setCurrentPeriod]=useState(()=>currentReportingPeriod());
  const statusYear=currentPeriod.year;
  const user=getUser(),isAdmin=user?.role==='admin',canUpload=isAdmin||user?.institution==='Bapenda';
  const {data,error,loading,retry}=useAsyncData(()=>api('/workbooks'),[]);
  const {data:statusData,error:statusError,loading:statusLoading,retry:retryStatus}=useAsyncData(()=>api(`/reporting-status?year=${encodeURIComponent(statusYear)}`),[statusYear]);
  useEffect(()=>{
    const refresh=()=>{if(document.visibilityState==='visible'){const period=currentReportingPeriod();setCurrentPeriod(previous=>previous.year===period.year&&previous.quarter===period.quarter?previous:period);retryStatus();}};
    const timer=window.setInterval(refresh,30000);
    document.addEventListener('visibilitychange',refresh);
    return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
  },[retryStatus]);
  const workbooks=data?.workbooks||[];
  const year=params.get('tahun')||'all',quarter=params.get('triwulan')||'all',institution=isAdmin?(params.get('instansi')||'all'):'all';
  const statusQuarter=currentPeriod.quarter;
  const years=[...new Set(workbooks.flatMap(w=>w.periods?.map(p=>p.year)||[w.periodYear]).filter(Boolean))].sort().reverse();
  const institutions=data?.institutions||[...new Set([...workbooks.map(w=>w.institution),user?.institution].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'id'));
  const statusByInstitution=new Map((statusData?.rows||[]).map(row=>[row.institution,row]));
  const statusByWorkbook=new Map((statusData?.workbooks||[]).map(row=>[row.id,row]));
  const filtered=workbooks.filter(w=>matchesPeriod(w,year,quarter)&&(institution==='all'||w.institution===institution));
  const emptyInstitutions=institutions.filter(name=>!workbooks.some(w=>w.institution===name)&&(institution==='all'||institution===name));
  const setFilter=(key,value)=>{const next=new URLSearchParams(params);value==='all'?next.delete(key):next.set(key,value);setParams(next,{replace:true});};
  const clear=()=>{setParams({},{replace:true});};
  const statusCell=(name,quarterNumber,workbookId)=>{
    if(statusLoading&&statusData?.year!==statusYear)return <span>Memuat status...</span>;
    const record=workbookId?statusByWorkbook.get(workbookId):statusByInstitution.get(name);
    if(statusError||!record)return <span>Status tidak tersedia</span>;
    const item=record.quarters.find(entry=>Number(entry.quarter)===quarterNumber);
    return <span>{!item?'Status tidak tersedia':item.status==='unknown'?'Perlu diperiksa':item.submitted?'Sudah terisi':'Belum terisi'}</span>;
  };
  if(error)return <RouteFeedback title="Daftar data belum dapat dimuat" text={error} onRetry={retry}/>;
  return <>
    <PageIntro title="Data PDRB" text="Pilih tahun, triwulan, atau instansi, lalu tekan Buka data untuk membaca tabel." actions={canUpload&&<div className="action-group">{isAdmin&&<button className="secondary-btn" disabled={loading} onClick={()=>setCreating(true)}>Buat data</button>}<button className="primary-btn" disabled={loading} onClick={()=>setUploading(true)}>Upload Excel/CSV</button></div>}/>
    <section className="panel data-list-panel" aria-label="Daftar data PDRB">
      <div className="filterbar">
        <label>Tahun<select value={year} onChange={e=>setFilter('tahun',e.target.value)}><option value="all">Semua tahun</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select></label>
        <label>Triwulan<select value={quarter} onChange={e=>setFilter('triwulan',e.target.value)}><option value="all">Semua triwulan</option>{[1,2,3,4].map(q=><option key={q} value={q}>Triwulan {q}</option>)}</select></label>
        {isAdmin&&<label>Instansi<select value={institution} onChange={e=>setFilter('instansi',e.target.value)}><option value="all">Semua instansi</option>{institutions.map(name=><option key={name} value={name}>{name}</option>)}</select></label>}
        {(year!=='all'||quarter!=='all'||institution!=='all')&&<button className="text-btn" onClick={clear}>Reset filter</button>}
      </div>
      {statusError&&<div className="status-error" role="alert">Status pengumpulan belum dapat dimuat. <button className="text-btn" onClick={retryStatus}>Coba lagi</button></div>}
      {loading?<Loading text="Memuat daftar data..."/>:(filtered.length||emptyInstitutions.length)?<>
        <div className="table-caption"><span>{filtered.length} dari {workbooks.length} data</span><span>Status terkini mengikuti TW {statusQuarter} {statusYear}, terlepas dari filter periode. “Sudah terisi” berarti ada minimal satu nilai, bukan seluruh tabel lengkap. “Perlu diperiksa” berarti periode atau hasil rumus belum dapat dipastikan.</span></div>
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Daftar data dan status triwulan, geser ke samping untuk melihat seluruh kolom"><table className="list-table data-list-table"><thead><tr><th scope="col">Instansi</th><th scope="col">Data pelaporan</th><th scope="col">Periode</th><th scope="col">Status saat ini</th><th scope="col">Buka tabel</th></tr></thead><tbody>{filtered.map(w=><tr key={w.id}><td data-label="Instansi">{w.institution}</td><td data-label="Data pelaporan"><strong>{datasetTitle(w)}</strong></td><td data-label="Periode">{periodLabel(w)}</td><td className="quarter-status-cell" data-quarter={statusQuarter} data-label="Status saat ini">{statusCell(w.institution,statusQuarter,w.id)}</td><td><Link className="row-link" to={`/data/${encodeURIComponent(w.id)}${params.size?'?'+params.toString():''}`} state={{from:'/data'+(params.size?'?'+params.toString():'')}}>Buka data<span className="sr-only"> {datasetTitle(w)} {periodLabel(w)}</span></Link></td></tr>)}{emptyInstitutions.map(name=><tr key={`empty-${name}`}><td data-label="Instansi">{name}</td><td data-label="Data pelaporan">Belum ada data</td><td data-label="Periode">-</td><td className="quarter-status-cell" data-quarter={statusQuarter} data-label="Status saat ini">{statusCell(name,statusQuarter)}</td><td>Belum ada tabel</td></tr>)}</tbody></table></div>
      </>:<Empty title={workbooks.length?'Tidak ada data untuk filter ini':'Data belum tersedia'} text={workbooks.length?'Ubah periode atau instansi untuk melihat data lainnya.':'Admin dapat menambahkan data pelaporan instansi.'} action={workbooks.length&&<button className="secondary-btn" onClick={clear}>Reset filter</button>}/>}
    </section>
    {uploading&&<UploadModal institution={isAdmin?(institution==='all'?'':institution):user.institution} institutions={isAdmin?institutions:undefined} onClose={()=>setUploading(false)} onUpload={async(file,target,title,year,quarter)=>{const body=new FormData();body.append('file',file);body.append('institution',target);body.append('year',year);body.append('quarter',quarter);if(title)body.append('title',title);await api('/upload',{method:'POST',body});setUploading(false);retry();retryStatus();}}/>}
    {creating&&<TemplateModal institutions={institutions} institution={institution==='all'?'':institution} onClose={()=>setCreating(false)} onSubmit={async body=>{const result=await api('/workbooks',{method:'POST',body:JSON.stringify(body)});setCreating(false);navigate(`/data/${encodeURIComponent(result.workbook.id)}`);}}/>}
  </>;
}

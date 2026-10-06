import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api, getUser } from '../lib/api';
import { parseValue, periodLabel } from '../lib/format';
import { datasetTitle, sheetLabel } from '../lib/datasetLabels.mjs';
import { detectBlocks } from '../lib/sheetPresentation.mjs';
import { filterBlockPeriod } from '../lib/periods.mjs';
import CleanDataTable from '../components/CleanDataTable';
import { RowModal, ColumnModal, TemplateModal, DatasetManageModal, TableManageModal, DeleteModal } from '../components/modals';
import { Empty, Loading, PageIntro, RouteFeedback } from '../components/ui';

export default function DatasetPage(){
  const {id}=useParams(),location=useLocation(),navigate=useNavigate(),[params,setParams]=useSearchParams();
  const [data,setData]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const [version,setVersion]=useState(0),[editing,setEditing]=useState(null),[modal,setModal]=useState(null),[notice,setNotice]=useState('');
  const request=useRef(0),user=getUser(),isAdmin=user?.role==='admin',canEdit=!!user&&(isAdmin||user.institution!=='Bapenda');
  useEffect(()=>{const controller=new AbortController(),current=++request.current;setLoading(true);setError('');
    api(`/workbooks/${encodeURIComponent(id)}`,{signal:controller.signal}).then(result=>{if(current===request.current)setData(result.workbook||result);}).catch(e=>{if(e.name!=='AbortError'&&current===request.current)setError(e.message);}).finally(()=>{if(current===request.current)setLoading(false);});
    return()=>controller.abort();
  },[id,version]);
  useEffect(()=>{setData(null);setEditing(null);setModal(null);setNotice('');},[id]);
  const sheets=data?.sheets||[],rawIndex=Number(params.get('bagian')||params.get('sheet')||0);
  const availableSheets=sheets.map((s,i)=>({sheet:s,index:i})).filter(x=>detectBlocks(x.sheet).length);
  const sheetIndex=Number.isInteger(rawIndex)&&rawIndex>=0&&rawIndex<sheets.length&&availableSheets.some(x=>x.index===rawIndex)?rawIndex:(availableSheets[0]?.index||0),sheet=sheets[sheetIndex];
  const blocks=useMemo(()=>sheet?detectBlocks(sheet):[],[sheet]);
  const year=params.get('tahun')||'all',quarter=params.get('triwulan')||'all';
  const years=[...new Set(data?.periods?.map(p=>p.year).filter(Boolean)||[])].sort().reverse();
  const change=(key,value)=>{const next=new URLSearchParams(params);value==='all'?next.delete(key):next.set(key,value);if(key==='bagian'){for(const key of [...next.keys()])if(key.startsWith('halaman-'))next.delete(key);setEditing(null);}setParams(next,{replace:true});};
  const reload=()=>setVersion(v=>v+1);
  const mutate=async(path,body)=>{await api(`/workbooks/${encodeURIComponent(id)}/${path}`,{method:path==='cell'?'PATCH':'POST',body:JSON.stringify(body)});reload();};
  const manageTable=async(block,body)=>{await api(`/workbooks/${encodeURIComponent(id)}/table`,{method:'PATCH',body:JSON.stringify({sheetIndex,tableId:block.id,...body})});setModal(null);setEditing(null);reload();setNotice('Tabel berhasil diperbarui.');};
  const backFilters=new URLSearchParams();for(const key of ['tahun','triwulan','instansi'])if(params.has(key))backFilters.set(key,params.get(key));
  const back=location.state?.from||('/data'+(backFilters.size?'?'+backFilters.toString():''));
  if(error)return <RouteFeedback title="Data belum dapat dibuka" text={error} onRetry={reload}/>;
  if(loading&&!data)return <Loading text="Memuat data pelaporan..."/>;
  if(!data)return <RouteFeedback title="Berkas tidak ditemukan" text="Buka daftar data untuk memilih berkas yang tersedia."/>;
  return <>
    <Link className="back-link" to={back}>Kembali ke daftar data</Link>
    <PageIntro title={datasetTitle(data)} text={`${data.institution} · ${periodLabel(data)}`} actions={isAdmin&&<div className="action-group"><button className="secondary-btn" disabled={loading} onClick={()=>setModal({kind:'dataset'})}>Kelola data</button><button className="primary-btn" disabled={loading} onClick={()=>setModal({kind:'template'})}>Tambah tabel</button></div>}/>
    {notice&&<p className="success-box" role="status">{notice}</p>}
    <section className="panel dataset-filters" aria-label="Pilihan data">
      <div className="filterbar">
        {availableSheets.length>1&&<label>Bagian data<select value={sheetIndex} onChange={e=>change('bagian',e.target.value)}>{availableSheets.map(({sheet:s,index:i})=><option key={i} value={i}>{sheetLabel(s.name)}</option>)}</select></label>}
        <label>Triwulan<select disabled={editing!==null} value={quarter} onChange={e=>change('triwulan',e.target.value)}><option value="all">Semua triwulan</option>{[1,2,3,4].map(q=><option key={q} value={q}>Triwulan {q}</option>)}</select></label>
        <label>Tahun<select disabled={editing!==null} value={year} onChange={e=>change('tahun',e.target.value)}><option value="all">Semua tahun</option>{years.map(y=><option key={y}>{y}</option>)}</select></label>
      </div>
      <p className="filter-hint">{editing!==null?'Mode edit menampilkan seluruh kolom tabel. Perubahan sel disimpan setelah berpindah dari kolom.':'Filter periode berlaku pada kolom yang memiliki keterangan tahun atau triwulan. Tabel yang terpisah pada sumber ditampilkan per bagian.'}</p>
    </section>
    {loading&&<p role="status">Memperbarui data...</p>}
    {!blocks.length&&<Empty title="Bagian ini belum berisi tabel" text="Pilih bagian data lain atau kembali ke daftar berkas."/>}
    {blocks.map(source=>{
      const active=editing===source.id;
      const block=active?{...source,columns:source.schemaColumns,labels:source.schemaLabels,headerPaths:source.schemaPaths,rowIndexes:[...new Set([...source.rowIndexes,...source.editableRowIndexes])].sort((a,b)=>a-b)}:filterBlockPeriod(source,year,quarter,data.periodYear);
      const pageKey=`halaman-${source.id}`,total=Math.max(1,Math.ceil(block.rowIndexes.length/40)),page=Math.min(total,Math.max(1,Math.floor(Number(params.get(pageKey)))||1));
      const rows=block.rowIndexes.slice((page-1)*40,page*40).map(index=>({row:sheet.rows[index],index}));
      return <section className="panel dataset-table" key={source.id} data-table-id={source.id}>
        <div className="dataset-heading"><h2>{source.label}</h2>{canEdit&&<div className="table-actions">{isAdmin&&<><button className="secondary-btn" disabled={loading} onClick={()=>setModal({kind:'row',block:source})}>Tambah baris</button><button className="secondary-btn" disabled={loading} onClick={()=>setModal({kind:'column',block:source})}>Tambah kolom</button><button className="secondary-btn" disabled={loading} onClick={()=>setModal({kind:'manage',block:source})}>Kelola tabel</button></>}<button className={active?'primary-btn':'secondary-btn'} onClick={()=>setEditing(active?null:source.id)}>{active?'Selesai edit':'Edit data'}</button></div>}</div>
        {block.columns.length?<CleanDataTable sheet={sheet} sheetIndex={sheetIndex} block={block} rows={rows} editing={active} onDeleteRow={isAdmin?r=>setModal({kind:'delete',block:source,operation:{kind:'deleteRow',rowIndex:r},label:`baris ${r+1}`}):undefined} onSave={async(si,rowIndex,colIndex,value)=>{setNotice('');await mutate('cell',{sheetIndex:si,rowIndex,colIndex,value:parseValue(value)});setNotice('Perubahan sel tersimpan.');}}/>:<Empty title="Nilai belum tersedia" text={canEdit?'Tekan Edit data untuk mengisi kolom kosong. Admin dapat menambahkan struktur tabel.':'Kolom yang belum diisi tidak ditampilkan. Bapenda dapat mengunggah berkas melalui halaman Data PDRB.'}/>}
        {total>1&&<div className="pagination" aria-label={`Halaman tabel ${source.label}`}><span>Halaman {page} dari {total}</span><div><button className="secondary-btn" disabled={page===1} onClick={()=>change(pageKey,String(page-1))}>Sebelumnya</button><button className="secondary-btn" disabled={page===total} onClick={()=>change(pageKey,String(page+1))}>Berikutnya</button></div></div>}
      </section>;
    })}
    {modal?.kind==='row'&&<RowModal sheet={sheet} block={modal.block} onClose={()=>setModal(null)} onSubmit={async values=>{await mutate('row',{sheetIndex,tableId:modal.block.id,values});setModal(null);setNotice('Baris ditambahkan pada tabel tujuan.');}}/>}
    {modal?.kind==='column'&&<ColumnModal block={modal.block} onClose={()=>setModal(null)} onSubmit={async label=>{await mutate('column',{sheetIndex,tableId:modal.block.id,label});setModal(null);setEditing(modal.block.id);setNotice('Kolom ditambahkan. Isi nilainya melalui mode edit.');}}/>}
    {modal?.kind==='template'&&<TemplateModal onClose={()=>setModal(null)} onSubmit={async({table})=>{const result=await api(`/workbooks/${encodeURIComponent(id)}/table`,{method:'POST',body:JSON.stringify(table)});setModal(null);setEditing(null);reload();change('bagian',String(result.sheetIndex));setNotice('Tabel baru tersedia untuk diisi instansi.');}}/>}
    {modal?.kind==='dataset'&&<DatasetManageModal data={data} onClose={()=>setModal(null)} onDelete={()=>setModal({kind:'deleteDataset'})} onSubmit={async body=>{await api(`/workbooks/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify(body)});setModal(null);reload();setNotice('Informasi data tersimpan.');}}/>}
    {modal?.kind==='manage'&&<TableManageModal block={modal.block} onClose={()=>setModal(null)} onSubmit={body=>manageTable(modal.block,body)} onDelete={operation=>setModal({kind:'delete',block:modal.block,operation,label:operation.label})}/>}
    {modal?.kind==='delete'&&<DeleteModal title="Konfirmasi penghapusan" description={`Hapus ${modal.label} dari tabel ${modal.block.label}?`} onClose={()=>setModal(null)} onSubmit={()=>manageTable(modal.block,modal.operation)}/>}
    {modal?.kind==='deleteDataset'&&<DeleteModal title="Hapus dataset?" description={`Seluruh tabel pada ${datasetTitle(data)} akan dihapus dari daftar aktif.`} onClose={()=>setModal(null)} onSubmit={async()=>{await api(`/workbooks/${encodeURIComponent(id)}`,{method:'DELETE'});navigate(back,{replace:true});}}/>}
  </>;
}

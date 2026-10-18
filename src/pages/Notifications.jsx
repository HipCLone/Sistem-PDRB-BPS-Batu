import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsyncData } from '../lib/useAsyncData';
import { useNotifications } from '../components/NotificationCenter';
import { Empty, Loading, PageIntro, RouteFeedback } from '../components/ui';
const actions={EDIT_CELL:'Perubahan nilai sel',ADD_ROW:'Penambahan baris',ADD_COLUMN:'Penambahan kolom',UPLOAD_FILE:'Upload berkas',CREATE_DATASET:'Pembuatan data',UPDATE_DATASET:'Perubahan informasi data',DELETE_DATASET:'Penghapusan data',ADD_TABLE:'Penambahan tabel',RENAME_TABLE:'Perubahan nama tabel',DELETE_TABLE:'Penghapusan tabel',DELETE_ROW:'Penghapusan baris',DELETE_COLUMN:'Penghapusan kolom',RENAME_COLUMN:'Perubahan nama kolom'};
const formatTime=value=>new Date(value).toLocaleString('id-ID',{timeZone:'Asia/Jakarta'});
function ChangeHistory({change}){
  if(!change)return null;
  const number=value=>new Intl.NumberFormat('id-ID',{maximumFractionDigits:6}).format(value);
  return <div className="change-history"><p><strong>{change.direction==='increase'?'Kenaikan drastis':'Penurunan drastis'}</strong>: {change.indicator}. {change.previous.period}: {number(change.previous.value)}. {change.currentPeriod}: {number(change.currentValue)}.</p><p>Alasan: {change.reason}</p></div>;
}
function Pages({page,total,onChange,label}){
  return total>1&&<div className="pagination" aria-label={label}><span>Halaman {page} dari {total}</span><div><button className="secondary-btn" disabled={page===1} onClick={()=>onChange(page-1)}>Sebelumnya</button><button className="secondary-btn" disabled={page===total} onClick={()=>onChange(page+1)}>Berikutnya</button></div></div>;
}
export default function Notifications(){
  const inbox=useNotifications(),navigate=useNavigate(),[params,setParams]=useSearchParams(),[busy,setBusy]=useState(false),[actionError,setActionError]=useState('');
  const {data,error,loading,retry}=useAsyncData(()=>api('/notifications'),[inbox.historyVersion]);
  const items=data?.audit||[],notifications=inbox.notifications;
  const total=Math.max(1,Math.ceil(notifications.length/10)),historyTotal=Math.max(1,Math.ceil(items.length/20));
  const page=Math.min(total,Math.max(1,Math.floor(Number(params.get('masuk')))||1)),historyPage=Math.min(historyTotal,Math.max(1,Math.floor(Number(params.get('riwayat')))||1));
  const change=(key,value)=>{const next=new URLSearchParams(params);value===1?next.delete(key):next.set(key,String(value));setParams(next,{replace:true});};
  const run=async action=>{setBusy(true);setActionError('');try{await action();}catch(e){setActionError(e.message);}finally{setBusy(false);}};
  const reload=()=>{inbox.refresh();retry();};
  if(error||inbox.error)return <RouteFeedback title="Notifikasi belum dapat dimuat" text={error||inbox.error} onRetry={reload}/>;
  return <>
    <PageIntro title="Notifikasi" text="Tabel baru dari admin dan pembaruan data instansi. Log histori menyimpan jejak perubahan yang dapat Anda akses." actions={<button className="secondary-btn" onClick={reload}>Muat ulang</button>}/>
    {actionError&&<p className="error-box" role="alert">{actionError}</p>}
    <section className="panel notification-panel" aria-labelledby="inbox-title">
      <div className="notification-section-heading"><div><h2 id="inbox-title">Notifikasi masuk</h2><p>{inbox.loading?'Memuat status notifikasi...':`${inbox.unreadCount} belum dibaca. Notifikasi yang sudah dibaca tetap ada dalam riwayat.`}</p></div><button className="secondary-btn" disabled={busy||inbox.loading||!inbox.unreadCount} onClick={()=>run(inbox.markAllRead)}>Tandai semua dibaca</button></div>
      {inbox.loading?<Loading text="Memuat notifikasi..."/>:notifications.length?<ul className="notification-list">{notifications.slice((page-1)*10,page*10).map(n=><li key={n.id} className={n.readAt?'':'unread'} data-notification-id={n.id}>
        <div className="notification-item-heading"><h3>{n.title}</h3><span className="read-status">{n.readAt?'Sudah dibaca':'Belum dibaca'}</span></div><p>{n.message}</p><time dateTime={n.at}>{formatTime(n.at)} WIB</time>
        <div className="notification-item-actions">{n.href?<button className="text-btn" disabled={busy} onClick={()=>run(async()=>{await inbox.markRead(n.id);navigate(n.href);})}>Buka data</button>:<span>Data tidak lagi tersedia untuk akun Anda.</span>}{!n.readAt&&<button className="secondary-btn" disabled={busy} onClick={()=>run(()=>inbox.markRead(n.id))}>Tandai dibaca</button>}</div>
      </li>)}</ul>:<Empty title="Belum ada notifikasi" text="Notifikasi akan muncul ketika admin menambahkan tabel untuk instansi, atau instansi memperbarui data untuk admin." action={<Link className="secondary-btn" to="/data">Buka daftar data</Link>}/>}
      <Pages page={page} total={total} label="Halaman notifikasi" onChange={p=>change('masuk',p)}/>
    </section>
    <section className="panel notification-history" aria-labelledby="history-title">
      <div className="notification-section-heading"><div><h2 id="history-title">Log histori</h2><p>Siapa yang mengubah data, jenis tindakan, dan waktu perubahan. Menandai notifikasi dibaca tidak menghapus histori.</p></div></div>
      {loading?<Loading text="Memuat log histori..."/>:items.length?<ul className="notice-list">{items.slice((historyPage-1)*20,historyPage*20).map((item,i)=><li key={item.id||`${item.at}-${i}`}><h3>{actions[item.action]||item.action}</h3><p>{[item.userName||item.user,item.details?.dataTitle||'Data pelaporan instansi',item.details?.sheet].filter(Boolean).join(' · ')}</p><ChangeHistory change={item.details?.drasticChange}/><time dateTime={item.at}>{formatTime(item.at)} WIB</time></li>)}</ul>:<Empty title="Belum ada histori" text="Riwayat akan muncul setelah data ditambahkan, diubah, diunggah, atau dihapus."/>}
      <Pages page={historyPage} total={historyTotal} label="Halaman log histori" onChange={p=>change('riwayat',p)}/>
    </section>
  </>;
}

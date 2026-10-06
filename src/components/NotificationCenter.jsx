import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, getUser } from '../lib/api';

const NotificationContext=createContext(null);
export const useNotifications=()=>useContext(NotificationContext);
export function BellIcon(){
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3a6 6 0 0 0-6 6v4l-2 4h16l-2-4V9a6 6 0 0 0-6-6Z"/><path d="M10 20a2 2 0 0 0 4 0M12 1v2"/></svg>;
}

export function NotificationProvider({children}){
  const userId=getUser()?.id,location=useLocation();
  const [data,setData]=useState({notifications:[],unreadCount:0,historyVersion:''}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[toast,setToast]=useState(null);
  const alive=useRef(false),pending=useRef(null),controller=useRef(null),seen=useRef(new Set()),currentUser=useRef(userId),pathname=useRef(location.pathname);
  currentUser.current=userId;pathname.current=location.pathname;
  const refresh=useCallback(async()=>{
    while(pending.current)await pending.current.catch(()=>{});
    if(!alive.current||!userId||currentUser.current!==userId)return;
    const abort=new AbortController();controller.current=abort;
    const request=api('/notifications/inbox',{signal:abort.signal});pending.current=request;
    try{
      const next=await request;if(!alive.current||currentUser.current!==userId)return;
      const fresh=next.notifications.filter(n=>!n.readAt&&!seen.current.has(n.id));
      for(const n of next.notifications)seen.current.add(n.id);
      try{sessionStorage.setItem(`pdrb-notification-seen:${userId}`,JSON.stringify([...seen.current].slice(-500)));}catch{}
      setData(next);setError('');
      if(fresh.length&&pathname.current!=='/notifications')setToast({notification:fresh[0],count:fresh.length});
      setToast(current=>current&&next.notifications.some(n=>n.id===current.notification.id&&!n.readAt)?current:null);
    }catch(e){if(e.name!=='AbortError'&&alive.current&&currentUser.current===userId)setError(e.message);}
    finally{if(pending.current===request)pending.current=null;if(alive.current&&currentUser.current===userId)setLoading(false);}
  },[userId]);
  useEffect(()=>{
    alive.current=true;setToast(null);
    try{const stored=JSON.parse(sessionStorage.getItem(`pdrb-notification-seen:${userId}`)||'[]');seen.current=new Set(Array.isArray(stored)?stored:[]);}catch{seen.current=new Set();}
    refresh();
    const visibleRefresh=()=>{if(document.visibilityState==='visible')refresh();};
    const interval=setInterval(visibleRefresh,10000);
    window.addEventListener('focus',visibleRefresh);window.addEventListener('pdrb-data-changed',visibleRefresh);document.addEventListener('visibilitychange',visibleRefresh);
    return()=>{alive.current=false;controller.current?.abort();clearInterval(interval);window.removeEventListener('focus',visibleRefresh);window.removeEventListener('pdrb-data-changed',visibleRefresh);document.removeEventListener('visibilitychange',visibleRefresh);};
  },[refresh,userId]);
  useEffect(()=>{if(location.pathname==='/notifications')setToast(null);},[location.pathname]);
  const markRead=async id=>{await api(`/notifications/${encodeURIComponent(id)}/read`,{method:'PATCH'});await refresh();};
  const markAllRead=async()=>{const throughId=data.notifications[0]?.id;if(!throughId)return;await api('/notifications/read-all',{method:'POST',body:JSON.stringify({throughId})});await refresh();};
  return <NotificationContext.Provider value={{...data,loading,error,refresh,markRead,markAllRead}}>{children}{toast&&<aside className="notification-toast" data-notification-id={toast.notification.id} role="status" aria-live="polite" aria-atomic="true"><div className="toast-heading"><strong>{toast.notification.title}</strong><button type="button" className="text-btn" aria-label="Tutup popup notifikasi" onClick={()=>setToast(null)}>Tutup</button></div><p>{toast.notification.message}</p>{toast.count>1&&<p>{toast.count} notifikasi baru diterima.</p>}<Link className="row-link" to="/notifications" onClick={()=>setToast(null)}>Lihat notifikasi</Link></aside>}</NotificationContext.Provider>;
}

export function NotificationBell(){
  const {unreadCount,loading,error}=useNotifications();
  const label=error?'Notifikasi, status belum terhubung':loading?'Notifikasi, memuat':unreadCount?`Notifikasi, ${unreadCount} belum dibaca`:'Notifikasi, tidak ada yang belum dibaca';
  return <Link className="notification-link" to="/notifications" aria-label={label} title={label}><BellIcon/>{unreadCount>0&&<span className="notification-count" aria-hidden="true">{unreadCount>99?'99+':unreadCount}</span>}</Link>;
}

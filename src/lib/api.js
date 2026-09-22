const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8787/api';
export function getToken(){ return localStorage.getItem('pdrb_token'); }
export function setSession(data){ localStorage.setItem('pdrb_token',data.token); localStorage.setItem('pdrb_user',JSON.stringify(data.user)); }
export function getUser(){ try{return JSON.parse(localStorage.getItem('pdrb_user')||'null')}catch{return null} }
export function clearSession(){ localStorage.removeItem('pdrb_token'); localStorage.removeItem('pdrb_user'); }
export async function api(path, options={}){
  const headers={...(options.headers||{})}; const token=getToken(); if(token) headers.Authorization=`Bearer ${token}`;
  if(options.body && !(options.body instanceof FormData)) headers['Content-Type']='application/json';
  const res=await fetch(`${API}${path}`,{...options,headers});
  const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.message||'Terjadi kesalahan'); return data;
}

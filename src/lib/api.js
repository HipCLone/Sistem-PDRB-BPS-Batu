const API = import.meta.env.VITE_API_URL || '/api';
export function getToken(){ return localStorage.getItem('pdrb_token'); }
export function setSession(data){ localStorage.setItem('pdrb_token',data.token); localStorage.setItem('pdrb_user',JSON.stringify(data.user)); }
export function getUser(){ try{return JSON.parse(localStorage.getItem('pdrb_user')||'null')}catch{return null} }
export function clearSession(){ localStorage.removeItem('pdrb_token'); localStorage.removeItem('pdrb_user'); }
export async function api(path, options={}){
  const headers={...(options.headers||{})}; const token=getToken(); if(token) headers.Authorization=`Bearer ${token}`;
  if(options.body && !(options.body instanceof FormData)) headers['Content-Type']='application/json';
  let res;
  try {res=await fetch(`${API}${path}`,{...options,headers});}
  catch(error){if(error.name==='AbortError')throw error;throw new Error('Server belum terhubung. Periksa koneksi atau jalankan backend.');}
  const data=await res.json().catch(()=>({}));
  if(!res.ok){
    if(res.status===401&&path!=='/auth/login'){clearSession();window.dispatchEvent(new Event('pdrb-session-expired'));}
    const error=new Error(data.message||'Data belum dapat diproses. Coba lagi.');error.status=res.status;throw error;
  }
  if(options.method&&options.method!=='GET'&&!path.startsWith('/auth/')&&!path.startsWith('/notifications'))window.dispatchEvent(new Event('pdrb-data-changed'));
  return data;
}

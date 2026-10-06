import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, setSession } from '../lib/api';
import BrandMark from '../components/BrandMark';

export default function Login(){
  const navigate=useNavigate(),location=useLocation();
  const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const submit=async e=>{e.preventDefault();setBusy(true);setError('');try{setSession(await api('/auth/login',{method:'POST',body:JSON.stringify({username:username.trim(),password})}));const from=location.state?.from;navigate(from?.startsWith('/')&&!from.startsWith('//')&&from!=='/'&&from!=='/login'?from:'/beranda',{replace:true});}catch(err){setError(err.message);}finally{setBusy(false);}};
  return <main className="login-page">
    <section className="login-context"><span className="login-wordmark"><BrandMark/>PDRB / Kota Batu</span><h1>Data pelaporan,<br/>satu tempat kerja.</h1><p>Baca data instansi, pilih periode triwulanan, dan tinjau tabel dari berkas Excel sumber.</p><dl><div><dt>Admin</dt><dd>Meninjau dan memperbarui data seluruh instansi.</dd></div><div><dt>Instansi</dt><dd>Membaca data milik instansi. Bapenda dapat mengunggah berkas pelaporan.</dd></div></dl></section>
    <section className="login-card"><h2>Masuk ke portal</h2><p>Gunakan akun yang diberikan administrator.</p>{location.state?.expired&&<p className="notice">Sesi Anda berakhir. Masuk lagi untuk melanjutkan.</p>}<form onSubmit={submit}>
      <label>Username<input required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} maxLength={100}/></label>
      <label>Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} maxLength={200}/></label>
      {error&&<p className="error-box" role="alert">{error}</p>}<button className="primary-btn full" disabled={busy}>{busy?'Memeriksa akun...':'Masuk'}</button>
    </form><details className="demo"><summary>Akun pengujian lokal</summary><p>Khusus pengujian proyek di komputer lokal.</p><button type="button" className="secondary-btn" onClick={()=>{setUsername('admin');setPassword('admin123');}}>Isi akun admin</button><button type="button" className="secondary-btn" onClick={()=>{setUsername('bapenda');setPassword('123456');}}>Isi akun Bapenda</button></details></section>
  </main>;
}

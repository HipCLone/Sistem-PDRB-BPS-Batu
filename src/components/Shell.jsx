import { Link, NavLink, useNavigate } from 'react-router-dom';
import { clearSession, getUser } from '../lib/api';
import BrandMark from './BrandMark';
import AccountAvatar from './AccountAvatar';
import { NotificationBell, NotificationProvider } from './NotificationCenter';

export const NAV=[{to:'/beranda',label:'Beranda'},{to:'/data',label:'Data PDRB'},{to:'/profile',label:'Akun'}];

export default function Shell({children}){
  const navigate=useNavigate(),user=getUser();
  return <NotificationProvider><div className="shell">
    <a className="skip-link" href="#main-content">Lewati ke isi halaman</a>
    <aside className="sidebar">
      <Link to="/beranda" className="wordmark"><BrandMark/><span className="wordmark-text"><strong>PDRB</strong><span>Kota Batu</span></span></Link>
      <nav aria-label="Navigasi utama">{NAV.map(item=><NavLink key={item.to} to={item.to} end={item.to==='/beranda'}>{item.label}</NavLink>)}</nav>
      <div className="sidebar-account"><p>{user?.role==='admin'?'Administrator':user?.institution}</p><button className="text-btn" onClick={()=>{clearSession();navigate('/login',{replace:true});}}>Keluar dari akun</button></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><span className="topbar-title"><span className="topbar-title-full">Portal pengumpulan data</span><span className="topbar-title-short">PDRB</span></span><div className="topbar-account"><NotificationBell/><Link to="/profile" className="profile-link"><AccountAvatar name={user?.institution||user?.name}/><span className="profile-label"><span>{user?.institution||user?.name}</span><span>{user?.role==='admin'?'Admin':'Instansi'}</span></span></Link></div></header>
      <main id="main-content" className="content" tabIndex={-1}>{children}</main>
      <footer className="footer">PDRB Kota Batu <span>Data sesuai berkas sumber instansi</span></footer>
    </div>
  </div></NotificationProvider>;
}

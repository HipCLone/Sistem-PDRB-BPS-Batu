import { CircleAlert, ArrowLeft, Home, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export function PageIntro({eyebrow,title,text,actions}){
  return <div className="page-intro">
    <div>{eyebrow&&<span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1><p>{text}</p></div>
    {actions&&<div className="intro-actions">{actions}</div>}
  </div>;
}

export function Loading({text='Memuat data...'}){return <div className="loading" role="status">{text}</div>}

export function Empty({title,text,action}){return <div className="empty"><h3>{title}</h3><p>{text}</p>{action}</div>}

export function RouteFeedback({code='',title,text,onRetry}){
  const nav=useNavigate();
  const goBack=()=>{if(window.history.state?.idx>0)nav(-1);else nav('/beranda',{replace:true})};
  return <section className="route-feedback panel">
    <div className="route-feedback-icon"><CircleAlert size={28}/></div>
    {code&&<span className="eyebrow">{code}</span>}
    <h1>{title}</h1>
    <p>{text}</p>
    <div className="route-feedback-actions">
      <button className="secondary-btn" onClick={goBack}><ArrowLeft size={16}/>Kembali</button>
      {onRetry
        ? <button className="primary-btn" onClick={onRetry}><RefreshCw size={16}/>Coba lagi</button>
        : <Link className="primary-btn" to="/beranda"><Home size={16}/>Ke beranda</Link>}
    </div>
  </section>;
}

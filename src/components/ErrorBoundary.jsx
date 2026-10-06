import React from 'react';
import { ArrowLeft, RefreshCw, CircleAlert } from 'lucide-react';

export class AppErrorBoundary extends React.Component{
  constructor(props){super(props);this.state={error:null}}
  static getDerivedStateFromError(error){return {error}}
  componentDidCatch(error,info){console.error('Application route error:',error,info)}
  componentDidUpdate(previous){if(previous.resetKey!==this.props.resetKey&&this.state.error)this.reset()}
  reset=()=>this.setState({error:null});
  render(){
    if(this.state.error){
      return <div className="app-error-fallback">
        <section className="route-feedback panel">
          <div className="route-feedback-icon"><CircleAlert size={28}/></div>
          <span className="eyebrow">TERJADI KESALAHAN</span>
          <h1>Halaman tidak dapat dimuat</h1>
          <p>Silakan kembali ke halaman sebelumnya atau muat ulang aplikasi.</p>
          <div className="route-feedback-actions">
            <button className="secondary-btn" onClick={()=>window.history.state?.idx>0?window.history.back():window.location.assign('/beranda')}><ArrowLeft size={16}/>Kembali</button>
            <button className="primary-btn" onClick={()=>window.location.reload()}><RefreshCw size={16}/>Muat ulang halaman</button>
          </div>
        </section>
      </div>;
    }
    return this.props.children;
  }
}

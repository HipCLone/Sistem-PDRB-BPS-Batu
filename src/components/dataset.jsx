import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { periodLabel } from '../lib/format';
import { datasetTitle } from '../lib/datasetLabels.mjs';

export function DatasetCard({w}){
  return <Link to={`/data/${encodeURIComponent(w.id)}`} className="dataset-card">
    <div className="dataset-top"><span className="period-label">{periodLabel(w)}</span></div>
    <h4>{w.institution}</h4>
    <p>{datasetTitle(w)}</p>
    <div className="dataset-meta"><span>{w.sector}</span></div>
    <div className="dataset-arrow"><ChevronRight/></div>
  </Link>;
}

export function Breadcrumb({items=[]}){
  return <div className="breadcrumb">
    <Link to="/beranda">Beranda</Link>
    {items.map((item,index)=>{
      const last=index===items.length-1;
      let node;
      if(last) node=<b key={`cur-${index}`}>{item.label}</b>;
      else if(item.to) node=<Link key={`lnk-${index}`} to={item.to}>{item.label}</Link>;
      else node=<span key={`txt-${index}`}>{item.label}</span>;
      return [<ChevronRight key={`sep-${index}`} size={15}/>,node];
    })}
  </div>;
}

import { useCallback, useEffect, useState } from 'react';

export function useAsyncData(loader,deps=[]){
  const [state,setState]=useState({data:null,error:'',loading:true});
  const [nonce,setNonce]=useState(0);

  useEffect(()=>{
    let active=true;
    setState(s=>({...s,loading:true,error:''}));
    Promise.resolve()
      .then(loader)
      .then(data=>{if(active)setState({data,error:'',loading:false})})
      .catch(error=>{if(active)setState({data:null,error:error?.message||'Terjadi kesalahan',loading:false})});
    return ()=>{active=false};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[...deps,nonce]);

  const retry=useCallback(()=>setNonce(n=>n+1),[]);
  return {...state,retry};
}

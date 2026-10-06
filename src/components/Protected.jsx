import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getUser, getToken } from '../lib/api';

export default function Protected({children}){
  const location=useLocation();
  const [expired,setExpired]=useState(false);
  useEffect(()=>{const expire=()=>setExpired(true);window.addEventListener('pdrb-session-expired',expire);return()=>window.removeEventListener('pdrb-session-expired',expire);},[]);
  return !expired&&getUser()&&getToken()?children:<Navigate to="/login" replace state={{from:location.pathname+location.search,expired}}/>;
}

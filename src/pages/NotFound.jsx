import { useLocation } from 'react-router-dom';
import { RouteFeedback } from '../components/ui';

export default function NotFound(){
  const {pathname}=useLocation();
  return <RouteFeedback
    code="404 / HALAMAN TIDAK DITEMUKAN"
    title="Halaman tidak tersedia"
    text={`Rute ${pathname} tidak ditemukan atau sudah tidak tersedia. Anda tetap dapat kembali ke halaman sebelumnya.`}/>;
}

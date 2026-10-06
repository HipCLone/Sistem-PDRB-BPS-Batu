import { Link } from 'react-router-dom';
import { api, getUser } from '../lib/api';
import { useAsyncData } from '../lib/useAsyncData';
import { Empty, Loading, PageIntro, RouteFeedback } from '../components/ui';
import { periodLabel } from '../lib/format';
import { datasetTitle } from '../lib/datasetLabels.mjs';
import AccountAvatar from '../components/AccountAvatar';

export default function Dashboard(){
  const user=getUser(),isAdmin=user?.role==='admin';
  const {data,error,loading,retry}=useAsyncData(()=>api('/workbooks'),[]);
  if(error)return <RouteFeedback title="Beranda belum dapat dimuat" text={error} onRetry={retry}/>;
  const workbooks=data?.workbooks||[];
  const institutions=[...new Set(workbooks.map(w=>w.institution))].sort((a,b)=>a.localeCompare(b,'id'));
  return <>
    <PageIntro title="Data PDRB Kota Batu" text="PDRB adalah Produk Domestik Regional Bruto. Portal ini menyediakan tabel pelaporan dari instansi untuk penyusunan PDRB Kota Batu." actions={<Link className="primary-btn" to="/data">Lihat seluruh data</Link>}/>
    <div className="home-layout">
      <section className="home-data" aria-labelledby="home-data-title">
        <div className="home-section-heading"><h2 id="home-data-title">{isAdmin?'Pilih instansi':'Data instansi Anda'}</h2><p>{isAdmin?'Pilih nama instansi, kemudian buka data yang ingin dibaca.':`Anda dapat membaca data ${user?.institution}. Pilih judul data untuk membuka tabelnya.`}</p></div>
        {loading?<Loading text="Memuat data instansi..."/>:!workbooks.length?<Empty title="Data belum tersedia" text="Hubungi admin untuk menambahkan data instansi Anda."/>:isAdmin?
          <ul className="institution-directory">{institutions.map(name=><li key={name}><Link to={`/data?instansi=${encodeURIComponent(name)}`}><AccountAvatar name={name}/><span className="directory-details"><span className="directory-name">{name}</span><span className="directory-count">{workbooks.filter(w=>w.institution===name).length} data tersedia</span></span><span className="directory-action">Lihat data</span></Link></li>)}</ul>:
          <ul className="home-datasets">{workbooks.map(w=><li key={w.id}><Link to={`/data/${encodeURIComponent(w.id)}`}><strong>{datasetTitle(w)}</strong><span>{periodLabel(w)}</span><span className="directory-action">Buka tabel</span></Link></li>)}</ul>}
      </section>
      <aside className="home-guide" aria-labelledby="reading-guide-title">
        <h2 id="reading-guide-title">Cara membaca data</h2>
        <p>Di halaman Data PDRB, pilih tahun dan triwulan jika ingin melihat periode tertentu. Tekan <strong>Buka data</strong> untuk membaca tabel.</p>
        <dl className="quarter-guide"><dt>Triwulan 1</dt><dd>Januari sampai Maret</dd><dt>Triwulan 2</dt><dd>April sampai Juni</dd><dt>Triwulan 3</dt><dd>Juli sampai September</dd><dt>Triwulan 4</dt><dd>Oktober sampai Desember</dd></dl>
        <p>Tanda <strong>-</strong> berarti nilai belum tersedia, bukan nol. Jika tabel lebih lebar dari layar, geser area tabel ke samping.</p>
        <div className="access-note"><h3>Akses Anda</h3><p>{isAdmin?'Sebagai admin, Anda dapat membuat, membaca, mengedit, dan menghapus data serta struktur tabel seluruh instansi.':user?.institution==='Bapenda'?'Anda dapat membaca data Bapenda dan mengunggah Excel/CSV dengan template pelaporan masing-masing. Setiap upload menjadi data baru. Tidak tersedia edit manual.':'Anda dapat membaca, mengisi, dan mengedit nilai tabel milik instansi sendiri, termasuk kolom kosong yang disiapkan admin. Tekan Edit data pada tabel; penambahan atau penghapusan struktur tetap dilakukan admin.'}</p></div>
      </aside>
    </div>
  </>;
}

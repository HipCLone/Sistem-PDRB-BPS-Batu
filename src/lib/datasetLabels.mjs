const titles={
  '1-pi-bulog':'Perubahan stok BULOG',
  '1-bps-lra-januari-2025-gabung-bapenda':'Realisasi pendapatan dan belanja daerah',
  '13-bps-lra-juni-bapenda':'Realisasi pendapatan dan belanja daerah',
  '1-ekspor-impor-diskoperindag':'Ekspor dan impor menurut komoditas',
  '1-lnp-bakesbangpol':'Organisasi kemasyarakatan dan lembaga swadaya masyarakat',
  '2-umkm-dan-nilai-produksi':'Jumlah UMKM dan nilai produksi',
  '23-esda':'Produksi bahan galian',
  '3-jumlah-koperasi-dan-nilai-produksi':'Jumlah koperasi dan nilai produksi',
  'a-dinas-pertanian':'Produksi pertanian dan peternakan',
  'atv':'Produksi dan harga layanan televisi',
  'bapenda':'Indikator pelaporan Bapenda',
  'd-pt-pln':'Penjualan dan harga listrik',
  'e-dinas-lingkungan-hidup':'Pengolahan limbah dan pengelolaan sampah',
  'e-pdam':'Distribusi dan harga air',
  'f-dinas-pupr':'Proyek dan paket konstruksi',
  'f-dinas-penanaman-modal-satu-pintu':'Luas bangunan yang mendaftar IMB/PBG',
  'h-dinas-perhubungan':'Penumpang dan layanan transportasi',
  'h-pt-pos':'Pengiriman paket dan tarif',
  'k-bpjs-kesehatan':'Peserta, iuran, dan klaim BPJS Kesehatan',
  'k-bpjs-ketenagakerjaan':'Peserta, iuran, dan klaim BPJS Ketenagakerjaan',
  'o-apbdes':'Realisasi pendapatan dan belanja desa',
  'penyusunan-pdrb-triwulan-dp3ap2kb':'Realisasi pendapatan dan belanja desa',
  'o-bkad':'Realisasi anggaran dan proporsi APBD',
  'p-dinas-pendidikan':'Jumlah siswa dan tarif SPP sekolah',
  'pt-pegadaian':'Pendapatan dan biaya usaha Pegadaian',
  'pertamina':'Penyaluran BBM dan LPG',
  'q-dinas-kesehatan':'Pasien, tarif, dan pendapatan layanan kesehatan',
  'r-dinas-pariwisata':'Pengunjung tempat wisata',
};
export function datasetTitle(workbook,blocksBySheet=[]){
  if(workbook?.title)return workbook.title;
  if(titles[workbook?.id])return titles[workbook.id];
  if(/^202[56]-[1-4]-lra/.test(workbook?.id||''))return 'Realisasi anggaran daerah (konsolidasi)';
  if(/^[23]a-realisasi-pma-dan-pmdn/.test(workbook?.id||''))return 'Realisasi investasi PMA dan PMDN menurut sektor';
  const sourceTitle=blocksBySheet.flat().find(b=>b.label&&!/^(?:sheet\d*|pengujian|data)?\s*·?\s*tabel\s+\d+$/i.test(b.label))?.label;
  return sourceTitle?.replace(/\s*·\s*(?:REALISASI|Pagu Anggaran).*$/i,'').trim()||'Data pelaporan instansi';
}

export function sheetLabel(name){
  const months={jan:'Januari',feb:'Februari',mar:'Maret',apr:'April',mei:'Mei',jun:'Juni',jul:'Juli',agu:'Agustus',sep:'September',okt:'Oktober',nov:'November',des:'Desember'};
  const value=String(name||'').trim();
  return months[value.toLowerCase()]||(/^growth$/i.test(value)?'Pertumbuhan':value);
}

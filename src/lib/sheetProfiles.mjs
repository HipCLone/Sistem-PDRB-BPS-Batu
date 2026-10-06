// Header ranges reviewed against every bundled worksheet (zero-based source rows).
// Profiles describe presentation only; source cells and edit coordinates stay intact.
const profiles = {
  '1-pi-bulog-0': [[2, 3]],
  '1-ekspor-impor-diskoperindag-0': [[2, 3], [17, 18], [33, 34], [48, 49]],
  '1-ekspor-impor-diskoperindag-1': [[2, 3], [17, 18]],
  '1-lnp-bakesbangpol-0': [[2, 3], [7, 8]],
  '1-lnp-bakesbangpol-1': [[2, 3]],
  '2-umkm-dan-nilai-produksi-0': [[2]],
  '23-esda-0': [[2]],
  '3-jumlah-koperasi-dan-nilai-produksi-0': [[2]],
  'a-dinas-pertanian-0': [[2], [15]],
  'a-dinas-pertanian-1': [[2], [119]],
  'a-dinas-pertanian-2': [[2]],
  'a-dinas-pertanian-3': [[2]],
  'a-dinas-pertanian-4': [[2]],
  'a-dinas-pertanian-5': [[2]],
  'a-dinas-pertanian-6': [[2]],
  'a-dinas-pertanian-7': [[2]],
  'a-dinas-pertanian-8': [[2]],
  'atv-0': [[3, 4], [13, 14]],
  'bapenda-0': [[3]],
  'bapenda-1': [[2, 3]],
  'bapenda-2': [[2, 3]],
  'd-pt-pln-0': [[2, 3], [12, 13], [21, 22]],
  'd-pt-pln-1': [[2, 3], [12, 13], [21, 22]],
  'e-dinas-lingkungan-hidup-0': [[2], [13]],
  'e-dinas-lingkungan-hidup-1': [[2], [13]],
  'e-pdam-0': [[2, 3], [11, 12]],
  'f-dinas-pupr-0': [[4, 5], [33, 34]],
  'f-dinas-penanaman-modal-satu-pintu-0': [[3], [15]],
  'f-dinas-penanaman-modal-satu-pintu-1': [[3], [31]],
  'h-dinas-perhubungan-0': [[2], [8], [14], [20], [26], [32]],
  'h-dinas-perhubungan-1': [[2], [6]],
  'h-pt-pos-0': [[2, 3], [10, 11], [18, 19], [26, 27]],
  'k-bpjs-kesehatan-0': [[2, 3], [10, 11]],
  'k-bpjs-ketenagakerjaan-0': [[2, 3]],
  'o-apbdes-0': [[2, 3, 4, 5], [22, 23, 24, 25]],
  'o-bkad-0': [[3]],
  'o-bkad-1': [[3, 4]],
  'o-bkad-2': [[2, 3, 4, 5]],
  'o-bkad-3': [[2, 3, 4, 5]],
  'o-bkad-4': [[2, 3, 4, 5]],
  'o-bkad-5': [[3]],
  'p-dinas-pendidikan-0': [[2, 3], [10, 11], [18, 19]],
  'p-dinas-pendidikan-1': [[2, 3], [10, 11], [18, 19]],
  'pt-pegadaian-0': [[2, 3], [10, 11]],
  'penyusunan-pdrb-triwulan-dp3ap2kb-0': [[2, 3, 4, 5]],
  'pertamina-0': [[3, 4], [17, 18]],
  'pertamina-1': [[3, 4], [17, 18]],
  'q-dinas-kesehatan-0': [[2, 3, 4], [21, 22, 23], [38, 39]],
  'q-dinas-kesehatan-1': [[2, 3, 4], [13, 14, 15], [24, 25]],
  'r-dinas-pariwisata-0': [[2, 3], [85, 86]],
  'r-dinas-pariwisata-1': [[2, 3]],
};

export function sheetProfile(sheet) {
  if(sheet?.manualHeaders)return {headers:[[0]]};
  if(Array.isArray(sheet?.headerGroups))return {headers:sheet.headerGroups};
  const id = sheet?.id || '';
  if (profiles[id]) return { headers: profiles[id], labels: id==='1-pi-bulog-0' ? {1:'Komoditas',2:'Keterangan'} : undefined, sectionColumn:id==='1-pi-bulog-0'?1:undefined };
  if (/^(1-bps-lra-januari-2025-gabung-bapenda|13-bps-lra-juni-bapenda)-\d+$/.test(id))
    return { headers: [[6]] };
  if (/^202[56]-[1-4]-lra-.*-0$/.test(id)) return { headers: [[5]] };
  if (/^2a-realisasi-pma-dan-pmdn-/.test(id)) return { headers: [[0, 1]], labels: {0: 'Kabupaten / Kota'} };
  if (/^3a-realisasi-pma-dan-pmdn-/.test(id)) {
    if (/^data_Page/.test(sheet.name)) return { headers: [], dataStart: 1, labels: {0: 'Tahun', 1: 'Nilai (Jawa Timur)'} };
    if (/^Sheet[12]$/.test(sheet.name)) return { headers: [] };
    if (/^PMA$|^PMDN$/.test(sheet.name)) return {
      headers: [[3, 4, 5]], labels: {0: 'Kelompok sektor', 1: 'Sektor'},
      // The 2025 workbook has auxiliary calculation tables beside the main one.
      splitColumns: /iv-2025/.test(id) ? (/^PMA$/.test(sheet.name) ? [[0,9],[10,13],[15,20]] : [[0,9],[10,13],[15,18],[20,23]]) : undefined,
    };
    return { headers: [[/iv-2025/.test(id) ? 2 : 3]] };
  }
  return null;
}

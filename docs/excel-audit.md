# Audit penyajian Excel

Pemeriksaan per sheet pada file asli di `source-excel/` dan data yang digunakan API. Tidak menulis ulang nilai sumber.

Kolom sumber tanpa judul diberi label berbasis koordinat, bukan dugaan satuan. Error/rumus tanpa cached value ditandai tidak tersedia. Baris bernomor saja, titik-titik contoh, dan seluruh baris/kolom kosong tidak disajikan sebagai data.

| File / sheet | Tabel | Baris tampil | Kolom tanpa judul sumber | Sel rumus/error tidak tersedia (API) | Status |
|---|---:|---:|---:|---:|---|
| 1 PI. BULOG.xlsx / bulog | 1 | 12 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / jan | 1 | 111 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / feb | 1 | 106 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / mar | 1 | 107 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / april | 1 | 108 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / mei  | 1 | 107 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / juni | 1 | 107 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / juli | 1 | 100 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / agustus | 1 | 107 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / september | 1 | 109 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / oktober | 1 | 100 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / november | 1 | 100 | 0 | 0 | Data tersedia |
| 1. BPS LRA Januari 2025 gabung (Bapenda).xlsx / desember | 1 | 109 | 0 | 0 | Data tersedia |
| 1. Ekspor impor Diskoperindag.xlsx / exim LN | 4 | 26 | 0 | 175 | Data tersedia |
| 1. Ekspor impor Diskoperindag.xlsx / exim antar daerah | 2 | 3 | 0 | 0 | Data tersedia |
| 1. LNP Bakesbangpol.xlsx / LNP | 2 | 4 | 0 | 2 | Data tersedia |
| 1. LNP Bakesbangpol.xlsx / Growth | 1 | 2 | 0 | 0 | Data tersedia |
| 13. BPS LRA Juni (Bapenda).xlsx / JAN 26 | 1 | 146 | 0 | 0 | Data tersedia |
| 13. BPS LRA Juni (Bapenda).xlsx / FEB 26 | 1 | 149 | 0 | 0 | Data tersedia |
| 13. BPS LRA Juni (Bapenda).xlsx / MARET 26 | 1 | 147 | 0 | 0 | Data tersedia |
| 13. BPS LRA Juni (Bapenda).xlsx / APRIL 26 | 1 | 148 | 0 | 0 | Data tersedia |
| 13. BPS LRA Juni (Bapenda).xlsx / MEI 26 | 1 | 149 | 0 | 0 | Data tersedia |
| 13. BPS LRA Juni (Bapenda).xlsx / JUNI 26 | 1 | 149 | 0 | 0 | Data tersedia |
| 2. UMKM dan Nilai Produksi.xlsx / Industri | 1 | 0 | 0 | 0 | Template belum diisi |
| 2025_1 LRA Triwulan I.xlsx / Worksheet | 1 | 970 | 0 | 0 | Data tersedia |
| 2025_2 LRA Triwulan II 2025.xlsx / Worksheet | 1 | 972 | 0 | 0 | Data tersedia |
| 2025_3 LRA Triwulan 3 T.A. 2025.xlsx / Worksheet | 1 | 980 | 0 | 0 | Data tersedia |
| 2025_4 LRA TW 4 2025.xlsx / Worksheet | 1 | 986 | 0 | 0 | Data tersedia |
| 2026_1 lra-konsolidasi-kota-batu triwulan 1 2026.xlsx / Worksheet | 1 | 1463 | 2 | 0 | Data tersedia |
| 2026_2 LRA TW II 2026 sementara.xlsx / Worksheet | 1 | 932 | 0 | 0 | Data tersedia |
| 23. ESDA.xlsx / Galian | 1 | 0 | 0 | 0 | Template belum diisi |
| 2a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2025.xlsx / PMA | 1 | 39 | 0 | 0 | Data tersedia |
| 2a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2025.xlsx / PMDN | 1 | 39 | 0 | 0 | Data tersedia |
| 3. Jumlah Koperasi dan Nilai Produksi.xlsx / Koperasi | 1 | 0 | 0 | 0 | Template belum diisi |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2026.xlsx / PMA | 1 | 28 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2026.xlsx / data_Page1_1_1 | 1 | 2 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2026.xlsx / data_Page1_1_2 | 1 | 2 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2026.xlsx / PMDN | 1 | 27 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2026.xlsx / PMA KABKOTA PER SEKTOR  | 1 | 24 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2026.xlsx / PMDN KABKOTA PER SEKTOR | 1 | 24 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2026.xlsx / data_Page2_2_1 | 1 | 2 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan I-2026.xlsx / data_Page2_2_2 | 1 | 2 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan IV-2025.xlsx / PMA | 3 | 74 | 10 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan IV-2025.xlsx / data_Page1_1_1 | 1 | 2 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan IV-2025.xlsx / data_Page1_1_2 | 1 | 2 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan IV-2025.xlsx / PMDN | 4 | 98 | 12 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan IV-2025.xlsx / PMDN KABKOTA PER SEKTOR | 1 | 24 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan IV-2025.xlsx / PMA KABKOTA PER SEKTOR  | 1 | 24 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan IV-2025.xlsx / Sheet1 | 0 | 0 | 0 | 0 | Sheet kosong |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan IV-2025.xlsx / Sheet2 | 0 | 0 | 0 | 0 | Sheet kosong |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan IV-2025.xlsx / data_Page2_2_1 | 1 | 2 | 0 | 0 | Data tersedia |
| 3a. Realisasi PMA dan PMDN Menurut Sektor Triwulan IV-2025.xlsx / data_Page2_2_2 | 1 | 2 | 0 | 0 | Data tersedia |
| A. Dinas Pertanian.xlsx / Tanaman Pangan | 2 | 20 | 0 | 51 | Data tersedia |
| A. Dinas Pertanian.xlsx / Hortikultura | 2 | 228 | 1 | 0 | Data tersedia |
| A. Dinas Pertanian.xlsx / Hortikultura PMTB | 1 | 56 | 1 | 0 | Data tersedia |
| A. Dinas Pertanian.xlsx / Perkebunan | 1 | 44 | 3 | 0 | Data tersedia |
| A. Dinas Pertanian.xlsx / Perkebunan PMTB | 1 | 24 | 0 | 0 | Data tersedia |
| A. Dinas Pertanian.xlsx / Peternakan | 1 | 57 | 0 | 1 | Data tersedia |
| A. Dinas Pertanian.xlsx / Peternakan PMTB | 1 | 34 | 0 | 0 | Indikator belum diisi |
| A. Dinas Pertanian.xlsx / Kehutanan | 1 | 26 | 0 | 0 | Indikator belum diisi |
| A. Dinas Pertanian.xlsx / Perikanan | 1 | 26 | 0 | 0 | Data tersedia |
| ATV.xlsx / Perusahaan | 2 | 5 | 0 | 0 | Data tersedia |
| Bapenda.xlsx / LRA | 1 | 7 | 0 | 0 | Indikator belum diisi |
| Bapenda.xlsx / bioskop | 1 | 3 | 0 | 0 | Indikator belum diisi |
| Bapenda.xlsx / lainnya | 1 | 1 | 0 | 0 | Indikator belum diisi |
| D. PT PLN.xlsx / Listrik | 3 | 19 | 0 | 0 | Data tersedia |
| D. PT PLN.xlsx / Growth | 3 | 19 | 0 | 68 | Data tersedia |
| E. Dinas Lingkungan Hidup.xlsx / DLH | 2 | 7 | 1 | 0 | Data tersedia |
| E. Dinas Lingkungan Hidup.xlsx / Growth | 2 | 7 | 0 | 59 | Data tersedia |
| E. PDAM.xlsx / Air | 2 | 14 | 0 | 0 | Data tersedia |
| F. Dinas PUPR.xlsx / IMB | 2 | 0 | 0 | 0 | Template belum diisi |
| F. Dinas Penanaman Modal Satu Pintu.xlsx / IMB | 2 | 18 | 0 | 45 | Data tersedia |
| F. Dinas Penanaman Modal Satu Pintu.xlsx / PMA dan PMDN | 2 | 48 | 0 | 0 | Data tersedia |
| H. Dinas Perhubungan.xlsx / Penumpang | 6 | 18 | 0 | 35 | Data tersedia |
| H. Dinas Perhubungan.xlsx / CCTV Etle | 2 | 4 | 0 | 2 | Data tersedia |
| H. PT POS.xlsx / POS | 4 | 0 | 0 | 0 | Template belum diisi |
| K. BPJS Kesehatan.xlsx / BPJS | 2 | 8 | 0 | 13 | Data tersedia |
| K. BPJS Ketenagakerjaan.xlsx / BPJS | 1 | 4 | 0 | 0 | Data tersedia |
| O. APBdes.xlsx / Belanja | 2 | 25 | 0 | 0 | Data tersedia |
| O. BKAD.xlsx / LRA | 1 | 1020 | 0 | 21 | Data tersedia |
| O. BKAD.xlsx / kolektif indv | 1 | 2 | 0 | 0 | Indikator belum diisi |
| O. BKAD.xlsx / Belanja | 1 | 8 | 0 | 1 | Data tersedia |
| O. BKAD.xlsx / Dinkes | 1 | 2 | 0 | 0 | Indikator belum diisi |
| O. BKAD.xlsx / Diknas | 1 | 2 | 0 | 0 | Indikator belum diisi |
| O. BKAD.xlsx / Growth | 1 | 978 | 0 | 6551 | Data tersedia |
| P. Dinas Pendidikan.xlsx / Diknas | 3 | 12 | 2 | 0 | Data tersedia |
| P. Dinas Pendidikan.xlsx / Growth | 3 | 12 | 2 | 15 | Data tersedia |
| PT Pegadaian.xlsx / POS | 2 | 0 | 0 | 0 | Template belum diisi |
| Penyusunan PDRB Triwulan DP3AP2KB.xlsx / Sheet1 | 1 | 6 | 0 | 0 | Data tersedia |
| Pertamina.xlsx / Pertamina | 2 | 0 | 0 | 0 | Template belum diisi |
| Pertamina.xlsx / Sheet3 | 2 | 0 | 0 | 330 | Template belum diisi |
| Q. Dinas Kesehatan.xlsx / Copy of Dinkes | 3 | 19 | 0 | 0 | Data tersedia |
| Q. Dinas Kesehatan.xlsx / Growth | 3 | 17 | 0 | 130 | Data tersedia |
| R. Dinas Pariwisata.xlsx / Kunjungan | 2 | 157 | 0 | 295 | Data tersedia |
| R. Dinas Pariwisata.xlsx / Restoran | 1 | 3 | 0 | 0 | Indikator belum diisi |

Total: 37 workbook, 95 sheet, 139 tabel.

Hasil validasi: lulus; tidak ada judul kosong, baris/kolom kosong yang tampil, atau isi sumber yang tidak terklasifikasi.

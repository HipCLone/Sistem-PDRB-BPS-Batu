# Verifikasi revisi pengumpulan PDRB

Tanggal: 20 Oktober 2026. Lingkup: perubahan lokal, belum dipasang di server produksi. Tidak ada commit/push maupun perubahan data produksi pada revisi ini.

## Perubahan

- Data PDRB dan detail dataset memakai urutan Tahun lalu Triwulan.
- Range slider biru di atas tabel dihapus. Scrollbar native serta panah keyboard dan Home/End tetap bekerja.
- Form baris/komoditas baru vertikal; satuan/keterangan opsional dan kolom periode dibiarkan kosong untuk diisi kemudian.
- Edit data hanya ada pada judul halaman dan berlaku pada semua tabel yang dibuka. Mode edit tetap aktif ketika mengganti bagian data.
- Kelola tabel menyediakan pilih baris, simpan nama indikator, dan hapus baris dengan konfirmasi. Backend membatasi tindakan struktur ke admin.
- Download CSV tersedia untuk setiap tabel dan seluruh peran yang boleh membaca dataset. Ekspor mengikuti filter, meliputi semua baris pagination, memakai cached formula, BOM UTF-8, CSV quoting, dan proteksi teks awalan formula.
- Upload meminta tahun dan triwulan wajib di frontend/backend. Metadata periode disimpan tanpa mengganti isi template atau dataset lama.
- Halaman `/status-pengumpulan` menampilkan instansi dan empat triwulan pada tahun terpilih. Admin melihat semua instansi, instansi hanya miliknya. Pada mobile setiap sel memiliki label triwulan.

## Arti status

Penyerahan eksplisit dari Kumpulkan laporan atau upload berhasil. Bukan inferensi dari isi kolom atau validasi kelengkapan seluruh tabel. Data lama tanpa penyerahan tetap Belum mengumpulkan. Admin/instansi non-Bapenda mengonfirmasi periode secara manual; Bapenda melalui upload saja. Dataset yang dihapus/dipindahkan tidak dihitung; dataset lain pada periode sama tetap dihitung. Pengumpulan tidak mengunci penyuntingan data.

Catatan disimpan melalui `db.submissions` dalam payload layout PostgreSQL `pdrb.app_metadata`. Transaksi yang sama menyimpan data, status, audit, dan notifikasi. Tidak ada migrasi schema atau reset database yang diperlukan.

## Hasil pengujian

- `npm test`: 25 tes lulus. Termasuk status belum/sudah, isolasi instansi, periode tidak valid, penolakan pengumpulan manual Bapenda, upload append, penghapusan laporan terbaru dengan fallback ke laporan lain, pengelolaan nama baris, restart JSON fixture, dan persistensi status melalui adaptor PostgreSQL/PGlite baru.
- `npm run test:tables`: 124 tabel sumber dirender pada mode baca/edit; tidak ada header kosong atau sel kosong tanpa placeholder.
- `node scripts/browser-check.mjs --revisions-only`: 15 pemeriksaan lulus, 0 uncaught runtime exception. Klik Edit/Selesai mengubah seluruh tabel; Tambah baris -> form tanpa periode -> Batal; Kelola tabel -> kontrol baris tersedia -> Tutup; Download CSV -> file nyata terunduh; pengumpulan manual -> status -> refresh; status network error -> Coba lagi pulih; upload Bapenda -> status triwulan; admin -> seluruh instansi.
- `node scripts/browser-check.mjs`: regresi browser lengkap lulus, termasuk route/back/forward, CRUD, konfirmasi penghapusan, pagination, notifikasi, upload template berbeda, login keyboard, dan validasi alasan drastis. Skrip diperbarui dari ekspektasi slider lama menjadi scrollbar native.
- Browser memeriksa lebar 320, 390, 768, 1024, 1440 px untuk tabel; kolom terakhir dapat dicapai tanpa overflow halaman. Status diperiksa pada 320, 768, 1440 px dan teks 200%. Regresi beranda/daftar mencakup 2560 px.
- Screenshot status: `.local-backups/browser/reporting-320.png`, `reporting-768.png`, `reporting-1440.png`. Tidak ada tes pada keyboard layar perangkat fisik; dialog memakai pola native yang sama dan konten dapat digulir.
- Kontras checker: `#52616c` di putih 6,39:1; `#194f90` di putih 8,20:1. Warna dan kontrol lain mempertahankan token portal.
- Build Vite berhasil. Database kantor tidak dipakai sebagai fixture pengujian.

## Delivery Gate antislop

Penilaian mencakup perubahan revisi ini; komponen dasar yang tidak berubah diperiksa melalui regresi yang disebutkan di atas.

| Aturan | Status dan bukti |
| --- | --- |
| R-01 | PASS: token biru portal, tidak menambah gradient. |
| R-02 | PASS: teks UI baru tidak memakai em dash. |
| R-03 | PASS: browser 320–1440 px, kolom terakhir terjangkau, status berlabel pada mobile. |
| R-04 | PASS: tidak membuat ikon baru; label tindakan tetap teks. |
| R-05 | PASS: matriks status mengikuti kebutuhan empat periode, bukan kartu dashboard. |
| R-06 | PASS: Segoe UI sistem tetap untuk komputer kerja Windows. |
| R-07 | PASS: latar dokumen polos, tidak ada pola tambahan. |
| R-08 | PASS: tidak ada panah dekoratif baru. |
| R-09 | PASS: tidak membuat badge dekoratif; status berupa teks. |
| R-10 | PASS: tidak menambah glassmorphism. |
| R-11 | PASS: radius kontrol menggunakan kelas portal yang ada. |
| R-12 | PASS: elevasi hanya dialog/popup yang sudah ada. |
| R-13 | PASS: tidak menambah glow. |
| R-14 | PASS: tidak menambah kartu fitur. |
| R-15 | PASS: Edit data, Download CSV, Kumpulkan laporan menyebut tindakan. |
| R-16 | PASS: teks faktual tanpa jargon pemasaran. |
| R-17 | PASS: status berasal dari peristiwa penyerahan tersimpan, bukan angka contoh. |
| R-18 | PASS: tidak membuat testimoni atau identitas orang. |
| R-19 | PASS: tanpa animasi tambahan, scroll auto sesuai MOTION 1. |
| R-20 | PASS: tabel instansi/periode dan identitas PDRB tetap menjadi fokus. |
| R-21 | PASS: tema terang dokumen kerja sesuai arah pengguna. |
| R-22 | PASS: tanpa ilustrasi tambahan. |
| R-23 | PASS: tidak membuat aset; halaman status diminta pengguna. |
| R-24 | PASS: navigasi status menuju route terlindungi yang diuji. |
| R-25 | PASS: kontras warna baru tidak berubah, checker 6,39:1 dan 8,20:1. |
| R-26 | PASS: aksi baru memakai endpoint/onClick nyata; unduh menghasilkan file CSV. |
| R-27 | PASS: Loading, error+Retry, dan Empty tersedia; network error diuji browser. |
| R-28 | PASS: tidak ada FAQ. |
| R-29 | PASS: warna status berupa teks netral, satu aksen biru. |
| R-30 | PASS: mempertahankan portal dokumen, tidak mengadopsi produk lain. |
| R-31 | PASS: alasan hierarki, form, navigasi, dan status tercatat di docs/design.md. |
| R-32 | PASS: kontrol native, focus ring portal, dialog Escape dan login Tab/Enter lulus regresi. |
| R-33 | PASS: perubahan langsung melalui patch source, tanpa rewrite script CSS. |
| R-34 | PASS: hanya tema terang yang dikirim, tidak menambah toggle. |
| R-35 | PASS: build, tes API/SQL/CSV, browser klik dan screenshot; batas uji perangkat fisik dicatat. |
| R-36 | PASS: tidak mengklaim kelengkapan, kualitas, atau keamanan data dari status pengumpulan. |
| R-37 | PASS: arah dokumen kerja, ENERGY 1 / RHYTHM 2 / MOTION 1 dari docs/design.md. |
| R-38 | PASS: data lama tidak dibuatkan status atau histori palsu. |
| Liveliness | PASS: tombol utama menjadi fokus, ruang memisahkan kontrol dan tabel, aksen biru serta motif header dokumen dipertahankan. |
| C-1–C-5 | PASS: kontrol memiliki tujuan, aksi bekerja, komposisi berdasarkan periode, reflow teruji, dan status berasal dari peristiwa nyata. |

## Penerapan server

Belum dijalankan pada server. Salin source frontend yang berubah (termasuk file baru `ReportingStatus.jsx` dan `tableCsv.mjs`) dan `backend/server.js`. Di SSH server jalankan `npm run build`, lalu `sudo systemctl restart pdrb`. Jangan menyalin `.env`, database JSON lama, atau menimpa package files laptop yang masih memakai SheetJS versi lama. Tidak memerlukan `db:import` dan tidak mengubah data Excel asli.

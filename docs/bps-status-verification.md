# Verifikasi revisi identitas dan status PDRB

Tanggal 28 Oktober 2026. Arah desain mengikuti `docs/design.md`, ENERGY 1 / RHYTHM 2 / MOTION 1 dan skill antislop selama pengerjaan. Catatan revisi terbaru: status sekarang dihitung dari nilai tiap dataset, bukan dari penyerahan manual; penjelasan status lama di dokumen ini mencatat perilaku sebelum revisi tersebut.

## Perubahan dan dasar desain

- Semua instansi dapat mengedit nilai pada dataset miliknya, termasuk Bapenda. Hak membuat atau menghapus struktur tetap di admin. Pengecekan kepemilikan tetap dilakukan backend. Perubahan drastis memakai validasi dan alasan yang sama untuk semua instansi.
- Bapenda dan admin dapat upload Excel/CSV; tahun dan triwulan wajib dipilih. Setiap upload tetap menghasilkan dataset baru dan menandai status pengumpulan periode yang dipilih.
- Halaman terpisah status dihapus. URL lama diarahkan ke Data PDRB agar tautan lama tidak buntu. Status TW 1, TW 2, TW 3, dan TW 4 berada pada empat kolom tersendiri untuk tahun status yang dipilih. Perubahan tahun filter data juga menyelaraskan tahun status; tahun status dapat dipilih sendiri. Tabel lebar dapat digeser di dalam wadahnya pada tablet; pada mobile status bertumpuk dengan label masing-masing.
- Satu instansi dapat memiliki beberapa dataset: status yang sama diulang pada setiap barisnya karena status merupakan status instansi, bukan jaminan kelengkapan tiap tabel. Instansi tanpa dataset memiliki baris sendiri. Data lama tanpa catatan penyerahan ditandai belum mengumpulkan, bukan dibuatkan catatan baru. Jika permintaan status gagal, data tetap terbaca dan ada tombol Coba lagi.
- Logo PNG BPS disalin dari aset proyek presensi; foto gedung memakai gambar lampiran pengguna. Keduanya lokal. Lapisan terang biru pada foto menjaga kontras; panel tabel dan form tetap putih sehingga angka tidak bersaing dengan latar.
- Akun Bapenda dapat menandai penyerahan manual atau melalui upload. Perubahan disimpan dalam transaksi PostgreSQL yang sama dengan audit/notifikasi; schema database tidak perlu dimigrasi.

## Pemeriksaan

- `npm test`: akses edit Bapenda, penolakan lintas instansi, alasan perubahan drastis, upload dengan periode, status, restart, dan adaptor PostgreSQL/PGlite diuji pada fixture terisolasi.
- `npm run test:tables`: 124 tabel sumber dirender pada mode baca/edit.
- `node scripts/browser-check.mjs --revisions-only`: upload, edit Bapenda yang bertahan setelah refresh, status per triwulan, kesalahan status dan Coba lagi, redirect URL lama, logo/foto, serta responsivitas 320–1440 px dan teks 200% diuji pada fixture terisolasi.
- `node scripts/browser-check.mjs`: regresi navigasi, login keyboard, CRUD, upload Bapenda, notifikasi, dialog, pagination, dan alasan perubahan drastis diuji pada fixture terisolasi.
- Screenshot: `.local-backups/browser/bps-login-1440.png` dan `.local-backups/browser/data-status-{320,768,1440}.png`. Tampilan mobile diperiksa melalui emulasi, bukan perangkat fisik.
- Kontras teks abu `#52616c` terhadap perkiraan bagian foto paling gelap setelah lapisan terang `#d4dce1`: 4,60:1; biru `#194f90` pada putih 8,20:1. Isi tabel memakai latar putih.
- Build Vite berhasil. Pengujian tidak menulis ke database produksi; perubahan belum dideploy.

## Delivery Gate antislop

| Pemeriksaan | Hasil dan bukti |
| --- | --- |
| Hard Gate: R-02, R-17, R-18, R-23, R-28, R-36, R-38 | PASS. Teks baru memakai data status nyata; logo dan foto diberikan pengguna; tidak ada statistik, testimoni, atau klaim fiktif. |
| Hard Gate: R-03, R-25, R-32, R-34 | PASS untuk lingkup yang diuji. Status, tabel, dan navigasi diperiksa pada lebar 320–1440 px dan 200%; kontrol dan dialog memakai focus ring dan perilaku keyboard yang ada; kontras diuji seperti di atas. |
| Hard Gate: R-24, R-26, R-27, R-35 | PASS. URL lama beralih ke daftar data; filter, edit, upload, status, retry, login, dialog, dan unduh ditelusuri pada browser; data/status memiliki loading dan error. |
| Hard Gate: R-33, R-37 | PASS. Perubahan ditulis pada source, dengan arahan dan dials dalam `docs/design.md`. |
| Purpose-Gate: R-01, R-04, R-06, R-07, R-08, R-09, R-10, R-12, R-13, R-14, R-19, R-22 | PASS. Logo BPS dan foto nyata menyampaikan identitas; aksen biru memandu tindakan, teks dan tabel tetap dominan; tidak ada ikon/animasi/ilustrasi hias baru. |
| Liveliness | PASS. Identitas BPS, foto sumber, hierarki judul, ruang antarbagiannya, dan aksen biru mempertahankan karakter portal dengan dials yang ditetapkan. |
| C-1–C-5 dan R-05, R-11, R-15, R-16, R-20, R-21, R-29–R-31 | PASS untuk perubahan ini. Status ditempatkan dekat data yang digunakan, tindakan berlabel jelas, radius dan tipografi konsisten, tidak ada data atau orang fiktif, dan alasan utama dicatat pada bagian desain. |

Untuk deploy, salin source frontend/backend dan dua aset baru ke server, build ulang, dan restart layanan. Jangan menimpa `.env` atau file package server dengan versi laptop yang lebih lama; migrasi database tidak diperlukan.

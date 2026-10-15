# Portal PDRB Kota Batu

Portal pengumpulan data PDRB dengan React, Express, dan PostgreSQL pada database `db_magang`, schema `pdrb`.

## Isi utama

- React + Vite frontend.
- Express backend dengan connection pool PostgreSQL (`pg`).
- JWT login.
- Hak akses per instansi: user instansi hanya menerima workbook milik instansinya dari API; admin menerima seluruh workbook.
- 37 file Excel sumber disertakan utuh pada `source-excel/`.
- 95 sheet Excel sumber dinormalisasi ke `backend/data/workbooks.json` sebagai bahan migrasi. Runtime membaca seluruh data dari PostgreSQL, bukan JSON.
- 62+ ribu baris/cell grid sumber dipertahankan; formula Excel juga dipertahankan sebagai formula dan cached value bila tersedia.
- Penyajian tabel per bagian dengan header tahun/triwulan dan sel gabungan sumber.
- Filter tahun/triwulan dan instansi admin, pagination tiap tabel, serta pilihan bagian data.
- Admin CRUD dataset, tabel, baris, dan kolom seluruh instansi. Instansi selain Bapenda mengisi/mengedit sel miliknya tanpa mengubah struktur. Bapenda hanya membaca dan upload, tanpa edit manual.
- Input baris baru melalui form dinamis yang mengikuti jumlah/label kolom sheet.
- Import Excel lokal melalui backend.
- Audit aktivitas CRUD dan upload dengan ID dataset, termasuk upload bernama file sama.
- Data kosong tidak dikonversi otomatis menjadi 0.

## Menjalankan di Windows

Pastikan Node.js dan npm sudah terpasang.

Aktifkan tunnel SSH ke server `192.168.100.10` melalui akun SSH `bps`, dengan listener lokal `127.0.0.1:15432` menuju PostgreSQL server port `5432`. Tunnel harus tetap aktif selama backend digunakan; project tidak menjalankan SSH secara otomatis.

Konfigurasi berada di `.env` lokal yang diabaikan Git. `.env.example` berisi nama variabel tanpa password. Target koneksi: `PGHOST=127.0.0.1`, `PGPORT=15432`, `PGDATABASE=db_magang`, `PGUSER=magang`. Isi `PGPASSWORD` sendiri, atau gunakan `PDRB_CREDENTIALS_FILE` untuk membaca hanya `PGPASSWORD` dari file konfigurasi yang Anda izinkan. Konfigurasi PDRB tidak mewarisi host, port aplikasi, atau schema presensi.

Konfigurasi saat ini memakai password langsung pada `.env` PDRB, tanpa bergantung pada `.env` presensi. Backend memakai `HOST=127.0.0.1` dan `PORT=5012`; proxy frontend membaca port tersebut. File contoh tidak berisi password asli.

```powershell
cd D:\bps-intern-project-ub\pdrb-frontend
npm install
npm run db:check
npm run dev
```

Buka:

- Frontend: http://127.0.0.1:5173
- API health: http://127.0.0.1:5012/api/health

Health yang berhasil menyebut `storage: "postgres"` dan `schema: "pdrb"`. Backend gagal startup jika database belum siap; tidak beralih diam-diam ke JSON. JWT secret diambil dari `JWT_SECRET` (minimal 32 karakter), atau dibuat acak dan disimpan pada `backend/data/jwt-secret` yang diabaikan Git. Penggantian secret membuat sesi lama tidak valid sehingga pengguna perlu login lagi.

## Migrasi database

Migrasi ke server telah dijalankan pada 9 Oktober 2026. Hasil dan batas pengujian: [docs/postgresql.md](docs/postgresql.md).

Untuk instalasi baru, siapkan JSON sumber yang ingin dipindahkan, hentikan backend lama yang masih menulis JSON, kemudian jalankan:

```powershell
npm run db:inventory
npm run db:check
npm run db:import
npm run db:verify
```

`db:import` membuat/memperbarui struktur khusus `pdrb`, mencadangkan kedua JSON ke `.local-backups/postgres-...`, mengimpor seluruh isinya, dan membandingkan hasil baca kembali sebelum commit. Jika sumber berubah selama import, transaksi dibatalkan. Import sumber yang sama tidak menduplikasi data; sumber berbeda ditolak apabila schema sudah berisi data. Tidak ada opsi otomatis untuk menimpa data server.

`db:migrate` hanya memperbarui struktur schema `pdrb`. `db:verify` membandingkan PostgreSQL dengan snapshot JSON lama, jadi perbedaan setelah pengguna mulai mengedit di PostgreSQL memang diharapkan. Jangan mengimpor ulang JSON untuk menghilangkan perbedaan tersebut.

URL awal `/` selalu membuka `/login`, termasuk jika sesi tersimpan. Login berhasil menuju `/beranda`, atau melanjutkan halaman data yang sebelumnya dibuka. Menu Beranda tidak mengarah lagi ke `/`. Refresh halaman data tetap mempertahankan sesi dan filter.

Daftar dan halaman data menggunakan judul pelaporan yang sesuai isi sumber, bukan nama file `.xlsx`. Nama asli tetap disimpan pada backend untuk pelacakan Excel. Saat upload, judul data dapat diisi sendiri atau mengikuti keterangan sumber jika tersedia.

Untuk production lokal:

```powershell
npm install
npm run build
npm start
```

Setelah build, Express menyajikan frontend dari folder `dist`.

## Akun demo

Semua password di bawah adalah password development dan wajib diganti jika sistem dipakai di lingkungan nyata.

| Username | Password | Akses |
|---|---|---|
| admin | admin123 | seluruh instansi |
| dinas-pertanian | 123456 | Dinas Pertanian dan Ketahanan Pangan |
| diskoperindag | 123456 | Diskoperindag |
| dpmptsp | 123456 | DPMPTSP |
| dishub | 123456 | Dinas Perhubungan |
| dinkes | 123456 | Dinas Kesehatan |
| bapenda | 123456 | Bapenda |
| pendidikan | 123456 | Dinas Pendidikan |
| pariwisata | 123456 | Dinas Pariwisata |
| bkad | 123456 | Badan Keuangan dan Aset Daerah |

Akun lain tersedia untuk instansi yang ada pada data sumber. Password default akun instansi adalah `123456`.

## Catatan data

Audit per file dan sheet tersedia pada [docs/excel-audit.md](docs/excel-audit.md). Pemeriksaan mencakup 37 Excel asli dan 95 sheet pada data API. Tabel kosong ditampilkan sebagai keadaan belum diisi, bukan grid kosong. Baris contoh bernomor saja dan kolom tanpa isi disembunyikan pada mode baca. Kolom dengan satu nilai tetap ditampilkan; nilai nol tetap nol.

Judul gabungan dibaca mengikuti rentang merge sumber. Jika judul memang tidak ada pada Excel, aplikasi memakai label berbasis posisi seperti `Nilai sumber (K)` dan memberi penjelasan, tanpa menebak makna atau satuannya. Rumus tanpa hasil tersimpan dan error Excel ditampilkan sebagai `-`; rumus asli tetap dapat dilihat melalui tooltip bila selnya tampil.

Jalankan pemeriksaan ulang setelah memperbarui data:

```powershell
npm test
npm run audit:excel
npm run test:tables
npm run build
```

Data pada aplikasi berasal dari workbook yang diberikan di percakapan. Struktur asli tidak diratakan menjadi satu tabel generik karena workbook memang memiliki struktur berbeda-beda: tabel indikator, growth, LRA, hierarki rekening, proyek, investasi, dan workbook bulanan.

## Pengelolaan data dan hak akses

Admin memakai **Buat data** pada daftar untuk membuat dataset dengan tabel kosong, atau upload untuk mengimpor berkas. Pada halaman dataset, **Tambah tabel** membuat bagian tabel baru, **Kelola data** mengubah judul/instansi atau menghapus dataset, dan **Kelola tabel** mengubah nama tabel/kolom atau menghapus tabel/kolom. **Tambah baris**, **Tambah kolom**, serta penghapusan baris dalam mode edit hanya tersedia untuk admin.

Instansi selain Bapenda membuka tabel sendiri lalu menekan **Edit data**. Seluruh kolom yang disiapkan admin, termasuk yang masih kosong, tersedia untuk diisi. Tekan Enter atau pindah sel untuk menyimpan. Baris yang nilainya dikosongkan tetap tersedia saat mode edit dibuka lagi. Header dan area gabungan selain sel utamanya tidak dapat diedit sebagai nilai; API menolak perubahan struktur maupun akses instansi lain.

Bapenda dapat mengunggah Excel/CSV dengan struktur template berbeda pada setiap pelaporan. Sistem tidak mensyaratkan satu template tetap. Setiap upload memiliki ID unik dan menambah dataset, termasuk jika nama file atau periodenya sama. Dataset sebelumnya tidak diganti. Bapenda tidak dapat mengedit nilai manual, membuat struktur, atau menghapus dataset.

Penghapusan meminta konfirmasi dan memakai penanda pada tabel `pdrb.deleted_datasets` serta `pdrb.table_states`, bukan menghapus fisik baris/kolom Excel. Dataset yang dihapus tidak dapat dibuka lewat URL/API aktif. Tabel/baris/kolom yang dihapus disembunyikan pada penyajian dan ditolak saat diedit. Grid sumber dan koordinatnya dipertahankan agar merge serta perubahan sel tidak bergeser; file di `source-excel/` tidak ditimpa. Grid mentah pada respons workbook tetap berisi sumber beserta penanda penghapusan, jadi fitur ini bukan penghapusan permanen untuk kebutuhan privasi. Belum tersedia tombol pemulihan di UI.

Untuk itu aplikasi menyimpan setiap workbook dan setiap sheet sebagai grid Excel-aware. Form input baru memakai header/struktur sheet yang sedang dibuka sehingga tidak memaksakan satu schema ke semua instansi.

File yang tidak dapat dipastikan kode PDRB-nya dari master yang tersedia tetap diberi sektor `Belum dipetakan dari master`; datanya tidak dibuang. Kode dan metadata sheet tidak ditampilkan sebagai baris tambahan di atas tabel.

## Struktur proyek dan pembersihan

Kode aplikasi berada di `src/`, API di `backend/`, dan pengujian/audit yang masih dipakai di `scripts/`. Dua puluh skrip diagnostik/persiapan lama pada root telah dicadangkan ke `.local-backups/cleanup-2026-10-06.zip`, lalu dihapus dari root. Arsip berisi versi terakhir sebelum penghapusan, termasuk `build_data.py` yang memakai path Linux lama. File Excel asli, data seed, database lokal, dan lockfile dipertahankan.

Frontend memakai proxy `/api` ke backend saat development. Jalankan `npm run dev` untuk keduanya, atau `npm run dev:server` dan `npm run dev:client` di dua terminal. Backend development memakai watch sehingga perubahan kode termuat otomatis. Restart proses yang sudah berjalan sebelum menggunakan revisi ini.

`npm test` mencakup tes JSON legacy terisolasi serta SQL/API PostgreSQL embedded (PGlite); tidak menulis ke database server. Pengujian browser: `node scripts/browser-check.mjs` (memerlukan Chrome di Windows), memakai JSON sementara untuk regresi UI. Screenshot dan hasilnya berada di `.local-backups/browser/`. `npm run test:postgres` membandingkan API PostgreSQL server dengan snapshot JSON melalui GET saja, tanpa membuat data uji di server; jalankan sebelum snapshot lama berbeda akibat perubahan pengguna.

Ringkasan hasil dan Delivery Gate desain: [docs/revision-verification.md](docs/revision-verification.md).

## Notifikasi dan log histori

Lonceng pada header berada di kiri nama akun/instansi dan menampilkan jumlah notifikasi belum dibaca. Ikon profil lingkaran memakai inisial nama sebenarnya. Menu Aktivitas diganti dengan halaman **Notifikasi** melalui lonceng; URL `/notifications` tetap dapat dibuka dan navigasi Back/Forward tetap berjalan.

- Admin membuat dataset/tabel baru: akun instansi tujuan menerima notifikasi tabel baru.
- Instansi mengisi atau mengedit sel: admin menerima notifikasi berisi instansi dan judul data.
- Bapenda mengunggah berkas: admin menerima pemberitahuan data baru.
- Popup dapat ditutup tanpa menghapus status belum dibaca. **Tandai dibaca**, **Tandai semua dibaca**, dan **Buka data** menandai pesan dibaca; membuka halaman notifikasi saja tidak otomatis membaca seluruh pesan.
- **Log histori** tetap menyimpan jejak tindakan yang dapat diakses akun tersebut. Admin melihat seluruh audit; instansi hanya histori instansinya. Status dibaca dan histori tetap tersimpan setelah restart backend.

Pemeriksaan notifikasi berlangsung setiap 10 detik saat tab terlihat, saat kembali fokus, dan setelah perubahan di sesi yang sama. Ini popup di dalam aplikasi saat dibuka, bukan push browser/OS saat aplikasi ditutup. Kotak masuk mengembalikan 200 notifikasi terbaru per akun, dengan pagination 10 pesan. Database mempertahankan maksimal 5.000 notifikasi total dan 1.000 peristiwa audit terbaru, dengan pagination histori 20 peristiwa. Audit lama tetap menjadi histori, tidak otomatis dibuat menjadi notifikasi belum dibaca. Dataset yang dihapus atau dipindahkan keluar hak akses tidak memiliki tautan aktif pada notifikasi.

## Batasan operasional

- Database runtime memakai PostgreSQL; JSON lama hanya bahan migrasi/cadangan dan tes legacy.
- User database `magang` juga digunakan project lain. Schema memisahkan objek aplikasi, bukan membatasi seluruh hak user tersebut. Aplikasi tidak mengubah role, izin global, atau `search_path` global.
- Tunnel lokal dan file kredensial rujukan harus tersedia. Password akun demo, HTTPS, rate limiting, dan backup PostgreSQL berkala tetap perlu ditangani sebelum penggunaan publik.
- Upload Excel baru masuk sebagai dataset baru di PostgreSQL dan belum melakukan mapping PDRB otomatis. Berkas sementara dibersihkan setelah parsing.
- Perhitungan formula Excel tidak dijadikan mesin kalkulasi penuh; formula sumber dipertahankan, dan cached value dari workbook digunakan bila tersedia.
- Belum tersedia workflow approval terpisah atau push notifikasi saat aplikasi ditutup; notifikasi dalam aplikasi memakai polling.

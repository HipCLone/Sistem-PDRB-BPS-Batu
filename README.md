# Portal PDRB Kota Batu — Local Full Stack

Prototype/full local implementation for data collection PDRB Kota Batu.

## Isi utama

- React + Vite frontend.
- Express local backend.
- JWT login.
- Hak akses per instansi: user instansi hanya menerima workbook milik instansinya dari API; admin menerima seluruh workbook.
- 37 file Excel sumber disertakan utuh pada `source-excel/`.
- 95 sheet Excel dinormalisasi ke `backend/data/workbooks.json`.
- 62+ ribu baris/cell grid sumber dipertahankan; formula Excel juga dipertahankan sebagai formula dan cached value bila tersedia.
- Tampilan workbook/sheet seperti Excel.
- Pencarian, pagination, status, sheet tabs.
- Edit cell untuk pemilik instansi/admin.
- Input baris baru melalui form dinamis yang mengikuti jumlah/label kolom sheet.
- Import Excel lokal melalui backend.
- Audit aktivitas edit/tambah/upload.
- Data kosong tidak dikonversi otomatis menjadi 0.

## Menjalankan di Windows

Pastikan Node.js dan npm sudah terpasang.

```powershell
cd pdrb-kota-batu-local
npm install
npm run dev
```

Buka:

- Frontend: http://127.0.0.1:5173
- API health: http://127.0.0.1:8787/api/health

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

Data pada aplikasi berasal dari workbook yang diberikan di percakapan. Struktur asli tidak diratakan menjadi satu tabel generik karena workbook memang memiliki struktur berbeda-beda: tabel indikator, growth, LRA, hierarki rekening, proyek, investasi, dan workbook bulanan.

Untuk itu aplikasi menyimpan setiap workbook dan setiap sheet sebagai grid Excel-aware. Form input baru memakai header/struktur sheet yang sedang dibuka sehingga tidak memaksakan satu schema ke semua instansi.

File yang tidak dapat dipastikan kode PDRB-nya dari master yang tersedia tetap diberi kode `—` dan sektor `Belum dipetakan dari master`; datanya tidak dibuang.

## Batasan prototype lokal

- Database memakai `backend/data/db.json`, bukan PostgreSQL/MySQL.
- Password JWT secret masih development default; ubah `JWT_SECRET` untuk penggunaan serius.
- Upload Excel baru masuk sebagai workbook lokal baru dan belum melakukan mapping PDRB otomatis.
- Perhitungan formula Excel tidak dijadikan mesin kalkulasi penuh; formula sumber dipertahankan, dan cached value dari workbook digunakan bila tersedia.
- Workflow approval/notifikasi real-time belum menjadi sistem terpisah; audit lokal sudah tersedia.

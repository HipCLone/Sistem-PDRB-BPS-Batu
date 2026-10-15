# PostgreSQL PDRB

Migrasi dijalankan pada 9 Oktober 2026 ke PostgreSQL 16.15 di server yang diberikan pengguna. Database `db_magang`, user database `magang`, schema `pdrb`. Koneksi dari komputer pengembangan melalui tunnel `127.0.0.1:15432` menuju PostgreSQL server `192.168.100.10:5432`; akun SSH `bps` berbeda dari akun database.

## Data yang dipindahkan

Import membaca `backend/data/workbooks.json` dan `backend/data/db.json` sekaligus. Sebelum commit, isi hasil baca dari PostgreSQL dibandingkan secara mendalam dengan seluruh isi kedua JSON, bukan hanya jumlah baris. ID, urutan, koordinat sel, rumus/cached value, format, merge, metadata, hash password, audit lama tanpa ID, penanda penghapusan, serta status dibaca dipertahankan.

| Tabel schema pdrb | Jumlah saat import | Isi |
|---|---:|---|
| institutions | 23 | Instansi |
| users | 24 | Akun dan hash password lama |
| datasets | 40 | 37 dataset sumber dan 3 tambahan |
| sheets | 99 | Seluruh sheet, termasuk dataset yang ditandai dihapus |
| cell_overrides | 3 | Perubahan sel |
| added_rows | 1 | Baris tambahan |
| added_columns | 2 | Kolom tambahan |
| edited_rows | 1 | Koordinat baris yang pernah diedit |
| table_states | 0 | Siap menyimpan perubahan/hapus struktur tabel |
| dataset_details | 0 | Siap menyimpan perubahan judul dan instansi |
| deleted_datasets | 1 | Dataset yang sebelumnya dihapus secara logis |
| audit_events | 10 | Histori pengguna |
| notifications | 2 | Notifikasi dan status dibaca |
| app_metadata | 1 payload + revisi internal | Bentuk/urutan data untuk rekonstruksi dan invalidasi cache |
| imports | 1 | Identitas import, hash sumber, jumlah hasil |
| schema_migrations | 2 versi | Struktur awal dan trigger revisi |

Terdapat 39 dataset aktif. Dataset yang ditandai dihapus tetap disimpan, bukan dibuang saat migrasi. Tabel dengan jumlah nol memang belum memiliki data pada JSON lokal saat import; bukan data yang gagal dipindahkan.

Grid Excel disimpan sebagai JSONB per sheet karena template instansi berbeda. Akun, dataset, sheet, override sel, tambahan struktur, audit, dan notifikasi disimpan pada tabel masing-masing dengan primary key, foreign key yang sesuai, dan indeks. Ini bukan satu baris JSON berisi seluruh database. Kolom `data` menjaga bentuk lengkap entitas lama; `path` dan payload layout mempertahankan lokasi dan wadah kosong agar migrasi dapat diverifikasi tanpa kehilangan informasi. Perubahan operasional dilakukan melalui API aplikasi agar payload dan kolom indeks tetap konsisten.

## Pemisahan dari presensi

Seluruh DDL/DML aplikasi menyebut schema `pdrb` secara eksplisit. Migrasi tidak menjalankan DROP/TRUNCATE, tidak mengubah role/izin global, dan tidak mengubah `search_path` global user `magang`. Fungsi trigger memakai search path lokal fungsi ke `pg_catalog`.

Saat import, fingerprint katalog struktur tabel/kolom `presensi` sebelum dan sesudah dibandingkan dan sama. Pemeriksaan ini membaca metadata katalog, bukan isi data presensi. Test SQL terisolasi juga membuat sentinel `presensi` dan memastikan nilainya tidak berubah. Ini bukti untuk operasi migrasi yang dilakukan, bukan klaim bahwa pemisahan schema membatasi seluruh hak user database bersama.

## Konfigurasi dan menjalankan

`.env` PDRB diabaikan Git. Saat migrasi awal, password dirujuk dari `.env` presensi tanpa mengubah file tersebut. Sesuai konfigurasi terbaru pengguna, password sekarang diisi langsung pada `PGPASSWORD` di `.env` PDRB; tidak lagi bergantung pada file presensi. `.env.example` hanya menyediakan tempat password kosong.

```powershell
npm run db:check
npm run dev
```

Frontend tetap pada `http://127.0.0.1:5173`, backend pada `http://127.0.0.1:5012` sesuai `HOST`/`PORT` dalam `.env`. Proxy frontend membaca port backend tersebut. Health API yang berhasil mengembalikan `storage: "postgres"`, `schema: "pdrb"`. Tunnel harus tetap aktif. Backend tidak membuat SSH tunnel secara otomatis dan tidak beralih ke JSON saat PostgreSQL gagal.

JWT secret menggunakan `JWT_SECRET` yang minimal 32 karakter, atau secret acak yang dibuat saat startup dan disimpan pada `backend/data/jwt-secret`. Secret tersebut diabaikan Git. Karena secret baru berbeda dari secret development lama, pengguna perlu login ulang; hash password akun hasil migrasi tetap sama.

## Transaksi dan cache

Setiap request API memakai satu client pool dan satu transaksi. Request baca memakai snapshot repeatable read. Mutasi aplikasi diserialkan melalui advisory transaction lock khusus PDRB untuk menghindari lost update dari dua proses backend. Penguncian ini menukar paralelisme penulisan dengan konsistensi pada tahap migrasi ini; belum ada pengukuran beban untuk banyak pengguna.

Hanya entitas yang berubah yang ditulis. Perubahan data, audit, notifikasi, dan status dibaca di-commit sebelum respons berhasil dikirim. Error HTTP maupun kegagalan SQL membatalkan transaksi. Kegagalan penyimpanan memberi 503, bukan pesan sukses palsu. Penghapusan dataset/tabel/baris/kolom tetap memakai penanda.

Setiap perubahan tabel data memperbarui token revisi melalui trigger PostgreSQL. Cache request diperiksa terhadap token tersebut, sehingga data yang diubah proses backend lain akan dimuat kembali. Jika pemeriksaan database gagal, cache tidak dipakai untuk menyamarkan kegagalan koneksi. Cache mempercepat polling tanpa menjadikan memori sebagai sumber penyimpanan utama.

## Cadangan dan import ulang

Cadangan import pertama:

`.local-backups/postgres-2026-10-09T04-32-47-872Z/`

Berisi salinan tepat kedua JSON serta hash sumber; direktori diabaikan Git. JSON asli dan Excel asli tidak dihapus atau ditimpa. Runtime PostgreSQL tidak lagi menulis perubahan ke snapshot tersebut.

Identitas import pertama:

`5d178701b5c56e2e682a890ab1e8cefd041e317bd4db1fb3ce03cea17f7a0a68`

`npm run db:import` dengan sumber yang sama tidak menduplikasi data. Sumber berbeda ditolak jika tabel aplikasi sudah berisi data. `npm run db:verify` dan `npm run test:postgres` membandingkan server dengan snapshot JSON lama; perbedaan setelah edit baru di PostgreSQL merupakan hal yang diharapkan, bukan alasan menimpa database server dengan snapshot lama. Backup JSON saat migrasi bukan pengganti backup PostgreSQL berkala.

## Bukti pengujian

20 tes unit/API/SQL lulus, 66 pemeriksaan browser lulus, build lulus, dan 124 tabel sumber lulus render. `git diff --check` lulus. Delivery Gate antislop untuk tampilan yang dipertahankan tersedia pada [revision-verification.md](revision-verification.md); dokumentasi memakai kalimat tugas dan hasil pengujian yang dapat diperiksa, bukan klaim kesiapan produksi.

- `db:import` pada server: seluruh isi JSON lulus perbandingan sebelum commit; fingerprint struktur presensi tidak berubah.
- `db:verify` pada server: rekonstruksi seluruh data identik dengan JSON sumber saat migrasi.
- `test:postgres` pada server: API semua 24 akun dan 39 dataset aktif, termasuk grid/override, histori, serta notifikasi dibandingkan dengan API snapshot JSON melalui GET saja. Tidak membuat data uji di server.
- Tes PGlite: schema/import lossless, import ulang, penolakan overwrite, primary/foreign key, API permissions, edit bersamaan, upload Bapenda, status dibaca, rollback karena exception/constraint, rollback SQL yang mengembalikan HTTP 503, dan invalidasi cache lintas adapter/perubahan SQL.
- Tes embedded mengantrekan koneksi tunggal dan mengganti advisory lock dengan antrean lokal; tidak menjadi bukti benchmark atau pengujian beberapa proses PostgreSQL server. Implementasi server memakai advisory lock PostgreSQL asli.
- Regresi UI menggunakan database JSON sementara; pengujian tersebut tidak diklaim memakai server PostgreSQL. Kesesuaian kontrak API server diperiksa secara terpisah di atas.

Tidak ada commit/push, perubahan pada `.env` presensi, penghapusan JSON sumber, atau pembuatan akun demo baru pada server. Password demo yang sudah dimigrasikan tetap perlu diganti sebelum aplikasi dipakai publik.

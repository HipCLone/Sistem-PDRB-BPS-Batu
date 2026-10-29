# Pemulihan Excel asli, 19 Oktober 2026

Permintaan: seluruh data pelaporan kembali ke Excel asli, termasuk menghapus dataset upload dan perubahan testing. Akun, password, histori, dan notifikasi dipertahankan.

## Sumber dan backup

- Sumber: `D:\bps-intern-project-ub\data_excel`, tidak diubah.
- Salinan: `.local-backups/excel-original-20261019`, 39 file dengan hash SHA-256 yang cocok dengan sumber (37 XLSX dan 2 PDF).
- Snapshot dari pembacaan ulang 37 XLSX: `.local-backups/excel-original-20261019/original-snapshot.json`, 95 sheet. PDF tidak diimpor sebagai tabel.
- Backup keadaan sebelum perubahan: `.local-backups/restore-original-2026-10-19T06-36-04-177Z-59f126fe-1398-43d7-9ad7-6c6b4ea317b6/state-before.json`.
- Folder backup juga memuat snapshot sumber dan manifest hash. Backup mengandung hash password akun dan data internal; jangan dipublikasikan atau dimasukkan Git.

## Hasil

Target koneksi proyek: `127.0.0.1:15432` melalui tunnel, database `db_magang`, user `magang`, schema `pdrb`.

| Isi | Sebelum | Sesudah |
| --- | ---: | ---: |
| Dataset sumber | 37 | 37 |
| Dataset upload/tambahan | 3 | 0 |
| Dataset dengan override sel | 3 | 0 |
| Dataset dengan tambahan baris | 1 | 0 |
| Dataset dengan tambahan kolom | 2 | 0 |
| Dataset dengan edited rows | 1 | 0 |
| Dataset bertanda dihapus | 2 | 0 |
| Akun | 24 | 24 |
| Histori | 11 | 12 |
| Notifikasi | 2 | 2 |

Histori bertambah satu entri `RESTORE_ORIGINAL_DATA`. Sebelas entri lama tetap identik. Nilai password hash dan status baca notifikasi tetap identik. Semua overlay struktur, metadata pengganti, dan extra sheet dikosongkan, sehingga sumber asli menjadi data aktif kembali. Penghapusan upload dilakukan pada record database, bukan penghapusan fisik file arsip di disk. Script hanya menulis tabel schema `pdrb`; tidak menjalankan reset schema atau operasi terhadap `presensi`.

## Pengamanan dan verifikasi

- Script `scripts/restore-original.cjs` secara default hanya memeriksa database. `--apply` memerlukan fingerprint kondisi database dan snapshot dari pemeriksaan sebelumnya.
- Backup lengkap dibuat dan hash-nya diverifikasi sebelum penulisan apa pun. Penulisan memakai transaksi dan advisory lock yang sama dengan backend; hasil diverifikasi sebelum commit. Kegagalan membatalkan transaksi.
- Pemeriksaan setelah commit menggunakan koneksi baru dan transaksi read-only: seed sama persis dengan snapshot Excel, upload/overlay kosong, akun beserta password hash, histori lama, dan notifikasi identik dengan backup.
- `node --test scripts/restore-original.test.cjs`: 2 tes lulus. Meliputi tidak memutasi sumber, validasi snapshot, round-trip SQL, rollback, commit, serta sentinel `presensi` tidak berubah pada database PGlite terisolasi.
- `npm test`: 23 tes lulus pada fixture terisolasi, bukan menulis data produksi.
- Akses health domain publik tidak dapat diverifikasi melalui alat web pada sesi ini. Verifikasi isi dilakukan langsung pada database yang dikonfigurasi proyek, bukan klaim uji browser produksi.

JSON lama `backend/data/db.json` tidak menjadi penyimpanan runtime PostgreSQL dan tidak dipakai untuk mengembalikan data testing. Jangan mengimpor ulang JSON lama ke database kosong tanpa meninjau isinya. Verifikasi pemulihan harus dibandingkan dengan snapshot baru, bukan JSON migrasi historis. File backup tidak dihapus, sehingga data sebelum pemulihan tetap tersedia jika dibutuhkan untuk pemulihan balik yang ditinjau terpisah.

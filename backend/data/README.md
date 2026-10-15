`workbooks.json` adalah snapshot data sumber Excel yang sudah dinormalisasi, dipertahankan untuk migrasi/audit sumber.

`db.json` adalah penyimpanan lama yang berisi akun, override sel, penambahan struktur, upload, audit, dan notifikasi. Seluruh isinya telah dipindahkan ke PostgreSQL schema `pdrb`. Runtime tidak lagi membaca atau menulis kedua JSON tersebut. Adapter JSON hanya dapat dipakai dengan direktori eksplisit pada tes terisolasi.

`jwt-secret` dibuat saat startup jika `JWT_SECRET` tidak diatur. File ini dan `db.json` diabaikan Git. Jangan menghapus secret tanpa memahami bahwa sesi login lama akan menjadi tidak valid. Jangan menghapus snapshot JSON sebelum backup PostgreSQL dan hasil migrasi diperiksa.

# Status triwulan berdasarkan isian

Status pada daftar Data PDRB dihitung untuk tiap dataset dan tahun terpilih. Minimal satu nilai valid pada triwulan menghasilkan “Sudah terisi”; tanpa nilai yang terdeteksi hasilnya “Belum terisi”. Ini menunjukkan adanya isian, bukan bahwa seluruh baris atau tabel telah lengkap. Nol merupakan nilai. Dataset berbeda pada satu instansi tidak saling mengubah status.

Periode dikenali dari judul kolom, tahun/baris yang dapat dibaca, nama sheet bulan, nama sumber dengan periode, atau tahun dan triwulan yang dipilih saat upload. Ketika periode atau referensi rumus tidak dapat dipastikan, hasilnya “Perlu diperiksa”. Status memakai data aktif sesudah edit dan aturan penghapusan. Nilai error dan rumus yang bergantung pada sel kosong tidak dianggap isian; rumus dengan sumber yang tidak dapat diperiksa tidak langsung dianggap terisi. Halaman memperbarui status setiap 30 detik saat terlihat dan saat pengguna kembali ke tab.

Catatan penyerahan yang sudah ada tetap menjadi histori, tetapi tidak lagi menentukan status. Tombol pengumpulan manual dihapus dari tampilan agar tidak bertentangan dengan status otomatis. Endpoint dan catatan historis lama tetap dipertahankan. Tidak ada migrasi atau perubahan massal data PostgreSQL.

## Bukti

- `node --test scripts/quarter-status.test.mjs`: 7 tes untuk nilai nol, teks, sel kosong, perubahan periode, tahun berbeda termasuk tahun pada baris, nama bulan, metadata upload, data tanpa periode, rumus/error, data BULOG asli, dan penghapusan baris/kolom. Salah satu tes memeriksa sheet Tanaman Pangan asli, yang memiliki rumus pertumbuhan `-100` saat input TW 3 kosong.
- `node --test scripts/api.test.mjs scripts/database.test.mjs`: 13 tes lulus pada penyimpanan sementara dan PostgreSQL/PGlite terisolasi. Termasuk status kosong setelah konfirmasi historis, perubahan `0`/kosong, upload dengan periode, hak akses, restart, dan status setelah edit di adaptor PostgreSQL.
- `node scripts/browser-check.mjs --revisions-only`: pengujian browser mencakup nilai TW 1 yang sudah ada, TW 2 kosong, edit TW 2 hingga terisi, refresh, kesalahan status dan Retry, upload Bapenda, serta lebar 320/768/1440 px dan zoom teks 200%. Tidak memakai database produksi.
- Build Vite berhasil. Perubahan masih lokal dan perlu deploy frontend serta backend untuk diterapkan pada website online.

## Penilaian antislop

- Hard Gate: label status berupa teks, empat header periode tetap jelas, tidak ada status palsu ketika periode/rumus tidak pasti; error dan Retry diuji; halaman diuji pada tiga ukuran dan teks 200%. PASS pada lingkup perubahan.
- Purpose-Gate: warna, logo, foto, tabel, dan tipografi mempertahankan alasan di `docs/design.md`; tidak ada ornamen baru. PASS.
- Liveliness: fokus tetap pada daftar data dan empat kolom triwulan; hierarki serta identitas BPS tidak diubah. PASS.
- Craftsmanship dan Quality Locks: status didasarkan pada nilai data, diberi penjelasan batas kelengkapan, serta diperbarui setelah nilai berubah. Arah ENERGY 1 / RHYTHM 2 / MOTION 1 tetap berlaku. PASS.

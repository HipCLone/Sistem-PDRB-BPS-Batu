# Arah desain Portal PDRB

Brief pengguna: tampilan bersih dan modern, data Excel nyaman dibaca, navigasi dapat kembali, dan revisi PDRB mengikuti catatan yang diberikan. Antislop digunakan selama pengerjaan (during).

Pembacaan desain: portal kerja data untuk admin dan petugas instansi Kota Batu. ENERGY 1 / RHYTHM 2 / MOTION 1.

- Tabel menjadi fokus halaman dataset; setiap tabel sumber memiliki judul dan pagination sendiri pada halaman yang sama.
- Tema terang menyerupai dokumen kerja dan memudahkan perbandingan angka dengan Excel. Tidak ada toggle tema yang menambah pekerjaan rutin pengguna.
- Biru tua menandai tautan, fokus, dan tindakan utama. Warna dasar putih dan abu netral menjaga kontras angka.
- Segoe UI dan font sistem dipilih agar teks Indonesia terbaca baik pada komputer kerja Windows dan tidak bergantung pada font daring.
- Beranda membantu memilih instansi atau membuka tabel milik akun, bukan menampilkan daftar nama file teknis. Panduan membaca tabel berada di samping pilihan data pada desktop dan di bawahnya pada mobile.
- Ruang antartabel lebih besar daripada jarak antarkontrol. Ukuran kontrol minimum 44 px memudahkan penggunaan layar sentuh.
- Radius kecil membedakan bidang input dan panel. Bayangan hanya untuk dialog dan popup notifikasi yang menumpang di atas isi halaman.
- Ikon dipakai pada identitas portal dan umpan balik kesalahan; label teks tetap tersedia. Atas permintaan pengguna, logo BPS dari aset proyek presensi dipakai pada tab browser, login, dan wordmark.
- Catatan sumber dapat dibuka saat diperlukan. Sel tanpa nilai memakai tanda minus dengan penjelasan yang dapat dibaca pembaca layar.
- Pada layar sempit, filter bertumpuk dan daftar file berubah menjadi baris informasi. Tabel lebar bergulir di dalam wadahnya sendiri.
- Transisi hanya memberi umpan balik hover/fokus dan menghormati preferensi reduced motion.

Klarifikasi hak akses terbaru: admin membuat, membaca, mengedit, dan menghapus dataset/tabel/baris/kolom seluruh instansi. Semua instansi, termasuk Bapenda, dapat mengisi dan mengedit sel tabel miliknya tanpa mengubah struktur. Bapenda juga dapat mengunggah Excel/CSV. Template upload boleh berbeda dan setiap upload menjadi dataset baru.

CRUD tetap berada pada halaman data, tidak menambah menu navigasi. Form pembuatan tabel meminta nama kolom dan indikator asli dari admin, bukan baris contoh buatan. Mode edit membuka kolom kosong agar instansi bisa mengisinya; mode baca tetap menampilkan kolom berjudul meskipun belum terisi, tetapi menyembunyikan baris kosong dan kolom tanpa judul asli yang tidak terisi. Dialog penghapusan memberi konfirmasi dengan fokus awal pada Batal. Penghapusan memakai penanda di database dan mempertahankan koordinat Excel agar profil, merge, dan perubahan sel tidak berpindah.

Motif portal: judul bagian ringkas, garis pemisah dokumen, dan header tabel bertingkat yang mengikat indikator dengan periode. Komposisi mengikuti panjang data instansi, bukan pola kartu pemasaran. Fokus tiap layar adalah masuk ke akun, memilih berkas, membaca tabel, membaca aktivitas, atau memahami hak akses.

Revisi lanjutan: judul pelaporan diringkas dari isi Excel asli, tanpa nama file dan ekstensi. Nama sumber tetap tersimpan untuk audit. Penamaan upload boleh ditentukan pengguna agar data tetap dapat dibedakan.

Alur masuk: URL `/` selalu menuju `/login`, termasuk ketika sesi tersimpan. Setelah login, beranda berada di `/beranda`; tautan halaman data tetap dapat dibuka dan di-refresh selama sesi valid.

Keselarasan: header, isi, dan footer memakai inset bersama 32 px desktop, 24 px tablet, dan 16 px mobile. Kolom daftar memakai proporsi tetap agar nama instansi, judul, periode, dan tindakan mudah dipindai. Navigasi mobile tiga tujuan memakai grid dua kolom, dengan Akun pada baris penuh dan target sentuh minimum 44 px. Notifikasi dipindahkan dari menu Aktivitas ke lonceng pada header.

Identitas memakai logo BPS PNG lokal pada favicon dan ukuran 40 px, tanpa permintaan jaringan luar. Warna hijau dan jingga dibatasi pada logo, tidak menjadi aksen tambahan pada tabel. Logo di samping nama bersifat dekoratif untuk pembaca layar agar nama portal tidak dibaca dua kali.

## Notifikasi dan identitas instansi

Atas permintaan pengguna, lonceng berada di kanan atas, tepat di kiri profil. Bentuk lonceng menunjukkan tujuan notifikasi; jumlah belum dibaca berasal dari database dan bukan badge dekoratif. Nama instansi tetap terlihat. Lingkaran profil memakai inisial nama instansi yang sebenarnya, bukan foto atau identitas fiktif, pada header, direktori instansi, dan halaman akun.

Admin membuat dataset beserta tabel awal atau menambah tabel -> notifikasi hanya untuk akun instansi tujuan. Instansi mengisi/mengedit sel -> notifikasi untuk admin dengan nama instansi dan judul data. Upload Bapenda juga memberitahu admin bahwa ada pelaporan baru. Hak akses CRUD tetap sama.

Popup aplikasi memakai pengumuman aksesibel yang sopan, tidak memindahkan fokus, dapat ditutup, dan memiliki tautan ke `/notifications`. Menutup popup tidak menandai dibaca. Halaman notifikasi menyediakan Tandai dibaca, Tandai semua dibaca, dan Buka data menuju tabel terkait. Notifikasi masuk dan log histori memiliki pagination terpisah agar jejak tindakan tidak bercampur dengan pesan belum dibaca.

Notifikasi diperiksa setiap 10 detik selama halaman aktif, saat tab kembali terlihat/fokus, serta setelah perubahan data pada sesi yang sama. Ini notifikasi di dalam aplikasi, bukan push sistem operasi ketika aplikasi ditutup. Riwayat dan status dibaca tersimpan pada PostgreSQL schema `pdrb`; audit lama tetap tersedia tanpa dibuat menjadi notifikasi baru palsu. Judul dan instansi disimpan sebagai snapshot peristiwa. Dataset yang dihapus atau tidak lagi dapat diakses tidak memiliki tautan aktif, tetapi historinya dipertahankan.

Migrasi PostgreSQL mempertahankan kontrak API dan grid Excel sehingga tampilan, URL, merge, koordinat edit, serta aturan hak akses tidak berubah. Perubahan data, audit, dan notifikasi disimpan dalam satu transaksi sebelum feedback berhasil diberikan kepada pengguna. Saat database tidak tersedia, aplikasi memberi error koneksi dan tidak berpindah ke penyimpanan JSON.

## Tabel lebar dan panjang

Revisi 20 Oktober 2026: bar geser biru di atas tabel dihapus. Tabel tetap memakai scrollbar horizontal native di bawah wadah, tanpa pilihan kerapatan, tinggi tabel, atau tombol geser tambahan. Header, ukuran teks, tinggi area gulir, dan pagination tetap seperti semula. Panah keyboard serta Home/End bekerja ketika wadah tabel mendapat fokus, tanpa mengambil alih tombol pada input sel. Warna biru dan font sistem mengikuti portal dokumen kerja (ENERGY 1 / RHYTHM 2 / MOTION 1); tidak ada animasi gulir.

Jika area tabel lebih sempit dari 480 px, indikator ikut bergeser secara horizontal supaya kolom lengket tidak menutupi angka di sebelah kanan. Header tetap lengket secara vertikal pada area gulir. Pengukuran mengikuti lebar wadah tabel, bukan hanya ukuran layar.

Koreksi mode baca: semua kolom berjudul yang belum diisi tetap ditampilkan, termasuk periode pelaporan mendatang dan kolom buatan admin. Kolom tanpa judul asli yang seluruh nilainya kosong tetap disembunyikan. Filter tahun/triwulan dan penghapusan kolom tetap dihormati. Status muat tidak menyatakan bahwa periode di luar filter sudah terlihat. Baris kosong tidak ikut ditambahkan. Sel kosong memakai tanda minus, bukan angka nol.

## Pengumpulan dan pengelolaan tabel

Urutan kontrol periode adalah Tahun, lalu Triwulan. Satu tombol Edit data pada judul dataset mengaktifkan semua tabel bagian yang sedang dibuka; tidak ada tombol edit per tabel. Form tambah baris memakai susunan vertikal untuk identitas komoditas/indikator dan satuan opsional. Kolom periode tidak diminta pada pembuatan baris, agar petugas dapat mengisinya di tabel. Kelola tabel menyediakan pemilihan, perubahan nama, dan penghapusan baris bagi admin.

Setiap tabel memiliki Download CSV. Ekspor mengikuti kolom dan baris hasil filter, mencakup seluruh halaman pagination, memakai hasil rumus tersimpan, dan melindungi teks awalan formula saat dibuka di spreadsheet. Tindakan unduh tidak memerlukan mode edit.

Revisi lanjutan: halaman status terpisah dihapus, dan alamat lamanya diarahkan ke Data PDRB. Satu kolom status mengikuti tahun dan triwulan berjalan berdasarkan waktu Jakarta, tanpa berubah saat filter periode data digunakan. Tabel bergulir horizontal dalam wadahnya pada tablet; pada mobile status ditumpuk dengan label triwulan. Status dihitung untuk setiap dataset, sehingga dua dataset dari instansi yang sama dapat berbeda. Instansi tanpa data memiliki baris sendiri.

Status berasal dari nilai aktif yang tersimpan pada tiap periode, bukan tombol penyerahan. Minimal satu nilai valid menghasilkan “Sudah terisi”; nilai kosong, rumus error, atau rumus yang bergantung pada sel kosong tidak dihitung. Angka nol adalah nilai. Kolom nama, kode, satuan, dan keterangan tidak dianggap isian periode. Tahun dan triwulan dibaca dari judul kolom, nama sheet/bulan, atau metadata periode upload; sumber dengan periode atau referensi rumus yang tidak dapat dipastikan ditandai “Perlu diperiksa”. Status tidak menyatakan seluruh tabel telah lengkap. Edit, pengosongan sel, dan penghapusan tabel/kolom/baris otomatis tercermin saat daftar dimuat kembali.

Data lama diperiksa dari isinya, tanpa membuat histori palsu. Catatan penyerahan sebelumnya tetap tersimpan sebagai histori, namun tidak menentukan status isian. Status dihitung melalui API dari data PostgreSQL aktif; tidak ada migrasi atau perubahan massal database. Selama halaman Data PDRB terlihat, status diperbarui setiap 30 detik dan saat tab kembali terlihat. Upload tetap meminta tahun dan triwulan untuk membantu mengenali periode file.

## Alasan perubahan drastis

Instansi yang mengisi atau mengedit sel wajib memberi alasan jika nilai minimal dua kali nilai periode sebelumnya, atau turun minimal 50%. Batas bersifat inklusif. Admin tetap dapat mengedit langsung; validasi berlaku juga untuk edit manual Bapenda. Validasi ini berlaku pada penyimpanan sel, bukan pemeriksaan massal berkas upload.

Latar halaman login dan area kerja memakai foto gedung yang disediakan pengguna dengan lapisan terang bernuansa biru BPS agar teks terbaca. Bidang tabel dan form tetap putih sehingga nilai tetap jelas. Tidak ada foto atau aset hasil generasi baru.

Dialog menampilkan indikator, kedua periode, kedua nilai, persentase perubahan, dan alasan wajib maksimal 2.000 karakter. Tombol Simpan nilai dan alasan menyimpan keduanya; Batal, Tutup, atau Escape tidak menyimpan nilai. Dialog memakai komponen native yang sudah ada untuk fokus keyboard dan pembatasan interaksi, tanpa ikon atau warna baru. Susunan perbandingan vertikal menjaga keterbacaan pada layar sempit. Tipografi, warna biru tindakan utama, dan spasi mengikuti dokumen kerja portal (ENERGY 1 / RHYTHM 2 / MOTION 1).

Pembanding harus tepat satu periode sebelumnya, bukan periode terdekat yang kebetulan terisi. Triwulan I dibandingkan dengan triwulan IV tahun sebelumnya; tahun dibanding tahun sebelumnya; bulan dibanding bulan sebelumnya. Kolom harus mengacu pada ukuran yang sama, misalnya volume tidak dibandingkan rupiah, dan rawat inap tidak dibandingkan rawat jalan. Periode pada baris Tahun juga didukung. Pencarian lintas tabel/dataset hanya pada instansi, identitas tabel, indikator, dan ukuran yang cocok. Jika ada lebih dari satu kandidat, tidak ada pemilihan otomatis.

Pembanding kosong, error rumus, nol, negatif, atau periode yang tidak terbaca tidak menghasilkan persentase dan tidak memicu kewajiban alasan. Nilai tersebut tidak dianggap nol maupun diisi dengan angka perkiraan. Penghapusan isi dan perubahan teks tidak diuji sebagai kenaikan/penurunan angka. Pengisian tanpa pembanding tetap mengikuti alur simpan biasa.

Backend menentukan pembanding dari data terkini dan memvalidasi alasan sebelum menulis. Token pembanding mengikat alasan ke nilai dan koordinat yang diperiksa; jika pembanding berubah saat dialog terbuka, dialog meminta pengguna memeriksa perbandingan baru. Nilai, alasan, snapshot pembanding, histori, dan notifikasi admin tersimpan dalam transaksi yang sama. Detail alasan memakai payload audit PostgreSQL yang sudah tersedia, tanpa migrasi schema tambahan. Log histori menampilkan alasan dan nilai perbandingan; notifikasi admin menyertakan indikator dan alasan.

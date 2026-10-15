# Verifikasi revisi PDRB

Diperiksa pada 6 Oktober 2026. Antislop during memakai skill lokal yang relevan sesuai AGENTS.md. Arah desain dan alasan keputusan tercatat di [design.md](design.md).

Pembaruan 9 Oktober 2026: runtime telah dipindahkan ke PostgreSQL schema `pdrb`. Laporan di bawah mempertahankan bukti desain/regresi awal; rincian migrasi, hasil server, dan batas pengujian terbaru ada di [postgresql.md](postgresql.md). Tidak ada perubahan komponen atau CSS pada migrasi ini.

Verifikasi ulang 9 Oktober: 20 tes unit/API/SQL lulus, 66 pemeriksaan browser terisolasi lulus, build lulus, 124 tabel lulus render, dan `git diff --check` lulus. API PostgreSQL server dibandingkan dengan snapshot JSON untuk seluruh 24 akun dan 39 dataset aktif; hasil cocok. Import ulang sumber yang sama tidak menduplikasi data. Pesan `Transaksi PostgreSQL gagal: XX001` pada tes merupakan kegagalan SQL yang sengaja disimulasikan untuk membuktikan HTTP 503 dan rollback, bukan kegagalan suite.

## Hasil pengujian

- `npm test`: 17 pengujian lulus, termasuk judul seluruh dataset sumber, pembacaan merge/rumus/nol, filter, akses API, validasi perubahan, CRUD admin, edit nilai instansi sendiri, pengisian kembali baris yang dikosongkan, ID upload unik, penolakan edit/struktur Bapenda, penerima notifikasi, penolakan membaca notifikasi akun lain, kedatangan pesan bersamaan dengan Tandai semua dibaca, dan persistensi setelah backend dimulai ulang.
- `npm run audit:excel`: 37 workbook, 95 sheet, 139 bagian tabel, 0 masalah. Rincian per sheet: [excel-audit.md](excel-audit.md).
- `npm run test:tables`: 124 tabel berisi dirender dalam mode baca dan edit; tidak ada heading kosong atau sel kosong tanpa penanda. Bagian template tidak ditampilkan sebagai grid kosong.
- `npm run build` dan `git diff --check`: lulus.
- `node scripts/browser-check.mjs`: 66 pemeriksaan lulus di Chrome headless dengan database sementara, tanpa exception runtime. Menguji login, navigasi Back/Forward/404, filter, tiga tabel sumber sekaligus, pagination, error jaringan/retry, ikon, CRUD admin, pengisian kolom kosong dan nilai nol oleh instansi, Bapenda tanpa edit manual, dua upload berbeda struktur bernama file sama yang menjadi dataset terpisah, popup lintas akun, penanda dibaca, pagination notifikasi/histori, serta sesi tidak valid. Hasil per tindakan tercatat pada `.local-backups/browser/results.json`.
- Screenshot Chrome diperiksa secara visual pada desktop dan mobile. Dataset diuji pada lebar 320, 390, 768, 1024, dan 1440 px; login pada 320, 390, 768, dan 1440 px. Tabel lebar bergulir di dalam wadah, bukan membuat halaman melebar.
- Beranda, daftar data, notifikasi, akun, dan halaman 404 juga diperiksa pada lebar 320 px. Login melalui Tab/Enter, Escape dialog, dan disclosure catatan sumber lulus di Chrome.
- Beranda dan daftar data diperiksa pada 320, 390, 768, 1024, 1440, dan 2560 px. Selisih posisi kiri header, heading isi, dan footer maksimal 1 px. Tidak ada nama file `.xlsx`/`.csv` pada isi halaman atau aktivitas; judul upload tampil menggantikan nama file.
- Beranda diuji dengan ukuran teks root 200% pada viewport 390 px tanpa overflow dokumen. Ini pemeriksaan pembesaran teks, bukan klaim pengujian perangkat fisik.
- Hasil browser dan screenshot: `.local-backups/browser/`. Semua data uji terpisah dari database pengguna.

## Pemeriksaan fitur hak akses dan CRUD

- Buat data -> dataset baru dengan judul, instansi, kolom, dan indikator masukan admin. Form mobile 320 px tidak menyebabkan overflow.
- Kelola data -> perubahan judul/pemilik tersimpan; API menolak akses instansi lama setelah pemilik dipindahkan.
- Tambah tabel -> bagian baru dengan grid kosong yang tersedia untuk diisi. Kelola tabel -> nama tabel dan kolom berubah.
- Hapus baris -> dialog membuka fokus pada Batal; Batal mempertahankan baris, Ya, hapus menyembunyikan baris tujuan. Hapus kolom mempertahankan koordinat lainnya.
- Hapus tabel -> tabel lain tetap tersedia. Hapus dataset -> dataset hilang dari daftar, URL lama memberi feedback pemulihan, dan API tetap 404 setelah restart.
- Instansi BULOG -> Edit data tersedia tanpa kontrol struktur/upload; mengisi kolom kosong dan nol, lalu refresh mempertahankan nilai. API juga diuji pada tabel Excel sumber, bukan hanya tabel baru.
- Bapenda -> upload CSV dengan dua struktur berbeda dan nama file sama menambah dua dataset; tabel tidak memiliki tombol edit/struktur. API menolak edit manual, pembuatan struktur, dan penghapusan.
- Database lama tidak di-reset. Penghapusan memakai penanda, bukan penghapusan permanen grid sumber. Belum tersedia pemulihan melalui UI.

## Pemeriksaan notifikasi

- Header -> lonceng berada di kiri profil; direktori memakai inisial lingkaran pada setiap instansi. Menu Aktivitas tidak lagi ada di sidebar, dan `/notifications` tetap tersedia.
- Admin menambah tabel saat BULOG aktif -> popup muncul lewat polling, tanpa mengubah fokus; tombol tutup tidak menghapus badge belum dibaca. Screenshot popup 320 px diperiksa tanpa overflow.
- Tandai dibaca/Tandai semua dibaca -> status dan badge berubah, tetap tersimpan setelah refresh; histori tidak terhapus. API memverifikasi pesan yang tiba setelah snapshot tidak ikut ditandai dibaca.
- Buka data -> langsung ke dataset dan bagian tabel baru yang benar. Setelah dataset dihapus, API mengembalikan tautan null tetapi histori tetap ada.
- BULOG mengisi/mengedit nilai -> admin menerima popup berisi nama BULOG dan judul data; akun instansi lain tidak menerima pesan. Upload Bapenda juga menghasilkan notifikasi admin.
- Pagination kotak masuk dan histori -> Berikutnya/Sebelumnya bekerja independen. Error jaringan pada kedua endpoint -> feedback Coba lagi mengembalikan kotak masuk dan histori.
- Restart backend -> pesan, status dibaca, dan histori tetap tersedia pada database sementara. Snapshot penerima tidak dapat ditandai oleh akun lain.
- Screenshot yang diperiksa: `notification-toast-320.png`, `notifications-1440.png`, dan `beranda-320.png` pada direktori hasil browser.

## Delivery Gate antislop

Status PASS berikut merujuk pada source UI, audit, pemeriksaan kontras, dan alur browser di atas. Ini verifikasi prototype lokal, bukan sertifikasi keamanan atau hasil pengujian perangkat fisik.

### Hard gate

- R-02 PASS: pemeriksaan teks UI tidak menemukan em dash; placeholder nilai memakai "-". Regex deteksi karakter sumber bukan copy UI.
- R-03 PASS: pemeriksaan `scrollWidth` pada viewport yang disebutkan tidak menemukan overflow dokumen; screenshot mobile diperiksa dan grid navigasi dua kolom memiliki kontrol minimum 44 px.
- R-17 PASS: jumlah berkas/instansi berasal dari API; angka tabel berasal dari sumber Excel.
- R-18 PASS: tidak ada testimonial, avatar fiktif, atau nama pelanggan buatan; lingkaran profil memakai inisial nama akun/instansi sebenarnya.
- R-23 PASS: ikon statistik, lonceng, dan lingkaran profil dibuat atas permintaan langsung pengguna; ikon statistik bukan logo resmi BPS. Aktivitas dipindahkan menjadi Notifikasi pada header sesuai permintaan, bukan menambah tujuan fiktif.
- R-24 PASS: `/` menuju `/login` dengan maupun tanpa sesi tersimpan. Login menuju `/beranda` atau melanjutkan deep link; seluruh menu tetap dapat dibuka dan path tidak dikenal memakai fallback 404.
- R-25 PASS: checker skill mengukur teks utama 14,89:1 pada putih, teks sekunder 5,63:1 pada latar header, dan biru/putih 8,20:1. Inisial biru pada lingkaran 7,14:1; teks sekunder pada pesan belum dibaca 5,79:1. Error 8,89:1, sukses 7,98:1, tombol hapus 8,49:1. Border input/textarea 3,95:1 memenuhi ambang nonteks 3:1.
- R-26 PASS: kontrol navigasi, filter, baca/edit, pembuatan dataset/tabel, perubahan nama/pemilik, tambah baris/kolom, hapus dengan konfirmasi, upload, simpan/batal, pagination, disclosure, retry, dan keluar dicoba di browser. Lonceng, tutup popup, Lihat notifikasi, Tandai dibaca, Tandai semua dibaca, Buka data, Muat ulang, serta dua pagination histori/kotak masuk diuji. Penolakan akses/struktur instansi, edit Bapenda, dan notifikasi penerima lain diuji lewat API.
- R-27 PASS: loading memiliki status; notifikasi/histori/template kosong memberi penjelasan; error jaringan data/notifikasi, dataset hilang, validasi dialog, sesi habis, dan 404 memiliki jalur pemulihan. Error koneksi tidak diberi kode 404 yang menyesatkan.
- R-28 PASS: tidak menambahkan FAQ generik.
- R-32 PASS: Tab memindahkan fokus dari username ke password dan Enter mengirim login; input/textarea memiliki outline terlihat. Dialog native membatasi fokus, Escape menutup dan fokus kembali ke pemicu. Konfirmasi hapus memfokuskan Batal, bukan tindakan destruktif; editor sel menyebut nama kolom dan baris pada label aksesibel. Lonceng memiliki nama aksesibel beserta jumlah belum dibaca; popup memakai live region sopan dan pengujian membuktikan tidak memindahkan fokus dari lonceng.
- R-33 PASS: perubahan source menggunakan apply_patch, bukan skrip penggantian string/CSS.
- R-34 PASS: hanya satu tema terang; tidak ada toggle dengan tema yang belum dibuat.
- R-35 PASS: build, unit/API, audit sumber, render seluruh tabel, dan click-through Chrome dijalankan; hasil dan screenshot disimpan.
- R-36 PASS: batasan password demo, kredensial/tunnel lokal, role database bersama, backup operasional, serta perhitungan formula dijelaskan di README dan laporan PostgreSQL; tidak mengklaim production-ready.
- R-37 PASS: brief dan ENERGY 1 / RHYTHM 2 / MOTION 1 tercatat sebelum perombakan UI.
- R-38 PASS: isi berasal dari Excel/API/akun lokal. Akun pengujian diberi label lokal; data browser hanya dibuat dalam database pengujian.

### Purpose gate

- R-01 PASS: satu aksen biru untuk tindakan/tautan/fokus; tidak menggunakan gradient.
- R-04 PASS: ikon statistik mengidentifikasi portal pada tab browser, login, dan sidebar. Lonceng mewakili notifikasi, dan inisial lingkaran membantu mengenali akun/instansi. Nama dan label aksesibel tetap tersedia; ikon dekoratif tidak dibaca dua kali.
- R-06 PASS: font sistem Segoe UI dipilih untuk komputer Windows dan kerja baca data, tanpa ketergantungan font daring.
- R-07 PASS: latar datar netral sebagai permukaan kerja, tanpa grid dekoratif.
- R-08 PASS: panah hanya pada tindakan kembali di feedback, bukan semua tombol.
- R-09 PASS: badge lonceng menunjukkan jumlah belum dibaca dari API; tidak ada capsule badge dekoratif atau label berulang di atas judul utama.
- R-10 PASS: tidak memakai glassmorphism.
- R-12 PASS: shadow hanya pada dialog dan popup notifikasi yang berada di atas isi halaman; alasan elevasi tercatat di design.md.
- R-13 PASS: tidak memakai glow.
- R-14 PASS: beranda admin menggunakan direktori instansi dan panduan membaca; instansi melihat judul data miliknya, bukan kartu fitur atau nama file teknis.
- R-19 PASS: tidak ada animasi dekoratif atau loop; reduced motion dihormati.
- R-22 PASS: tidak menambahkan ilustrasi generik.

### Liveliness

- Dials PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 eksplisit di design.md.
- Konsistensi PASS: warna tenang, daftar dan tabel memiliki ritme berbeda, tanpa animasi dekoratif.
- Focal point PASS: formulir login, pilihan berkas, tabel dataset, kotak masuk notifikasi, dan informasi akun menjadi fokus masing-masing layar.
- Whitespace PASS: jarak antartabel lebih besar daripada jarak kontrol; kelompok filter dipisahkan dari data.
- Accent PASS: biru tua dipakai selektif pada tindakan dan fokus.
- Motif PASS: garis dokumen dan header indikator/periode bertingkat diulang sesuai kebutuhan data PDRB.
- Design Read PASS: portal kerja admin/petugas instansi dinyatakan dalam design.md, bukan dashboard pemasaran.

### Craftsmanship dan quality locks

- C-1 PASS: alasan tema, warna, font, direktori, panduan, penamaan data, alur login, inset bersama, dialog, lonceng, inisial profil, popup, dan responsivitas tercatat di design.md.
- C-2 PASS: kontrol memakai tujuan nyata; edit, upload, serta penghapusan bertahan setelah restart backend pada database sementara. Form/modal CRUD dan penyimpanan nilai instansi diuji di Chrome.
- C-3 PASS: bagian UI mengikuti instansi, berkas, tabel, notifikasi, histori, dan hak akses yang memang ada.
- C-4 PASS: fallback route, state gagal/kosong, dialog, dan viewport diuji; error boundary tidak menghasilkan halaman blank tanpa pemulihan.
- C-5 PASS: ringkasan bersumber dari API/Excel dan tidak ada klaim/testimonial buatan.
- R-05 PASS: komposisi mengikuti data dan peran; tidak menambahkan hero/kartu marketing/pricing/bento generik.
- R-11 PASS: radius kecil untuk input/tombol, radius panel/dialog sedikit lebih besar; tidak semua berbentuk pill.
- R-15 PASS: CTA spesifik seperti Buka data, Simpan baris, Upload berkas, dan Coba lagi.
- R-16 PASS: copy tugas berbahasa Indonesia; tidak ada buzzword pemasaran AI.
- R-20 PASS: identitas portal data PDRB muncul dari instansi, periode triwulan, multiheader, dan pembatasan tugas per peran.
- R-21 PASS: tema terang dipilih untuk kerja dokumen, bukan dark mode default tanpa alasan.
- R-29 PASS: dasar putih/abu/ink dan biru aksen; hijau dan jingga tambahan dibatasi pada ikon identitas yang diminta pengguna. Kontras batang ikon terhadap putih: biru 8,20:1, hijau 5,70:1, jingga 4,62:1, semuanya melampaui ambang nonteks 3:1. Warna semantik pada isi untuk sukses, error, dan tindakan hapus.
- R-30 PASS: tidak meniru layout merek produk lain; tampilan dibentuk oleh struktur Excel.
- R-31 PASS: keputusan visual penting mempunyai alasan tertulis dan screenshot hasil kerja.

## Pembersihan dan batasan

20 skrip diagnostik/persiapan root dihapus setelah ZIP diperiksa berisi semua file. Pemulihan: ekstrak `.local-backups/cleanup-2026-10-06.zip`. Source Excel, seed, database pengguna, lockfile, dan skill lokal tidak dihapus.

Rumus tanpa cached value tidak dihitung otomatis oleh web dan tidak diganti nol. Bapenda boleh upload, tetapi tidak mengedit struktur/nilai. Runtime sekarang memakai PostgreSQL; deployment production, penggantian password demo, HTTPS, rate limiting, dan backup operasional tetap memerlukan pekerjaan tersendiri.

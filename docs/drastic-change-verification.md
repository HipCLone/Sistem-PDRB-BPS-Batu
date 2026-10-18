# Pemeriksaan perubahan drastis, 15 Oktober 2026

Lingkup: dialog alasan saat instansi menyimpan sel, validasi backend, notifikasi admin, dan log histori. Arah visual mengikuti docs/design.md. Database kantor dan .env tidak diubah; tidak ada commit atau push.

## Bukti pengujian

- PASS: npm test, 22 pengujian. Meliputi batas inklusif 2x dan 50%, pergantian tahun, ukuran kolom berbeda, periode hilang, bulan antarsheet, tahun pada baris, pencarian antar-dataset dalam instansi yang sama, alasan kosong/panjang, token pembanding lama, dan hak akses.
- PASS: adapter PostgreSQL diuji menggunakan PGlite terisolasi. Kegagalan SQL pada audit membatalkan nilai dan notifikasi; alasan tetap tersedia ketika state dibaca melalui adapter baru. Ini bukan pengujian koneksi ke PostgreSQL kantor.
- PASS: npm run build.
- PASS: npm run test:tables, 124 tabel terisi dirender pada mode baca dan edit; template tetap memakai catatan tanpa grid kosong.
- PASS: node scripts/browser-check.mjs, 75 pemeriksaan, tanpa exception JavaScript yang tidak tertangani. Rincian mesin tersimpan pada .local-backups/browser/results.json (diabaikan Git).

Urutan pemeriksaan dialog: input 200 terhadap 100 membuka dialog dan fokus textarea; alasan kosong/spasi menonaktifkan simpan; Batal tidak menulis; Escape melalui KeyboardEvent DOM dan Tutup tidak menulis; kegagalan jaringan mempertahankan alasan; perubahan pembanding 100 menjadi 90 meminta konfirmasi ulang; simpan menulis nilai dan alasan; nilai 45 terhadap 90 meminta alasan penurunan; admin membaca alasan pada notifikasi dan histori. Escape native melalui Chrome DevTools diuji pada dialog bersama dalam pemeriksaan regresi; pengujian Escape dialog alasan menggunakan event DOM, bukan klaim pengujian keyboard fisik.

Screenshot dialog 320, 768, dan 1440 px tersimpan pada .local-backups/browser/drastic-*.png. Screenshot 320 px juga diperiksa secara visual. Konten panjang bergulir di dalam dialog; tidak ada overflow horizontal. Keyboard layar ponsel fisik dan deployment domain publik tidak diuji dalam perubahan ini.

## Delivery Gate

Status berikut berlaku pada perubahan fitur ini, bukan sertifikasi seluruh aplikasi.

### Hard Gate

- R-02 PASS: teks baru diperiksa, tanpa em dash atau jargon pemasaran.
- R-03 PASS: browser memeriksa dialog pada 320, 768, dan 1440 px tanpa overflow horizontal.
- R-17 PASS: perbandingan berasal dari nilai sel dan periode aktual, bukan statistik dekoratif.
- R-18 PASS: tidak menambah testimoni atau identitas orang.
- R-23 PASS: tidak menambah aset, avatar, atau struktur navigasi.
- R-24 PASS: memakai route notifikasi yang sudah tersedia; regresi navigasi Back/Forward lulus.
- R-25 PASS: checker kontras menghasilkan teks 14,89:1, teks sekunder 6,39:1, tombol utama 8,20:1, dan batas input 3,95:1 (batas nonteks minimal 3:1).
- R-26 PASS: simpan, Batal, Tutup, dan Escape memiliki aksi yang diverifikasi; alasan wajib tidak dapat dilewati melalui API.
- R-27 PASS: keadaan alasan kosong, menyimpan, koneksi gagal, pembanding berubah, dan berhasil diuji.
- R-28 PASS: tidak menambah FAQ.
- R-32 PASS: dialog native membatasi fokus; textarea mendapat fokus awal; handler Escape diuji melalui event DOM; fokus dialog bersama diuji dalam regresi browser.
- R-33 PASS: source diedit melalui patch langsung, tanpa skrip penggantian source/CSS.
- R-34 PASS: tidak menambah atau mengubah tema.
- R-35 PASS: build, 22 pengujian, render tabel, dan 75 pemeriksaan browser lulus; urutan kontrol baru dicatat di atas.
- R-36 PASS: tidak menambah klaim keamanan, kepatuhan, atau performa.
- R-37 PASS: docs/design.md dibaca; ENERGY 1 / RHYTHM 2 / MOTION 1 dipertahankan.
- R-38 PASS: contoh angka hanya fixture pengujian terisolasi; UI menggunakan data pengguna.

### Purpose-Gate

- R-01 PASS: tidak menambah gradien atau glow; warna portal dipertahankan.
- R-04 PASS: dialog tidak menambah ikon dekoratif.
- R-06 PASS: font sistem Segoe UI yang sudah dipilih untuk keterbacaan tetap digunakan.
- R-07 PASS: tidak menambah pola latar.
- R-08 PASS: tidak menambah panah pada tombol.
- R-09 PASS: tidak menambah badge; label Kenaikan/Penurunan menjelaskan hasil perhitungan.
- R-10 PASS: tidak menambah glassmorphism.
- R-12 PASS: shadow hanya memakai komponen dialog yang berada di atas halaman.
- R-13 PASS: tidak menambah glow.
- R-14 PASS: perbandingan memakai daftar definisi vertikal, bukan kartu pemasaran.
- R-19 PASS: tidak menambah animasi atau loop.
- R-22 PASS: tidak menambah ilustrasi.

### Liveliness

- Dials PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 mengikuti arah portal kerja instansi.
- Konsistensi PASS: gaya dokumen dan kontrol yang sudah ada digunakan kembali.
- Fokus PASS: alasan perubahan menjadi tindakan utama dialog.
- Spasi PASS: pemisah memisahkan pembanding, nilai baru, persentase, dan alasan.
- Aksen PASS: biru dipakai untuk tindakan simpan, tidak untuk semua nilai.
- Motif PASS: garis pemisah dan angka tabular mengikuti tabel portal.
- Design Read PASS: arah desain dan dials dinyatakan sebelum perubahan UI.

### Craftsmanship dan Quality Locks

- C-1 PASS: alasan tata letak vertikal dan penggunaan dialog dicatat dalam docs/design.md.
- C-2 PASS: seluruh kontrol baru memiliki perilaku yang diuji.
- C-3 PASS: setiap bagian dialog menunjang pemeriksaan nilai dan penulisan alasan.
- C-4 PASS: dialog sempit, error koneksi, pembanding berubah, dan pembatalan diuji; batas pengujian perangkat fisik dinyatakan di atas.
- C-5 PASS: tidak menambah angka atau klaim yang dibuat sebagai data pengguna.
- R-05 PASS: komposisi mengikuti kebutuhan pembandingan sel, tanpa template dashboard baru.
- R-11 PASS: radius dialog dan kontrol memakai sistem yang sudah ada.
- R-15 PASS: label Simpan nilai dan alasan menjelaskan tindakan sebenarnya.
- R-16 PASS: teks menjelaskan ambang batas dan tindakan, tanpa buzzword.
- R-20 PASS: identitas portal kerja data dipertahankan, tanpa gaya produk lain.
- R-21 PASS: tema terang dokumen kerja tetap mengikuti arah pengguna.
- R-29 PASS: tidak menambah warna inti atau aksen baru.
- R-30 PASS: tidak meniru komposisi produk lain.
- R-31 PASS: keputusan visual beserta alasan tertulis pada bagian Alasan perubahan drastis di docs/design.md.

## Batas perilaku

Validasi berlaku pada edit/pengisian sel oleh instansi selain Bapenda. Admin tetap dapat mengedit langsung, dan upload Bapenda tidak dianalisis massal oleh fitur ini. Pembanding harus tepat satu periode sebelumnya pada ukuran yang sama. Pembanding nol, negatif, kosong, rumus tanpa hasil, atau ambigu tidak memicu persentase. Alasan tersimpan dalam payload audit PostgreSQL yang sudah ada sehingga tidak memerlukan migrasi schema baru.

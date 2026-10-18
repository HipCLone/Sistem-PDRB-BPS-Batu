# Pemeriksaan tampilan tabel, 16 Oktober 2026

Lingkup terbaru: satu bar geser horizontal pada setiap tabel, tanpa pilihan kerapatan, tinggi tabel, atau tombol geser tambahan, sesuai koreksi pengguna. Mode baca mempertahankan kolom berjudul meskipun belum diisi. Indikator pada area sempit dan posisi gulir setelah pagination tetap dipertahankan. Data, rumus, koordinat edit, hak akses, dan backend tidak diubah dalam revisi tampilan ini. Perubahan fitur alasan drastis sebelumnya tetap dipertahankan. Tidak ada commit/push atau perubahan .env.

## Hasil

- PASS: npm run build.
- PASS: npm test, 23 pengujian, tanpa kegagalan; kasus Excel Tanaman Pangan juga diperiksa pada pengujian presentasi.
- PASS: npm run test:tables, 124 tabel terisi pada mode baca/edit.
- PASS: node scripts/browser-check.mjs, 85 pemeriksaan dan nol exception JavaScript yang tidak tertangani.
- PASS: git diff --check.

Pengujian memakai database sementara terisolasi, termasuk adapter SQL melalui PGlite. Tidak mengubah atau menguji deployment database kantor. Hasil browser tersimpan pada .local-backups/browser/results.json. Screenshot dataset-320.png diperiksa secara visual; screenshot ukuran lain juga tersimpan di folder tersebut yang diabaikan Git.

## Interaksi yang diperiksa

- Setiap tabel memiliki satu bar horizontal, tanpa select atau tombol tambahan.
- Klik pointer pada ujung kanan bar mencapai kolom terakhir, dan ujung kiri mengembalikan kolom pertama.
- Gulir langsung pada tabel menyinkronkan posisi bar.
- Home/End pada wadah tabel mencapai kedua ujung melalui KeyboardEvent DOM. Handler panah hanya berlaku ketika wadah sendiri mendapat fokus, bukan input edit.
- Bar tetap terlihat tetapi nonaktif ketika seluruh kolom sudah muat.
- Mode baca menampilkan periode kosong yang berjudul sebelum masuk mode edit. Mode baca/edit mempertahankan kolom berjudul yang sama, kecuali kolom tindakan admin.
- Filter tetap menghormati tahun/triwulan dan mempertahankan periode terpilih yang kosong; status bar muat hanya mengacu pada kolom yang sedang ditampilkan.
- Ukuran teks, padding, tinggi area gulir, dan pagination tidak memiliki pengaturan tambahan.
- Kolom terakhir terjangkau penuh pada 320, 390, 768, 1024, dan 1440 px; halaman tidak melebar.
- Kontrol tetap reflow saat ukuran teks 200% pada viewport desktop.
- Pada tabel panjang, gulir mencapai baris terakhir sementara header tetap terlihat.
- Setelah pindah halaman pagination, gulir vertikal kembali ke baris pertama.
- Regresi CRUD, input instansi, upload Bapenda, notifikasi, dialog alasan, Back/Forward, dan route pemulihan lulus.

Keyboard layar perangkat fisik dan deployment domain publik tidak diuji. Pemeriksaan keyboard handler melalui DOM tidak dinyatakan sebagai pengujian keyboard fisik.

Kasus sumber pengguna: dataset a-dinas-pertanian, bagian Tanaman Pangan, memiliki 9 kolom terisi dan 11 kolom berjudul. Proyeksi mode baca kini berisi 11 kolom, termasuk 2026 TW 3 dan 2026 TW 4, sama dengan struktur edit. Unit test memastikan kolom kosong tanpa judul asli tidak ikut ditambahkan, baris kosong tetap tersembunyi, dan sumber tidak dimutasi. Render 124 tabel menggunakan proyeksi mode baca yang sama dengan halaman web. Screenshot dataset-1440.png diperiksa secara visual untuk memastikan kolom periode kosong terlihat dengan tanda minus dalam mode baca.

## Delivery Gate

Status berlaku pada perubahan tampilan tabel ini. Arah dan alasan desain tercatat pada bagian Tabel lebar dan panjang di docs/design.md.

### Hard Gate

- R-02 PASS: teks baru tanpa em dash atau jargon pemasaran.
- R-03 PASS: viewport 320 sampai 1440 px tidak mengalami overflow halaman; kolom terakhir terjangkau.
- R-17 PASS: posisi dan jumlah baris berasal dari tabel aktual.
- R-18 PASS: tidak menambah testimoni atau identitas fiktif.
- R-23 PASS: tidak menambah aset visual atau struktur navigasi.
- R-24 PASS: route tidak berubah; regresi Back/Forward lulus.
- R-25 PASS: teks petunjuk #52616c pada putih diuji 6,39:1; warna aktif dan fokus memakai token portal yang sudah diverifikasi. Tombol nonaktif tetap memakai state disabled komponen bersama.
- R-26 PASS: bar horizontal digerakkan ke kedua ujung dengan pointer; select dan tombol tambahan dihapus.
- R-27 PASS: state muat, kosong, error, retry, serta batas awal/akhir diuji pada regresi.
- R-28 PASS: tidak menambah FAQ.
- R-32 PASS: region dapat difokuskan, bar native berlabel untuk pembaca layar, fokus terlihat, Home/End diuji melalui event DOM.
- R-33 PASS: perubahan dibuat langsung pada source melalui patch.
- R-34 PASS: tema tidak ditambah atau diubah.
- R-35 PASS: build, render tabel, pengujian, dan interaksi browser dicatat di atas.
- R-36 PASS: tidak menambah klaim keamanan, performa, atau kepatuhan.
- R-37 PASS: arah portal dokumen kerja dibaca dan dipertahankan.
- R-38 PASS: UI memakai data aktual; data pengujian berada dalam penyimpanan sementara.

### Purpose-Gate

- R-01 PASS: tidak menambah gradien atau glow.
- R-04 PASS: tidak menambah ikon; bar memiliki label yang menjelaskan tabel tujuannya.
- R-06 PASS: font sistem dipertahankan; mode ringkas tidak mengecilkan teks.
- R-07 PASS: tidak menambah pola latar.
- R-08 PASS: tidak menambah panah dekoratif.
- R-09 PASS: status awal/akhir menjelaskan posisi aktual, bukan badge dekoratif.
- R-10 PASS: tidak menambah blur atau glassmorphism.
- R-12 PASS: panel kontrol datar tanpa shadow baru.
- R-13 PASS: tidak menambah glow.
- R-14 PASS: kontrol mengikuti kebutuhan tabel, tanpa kartu pemasaran.
- R-19 PASS: gulir tanpa animasi; tidak menambah loop.
- R-22 PASS: tidak menambah ilustrasi.

### Liveliness

- Dials PASS: ENERGY 1 / RHYTHM 2 / MOTION 1 mengikuti docs/design.md.
- Konsistensi PASS: token warna, radius, font, dan kontrol portal digunakan kembali.
- Fokus PASS: data tabel tetap menjadi isi utama; toolbar hanya mengatur pembacaan.
- Spasi PASS: opsi tampilan, navigasi horizontal, dan petunjuk dikelompokkan terpisah.
- Aksen PASS: biru pada slider menunjukkan posisi; tidak mewarnai seluruh tabel.
- Motif PASS: garis pemisah dokumen dan header bertingkat tetap digunakan.
- Design Read PASS: arah desain dan dials dinyatakan sebelum perubahan.

### Craftsmanship dan Quality Locks

- C-1 PASS: setiap kontrol memiliki alasan keterjangkauan atau keterbacaan yang dicatat.
- C-2 PASS: seluruh kontrol baru dijalankan melalui pengujian browser.
- C-3 PASS: tidak menambah bagian di luar kebutuhan pembacaan tabel.
- C-4 PASS: batas gulir, resize, sinkronisasi bar, teks 200%, dan pagination diuji; batas perangkat fisik dijelaskan di atas.
- C-5 PASS: tidak menambah angka dekoratif atau klaim fiktif.
- R-05 PASS: komposisi mengikuti tabel, bukan template dashboard.
- R-11 PASS: radius kontrol mengikuti komponen bersama.
- R-15 PASS: petunjuk Geser bar ke kanan atau kiri menyebut tindakan sebenarnya.
- R-16 PASS: petunjuk menyebut posisi dan cara membaca tabel secara langsung.
- R-20 PASS: identitas portal kerja data dipertahankan.
- R-21 PASS: tema terang dokumen kerja tetap sesuai arah pengguna.
- R-29 PASS: tidak menambah warna inti.
- R-30 PASS: tidak meniru komposisi produk lain.
- R-31 PASS: alasan penyederhanaan menjadi satu bar dan perilaku sticky tercatat dalam docs/design.md.

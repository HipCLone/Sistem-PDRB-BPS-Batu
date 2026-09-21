# PDRB Kota Batu — Frontend Prototype

Prototype frontend React/Vite untuk sistem pengumpulan data PDRB Kota Batu.

## Tujuan tahap ini

Tahap ini sengaja fokus pada **frontend dan pengalaman pengguna** terlebih dahulu. Belum ada backend, database, autentikasi nyata, atau API.

## Yang sudah tersedia

- Login prototype.
- Sidebar kiri.
- Dashboard daftar lapangan usaha.
- Status `Sudah`, `Belum`, `On Progress`, dan `Derived`.
- Struktur `Kode PDRB → Instansi → Dataset`.
- Detail dataset.
- Periode 2025 TW1 sampai 2026 TW4.
- Preview tabel.
- Mode edit prototype.
- Notifikasi.
- Profil operator.
- Field Fenomena/Penjelasan.
- Empty value tetap ditampilkan sebagai kosong/`—`, bukan otomatis 0.
- Dataset calculation/growth ditandai sebagai derived.
- Data mock berasal dari struktur yang sudah dipetakan dari file/screenshot pengguna.

## Catatan arsitektur

Jangan menjadikan setiap kode PDRB sebagai halaman React terpisah. Frontend dirancang sebagai UI schema-driven: komponen yang sama menerima metadata dataset dan merender bentuk tabel/form sesuai schema.

React mendukung komposisi komponen, rendering list, conditional rendering, dan state untuk membangun pola ini. Lihat dokumentasi React:
https://react.dev/learn

## Menjalankan

```bash
npm install
npm run dev
```

Kemudian buka URL yang diberikan Vite.

## Tahap berikutnya

Setelah UI ini disepakati, tahap berikutnya dapat berupa:

1. finalisasi design system,
2. schema JSON untuk seluruh dataset,
3. backend/API,
4. authentication & role,
5. database,
6. upload/import khusus Bapenda,
7. calculation engine,
8. audit trail/versioning,
9. notifikasi,
10. admin form builder.

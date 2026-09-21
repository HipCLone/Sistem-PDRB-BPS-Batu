# PDRB Kota Batu — Frontend Specification & Implementation Brief

> Dokumen ini adalah brief untuk AI coding agent/developer yang akan menyempurnakan frontend sistem pengumpulan data PDRB Kota Batu.
>
> **Fokus tahap saat ini: FRONTEND TERLEBIH DAHULU.**
>
> Backend, database, API, autentikasi nyata, calculation engine, dan import pipeline belum menjadi fokus implementasi tahap pertama. Frontend harus dibangun dengan struktur yang nantinya mudah dihubungkan ke backend tanpa perlu membongkar ulang komponen.

---

## 1. Tujuan Produk

Membangun web application untuk pengumpulan, pengisian, pemantauan, dan pengelolaan data PDRB Kota Batu dari berbagai instansi/lembaga.

Sistem harus dapat menampilkan data dengan pola yang sedekat mungkin dengan form/file sumber yang digunakan masing-masing instansi, tetapi UI harus tetap konsisten dan mudah digunakan.

Prinsip utama:

- satu instansi/lembaga mempunyai ruang/folder data sendiri;
- data boleh kosong;
- data lama tetap ditampilkan;
- data lama pada tahap awal dapat diedit;
- pengisian data bersifat opsional;
- tampilan frontend harus mengikuti struktur form sumber;
- satu kode PDRB dapat memiliki banyak instansi;
- satu instansi dapat memiliki banyak dataset;
- satu dataset dapat memiliki struktur yang berbeda;
- dataset dapat berupa raw data, calculated data, growth, project, accounting, facility, commodity, entity, atau file upload;
- perubahan tajam harus dapat diberi alasan/fenomena;
- threshold perubahan drastis adalah ±100%;
- angka ditampilkan maksimal 2 angka desimal;
- user wajib login;
- user hanya dapat melihat/mengelola data yang menjadi hak aksesnya;
- admin membutuhkan form builder/configuration yang dinamis;
- admin dapat menambah instansi/dinas;
- admin dapat mengubah isi dan periode form;
- sistem perlu memiliki notifikasi perubahan data.

---

# 2. Requirement dari User

## 2.1 Requirement umum

1. `lembaga 1 folder`
2. `Data bisa kosong`
3. `Tampilan site ditampilkan sama dengan form`
4. `Data lama tetap ditampilkan`
5. `Alasan baik/turun tajam harus jelas`
6. `Patokan naik/turun drastis 100%`
7. `Wajib login`
8. `Hanya dapat melihat data yang diupload sendiri`
9. Gunakan sidebar kiri untuk navigasi per data
10. Pengisian data bersifat opsional
11. Desimal maksimal 2 digit
12. Pada tahap awal data lama dapat diedit
13. Apabila terdapat 2 tabel dan salah satunya adalah perhitungan, UI harus mengikuti struktur form sumber
14. Khusus Bapenda: file yang diupload, bukan pengisian isi form

## 2.2 Requirement admin

1. Form bersifat dinamis
2. Form dapat diedit:
   - isi/field
   - periode
   - dataset
3. Admin dapat menambahkan dinas/lembaga
4. Sistem memberikan notifikasi apabila ada perubahan data
5. Sediakan email dummy untuk setiap dinas/lembaga pada tahap prototype

---

# 3. Prinsip UX Utama

## 3.1 Jangan membuat aplikasi sebagai kumpulan halaman hardcoded

Hindari:

```js
if (code === "A") {
  return <AgricultureForm />
}

if (code === "B") {
  return <MiningForm />
}

if (code === "C") {
  return <IndustryForm />
}
```

Gunakan pendekatan schema-driven.

Konsep:

```text
PDRB Code
    ↓
Institution
    ↓
Dataset
    ↓
Schema
    ↓
Sections
    ↓
Rows / Entities / Indicators
    ↓
Periods
    ↓
Values
    ↓
Derived / Growth / Phenomenon
```

React component harus reusable dan menerima metadata/schema sebagai props.

---

# 4. Hierarki Data Frontend

Gunakan konsep:

```text
PDRB Sector
├── code
├── name
├── status
└── institutions[]
    ├── name
    ├── linkLabel
    └── datasets[]
        ├── name
        ├── type
        ├── status
        ├── schema
        ├── periods
        └── calculationRules
```

Dataset type yang perlu didukung:

```text
indicator
commodity
entity
facility
project
accounting
calculated
file-upload
monthly-source
ytd-source
```

Tipe tersebut bukan berarti setiap tipe harus mempunyai halaman React sendiri. Tipe digunakan untuk menentukan renderer/schema.

---

# 5. Status

Status master harus dipisahkan dari status dataset.

Status master:

```text
Sudah
Belum
On Progress
```

Status dataset dapat memiliki:

```text
Raw
Derived
Raw + Derived
Draft
Submitted
Reviewed
```

Jangan mencampur:

```text
collection status
```

dengan:

```text
calculation status
```

atau:

```text
approval status
```

---

# 6. Data Kosong

Ini merupakan requirement penting.

Nilai:

```text
empty / null
```

tidak sama dengan:

```text
0
```

Frontend harus:

- menampilkan cell kosong sebagai kosong;
- tidak mengubah kosong menjadi 0;
- tidak menghitung growth apabila nilai sebelumnya kosong;
- memberikan visual yang jelas bahwa field belum memiliki data;
- tetap menampilkan struktur/form meskipun belum ada nilai.

Contoh:

```text
2026 TW3 | —
2026 TW4 | —
```

boleh digunakan pada preview, tetapi nilai sebenarnya tetap harus `null`.

---

# 7. Data Teks

Beberapa sumber mempunyai nilai non-numerik di dalam tabel numerik.

Contoh:

```text
Provinsi
data dari provinsi
tidak ada datanya
-
#VALUE!
#REF!
```

Frontend tidak boleh:

```text
"Provinsi" → 0
"-" → 0
"#VALUE!" → 0
"#REF!" → 0
```

Harus ada representasi value:

```js
{
  rawValue: "Provinsi",
  numericValue: null,
  valueType: "text"
}
```

atau:

```js
{
  rawValue: "#VALUE!",
  numericValue: null,
  valueType: "calculation_error"
}
```

---

# 8. Angka dan Desimal

Display:

```text
maksimal 2 digit desimal
```

Contoh:

```text
1.00
1.25
12.50
```

Namun frontend jangan membuang precision asli dari source hanya karena display dibatasi 2 digit.

Pisahkan:

```text
raw value
stored value
display value
```

---

# 9. Growth / Perubahan

Jangan membuat satu formula growth global.

Beberapa file menggunakan:

```text
(current / previous × 100) − 100
```

File lain menggunakan:

```text
(current - previous) / previous × 100
```

Bahkan ada dataset yang mempunyai pola berbeda.

Karena itu:

```js
calculationRule = {
  type: "growth",
  formula: "current_over_previous_minus_100",
  previousPeriod: "previous_period"
}
```

atau:

```js
calculationRule = {
  type: "growth",
  formula: "delta_over_previous"
}
```

Frontend hanya perlu menampilkan hasil calculation rule yang diberikan schema/backend.

---

# 10. Threshold ±100%

Patokan perubahan drastis:

```text
growth <= -100%
atau
growth >= 100%
```

UI dapat memberikan warning/attention state.

Contoh:

```text
⚠ Perubahan signifikan
Growth: +124.30%
```

atau:

```text
⚠ Penurunan signifikan
Growth: -100.00%
```

Jangan menyimpulkan bahwa perubahan tersebut otomatis baik atau buruk.

Yang wajib adalah:

```text
growth
+
fenomena/alasan
```

---

# 11. Fenomena / Alasan

Fenomena harus dapat dikaitkan dengan perubahan antarperiode.

Minimal:

```js
{
  indicatorId,
  fromPeriod,
  toPeriod,
  previousValue,
  currentValue,
  growthValue,
  explanation,
  createdBy,
  createdAt
}
```

UI:

```text
Perubahan 2026 TW1 → 2026 TW2

Growth
+135.20%

Fenomena / Penjelasan
[ textarea ]

[ Simpan Penjelasan ]
```

Jika threshold ±100% terlampaui, field fenomena dapat diberi emphasis.

Fenomena juga dapat muncul pada dataset yang secara eksplisit menyediakan kolom Fenomena.

---

# 12. Struktur Frontend

Gunakan struktur seperti:

```text
src/
├── components/
│   ├── Sidebar.jsx
│   ├── Topbar.jsx
│   ├── StatusBadge.jsx
│   ├── DataTable.jsx
│   ├── DynamicForm.jsx
│   ├── DatasetCard.jsx
│   ├── InstitutionCard.jsx
│   ├── PeriodSelector.jsx
│   ├── GrowthCell.jsx
│   ├── PhenomenonForm.jsx
│   ├── EmptyState.jsx
│   └── NotificationItem.jsx
│
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── DataPDRB.jsx
│   ├── DatasetDetail.jsx
│   ├── Notifications.jsx
│   └── Profile.jsx
│
├── data/
│   └── prdbData.js
│
├── schemas/
│   └── datasetSchemas.js
│
├── App.jsx
├── main.jsx
└── styles.css
```

---

# 13. Screen 1 — Login

Requirement:

- wajib login;
- email;
- password;
- remember me;
- forgot password;
- dummy account;
- visual profesional.

Prototype:

```text
PORTAL DATA PDRB

Selamat datang
Masuk ke sistem

Email
[________________________]

Password
[________________________]

☐ Ingat saya                 Lupa password?

[ Masuk ke dashboard → ]
```

Untuk tahap frontend, authentication boleh berupa mock state.

---

# 14. Screen 2 — Dashboard

Dashboard harus menjadi ringkasan.

Bagian:

```text
Sidebar
+
Topbar
+
Welcome section
+
Summary cards
+
Daftar Lapangan Usaha
```

Summary:

```text
Total Kode PDRB
Instansi/Lembaga
Dataset
Periode
```

Daftar lapangan usaha:

```text
Kode
Lapangan Usaha
Instansi
Progress
Status
Action
```

Contoh:

```text
A
Pertanian, Kehutanan, dan Perikanan
1 instansi • 9 dataset
[██████░░] 0/9
Belum
>
```

---

# 15. Sidebar

Menu:

```text
PDRB Kota Batu

Dashboard
Data PDRB
Notifikasi
Profil Saya

-----------------

Butuh bantuan?

Keluar
```

Karena requirement menyebut sidebar kiri, sidebar harus menjadi navigasi utama.

---

# 16. Screen 3 — Data PDRB

Hierarki:

```text
Data PDRB
    ↓
Kode
    ↓
Instansi
    ↓
Dataset
```

Contoh:

```text
O — Administrasi Pemerintahan...
    ├── BKAD
    │   ├── LRA APBD
    │   ├── Belanja
    │   └── Proporsi APBD
    │
    └── DP3AP2KB
        └── APBDes
```

---

# 17. Screen 4 — Dataset Detail

Layout:

```text
Breadcrumb

Kode PDRB + nama

┌───────────────┬───────────────────────────┐
│ INSTANSI      │ FORM DATA                 │
│               │                           │
│ Dinas ...     │ Dataset                  │
│               │ Periode                   │
│ DATASET       │ Metadata                  │
│               │                           │
│ Dataset 1     │ Table / Dynamic Form      │
│ Dataset 2     │                           │
│ Growth        │ Fenomena                  │
└───────────────┴───────────────────────────┘
```

---

# 18. Dynamic Form

Form renderer harus membaca schema.

Contoh schema:

```js
{
  datasetType: "indicator",
  title: "Jumlah Siswa dan Tarif SPP Sekolah",
  periods: [
    "2025 TW1",
    "2025 TW2",
    "2025 TW3",
    "2025 TW4",
    "2026 TW1",
    "2026 TW2",
    "2026 TW3",
    "2026 TW4"
  ],
  columns: [
    {
      key: "category",
      label: "Kategori",
      type: "text"
    },
    {
      key: "indicator",
      label: "Indikator",
      type: "text"
    },
    {
      key: "unit",
      label: "Satuan",
      type: "text"
    },
    {
      key: "values",
      label: "Periode",
      type: "period_values"
    }
  ]
}
```

---

# 19. Dataset Type: Commodity

Contoh A / B / G:

```text
Komoditas
Wujud / Indikator Produksi
Satuan
2025 TW1
...
2026 TW4
```

UI harus mendukung row-based table.

---

# 20. Dataset Type: Indicator

Contoh:

```text
Jumlah Peserta
Pendapatan Iuran
Nilai Klaim
Nilai Premi
```

Setiap indikator memiliki:

```text
name
unit
periodValues
```

---

# 21. Dataset Type: Entity

Contoh R:

```text
Nama Tempat Wisata
Satuan
2025 TW1
...
2026 TW4
```

Entity dapat berupa:

```text
tempat wisata
fasilitas
perusahaan
sekolah
```

---

# 22. Dataset Type: Facility

Contoh Q — Dinas Kesehatan.

Struktur:

```text
Fasilitas Kesehatan
    ↓
Jenis Pelayanan
    ├── Rawat Inap
    └── Rawat Jalan
```

Contoh:

```text
RS BAPTIS BATU
├── Rawat Inap
└── Rawat Jalan
```

---

# 23. Dataset Type: Project

Contoh F — Dinas PUPR.

Struktur:

```text
Nama Proyek/Paket
Pagu Anggaran
Nilai Kontrak/Proyek
Periode
    ├── Keuangan
    └── Fisik
```

Jangan memaksa dataset proyek menjadi tabel indikator biasa.

---

# 24. Dataset Type: Accounting

Contoh O — BKAD dan DP3AP2KB.

Harus mendukung:

```text
Kode Rekening
Nama Rekening
Parent
Level
Jenis
Pagu
Realisasi
Persentase
```

Account hierarchy harus dipertahankan.

Contoh:

```text
4 PENDAPATAN DAERAH
└── 4.1 PAD
    └── 4.1.01 Pajak Daerah
        └── 4.1.01.06 Pajak Hotel
```

---

# 25. Bapenda — Special File Upload UI

Bapenda adalah pengecualian.

Requirement:

> khusus Bapenda file yang diupload, bukan isi form.

UI:

```text
Bapenda

Upload File
[ Drag & Drop ]

Format:
.xlsx / .xls

[ Pilih File ]

Preview
↓
Validasi
↓
Mapping
↓
Konfirmasi
```

Jangan membuat Bapenda menjadi form cell-by-cell seperti dataset biasa.

---

# 26. Data Lama

Data lama harus tetap tampil.

Jika ada:

```text
2025 TW1
2025 TW2
2025 TW3
2025 TW4
```

maka jangan hanya menampilkan periode terbaru.

User harus bisa:

```text
lihat
edit
bandingkan
```

sesuai permission.

---

# 27. Period Selector

Periode default:

```text
2025 TW1
2025 TW2
2025 TW3
2025 TW4
2026 TW1
2026 TW2
2026 TW3
2026 TW4
```

Tetapi periode harus configurable oleh admin.

Jangan hardcode periode secara permanen.

Admin harus nantinya dapat:

```text
Tambah periode
Edit label periode
Aktifkan/nonaktifkan periode
Atur deadline
```

---

# 28. Admin Requirement

Tahap frontend berikutnya perlu menyiapkan konsep Admin UI:

```text
Admin
├── Dashboard
├── Master PDRB
├── Instansi
├── Dataset
├── Form Builder
├── Periode
├── Calculation Rules
├── User & Access
└── Notification
```

Form builder:

```text
Dataset
 ├── Title
 ├── Description
 ├── Type
 ├── Period
 ├── Fields
 ├── Units
 ├── Validation
 └── Calculation
```

---

# 29. Access Control

Requirement:

> Hanya dapat melihat data yang diupload sendiri.

Frontend harus siap menerima permission dari backend.

Contoh:

```js
currentUser = {
  id,
  institutionId,
  role,
  permissions
}
```

Permission:

```text
VIEW_OWN_DATA
EDIT_OWN_DATA
UPLOAD_DATA
VIEW_ALL_DATA
MANAGE_FORM
MANAGE_INSTITUTION
MANAGE_USER
```

Jangan mengandalkan frontend sebagai satu-satunya security layer. Backend nantinya wajib melakukan authorization.

---

# 30. Notification

Notifikasi muncul ketika:

- data diperbarui;
- form baru tersedia;
- periode berubah;
- admin mengubah form;
- data dikembalikan untuk diperbaiki;
- terdapat perubahan signifikan;
- deadline mendekat.

Contoh:

```text
Data Dinas Pendidikan diperbarui
2026 TW2 • Jumlah siswa dan tarif SPP

Data Dinas Kesehatan belum lengkap
2026 TW3 dan TW4 masih kosong

Form baru tersedia
DP3AP2KB • APBDes
```

---

# 31. Dummy Email

Untuk prototype:

```text
pertanian@pdrb-kotabatu.local
esda@pdrb-kotabatu.local
pln@pdrb-kotabatu.local
dlh@pdrb-kotabatu.local
pupr@pdrb-kotabatu.local
dishub@pdrb-kotabatu.local
diskoperindag@pdrb-kotabatu.local
dpmptsp@pdrb-kotabatu.local
bkad@pdrb-kotabatu.local
dp3ap2kb@pdrb-kotabatu.local
pendidikan@pdrb-kotabatu.local
kesehatan@pdrb-kotabatu.local
bakesbangpol@pdrb-kotabatu.local
pariwisata@pdrb-kotabatu.local
```

Email di atas hanya dummy untuk UI/prototype.

---

# 32. Mapping Data yang Sudah Dipelajari

## A — Pertanian, Kehutanan, dan Perikanan

Instansi:

```text
Dinas Pertanian dan Ketahanan Pangan
```

Dataset:

```text
Tanaman Pangan
Hortikultura
Hortikultura PMTB
Perkebunan
Perkebunan PMTB
Peternakan
Peternakan PMTB
Kehutanan
Perikanan
```

---

## B — Pertambangan dan Penggalian

Instansi:

```text
ESDA
```

Dataset:

```text
Galian
Produksi Bahan Galian
```

---

## C — Industri Pengolahan

Instansi:

```text
Diskoperindag
```

Dataset:

```text
Industri
Ekspor Impor Luar Negeri
Ekspor Impor Antar Daerah
```

Beberapa volume dapat berupa teks:

```text
1 Kontainer
825 bok
573 pic/pot
3500 tanaman
15 ton
```

Jangan memaksa semua volume menjadi numeric.

---

## D — Pengadaan Listrik dan Gas

Instansi:

```text
PLN
```

Dataset:

```text
Jumlah Listrik Terjual
Rata-Rata Harga Listrik menurut Golongan Tarif
Growth
```

Golongan tarif:

```text
Sosial
Rumah Tangga
Bisnis
Industri
Pemerintah
Multiguna
Total
```

Total dapat menjadi calculated value.

---

## E — Pengadaan Air, Pengelolaan Sampah, Limbah dan Daur Ulang

Instansi:

```text
DLH
PDAM
```

DLH:

```text
Volume Pengolahan Limbah dan Daur Ulang
Pendapatan Pengelolaan Sampah
Growth
```

PDAM:

```text
Volume Air Disalurkan
Rata-Rata Harga
```

Golongan:

```text
Sosial
Rumah Tangga
Pemerintah
Niaga
Industri
Khusus
Total
```

---

## F — Konstruksi

Instansi:

```text
Dinas PUPR
```

Dataset:

```text
Proyek dan Realisasi Triwulanan
```

Field:

```text
Nama Proyek/Paket
Pagu Anggaran
Nilai Kontrak/Proyek
Keuangan
Fisik
Periode
Sumber Dana
```

---

## G — Perdagangan Besar dan Eceran

Instansi:

```text
Pertamina Patra Niaga
```

Dataset:

```text
Penyaluran BBM dan LPG
Analisis Growth
Fenomena
```

Fenomena terkait perubahan antarperiode.

---

## H — Transportasi dan Pergudangan

### Dinas Perhubungan

```text
Jumlah Penumpang Terminal Batu
Jumlah Apel Gratis Kota Batu
Jumlah Penumpang TransJatim
CCTV ETLE
```

Beberapa data dapat berupa teks:

```text
data dari provinsi
```

### POS

```text
Jumlah dan Rata-Rata Tarif Paket
Pendapatan dan Biaya Usaha
```

### BULOG

```text
Perubahan Stok BULOG
Pemasukan Beras dan Gula
```

---

## K — Jasa Keuangan dan Asuransi / PMTB

Instansi:

```text
Diskoperindag
DPMPTSP
BPJS Kesehatan
BPJS Ketenagakerjaan
```

Dataset antara lain:

```text
Unit Koperasi dan Volume Usaha
Realisasi PMA
Luas Bangunan IMB/PBG
Jumlah Peserta
Pendapatan Iuran
Nilai Klaim
Nilai Premi
```

BPJS Ketenagakerjaan mempunyai perhitungan yang dapat berasal dari nilai kumulatif/YTD.

---

## O — Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib

### BKAD

```text
LRA APBD
Belanja
Proporsi APBD Individu dan Kolektif
Growth
Fenomena
```

Account hierarchy harus dipertahankan.

### DP3AP2KB

```text
APBDes
```

---

## P — Jasa Pendidikan

Instansi:

```text
Dinas Pendidikan
```

Dataset:

```text
Jumlah Siswa dan Tarif SPP Sekolah
Growth
```

Kategori:

```text
Sekolah Negeri
Sekolah Swasta
```

Indikator:

```text
PAUD
SD sederajat
SMP sederajat
SMA sederajat
```

SMA dapat mempunyai nilai teks seperti:

```text
Provinsi
```

---

## Q — Jasa Kesehatan dan Kegiatan Sosial / PKLNPRT

### Dinas Kesehatan

```text
Jumlah Pasien dan Tarif Periksa Rumah Sakit dan Puskesmas
Growth
```

Entity:

```text
Fasilitas kesehatan
```

Pelayanan:

```text
Rawat Inap
Rawat Jalan
```

### Bakesbangpol

```text
Jumlah organisasi kemasyarakatan (Ormas)/
lembaga swadaya masyarakat (LSM) terdaftar
Growth
Fenomena
```

Indikator:

```text
Mendaftar triwulan ini
Total terdaftar hingga triwulan ini
```

---

## R — Pariwisata

Instansi:

```text
Dinas Pariwisata
```

Dataset:

```text
Jumlah Pengunjung Wisata menurut Lokasi Wisata
Perkembangan Nilai Penjualan dan Jumlah Tenaga Kerja Restoran
```

Dataset wisata mempunyai banyak entity/tempat wisata.

Dataset restoran:

```text
Nilai Penjualan
Jumlah tenaga kerja
Jumlah Kunjungan Resto dan Cafe
```

---

# 33. Data Model Frontend yang Disarankan

Contoh:

```js
const dataset = {
  id: "p-diknas",
  sectorCode: "P",
  institutionId: "diknas",
  type: "indicator",

  title: "Jumlah Siswa dan Tarif SPP Sekolah",

  periods: [
    "2025 TW1",
    "2025 TW2",
    "2025 TW3",
    "2025 TW4",
    "2026 TW1",
    "2026 TW2",
    "2026 TW3",
    "2026 TW4"
  ],

  fields: [
    {
      key: "category",
      label: "Kategori",
      type: "text"
    },
    {
      key: "indicator",
      label: "Indikator",
      type: "text"
    },
    {
      key: "unit",
      label: "Satuan",
      type: "text"
    }
  ],

  calculationRules: [
    {
      type: "growth",
      formula: "current_over_previous_minus_100"
    }
  ]
};
```

---

# 34. Component Behavior

## StatusBadge

Input:

```jsx
<StatusBadge status="Sudah" />
```

Harus mendukung:

```text
Sudah
Belum
On Progress
Derived
```

---

## DataTable

Harus:

- horizontal scroll;
- sticky header;
- empty value;
- text value;
- numeric value;
- calculated value;
- warning state;
- responsive fallback.

---

## DynamicForm

Harus menerima schema.

Contoh:

```jsx
<DynamicForm schema={dataset.schema} data={dataset.data} />
```

Jangan menulis field satu per satu untuk setiap dinas.

---

## PhenomenonForm

Props:

```js
indicator
fromPeriod
toPeriod
growth
value
threshold
```

Jika threshold terlampaui, tampilkan emphasis.

---

# 35. Frontend State

Gunakan state secara terstruktur.

Contoh:

```text
authState
navigationState
selectedSector
selectedInstitution
selectedDataset
selectedPeriod
editMode
formState
notificationState
```

Jangan menyimpan informasi turunan secara redundant jika dapat dihitung dari source state.

React sendiri menyarankan struktur state yang menghindari state redundant/duplikatif agar sinkronisasi UI lebih mudah dipelihara.

---

# 36. Responsive

Desktop adalah prioritas, tetapi UI tidak boleh rusak pada mobile/tablet.

Desktop:

```text
Sidebar + Main
```

Tablet:

```text
Sidebar collapse
```

Mobile:

```text
Topbar
Content
Horizontal table scroll
```

Data table tidak harus dipaksa menjadi card jika hal tersebut mengurangi keterbacaan data.

---

# 37. Visual Direction

Gaya:

```text
Professional
Government data portal
Clean
Dense but readable
Minimal
Structured
```

Gunakan:

- dark navy untuk navigation/brand;
- white surface;
- light gray background;
- blue sebagai primary action;
- green untuk status selesai;
- orange untuk progress/warning;
- red untuk belum/attention.

Jangan membuat UI terlalu dekoratif.

Prioritaskan keterbacaan data.

---

# 38. Hal yang Jangan Dilakukan

Jangan:

- hardcode semua dataset sebagai halaman berbeda;
- menganggap empty = 0;
- memaksa semua value menjadi number;
- menghitung growth jika previous value kosong/0;
- membuat growth sebagai input manual jika sebenarnya derived;
- menghilangkan data lama;
- membuat satu formula growth untuk semua dataset;
- menghilangkan notes dari sumber;
- mengubah teks seperti `Provinsi` menjadi numeric;
- menyatukan instansi berbeda hanya karena indikatornya mirip;
- menyatukan Q Dinas Kesehatan dengan Q Bakesbangpol;
- menyatukan O BKAD dengan O DP3AP2KB;
- membuat Bapenda sebagai form input biasa;
- menjadikan frontend sebagai satu-satunya security layer.

---

# 39. Tahap Implementasi Frontend

## Phase 1 — Foundation

- React/Vite
- routing/navigation
- global styles
- design tokens
- sidebar
- topbar

## Phase 2 — Main Screens

- Login
- Dashboard
- Data PDRB
- Dataset detail
- Notifications
- Profile

## Phase 3 — Dynamic Rendering

- schema
- DynamicForm
- DataTable
- PeriodSelector
- StatusBadge
- GrowthCell
- PhenomenonForm

## Phase 4 — Dataset Types

Implement renderer untuk:

```text
indicator
commodity
entity
facility
project
accounting
calculated
file-upload
```

## Phase 5 — Admin UI

- master PDRB
- institution
- dataset
- form builder
- period builder
- calculation rule builder
- notification configuration

## Phase 6 — Backend Integration

Baru setelah UI disepakati:

```text
API
Database
Authentication
Authorization
Upload
Validation
Calculation
Audit trail
Notification
```

---

# 40. Acceptance Criteria Frontend

Frontend dianggap berhasil apabila:

### Authentication

- [ ] Login page tersedia
- [ ] Dashboard tidak tampil sebelum login
- [ ] Logout kembali ke login

### Navigation

- [ ] Sidebar tersedia
- [ ] Dashboard
- [ ] Data PDRB
- [ ] Notification
- [ ] Profile

### Data hierarchy

- [ ] Kode PDRB
- [ ] Instansi
- [ ] Dataset
- [ ] Periode

### Form

- [ ] Form dapat dirender dari schema
- [ ] Data lama tampil
- [ ] Data kosong tetap tampil
- [ ] Text value dapat tampil
- [ ] Numeric value dapat tampil
- [ ] Decimal display maksimal 2 digit
- [ ] Edit mode tersedia

### Calculation

- [ ] Derived data dapat dibedakan
- [ ] Growth dapat ditampilkan
- [ ] Threshold ±100% dapat ditandai
- [ ] Fenomena tersedia

### Dataset diversity

- [ ] Commodity
- [ ] Indicator
- [ ] Entity
- [ ] Facility
- [ ] Project
- [Accounting
- [ ] File upload concept

### Admin

- [ ] Struktur form builder sudah disiapkan
- [ ] Period configuration sudah dipikirkan
- [ ] Institution configuration sudah dipikirkan

---

# 41. Status Prototype Saat Ini

Prototype frontend yang disediakan bersama dokumen ini sudah mempunyai:

```text
Login
Dashboard
Sidebar
Topbar
Status Badge
PDRB List
Sector Detail
Institution Selector
Dataset Selector
Period Selector
Data Table Preview
Edit Mode
Fenomena
Notification
Profile
Mock Data
Responsive CSS
```

File utama:

```text
src/App.jsx
src/styles.css
src/data/prdbData.js

src/components/
├── Sidebar.jsx
├── Topbar.jsx
├── StatusBadge.jsx
├── Dashboard.jsx
└── SectorDetail.jsx

src/pages/
├── Login.jsx
└── Notifications.jsx
```

---

# 42. Instruksi untuk AI Coding Agent

Saat melanjutkan project:

1. Baca seluruh source code terlebih dahulu.
2. Jangan langsung mengganti architecture.
3. Pertahankan prinsip schema-driven.
4. Jangan membuat hardcoded page untuk setiap kode.
5. Pisahkan UI component dan data/schema.
6. Jangan menambahkan backend sebelum frontend flow disetujui.
7. Jangan mengarang dataset yang belum diberikan.
8. Jika struktur dataset belum diketahui, buat schema extensible dan gunakan placeholder yang jelas.
9. Jangan mengubah data source yang diberikan.
10. Jangan menghapus data kosong.
11. Jangan mengubah string menjadi numeric tanpa aturan.
12. Jangan membuat calculation formula global.
13. Jangan menganggap calculated value sebagai user input.
14. Pertahankan raw/source value.
15. Siapkan frontend agar backend dapat mengganti mock data melalui API nantinya.
16. Pastikan komponen dapat digunakan ulang.
17. Pastikan tabel tetap nyaman untuk data yang banyak.
18. Gunakan loading, empty, error, dan success state.
19. Gunakan confirmation untuk perubahan penting.
20. Simpan perubahan sebagai draft di frontend sebelum backend tersedia.

---

# 43. Referensi React

Implementasi menggunakan pola komponen, conditional rendering, list rendering, dan state React.

Dokumentasi resmi:

- React Quick Start: https://react.dev/learn
- Describing the UI: https://react.dev/learn/describing-the-ui
- Managing State: https://react.dev/learn/managing-state
- Adding Interactivity: https://react.dev/learn/adding-interactivity
- React Hooks: https://react.dev/reference/react/hooks

---

# 44. Kesimpulan

Frontend harus diperlakukan sebagai **data collection platform yang schema-driven**, bukan kumpulan spreadsheet yang dipindahkan ke HTML.

Model utama:

```text
USER
 ↓
LOGIN
 ↓
DASHBOARD
 ↓
PDRB CODE
 ↓
INSTITUTION / LEMBAGA
 ↓
DATASET
 ↓
SCHEMA
 ↓
FORM / TABLE
 ↓
PERIOD
 ↓
RAW VALUE
 ↓
CALCULATION / GROWTH
 ↓
PHENOMENON
 ↓
SAVE / UPDATE
```

Dengan pendekatan ini, struktur yang sangat berbeda seperti:

```text
A — Komoditas
F — Proyek
O — Rekening APBD
Q — Fasilitas kesehatan
R — Tempat wisata
Bapenda — File upload
```

tetap dapat berada dalam satu aplikasi tanpa membuat frontend menjadi kumpulan kode khusus per dinas.

**Tahap sekarang hanya fokus memastikan UX/frontend benar. Backend dan database dikerjakan setelah struktur UI dan schema dianggap stabil.**

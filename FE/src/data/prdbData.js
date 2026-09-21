export const periods = [
  "2025 TW1", "2025 TW2", "2025 TW3", "2025 TW4",
  "2026 TW1", "2026 TW2", "2026 TW3", "2026 TW4"
];

export const sectors = [
  {
    code: "A",
    name: "Pertanian, Kehutanan, dan Perikanan",
    status: "Belum",
    institutions: [
      {
        name: "Dinas Pertanian dan Ketahanan Pangan",
        linkLabel: "1. Dinas Pertanian",
        datasets: [
          { name: "Tanaman Pangan", type: "commodity", status: "Belum", note: "Komoditas, wujud/indikator produksi, satuan, dan periode." },
          { name: "Hortikultura", type: "commodity", status: "Belum" },
          { name: "Hortikultura PMTB", type: "indicator", status: "Belum" },
          { name: "Perkebunan", type: "commodity", status: "Belum" },
          { name: "Perkebunan PMTB", type: "indicator", status: "Belum" },
          { name: "Peternakan", type: "commodity", status: "Belum" },
          { name: "Peternakan PMTB", type: "indicator", status: "Belum" },
          { name: "Kehutanan", type: "commodity", status: "Belum" },
          { name: "Perikanan", type: "commodity", status: "Belum" }
        ]
      }
    ]
  },
  {
    code: "B",
    name: "Pertambangan dan Penggalian",
    status: "Belum",
    institutions: [
      {
        name: "ESDA (Bagian Perekonomian dan Sumber Daya Alam)",
        linkLabel: "23. ESDA",
        datasets: [{ name: "Galian — Produksi Bahan Galian", type: "commodity", status: "Belum" }]
      }
    ]
  },
  {
    code: "C",
    name: "Industri Pengolahan",
    status: "Belum",
    institutions: [
      {
        name: "Dinas Koperasi, Usaha Mikro, Perdagangan, dan Perindustrian",
        linkLabel: "9. Diskoperindag",
        datasets: [
          { name: "Industri — Jumlah Perusahaan/UMKM, Tenaga Kerja, Nilai Produksi", type: "indicator", status: "Belum" },
          { name: "Ekspor Impor Luar Negeri", type: "indicator", status: "Belum" },
          { name: "Ekspor Impor Antar Daerah", type: "indicator", status: "Belum" }
        ]
      }
    ]
  },
  {
    code: "D",
    name: "Pengadaan Listrik dan Gas",
    status: "Belum",
    institutions: [
      {
        name: "PLN",
        linkLabel: "2. PLN",
        datasets: [
          { name: "Listrik — Jumlah Listrik Terjual", type: "indicator", status: "Belum" },
          { name: "Listrik — Rata-Rata Harga Listrik menurut Golongan Tarif", type: "indicator", status: "Belum" },
          { name: "Growth", type: "calculated", status: "Derived", formula: "(current / previous × 100) − 100" }
        ]
      }
    ]
  },
  {
    code: "E",
    name: "Pengadaan Air, Pengelolaan Sampah, Limbah dan Daur Ulang",
    status: "Belum",
    institutions: [
      {
        name: "Dinas Lingkungan Hidup",
        linkLabel: "3. DLH",
        datasets: [
          { name: "Volume Pengolahan Limbah dan Daur Ulang", type: "indicator", status: "Sudah" },
          { name: "Growth", type: "calculated", status: "Derived" }
        ]
      },
      {
        name: "PDAM",
        linkLabel: "4. PDAM",
        datasets: [{ name: "Volume Air Disalurkan dan Rata-Rata Harga", type: "indicator", status: "Belum" }]
      }
    ]
  },
  {
    code: "F",
    name: "Konstruksi",
    status: "Sudah",
    institutions: [
      {
        name: "Dinas PUPR",
        linkLabel: "8. PUPR",
        datasets: [{ name: "Proyek dan Realisasi Triwulanan", type: "project", status: "Sudah" }]
      }
    ]
  },
  {
    code: "G",
    name: "Perdagangan Besar dan Eceran",
    status: "Belum",
    institutions: [
      {
        name: "Pertamina Patra Niaga",
        linkLabel: "21. Pertamina Patra Niaga",
        datasets: [
          { name: "Penyaluran BBM dan LPG menurut Jenis, Volume, dan Nilai", type: "commodity", status: "Belum" },
          { name: "Analisis Growth & Fenomena", type: "calculated", status: "Derived" }
        ]
      }
    ]
  },
  {
    code: "H",
    name: "Transportasi dan Pergudangan",
    status: "On Progress",
    institutions: [
      {
        name: "Dinas Perhubungan",
        linkLabel: "10. Dishub",
        datasets: [
          { name: "Jumlah Penumpang Terminal Batu, Apel Batu, TransJatim", type: "indicator", status: "Sudah" },
          { name: "CCTV ETLE — Kendaraan Masuk/Keluar", type: "indicator", status: "Sudah" }
        ]
      },
      {
        name: "PT Pos Indonesia dan Shopee Xpress",
        linkLabel: "11. POS",
        datasets: [
          { name: "Jumlah dan Rata-Rata Tarif Paket yang Dikirim", type: "indicator", status: "Belum" },
          { name: "Pendapatan dan Biaya Usaha", type: "indicator", status: "Belum" }
        ]
      },
      {
        name: "Bulog",
        linkLabel: "20. BULOG",
        datasets: [
          { name: "Perubahan Stok BULOG", type: "indicator", status: "On Progress" },
          { name: "Pemasukan Beras dan Gula", type: "indicator", status: "On Progress" }
        ]
      }
    ]
  },
  {
    code: "K",
    name: "Jasa Keuangan dan Asuransi / PMTB",
    status: "Belum",
    institutions: [
      {
        name: "Dinas Koperasi, Usaha Mikro, Perdagangan, dan Perindustrian",
        linkLabel: "9. Diskoperindag",
        datasets: [{ name: "Unit Koperasi dan Volume Usaha", type: "indicator", status: "Belum" }]
      },
      {
        name: "DPMPTSP",
        linkLabel: "7. DPMPTSP",
        datasets: [
          { name: "Realisasi PMA", type: "indicator", status: "Belum" },
          { name: "Luas Bangunan IMB/PBG dan Perkiraan Harga Bangunan per m²", type: "indicator", status: "Belum" }
        ]
      },
      {
        name: "BPJS Kesehatan",
        linkLabel: "18. BPJS Kesehatan",
        datasets: [{ name: "Jumlah Peserta, Pendapatan Iuran, Nilai Klaim BPJS", type: "indicator", status: "Belum" }]
      },
      {
        name: "BPJS Ketenagakerjaan",
        linkLabel: "19. Dinas Ketenagakerjaan (BPJS Naker)",
        datasets: [{ name: "Jumlah Peserta, Pendapatan Iuran, Nilai Klaim BPJS", type: "indicator", status: "Belum" }]
      }
    ]
  },
  {
    code: "O",
    name: "Administrasi Pemerintahan, Pertahanan dan Jaminan Sosial Wajib",
    status: "On Progress",
    institutions: [
      {
        name: "Badan Keuangan dan Aset Daerah",
        linkLabel: "5. BKAD",
        datasets: [
          { name: "LRA APBD", type: "accounting", status: "Belum" },
          { name: "Belanja", type: "accounting", status: "Derived/Raw" },
          { name: "Proporsi APBD Individu dan Kolektif", type: "accounting", status: "Derived/Raw" }
        ]
      },
      {
        name: "DP3AP2KB",
        linkLabel: "6. DP3AP2KB",
        datasets: [{ name: "APBDes", type: "accounting", status: "Sudah" }]
      }
    ]
  },
  {
    code: "P",
    name: "Jasa Pendidikan",
    status: "Sudah",
    institutions: [
      {
        name: "Dinas Pendidikan",
        linkLabel: "15. Dinas Pendidikan",
        datasets: [
          { name: "Jumlah Siswa dan Tarif SPP Sekolah", type: "indicator", status: "Sudah" },
          { name: "Growth", type: "calculated", status: "Derived" }
        ]
      }
    ]
  },
  {
    code: "Q",
    name: "Jasa Kesehatan dan Kegiatan Sosial / PKLNPRT",
    status: "On Progress",
    institutions: [
      {
        name: "Dinas Kesehatan",
        linkLabel: "16. Dinas Kesehatan",
        datasets: [
          { name: "Jumlah Pasien dan Tarif Periksa Rumah Sakit dan Puskesmas", type: "facility", status: "On Progress" },
          { name: "Growth", type: "calculated", status: "Derived" }
        ]
      },
      {
        name: "Bakesbangpol",
        linkLabel: "17. Bakesbangpol",
        datasets: [
          { name: "Jumlah Organisasi Kemasyarakatan (Ormas)/LSM Terdaftar", type: "indicator", status: "Sudah" },
          { name: "Growth & Fenomena", type: "calculated", status: "Derived" }
        ]
      }
    ]
  },
  {
    code: "R",
    name: "Kesenian, Hiburan dan Rekreasi",
    status: "Belum",
    institutions: [
      {
        name: "Dinas Pariwisata",
        linkLabel: "Dinas Pariwisata",
        datasets: [
          { name: "Jumlah Pengunjung Wisata menurut Lokasi Wisata", type: "entity", status: "Belum" },
          { name: "Perkembangan Nilai Penjualan dan Jumlah Tenaga Kerja Restoran", type: "indicator", status: "Belum" }
        ]
      }
    ]
  }
];

export const notifications = [
  { id: 1, type: "change", title: "Data Dinas Pendidikan diperbarui", detail: "2026 TW2 • Jumlah siswa dan tarif SPP", time: "12 menit lalu" },
  { id: 2, type: "warning", title: "Data Dinas Kesehatan belum lengkap", detail: "2026 TW3 dan TW4 masih kosong", time: "1 jam lalu" },
  { id: 3, type: "info", title: "Form baru tersedia", detail: "DP3AP2KB • APBDes", time: "Kemarin" }
];

export const sampleTables = {
  "Jumlah Siswa dan Tarif SPP Sekolah": {
    columns: ["Kategori", "Indikator", "Satuan", "2025 TW1", "2025 TW2", "2025 TW3", "2025 TW4", "2026 TW1", "2026 TW2"],
    rows: [
      ["Sekolah Negeri", "PAUD", "Orang", "120", "122", "125", "127", "129", "130"],
      ["Sekolah Negeri", "SD sederajat", "Orang", "4.320", "4.345", "4.360", "4.380", "4.401", "4.420"],
      ["Sekolah Negeri", "SMP sederajat", "Orang", "2.180", "2.201", "2.220", "2.240", "2.260", "2.275"],
      ["Sekolah Negeri", "SMA sederajat", "Orang", "Provinsi", "Provinsi", "Provinsi", "Provinsi", "Provinsi", "Provinsi"],
      ["Sekolah Swasta", "PAUD", "Orang", "—", "—", "—", "—", "—", "—"],
      ["Sekolah Swasta", "SD sederajat", "Orang", "1.240", "1.255", "1.270", "1.285", "1.298", "1.310"]
    ]
  },
  "Jumlah Organisasi Kemasyarakatan (Ormas)/LSM Terdaftar": {
    columns: ["Indikator", "Satuan", "2025 TW1", "2025 TW2", "2025 TW3", "2025 TW4", "2026 TW1", "2026 TW2", "2026 TW3"],
    rows: [
      ["Mendaftar triwulan ini", "Ormas", "1", "2", "1", "4", "1", "2", "—"],
      ["Total terdaftar hingga triwulan ini", "Ormas", "99", "101", "102", "106", "107", "109", "—"]
    ]
  },
  "Jumlah Pengunjung Wisata menurut Lokasi Wisata": {
    columns: ["Tempat Wisata", "Satuan", "2025 TW1", "2025 TW2", "2025 TW3", "2025 TW4", "2026 TW1", "2026 TW2", "2026 TW3"],
    rows: [
      ["Jatim Park I", "Orang", "120.300", "150.240", "98.120", "111.430", "105.200", "130.100", "—"],
      ["Jatim Park II", "Orang", "155.200", "188.300", "125.100", "142.900", "135.400", "166.700", "—"],
      ["Museum Angkut +", "Orang", "90.120", "112.500", "86.400", "97.300", "92.500", "105.700", "—"],
      ["Desa Wisata Sumberejo", "Orang", "—", "—", "—", "—", "—", "—", "—"]
    ]
  }
};

export const summaryCards = [
  { label: "Total Kode PDRB", value: "12", hint: "terpetakan saat ini" },
  { label: "Instansi / Lembaga", value: "16+", hint: "dengan folder terpisah" },
  { label: "Dataset", value: "40+", hint: "beragam tipe struktur" },
  { label: "Periode", value: "8", hint: "2025 TW1 — 2026 TW4" }
];
# Monetra — Personal Monthly Expense & Budget Tracker

Aplikasi web pencatatan keuangan & anggaran bulanan pribadi berbasis **Client-Side (Zero-Backend & Privacy-First)** yang dibangun menggunakan **React 18, TypeScript, Vite, dan Tailwind CSS**.

## Fitur Utama

1. **Zero-Backend & Privacy-First (`localStorage`)**
   - Seluruh data disimpan secara eksklusif di browser menggunakan key `monetra_finance_v1`.
   - Pengguna baru langsung mendapatkan ruang kerja kosong (`Rp 0`) tanpa dummy data, sementara pengguna lama otomatis melihat riwayat transaksinya kembali.
   - Dilengkapi perlindungan `try-catch` terhadap pembatasan mode Private/Incognito dan sinkronisasi otomatis antar tab.

2. **Filter Periode Bulanan (`YYYY-MM`)**
   - Navigasi antar bulan (`< Nov 2026 >`) serta pemilih bulan cepat.
   - Seluruh perhitungan saldo, ringkasan pemasukan/pengeluaran, alokasi kategori, dan daftar riwayat transaksi difilter secara dinamis sesuai bulan yang dipilih.

3. **Kalkulasi Saldo & Indikator Anggaran Real-Time**
   - Menampilkan **Sisa Uang Bulan Ini**, **Total Pemasukan**, dan **Total Pengeluaran**.
   - Dilengkapi progress bar pemakaian anggaran otomatis:
     - **Hijau (`<= 75%`)**: Anggaran Sehat
     - **Kuning (`> 75%`)**: Waspada
     - **Merah (`> 90%` atau Saldo Minus)**: Kritis / Defisit Anggaran

4. **Manajemen Transaksi Lengkap (CRUD)**
   - **Tambah Transaksi**: Pilihan tipe (Pengeluaran default / Pemasukan), input nominal dengan pemisah ribuan otomatis & tombol nominal cepat, keterangan, kategori, dan tanggal.
   - **Edit Transaksi**: Ubah nominal, kategori, tanggal, atau keterangan kapan saja.
   - **Hapus Transaksi**: Dilengkapi konfirmasi langsung serta fitur **Urungkan (Undo Toast)** untuk mencegah penghapusan tidak sengaja.

5. **Portabilitas Data (Backup & Restore Lokal)**
   - **Export JSON**: Unduh seluruh data `monetra_finance_v1` ke file `monetra-backup-YYYY-MM.json`.
   - **Import JSON**: Unggah file JSON dengan validasi skema ketat, mendukung mode **Gabungkan Data (Merge)** maupun **Timpa Seluruh Data (Replace)**.
   - **Reset Data**: Hapus seluruh data lokal dengan pengaman konfirmasi ganda.

## Menjalankan Secara Lokal

```bash
# Install dependencies
npm install

# Jalankan server development
npm run dev

# Build untuk produksi (Vercel)
npm run build
```


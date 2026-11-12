# Monetra — Personal Monthly Expense & Budget Tracker

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)

**Monetra** adalah aplikasi web pencatatan keuangan dan anggaran bulanan pribadi berbasis **Client-Side (Zero-Backend & Privacy-First)** yang dibangun dengan React 18, TypeScript, Vite, dan Tailwind CSS. Seluruh data keuangan tersimpan secara eksklusif di `localStorage` browser pengguna tanpa login atau server database eksternal.

---

## Fitur Utama

### 1. Zero-Backend & Privacy-First (`localStorage`)
- Menggunakan satu key penyimpanan utama: `monetra_finance_v1`.
- **First-Time Empty State:** Pengguna baru otomatis memulai dari saldo `Rp 0` tanpa dummy data.
- **Auto-Save & Tab Sync:** Setiap penambahan, perubahan, atau penghapusan transaksi langsung disimpan ke `localStorage` (dilindungi `try-catch` untuk mode Private/Incognito) dan tersinkronisasi antar tab browser.

### 2. Ringkasan Saldo Bulanan & Indikator Anggaran Real-Time
- **Filter Periode (`YYYY-MM`):** Navigasi cepat antar bulan (`< Nov 2026 >`) serta pemilih bulan interaktif.
- **Sisa Uang Bulan Ini:** Menghitung `Total Pemasukan - Total Pengeluaran` secara real-time dalam format Rupiah (`Intl.NumberFormat('id-ID')`).
- **Progress Bar Status Anggaran:**
  - **Hijau (`<= 75%`)** — Anggaran Sehat
  - **Kuning (`> 75%`)** — Waspada
  - **Merah (`> 90%` atau Saldo Minus)** — Kritis / Defisit Anggaran

### 3. Akumulasi Sisa Saldo Multi-Bulan
Card khusus untuk memantau total uang tersisa lintas bulan dengan 3 mode filter fleksibel:
- **Semua:** Mengakumulasikan seluruh pemasukan, pengeluaran, dan sisa saldo dari semua bulan yang tercatat.
- **Rentang:** Memilih rentang bulan (**Dari Bulan – Sampai Bulan**) lengkap dengan preset **3 Bln Terakhir**, **6 Bln Terakhir**, **Tahun Berjalan**, dan **Semua Data**.
- **Pilih Bulan:** Menggabungkan bulan-bulan tertentu secara bebas lewat chip checklist (misalnya gabungan bulan non-berurutan).
- **Rincian per Bulan:** Panel lipat untuk melihat pemasukan, pengeluaran, dan selisih bersih tiap bulan beserta tombol **Buka** untuk melompat langsung ke bulan tersebut.

### 4. Manajemen Transaksi Lengkap (CRUD)
- **Catat Transaksi Cepat:** Pilihan tipe **Pengeluaran** (default) dan **Pemasukan**, input nominal dengan pemisah ribuan otomatis + tombol nominal cepat (`+25rb`, `+50rb`, `+100rb`, `+500rb`, `+5jt`), kategori dinamis, dan tanggal.
- **Edit Transaksi:** Perbarui nominal, keterangan, kategori, atau tanggal transaksi kapan saja.
- **Hapus + Undo Toast:** Konfirmasi hapus per item disertai notifikasi **Urungkan** selama 6 detik agar transaksi tidak hilang karena salah klik.
- **Pencarian & Filter:** Filter riwayat berdasarkan tipe (`Semua`, `Pemasukan`, `Pengeluaran`), kategori, maupun kata kunci/nominal.

### 5. Alokasi Pengeluaran per Kategori
- Menampilkan ringkasan distribusi pengeluaran per kategori dalam bentuk progress bar horizontal lengkap dengan persentase dan jumlah transaksi.

### 6. Backup, Restore & Reset Data Lokal
- **Export JSON:** Mengunduh seluruh data `monetra_finance_v1` menjadi file backup (contoh: `monetra-backup-2026-11.json`).
- **Import JSON:** Memulihkan data dari file backup dengan validasi skema ketat, mendukung mode **Gabungkan Data (Merge)** maupun **Timpa Seluruh Data (Replace)**.
- **Reset Data:** Menghapus seluruh transaksi lokal dengan pengaman konfirmasi ganda.

---

## Tech Stack

- **Framework:** React 18 + Vite
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Storage:** Browser `localStorage`

---

## Struktur Project

```text
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── BackupModal.tsx            # Modal Export/Import JSON & Reset Data
│   │   ├── BalanceCard.tsx            # Kartu saldo & progress bar bulan terpilih
│   │   ├── CategorySummary.tsx        # Breakdown pengeluaran per kategori
│   │   ├── CumulativeBalanceCard.tsx  # Kartu akumulasi sisa saldo multi-bulan
│   │   ├── Header.tsx                 # Navigasi bulan & tombol Backup/Restore
│   │   ├── TransactionForm.tsx        # Form tambah & edit transaksi
│   │   └── TransactionList.tsx        # Daftar riwayat transaksi, pencarian, & filter
│   ├── hooks/
│   │   └── useLocalStorage.ts         # Hook persistensi localStorage + multi-tab sync
│   ├── types/
│   │   └── finance.ts                 # Interface & tipe skema transaksi
│   ├── utils/
│   │   └── formatCurrency.ts          # Formatter IDR, helper tanggal, kalkulasi, & validator JSON
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

---

## Skema Data (`localStorage`)

Key: `monetra_finance_v1`

```ts
export type TransactionType = 'income' | 'expense';

export type TransactionCategory =
  | 'Gaji & Pemasukan'
  | 'Makan & Minum'
  | 'Transportasi'
  | 'Tagihan & Utilitas'
  | 'Belanja & Kebutuhan'
  | 'Hiburan'
  | 'Tabungan & Investasi'
  | 'Lainnya';

export interface Transaction {
  id: string;
  type: TransactionType;
  title: string;
  amount: number;
  category: TransactionCategory;
  date: string;      // ISO YYYY-MM-DD
  createdAt: number; // Unix timestamp
}
```

---

## Menjalankan Secara Lokal

```bash
# 1. Clone repository
git clone https://github.com/USERNAME/monetra.git
cd monetra

# 2. Install dependencies
npm install

# 3. Jalankan development server
npm run dev

# 4. Build produksi
npm run build
```

---

## Deploy ke Vercel

Project ini sudah dilengkapi [`vercel.json`](./vercel.json) untuk routing SPA static hosting:

1. Push repository ini ke GitHub.
2. Buka [vercel.com](https://vercel.com) dan login dengan akun GitHub.
3. Pilih **Add New → Project**, lalu import repository `monetra`.
4. Pastikan pengaturan build (otomatis terdeteksi oleh Vercel):
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Klik **Deploy**.

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
  id: string;                 // UUID atau timestamp string unik
  type: TransactionType;      // 'income' menambah saldo, 'expense' mengurangi saldo
  title: string;              // Keterangan transaksi (e.g., "Gaji Bulanan", "Kopi")
  amount: number;             // Nominal integer positif (dalam IDR)
  category: TransactionCategory;
  date: string;               // Format ISO YYYY-MM-DD (untuk filtering bulanan)
  createdAt: number;          // Unix timestamp untuk sorting terbaru
}

export const STORAGE_KEY = 'monetra_finance_v1';

export const ALL_CATEGORIES: TransactionCategory[] = [
  'Gaji & Pemasukan',
  'Makan & Minum',
  'Transportasi',
  'Tagihan & Utilitas',
  'Belanja & Kebutuhan',
  'Hiburan',
  'Tabungan & Investasi',
  'Lainnya',
];

export const INCOME_CATEGORIES: TransactionCategory[] = [
  'Gaji & Pemasukan',
  'Tabungan & Investasi',
  'Lainnya',
];

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'Makan & Minum',
  'Transportasi',
  'Tagihan & Utilitas',
  'Belanja & Kebutuhan',
  'Hiburan',
  'Tabungan & Investasi',
  'Lainnya',
];

export interface MonthlySummary {
  totalIncome: number;
  totalExpense: number;
  remainingBalance: number;
  usagePercentage: number;
}

export interface CategoryBreakdownItem {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  count: number;
}

export type PeriodFilterMode = 'all' | 'range' | 'custom';

export interface MonthlyBreakdownItem {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  remainingBalance: number;
  transactionCount: number;
}


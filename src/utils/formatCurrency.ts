import { ALL_CATEGORIES, MonthlySummary, Transaction, TransactionCategory, TransactionType } from '../types/finance';

const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Format angka menjadi format mata uang Rupiah (contoh: Rp 5.000.000)
 */
export function formatCurrency(amount: number): string {
  return idrFormatter.format(amount);
}

/**
 * Format angka ribuan dengan titik untuk input nominal (contoh: 5.000.000)
 */
export function formatNumberInput(value: number | string): string {
  const digits = String(value).replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  if (isNaN(num)) return '';
  return numberFormatter.format(num);
}

/**
 * Parse string angka berformat ribuan kembali menjadi integer positif
 */
export function parseNumberInput(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  if (!digits) return 0;
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Mendapatkan periode bulan saat ini dalam format YYYY-MM
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Mendapatkan tanggal hari ini dalam format ISO YYYY-MM-DD
 */
export function getTodayISODate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format YYYY-MM menjadi label bulan Indonesia (contoh: "Nov 2026" atau "November 2026")
 */
export function formatMonthLabel(yearMonth: string, style: 'short' | 'long' = 'short'): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return yearMonth;

  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat('id-ID', {
    month: style,
    year: 'numeric',
  }).format(date);
}

/**
 * Menggeser periode YYYY-MM sebanyak delta bulan (-1 untuk bulan lalu, +1 untuk bulan depan)
 */
export function shiftYearMonth(yearMonth: string, deltaMonths: number): string {
  const [yearStr, monthStr] = yearMonth.split('-');
  const date = new Date(Number(yearStr), Number(monthStr) - 1 + deltaMonths, 1);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Format tanggal ISO YYYY-MM-DD menjadi tampilan ramah pengguna (contoh: "12 Nov 2026")
 */
export function formatDisplayDate(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [y, m, d] = parts.map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Menghasilkan ID unik untuk transaksi baru
 */
export function generateTransactionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validasi apakah sebuah objek memenuhi skema Transaction
 */
export function isValidTransaction(item: unknown): item is Transaction {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;

  const validTypes: TransactionType[] = ['income', 'expense'];
  const isTypeValid = typeof obj.type === 'string' && validTypes.includes(obj.type as TransactionType);
  const isCategoryValid =
    typeof obj.category === 'string' && ALL_CATEGORIES.includes(obj.category as TransactionCategory);
  const isDateValid = typeof obj.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.date);
  const isAmountValid =
    typeof obj.amount === 'number' && Number.isFinite(obj.amount) && obj.amount > 0;

  return (
    typeof obj.id === 'string' &&
    obj.id.trim().length > 0 &&
    isTypeValid &&
    typeof obj.title === 'string' &&
    obj.title.trim().length > 0 &&
    isAmountValid &&
    isCategoryValid &&
    isDateValid &&
    typeof obj.createdAt === 'number' &&
    Number.isFinite(obj.createdAt)
  );
}

/**
 * Validasi array transaksi dari file JSON backup
 */
export function validateTransactionsPayload(data: unknown): {
  valid: boolean;
  transactions: Transaction[];
  error?: string;
} {
  // Mendukung format array langsung maupun objek wrapper { data: [...] } / { transactions: [...] }
  let rawList: unknown = data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.transactions)) {
      rawList = record.transactions;
    } else if (Array.isArray(record.data)) {
      rawList = record.data;
    }
  }

  if (!Array.isArray(rawList)) {
    return {
      valid: false,
      transactions: [],
      error: 'Format file tidak valid: Data harus berupa array transaksi JSON.',
    };
  }

  const validTransactions: Transaction[] = [];
  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (!isValidTransaction(item)) {
      return {
        valid: false,
        transactions: [],
        error: `Data transaksi pada indeks ke-${i + 1} tidak sesuai skema Monetra (pastikan id, type, title, amount, category, date, dan createdAt valid).`,
      };
    }
    validTransactions.push({
      id: item.id.trim(),
      type: item.type,
      title: item.title.trim(),
      amount: Math.round(item.amount),
      category: item.category,
      date: item.date,
      createdAt: item.createdAt,
    });
  }

  return {
    valid: true,
    transactions: validTransactions,
  };
}

/**
 * Menghitung ringkasan pemasukan, pengeluaran, sisa saldo, dan persentase pemakaian
 */
export function calculateSummary(transactions: Transaction[]): MonthlySummary {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') {
      totalIncome += tx.amount;
    } else if (tx.type === 'expense') {
      totalExpense += tx.amount;
    }
  }

  const remainingBalance = totalIncome - totalExpense;
  const usagePercentage =
    totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpense,
    remainingBalance,
    usagePercentage,
  };
}



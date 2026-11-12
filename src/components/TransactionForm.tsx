import React, { useState, useEffect } from 'react';
import {
  PlusCircle,
  Save,
  X,
  ArrowDownCircle,
  ArrowUpCircle,
  Sparkles,
} from 'lucide-react';
import {
  ALL_CATEGORIES,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  Transaction,
  TransactionCategory,
  TransactionType,
} from '../types/finance';
import {
  formatNumberInput,
  getCurrentYearMonth,
  getTodayISODate,
  parseNumberInput,
} from '../utils/formatCurrency';

interface TransactionFormProps {
  selectedMonth: string;
  editingTransaction: Transaction | null;
  onSaveTransaction: (
    data: Omit<Transaction, 'id' | 'createdAt'>,
    editId?: string
  ) => void;
  onCancelEdit: () => void;
  presetType?: TransactionType | null;
  onClearPresetType?: () => void;
}

const QUICK_AMOUNTS = [
  { label: '+25rb', value: 25000 },
  { label: '+50rb', value: 50000 },
  { label: '+100rb', value: 100000 },
  { label: '+500rb', value: 500000 },
  { label: '+5jt', value: 5000000 },
];

export const TransactionForm: React.FC<TransactionFormProps> = ({
  selectedMonth,
  editingTransaction,
  onSaveTransaction,
  onCancelEdit,
  presetType,
  onClearPresetType,
}) => {
  // Default tanggal mengikuti hari ini jika berada di bulan yang dipilih, atau tanggal 01 di bulan terpilih
  const getDefaultDateForMonth = (monthStr: string) => {
    const today = getTodayISODate();
    if (monthStr === getCurrentYearMonth()) {
      return today;
    }
    return `${monthStr}-01`;
  };

  // FR-4: Pengeluaran ('expense') sebagai default
  const [type, setType] = useState<TransactionType>('expense');
  const [title, setTitle] = useState<string>('');
  const [amountInput, setAmountInput] = useState<string>('');
  const [category, setCategory] = useState<TransactionCategory>('Makan & Minum');
  const [date, setDate] = useState<string>(() => getDefaultDateForMonth(selectedMonth));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sinkronisasi tanggal default ketika bulan di Header berubah (jika tidak sedang mengedit)
  useEffect(() => {
    if (!editingTransaction) {
      setDate((prevDate) => {
        if (prevDate.startsWith(selectedMonth)) return prevDate;
        return getDefaultDateForMonth(selectedMonth);
      });
    }
  }, [selectedMonth, editingTransaction]);

  // Jika pengguna menekan tombol pintasan "Catat Pemasukan Pertama" dari Empty State
  useEffect(() => {
    if (presetType && !editingTransaction) {
      setType(presetType);
      if (presetType === 'income') {
        setCategory('Gaji & Pemasukan');
      } else {
        setCategory('Makan & Minum');
      }
      if (onClearPresetType) {
        onClearPresetType();
      }
    }
  }, [presetType, editingTransaction, onClearPresetType]);

  // Populate form saat mode Edit Transaksi aktif
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setTitle(editingTransaction.title);
      setAmountInput(formatNumberInput(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setDate(editingTransaction.date);
      setErrorMessage(null);
    }
  }, [editingTransaction]);

  const handleTypeSwitch = (newType: TransactionType) => {
    setType(newType);
    setErrorMessage(null);
    if (newType === 'income') {
      if (!INCOME_CATEGORIES.includes(category)) {
        setCategory('Gaji & Pemasukan');
      }
    } else {
      if (category === 'Gaji & Pemasukan') {
        setCategory('Makan & Minum');
      }
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setAmountInput(formatNumberInput(rawValue));
    if (errorMessage) setErrorMessage(null);
  };

  const handleQuickAmount = (addValue: number) => {
    const current = parseNumberInput(amountInput);
    const next = current + addValue;
    setAmountInput(formatNumberInput(next));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const numericAmount = parseNumberInput(amountInput);

    if (!trimmedTitle) {
      setErrorMessage('Mohon isi judul/keterangan transaksi (contoh: Gaji Bulanan, Makan Siang).');
      return;
    }
    if (numericAmount <= 0) {
      setErrorMessage('Mohon masukkan nominal transaksi lebih dari Rp 0.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setErrorMessage('Tanggal transaksi tidak valid.');
      return;
    }

    onSaveTransaction(
      {
        type,
        title: trimmedTitle,
        amount: numericAmount,
        category,
        date,
      },
      editingTransaction?.id
    );

    // Reset form setelah simpan
    if (!editingTransaction) {
      setTitle('');
      setAmountInput('');
      setErrorMessage(null);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setAmountInput('');
    setType('expense');
    setCategory('Makan & Minum');
    setDate(getDefaultDateForMonth(selectedMonth));
    setErrorMessage(null);
    onCancelEdit();
  };

  const availableCategories =
    type === 'income'
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES.length > 0
      ? EXPENSE_CATEGORIES
      : ALL_CATEGORIES;

  return (
    <section
      id="transaction-form-card"
      aria-label={editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
      className={`bg-white rounded-2xl border transition-all shadow-sm p-5 sm:p-6 ${
        editingTransaction
          ? 'border-amber-400 ring-2 ring-amber-400/20'
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              editingTransaction
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-900 text-white'
            }`}
          >
            {editingTransaction ? (
              <Save className="w-4 h-4" />
            ) : (
              <PlusCircle className="w-4 h-4" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {editingTransaction ? 'Edit Transaksi' : 'Catat Transaksi Cepat'}
            </h2>
            <p className="text-xs text-slate-500">
              {editingTransaction
                ? 'Perbarui detail transaksi yang dipilih'
                : 'Otomatis tersimpan ke perangkat Anda'}
            </p>
          </div>
        </div>

        {editingTransaction && (
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Batal</span>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pilihan Tipe: Pengeluaran (default) atau Pemasukan */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200/70">
          <button
            type="button"
            onClick={() => handleTypeSwitch('expense')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              type === 'expense'
                ? 'bg-white text-rose-600 shadow-sm border border-rose-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Pengeluaran</span>
          </button>

          <button
            type="button"
            onClick={() => handleTypeSwitch('income')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              type === 'income'
                ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Pemasukan</span>
          </button>
        </div>

        {/* Input Nominal (Formatted IDR) */}
        <div>
          <label
            htmlFor="tx-amount"
            className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
          >
            Nominal (IDR)
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-slate-400 pointer-events-none">
              Rp
            </span>
            <input
              id="tx-amount"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amountInput}
              onChange={handleAmountChange}
              className="w-full pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-extrabold text-slate-900 placeholder:text-slate-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all tabular-nums"
            />
            {amountInput && (
              <button
                type="button"
                onClick={() => setAmountInput('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs font-semibold text-slate-400 hover:text-slate-600"
                title="Reset nominal"
              >
                Reset
              </button>
            )}
          </div>

          {/* Tombol Pintasan Nominal */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 mr-1">
              <Sparkles className="w-3 h-3" /> Cepat:
            </span>
            {QUICK_AMOUNTS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleQuickAmount(item.value)}
                className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input Keterangan / Judul */}
        <div>
          <label
            htmlFor="tx-title"
            className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
          >
            Keterangan Transaksi
          </label>
          <input
            id="tx-title"
            type="text"
            maxLength={80}
            placeholder={
              type === 'income'
                ? 'Contoh: Gaji Bulanan, Bonus Project...'
                : 'Contoh: Kopi Pagi, Makan Siang, Listrik...'
            }
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMessage) setErrorMessage(null);
            }}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
          />
        </div>

        {/* Kategori & Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="tx-category"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Kategori
            </label>
            <select
              id="tx-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              {/* Jika sedang mengedit transaksi dengan kategori di luar grup default */}
              {!availableCategories.includes(category) && (
                <option value={category}>{category}</option>
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="tx-date"
              className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Tanggal
            </label>
            <input
              id="tx-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
          </div>
        </div>

        {/* Pesan Validasi Error */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-3 px-4 rounded-xl text-sm font-bold text-white shadow-sm flex items-center justify-center gap-2 active:scale-[0.99] transition-all ${
            editingTransaction
              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/10'
              : type === 'income'
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/10'
              : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/10'
          }`}
        >
          {editingTransaction ? (
            <>
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>
                Tambah {type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </span>
            </>
          )}
        </button>
      </form>
    </section>
  );
};


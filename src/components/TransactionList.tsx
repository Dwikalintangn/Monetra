import React, { useState, useMemo } from 'react';
import {
  Search,
  Trash2,
  Pencil,
  ArrowDownLeft,
  ArrowUpRight,
  ReceiptText,
  PlusCircle,
  X,
  Check,
  Filter,
} from 'lucide-react';
import {
  ALL_CATEGORIES,
  Transaction,
  TransactionCategory,
  TransactionType,
} from '../types/finance';
import {
  formatCurrency,
  formatDisplayDate,
  formatMonthLabel,
} from '../utils/formatCurrency';

interface TransactionListProps {
  transactions: Transaction[];
  selectedMonth: string;
  editingId?: string | null;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onTriggerFirstIncome: () => void;
}

type FilterTab = 'all' | TransactionType;

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  selectedMonth,
  editingId,
  onEdit,
  onDelete,
  onTriggerFirstIncome,
}) => {
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Urutkan transaksi dari yang terbaru (tanggal terbaru, kemudian createdAt terbaru)
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...transactions]
      .filter((tx) => {
        if (filterTab !== 'all' && tx.type !== filterTab) return false;
        if (selectedCategory !== 'ALL' && tx.category !== selectedCategory) return false;
        if (query) {
          const matchTitle = tx.title.toLowerCase().includes(query);
          const matchCategory = tx.category.toLowerCase().includes(query);
          const matchAmount = String(tx.amount).includes(query);
          return matchTitle || matchCategory || matchAmount;
        }
        return true;
      })
      .sort((a, b) => {
        if (b.date !== a.date) {
          return b.date.localeCompare(a.date);
        }
        return b.createdAt - a.createdAt;
      });
  }, [transactions, filterTab, selectedCategory, searchQuery]);

  const handleConfirmDelete = (tx: Transaction) => {
    onDelete(tx);
    setConfirmDeleteId(null);
  };

  return (
    <section
      aria-label="Riwayat Transaksi"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col"
    >
      {/* Header & Jumlah Transaksi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <ReceiptText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Riwayat Transaksi
            </h2>
            <p className="text-xs text-slate-500">
              Periode {formatMonthLabel(selectedMonth, 'long')} ({filteredTransactions.length}{' '}
              dari {transactions.length} transaksi)
            </p>
          </div>
        </div>

        {/* Filter Tipe (Semua, Pemasukan, Pengeluaran) */}
        <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200/70 self-start sm:self-auto">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'income', label: 'Pemasukan' },
              { id: 'expense', label: 'Pengeluaran' },
            ] as { id: FilterTab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Pencarian & Filter Kategori */}
      {transactions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari keterangan atau nominal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="relative sm:w-48">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter berdasarkan kategori"
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
            >
              <option value="ALL">Semua Kategori</option>
              {ALL_CATEGORIES.map((cat: TransactionCategory) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* FR-1: Empty State (First-Time User / Bulan Kosong) */}
      {transactions.length === 0 ? (
        <div className="my-2 py-10 px-5 text-center rounded-2xl bg-slate-50/80 border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
            <ReceiptText className="w-6 h-6" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 mb-1">
            Belum Ada Transaksi di {formatMonthLabel(selectedMonth, 'long')}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed mb-5">
            Mulai kelola anggaran bulanan Anda dengan mencatat gaji atau pemasukan
            pertama, lalu pantau sisa saldo terhadap pengeluaran harian secara real-time.
          </p>
          <button
            type="button"
            onClick={onTriggerFirstIncome}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/15 active:scale-[0.98] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Catat Gaji / Pemasukan Pertama</span>
          </button>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="my-2 py-8 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
          <p className="text-xs font-semibold text-slate-600 mb-1">
            Tidak ada transaksi yang cocok dengan filter pencarian.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterTab('all');
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
          >
            Reset Filter Pencarian
          </button>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 -mx-2 px-2">
          {filteredTransactions.map((tx) => {
            const isIncome = tx.type === 'income';
            const isEditing = editingId === tx.id;
            const isConfirmingDelete = confirmDeleteId === tx.id;

            return (
              <div
                key={tx.id}
                className={`py-3.5 px-2.5 rounded-xl transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isEditing
                    ? 'bg-amber-50/70 ring-1 ring-amber-300'
                    : 'hover:bg-slate-50/90'
                }`}
              >
                {/* Kiri: Ikon + Judul + Meta Kategori & Tanggal */}
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isIncome
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        : 'bg-rose-50 border-rose-200 text-rose-600'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {tx.title}
                      </p>
                      {isEditing && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-200/80 text-amber-900 rounded">
                          Diedit
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-slate-500">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {tx.category}
                      </span>
                      <span>•</span>
                      <span className="font-medium">{formatDisplayDate(tx.date)}</span>
                    </div>
                  </div>
                </div>

                {/* Kanan: Nominal + Aksi Edit & Hapus */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pl-13 sm:pl-0 shrink-0">
                  <span
                    className={`text-sm sm:text-base font-extrabold tabular-nums ${
                      isIncome ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'} {formatCurrency(tx.amount)}
                  </span>

                  <div className="flex items-center gap-1">
                    {isConfirmingDelete ? (
                      <div className="inline-flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-lg p-1">
                        <span className="text-[11px] font-bold text-rose-700 px-1.5">
                          Hapus?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(tx)}
                          className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                          title="Ya, hapus transaksi"
                          aria-label="Konfirmasi hapus transaksi"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="p-1 rounded bg-white text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Batal hapus"
                          aria-label="Batal hapus transaksi"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onEdit(tx)}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Edit transaksi"
                          aria-label={`Edit ${tx.title}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(tx.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Hapus transaksi"
                          aria-label={`Hapus ${tx.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};


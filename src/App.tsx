import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { RotateCcw, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { CumulativeBalanceCard } from './components/CumulativeBalanceCard';
import { TransactionForm } from './components/TransactionForm';
import { CategorySummary } from './components/CategorySummary';
import { TransactionList } from './components/TransactionList';
import { BackupModal } from './components/BackupModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  CategoryBreakdownItem,
  MonthlySummary,
  STORAGE_KEY,
  Transaction,
  TransactionCategory,
  TransactionType,
} from './types/finance';
import {
  calculateSummary,
  formatCurrency,
  generateTransactionId,
  getCurrentYearMonth,
} from './utils/formatCurrency';

export const App: React.FC = () => {
  // FR-1: Initialization & localStorage Persistence (Empty array [] jika pengguna baru)
  const [transactions, setTransactions, storageWarning] = useLocalStorage(
    STORAGE_KEY,
    []
  );

  // FR-2: Period Filtering (Default bulan & tahun saat ini YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() =>
    getCurrentYearMonth()
  );

  // State untuk Edit Transaksi, Preset Form, Backup Modal, dan Undo Toast
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(
    null
  );
  const [presetType, setPresetType] = useState<TransactionType | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [deletedUndoItem, setDeletedUndoItem] = useState<Transaction | null>(null);

  // Auto-hide Undo Toast setelah 6 detik
  useEffect(() => {
    if (!deletedUndoItem) return;
    const timer = window.setTimeout(() => {
      setDeletedUndoItem(null);
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [deletedUndoItem]);

  // FR-2: Filter transaksi berdasarkan bulan yang sedang dipilih (YYYY-MM)
  const monthlyTransactions = useMemo(() => {
    return transactions.filter((tx) => tx.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // FR-3: Real-Time Balance Calculation
  const monthlySummary = useMemo<MonthlySummary>(
    () => calculateSummary(monthlyTransactions),
    [monthlyTransactions]
  );

  // Ringkasan pengeluaran per kategori pada bulan tersebut
  const categoryBreakdown = useMemo<CategoryBreakdownItem[]>(() => {
    const expenseMap = new Map<
      TransactionCategory,
      { amount: number; count: number }
    >();

    for (const tx of monthlyTransactions) {
      if (tx.type !== 'expense') continue;
      const existing = expenseMap.get(tx.category) || { amount: 0, count: 0 };
      expenseMap.set(tx.category, {
        amount: existing.amount + tx.amount,
        count: existing.count + 1,
      });
    }

    const totalExpense = monthlySummary.totalExpense;
    const result: CategoryBreakdownItem[] = [];

    expenseMap.forEach((value, category) => {
      result.push({
        category,
        amount: value.amount,
        count: value.count,
        percentage: totalExpense > 0 ? (value.amount / totalExpense) * 100 : 0,
      });
    });

    return result.sort((a, b) => b.amount - a.amount);
  }, [monthlyTransactions, monthlySummary.totalExpense]);

  // FR-4: Tambah atau Edit Transaksi
  const handleSaveTransaction = useCallback(
    (data: Omit<Transaction, 'id' | 'createdAt'>, editId?: string) => {
      if (editId) {
        setTransactions((prev) =>
          prev.map((item) =>
            item.id === editId
              ? {
                  ...item,
                  type: data.type,
                  title: data.title,
                  amount: data.amount,
                  category: data.category,
                  date: data.date,
                }
              : item
          )
        );
        setEditingTransaction(null);
      } else {
        const newTransaction: Transaction = {
          id: generateTransactionId(),
          type: data.type,
          title: data.title,
          amount: data.amount,
          category: data.category,
          date: data.date,
          createdAt: Date.now(),
        };
        setTransactions((prev) => [newTransaction, ...prev]);
      }

      // Jika transaksi yang baru dicatat berada di bulan berbeda, arahkan periode ke bulan transaksi tersebut
      const txYearMonth = data.date.slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(txYearMonth) && txYearMonth !== selectedMonth) {
        setSelectedMonth(txYearMonth);
      }
    },
    [setTransactions, selectedMonth]
  );

  // FR-4: Hapus Transaksi + Undo Toast
  const handleDeleteTransaction = useCallback(
    (transaction: Transaction) => {
      setTransactions((prev) => prev.filter((item) => item.id !== transaction.id));
      if (editingTransaction?.id === transaction.id) {
        setEditingTransaction(null);
      }
      setDeletedUndoItem(transaction);
    },
    [setTransactions, editingTransaction]
  );

  // Kembalikan transaksi yang baru dihapus (Undo)
  const handleUndoDelete = () => {
    if (!deletedUndoItem) return;
    setTransactions((prev) => {
      if (prev.some((item) => item.id === deletedUndoItem.id)) return prev;
      return [deletedUndoItem, ...prev];
    });
    setDeletedUndoItem(null);
  };

  // Aktifkan mode edit & scroll ke form pada tampilan mobile
  const handleStartEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    const formEl = document.getElementById('transaction-form-card');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // Pintasan dari Empty State untuk mencatat Gaji / Pemasukan pertama
  const handleTriggerFirstIncome = () => {
    setEditingTransaction(null);
    setPresetType('income');
    const formEl = document.getElementById('transaction-form-card');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const amountInput = document.getElementById('tx-amount');
    if (amountInput) {
      window.setTimeout(() => amountInput.focus(), 250);
    }
  };

  // FR-5: Import JSON (Merge atau Replace)
  const handleImportTransactions = (
    imported: Transaction[],
    mode: 'merge' | 'replace'
  ) => {
    if (mode === 'replace') {
      setTransactions(imported);
    } else {
      setTransactions((prev) => {
        const existingMap = new Map<string, Transaction>();
        for (const item of prev) {
          existingMap.set(item.id, item);
        }
        for (const item of imported) {
          existingMap.set(item.id, item);
        }
        return Array.from(existingMap.values());
      });
    }
    setEditingTransaction(null);
  };

  // FR-5: Reset Seluruh Data
  const handleResetAllData = () => {
    setTransactions([]);
    setEditingTransaction(null);
    setDeletedUndoItem(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header Navigasi & Pemilih Periode Bulan */}
      <Header
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        totalTransactionsCount={transactions.length}
      />

      {/* Peringatan jika localStorage dibatasi oleh browser */}
      {storageWarning && (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2.5 text-xs font-semibold text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{storageWarning}</span>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Ringkasan Saldo: Bulan Dipilih vs Akumulasi Multi-Bulan */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6">
            <BalanceCard
              summary={monthlySummary}
              selectedMonth={selectedMonth}
              transactionCount={monthlyTransactions.length}
            />
          </div>
          <div className="lg:col-span-6">
            <CumulativeBalanceCard
              transactions={transactions}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
            />
          </div>
        </div>

        {/* Grid Utama: Kolom Kiri (Form Input & Alokasi Kategori), Kolom Kanan (Riwayat Transaksi) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 space-y-6">
            <TransactionForm
              selectedMonth={selectedMonth}
              editingTransaction={editingTransaction}
              onSaveTransaction={handleSaveTransaction}
              onCancelEdit={() => setEditingTransaction(null)}
              presetType={presetType}
              onClearPresetType={() => setPresetType(null)}
            />

            <CategorySummary
              items={categoryBreakdown}
              totalExpense={monthlySummary.totalExpense}
            />
          </div>

          <div className="lg:col-span-7">
            <TransactionList
              transactions={monthlyTransactions}
              selectedMonth={selectedMonth}
              editingId={editingTransaction?.id}
              onEdit={handleStartEdit}
              onDelete={handleDeleteTransaction}
              onTriggerFirstIncome={handleTriggerFirstIncome}
            />
          </div>
        </div>
      </main>

      {/* Undo Toast saat transaksi dihapus */}
      {deletedUndoItem && (
        <div className="fixed bottom-5 right-4 left-4 sm:left-auto sm:w-96 z-40">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">
                Dihapus: {deletedUndoItem.title}
              </p>
              <p className="text-[11px] text-slate-300">
                {formatCurrency(deletedUndoItem.amount)}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleUndoDelete}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Urungkan</span>
              </button>
              <button
                type="button"
                onClick={() => setDeletedUndoItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Backup, Restore & Reset Data */}
      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        transactions={transactions}
        onImportTransactions={handleImportTransactions}
        onResetAllData={handleResetAllData}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              100% Privacy-First — Seluruh data keuangan tersimpan eksklusif di browser Anda.
            </span>
          </div>
          <span className="font-semibold text-slate-400">
            Monetra v1.0
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;


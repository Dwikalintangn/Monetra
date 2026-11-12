import React, { useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  DatabaseBackup,
  Wallet,
  RotateCcw,
} from 'lucide-react';
import {
  formatMonthLabel,
  getCurrentYearMonth,
  shiftYearMonth,
} from '../utils/formatCurrency';

interface HeaderProps {
  selectedMonth: string;
  onMonthChange: (newMonth: string) => void;
  onOpenBackupModal: () => void;
  totalTransactionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  onMonthChange,
  onOpenBackupModal,
  totalTransactionsCount,
}) => {
  const monthInputRef = useRef<HTMLInputElement>(null);
  const currentMonth = getCurrentYearMonth();
  const isCurrentMonth = selectedMonth === currentMonth;

  const handlePrevMonth = () => {
    onMonthChange(shiftYearMonth(selectedMonth, -1));
  };

  const handleNextMonth = () => {
    onMonthChange(shiftYearMonth(selectedMonth, 1));
  };

  const handleResetToCurrentMonth = () => {
    onMonthChange(currentMonth);
  };

  const handleOpenPicker = () => {
    if (monthInputRef.current) {
      if (typeof monthInputRef.current.showPicker === 'function') {
        try {
          monthInputRef.current.showPicker();
        } catch {
          monthInputRef.current.focus();
        }
      } else {
        monthInputRef.current.focus();
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand Identity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm shadow-slate-900/10">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                    Monetra
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Local-First
                  </span>
                </div>
                <p className="text-xs text-slate-500 hidden sm:block">
                  Personal Monthly Expense &amp; Budget Tracker
                </p>
              </div>
            </div>

            {/* Mobile Backup Button */}
            <button
              type="button"
              onClick={onOpenBackupModal}
              className="sm:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 active:scale-[0.98] transition-all"
              title="Backup, Restore, atau Reset Data"
            >
              <DatabaseBackup className="w-4 h-4 text-slate-600" />
              <span>Data</span>
              {totalTransactionsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                  {totalTransactionsCount}
                </span>
              )}
            </button>
          </div>

          {/* Controls: Month Period Selector + Backup Modal Trigger */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 flex-1 sm:flex-initial justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
                aria-label="Bulan Sebelumnya"
                title="Bulan Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={handleOpenPicker}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold text-slate-800 hover:bg-white/70 transition-colors min-w-[128px] justify-center"
                  title="Klik untuk memilih bulan & tahun"
                >
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{formatMonthLabel(selectedMonth, 'short')}</span>
                </button>
                <input
                  ref={monthInputRef}
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => {
                    if (e.target.value) {
                      onMonthChange(e.target.value);
                    }
                  }}
                  aria-label="Pilih periode bulan dan tahun"
                  className="sr-only"
                />
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
                aria-label="Bulan Berikutnya"
                title="Bulan Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isCurrentMonth && (
              <button
                type="button"
                onClick={handleResetToCurrentMonth}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0"
                title="Kembali ke bulan saat ini"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Bulan Ini</span>
              </button>
            )}

            {/* Desktop Backup Button */}
            <button
              type="button"
              onClick={onOpenBackupModal}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm hover:border-slate-300 active:scale-[0.99] transition-all"
            >
              <DatabaseBackup className="w-4 h-4 text-emerald-600" />
              <span>Backup &amp; Restore</span>
              {totalTransactionsCount > 0 && (
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold">
                  {totalTransactionsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};


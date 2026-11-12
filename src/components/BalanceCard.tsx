import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { MonthlySummary } from '../types/finance';
import { formatCurrency, formatMonthLabel } from '../utils/formatCurrency';

interface BalanceCardProps {
  summary: MonthlySummary;
  selectedMonth: string;
  transactionCount: number;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  summary,
  selectedMonth,
  transactionCount,
}) => {
  const { totalIncome, totalExpense, remainingBalance, usagePercentage } = summary;
  const isNegative = remainingBalance < 0;
  const isDanger = isNegative || usagePercentage > 90;
  const isWarning = !isDanger && usagePercentage > 75;

  // Lebar visual progress bar dibatasi 0% - 100%
  const progressWidth =
    totalIncome === 0 && totalExpense > 0
      ? 100
      : Math.min(100, Math.max(0, usagePercentage));

  // Penentuan warna progress bar sesuai FR-3:
  // Kuning jika > 75%, Merah jika > 90% atau saldo minus, Hijau jika aman (<= 75%)
  const getProgressBarColor = () => {
    if (isDanger) return 'bg-rose-500';
    if (isWarning) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getStatusBadge = () => {
    if (totalIncome === 0 && totalExpense === 0) {
      return {
        label: 'Belum Ada Aktivitas',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
        icon: <TrendingUp className="w-3.5 h-3.5 text-slate-500" />,
      };
    }
    if (isNegative) {
      return {
        label: 'Defisit Anggaran (Saldo Minus)',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />,
      };
    }
    if (usagePercentage > 90) {
      return {
        label: 'Kritis (>90% Terpakai)',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />,
      };
    }
    if (usagePercentage > 75) {
      return {
        label: 'Waspada (>75% Terpakai)',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      };
    }
    return {
      label: 'Anggaran Sehat',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
    };
  };

  const statusBadge = getStatusBadge();

  return (
    <section
      aria-label="Ringkasan Saldo Bulanan"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Top Hero Balance Area */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Sisa Uang Bulan Ini
            </span>
            <span className="text-xs font-medium text-slate-400">
              • {formatMonthLabel(selectedMonth, 'long')}
            </span>
          </div>

          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}
          >
            {statusBadge.icon}
            <span>{statusBadge.label}</span>
          </div>
        </div>

        {/* Main Remaining Balance Figure */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 my-1">
          <h2
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ${
              isNegative ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {formatCurrency(remainingBalance)}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {transactionCount} transaksi tercatat bulan ini
          </span>
        </div>

        {/* Budget Usage Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-600">
              Pemakaian Anggaran Pemasukan
            </span>
            <span
              className={`font-bold tabular-nums ${
                isDanger
                  ? 'text-rose-600'
                  : isWarning
                  ? 'text-amber-600'
                  : 'text-slate-700'
              }`}
            >
              {totalIncome > 0
                ? `${usagePercentage.toFixed(1)}%`
                : totalExpense > 0
                ? '100% (Tanpa Pemasukan)'
                : '0%'}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressBarColor()}`}
              style={{ width: `${progressWidth}%` }}
              role="progressbar"
              aria-valuenow={Math.round(usagePercentage)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
            <span>0% (Aman)</span>
            <span>75% (Waspada)</span>
            <span>90%+ (Kritis)</span>
          </div>
        </div>

        {/* Sub-cards: Total Pemasukan (Hijau) & Total Pengeluaran (Merah) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
          {/* Income Sub-Card */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-800/80 mb-1">
                Total Pemasukan
              </p>
              <p className="text-lg sm:text-xl font-extrabold text-emerald-700 tabular-nums truncate">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          {/* Expense Sub-Card */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-rose-50/60 border border-rose-200/80">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-rose-800/80 mb-1">
                Total Pengeluaran
              </p>
              <p className="text-lg sm:text-xl font-extrabold text-rose-600 tabular-nums truncate">
                {formatCurrency(totalExpense)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-5 h-5 text-rose-600" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


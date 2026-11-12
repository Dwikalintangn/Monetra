import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronUp,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';
import {
  MonthlyBreakdownItem,
  PeriodFilterMode,
  Transaction,
} from '../types/finance';
import {
  calculateSummary,
  formatCurrency,
  formatMonthLabel,
  getCurrentYearMonth,
  shiftYearMonth,
} from '../utils/formatCurrency';

interface CumulativeBalanceCardProps {
  transactions: Transaction[];
  selectedMonth: string;
  onSelectMonth?: (yearMonth: string) => void;
}

export const CumulativeBalanceCard: React.FC<CumulativeBalanceCardProps> = ({
  transactions,
  selectedMonth,
  onSelectMonth,
}) => {
  const currentMonth = getCurrentYearMonth();

  // Daftar bulan unik yang memiliki transaksi, terurut kronologis (lama -> baru)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    for (const tx of transactions) {
      const ym = tx.date.slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(ym)) {
        monthSet.add(ym);
      }
    }
    return Array.from(monthSet).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const earliestMonth = availableMonths[0] ?? currentMonth;
  const latestMonth =
    availableMonths[availableMonths.length - 1] ?? currentMonth;

  const [mode, setMode] = useState<PeriodFilterMode>('all');
  const [rangeStart, setRangeStart] = useState<string>(earliestMonth);
  const [rangeEnd, setRangeEnd] = useState<string>(latestMonth);
  const [hasCustomizedRange, setHasCustomizedRange] = useState<boolean>(false);

  const [customSelectedMonths, setCustomSelectedMonths] = useState<string[]>(
    () => availableMonths
  );
  const [hasCustomizedMonths, setHasCustomizedMonths] =
    useState<boolean>(false);

  const [isBreakdownOpen, setIsBreakdownOpen] = useState<boolean>(false);

  // Sinkronkan rentang default jika user belum mengubah rentang secara manual
  useEffect(() => {
    if (!hasCustomizedRange) {
      setRangeStart(earliestMonth);
      setRangeEnd(latestMonth);
    }
  }, [earliestMonth, latestMonth, hasCustomizedRange]);

  // Sinkronkan pilihan bulan custom awal jika user belum memodifikasi checklist
  useEffect(() => {
    if (!hasCustomizedMonths) {
      setCustomSelectedMonths(availableMonths);
    }
  }, [availableMonths, hasCustomizedMonths]);

  // Filter transaksi sesuai mode yang dipilih
  const filteredTransactions = useMemo(() => {
    if (mode === 'all') {
      return transactions;
    }

    if (mode === 'range') {
      const [minMonth, maxMonth] =
        rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];
      return transactions.filter((tx) => {
        const ym = tx.date.slice(0, 7);
        return ym >= minMonth && ym <= maxMonth;
      });
    }

    // mode === 'custom'
    const selectedSet = new Set(customSelectedMonths);
    return transactions.filter((tx) => selectedSet.has(tx.date.slice(0, 7)));
  }, [transactions, mode, rangeStart, rangeEnd, customSelectedMonths]);

  const summary = useMemo(
    () => calculateSummary(filteredTransactions),
    [filteredTransactions]
  );

  // Rincian saldo per bulan dalam periode yang terfilter
  const monthlyBreakdown = useMemo<MonthlyBreakdownItem[]>(() => {
    const map = new Map<
      string,
      { income: number; expense: number; count: number }
    >();

    for (const tx of filteredTransactions) {
      const ym = tx.date.slice(0, 7);
      const entry = map.get(ym) ?? { income: 0, expense: 0, count: 0 };
      if (tx.type === 'income') {
        entry.income += tx.amount;
      } else {
        entry.expense += tx.amount;
      }
      entry.count += 1;
      map.set(ym, entry);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a)) // Terbaru di atas
      .map(([yearMonth, val]) => ({
        yearMonth,
        totalIncome: val.income,
        totalExpense: val.expense,
        remainingBalance: val.income - val.expense,
        transactionCount: val.count,
      }));
  }, [filteredTransactions]);

  const { totalIncome, totalExpense, remainingBalance, usagePercentage } =
    summary;
  const isNegative = remainingBalance < 0;
  const isDanger = isNegative || usagePercentage > 90;
  const isWarning = !isDanger && usagePercentage > 75;

  const progressWidth =
    totalIncome === 0 && totalExpense > 0
      ? 100
      : Math.min(100, Math.max(0, usagePercentage));

  const getProgressBarColor = () => {
    if (isDanger) return 'bg-rose-500';
    if (isWarning) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Handler rentang bulan dengan normalisasi otomatis agar Dari <= Sampai
  const handleRangeStartChange = (value: string) => {
    if (!value) return;
    setHasCustomizedRange(true);
    setRangeStart(value);
    if (value > rangeEnd) {
      setRangeEnd(value);
    }
  };

  const handleRangeEndChange = (value: string) => {
    if (!value) return;
    setHasCustomizedRange(true);
    setRangeEnd(value);
    if (value < rangeStart) {
      setRangeStart(value);
    }
  };

  const applyRangePreset = (
    preset: 'last3' | 'last6' | 'ytd' | 'all'
  ) => {
    setHasCustomizedRange(true);
    if (preset === 'all') {
      setRangeStart(earliestMonth);
      setRangeEnd(latestMonth);
      return;
    }
    const anchor = selectedMonth || currentMonth;
    if (preset === 'last3') {
      setRangeStart(shiftYearMonth(anchor, -2));
      setRangeEnd(anchor);
    } else if (preset === 'last6') {
      setRangeStart(shiftYearMonth(anchor, -5));
      setRangeEnd(anchor);
    } else if (preset === 'ytd') {
      const year = anchor.slice(0, 4);
      setRangeStart(`${year}-01`);
      setRangeEnd(`${year}-12`);
    }
  };

  const handleToggleCustomMonth = (ym: string) => {
    setHasCustomizedMonths(true);
    setCustomSelectedMonths((prev) =>
      prev.includes(ym)
        ? prev.filter((item) => item !== ym)
        : [...prev, ym].sort((a, b) => a.localeCompare(b))
    );
  };

  const handleSelectAllCustomMonths = () => {
    setHasCustomizedMonths(true);
    setCustomSelectedMonths(availableMonths);
  };

  const handleClearCustomMonths = () => {
    setHasCustomizedMonths(true);
    setCustomSelectedMonths([]);
  };

  // Label ringkas periode aktif
  const getPeriodSummaryLabel = () => {
    if (transactions.length === 0) {
      return 'Belum ada data transaksi';
    }
    if (mode === 'all') {
      if (availableMonths.length === 1) {
        return `${formatMonthLabel(availableMonths[0], 'short')} • 1 bulan tercatat`;
      }
      return `${formatMonthLabel(earliestMonth, 'short')} – ${formatMonthLabel(
        latestMonth,
        'short'
      )} • ${availableMonths.length} bulan`;
    }
    if (mode === 'range') {
      const [minM, maxM] =
        rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart];
      return `${formatMonthLabel(minM, 'short')} – ${formatMonthLabel(
        maxM,
        'short'
      )} • ${monthlyBreakdown.length} bulan aktif`;
    }
    return `Gabungan ${customSelectedMonths.length} dari ${availableMonths.length} bulan`;
  };

  const savingRate =
    totalIncome > 0
      ? Math.max(-999, ((totalIncome - totalExpense) / totalIncome) * 100)
      : 0;

  return (
    <section
      aria-label="Akumulasi Sisa Saldo Multi-Bulan"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <div className="p-5 sm:p-6">
        {/* Top Row: Label + Mode Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-slate-900 text-emerald-400 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Akumulasi Sisa Saldo
            </span>
          </div>

          {/* Mode Tabs */}
          <div
            className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/80"
            role="tablist"
            aria-label="Mode filter periode akumulasi"
          >
            {(
              [
                { id: 'all', label: 'Semua' },
                { id: 'range', label: 'Rentang' },
                { id: 'custom', label: 'Pilih Bulan' },
              ] as { id: PeriodFilterMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => setMode(tab.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  mode === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Accumulated Remaining Balance */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1.5 my-1">
          <h2
            className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ${
              isNegative ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {formatCurrency(remainingBalance)}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {filteredTransactions.length} transaksi • {getPeriodSummaryLabel()}
          </span>
        </div>

        {/* Filter Controls: Mode 'range' */}
        {mode === 'range' && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <CalendarRange className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pilih Rentang Bulan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="cum-range-start"
                  className="block text-[11px] font-semibold text-slate-500 mb-1"
                >
                  Dari Bulan
                </label>
                <input
                  id="cum-range-start"
                  type="month"
                  value={rangeStart}
                  onChange={(e) => handleRangeStartChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="cum-range-end"
                  className="block text-[11px] font-semibold text-slate-500 mb-1"
                >
                  Sampai Bulan
                </label>
                <input
                  id="cum-range-end"
                  type="month"
                  value={rangeEnd}
                  onChange={(e) => handleRangeEndChange(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => applyRangePreset('last3')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              >
                3 Bln Terakhir
              </button>
              <button
                type="button"
                onClick={() => applyRangePreset('last6')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              >
                6 Bln Terakhir
              </button>
              <button
                type="button"
                onClick={() => applyRangePreset('ytd')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
              >
                Tahun {(selectedMonth || currentMonth).slice(0, 4)}
              </button>
              <button
                type="button"
                onClick={() => applyRangePreset('all')}
                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-slate-100 text-emerald-700 border border-emerald-200 transition-colors"
              >
                Semua Data
              </button>
            </div>
          </div>
        )}

        {/* Filter Controls: Mode 'custom' (Gabung Bulan Tertentu) */}
        {mode === 'custom' && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
                <span>Gabungkan Bulan</span>
              </div>

              {availableMonths.length > 0 && (
                <div className="flex items-center gap-2 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={handleSelectAllCustomMonths}
                    className="text-emerald-700 hover:text-emerald-800"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleClearCustomMonths}
                    className="text-slate-500 hover:text-slate-800"
                  >
                    Kosongkan
                  </button>
                </div>
              )}
            </div>

            {availableMonths.length === 0 ? (
              <p className="text-xs text-slate-500 py-1">
                Belum ada bulan yang memiliki transaksi tercatat.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {availableMonths.map((ym) => {
                  const isSelected = customSelectedMonths.includes(ym);
                  return (
                    <button
                      key={ym}
                      type="button"
                      onClick={() => handleToggleCustomMonth(ym)}
                      aria-pressed={isSelected}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                      <span>{formatMonthLabel(ym, 'short')}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Progress Bar Rasio Pemakaian & Sisa Akumulasi */}
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold text-slate-600">
              Rasio Pemakaian Akumulasi
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
                ? `${usagePercentage.toFixed(1)}% terpakai`
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
            <span>
              {totalIncome > 0
                ? `Tersisa ${savingRate.toFixed(1)}% dari total pemasukan`
                : 'Belum ada pemasukan pada periode ini'}
            </span>
            <span className="font-semibold text-slate-500">
              {monthlyBreakdown.length} bln aktif
            </span>
          </div>
        </div>

        {/* Sub-cards: Total Pemasukan & Total Pengeluaran Akumulasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
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

        {/* Toggle Rincian per Bulan */}
        {monthlyBreakdown.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsBreakdownOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 py-1 transition-colors"
            >
              <span>
                Rincian Sisa Uang per Bulan ({monthlyBreakdown.length} bulan)
              </span>
              {isBreakdownOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isBreakdownOpen && (
              <div className="mt-2.5 space-y-2 max-h-56 overflow-y-auto pr-1">
                {monthlyBreakdown.map((item) => {
                  const isActiveMonth = item.yearMonth === selectedMonth;
                  const isMonthNegative = item.remainingBalance < 0;
                  return (
                    <div
                      key={item.yearMonth}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors ${
                        isActiveMonth
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-slate-50 border-slate-200/70'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">
                            {formatMonthLabel(item.yearMonth, 'short')}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({item.transactionCount}x)
                          </span>
                          {isActiveMonth && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">
                              Aktif
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums truncate">
                          Masuk {formatCurrency(item.totalIncome)} • Keluar{' '}
                          {formatCurrency(item.totalExpense)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`font-extrabold tabular-nums ${
                            isMonthNegative
                              ? 'text-rose-600'
                              : 'text-emerald-700'
                          }`}
                        >
                          {item.remainingBalance >= 0 ? '+' : ''}
                          {formatCurrency(item.remainingBalance)}
                        </span>
                        {onSelectMonth && !isActiveMonth && (
                          <button
                            type="button"
                            onClick={() => onSelectMonth(item.yearMonth)}
                            className="px-2 py-1 rounded-md text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                            title={`Buka transaksi ${formatMonthLabel(
                              item.yearMonth,
                              'long'
                            )}`}
                          >
                            Buka
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};


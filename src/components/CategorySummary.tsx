import React from 'react';
import {
  PieChart,
  Utensils,
  Car,
  Zap,
  ShoppingBag,
  Film,
  PiggyBank,
  Briefcase,
  MoreHorizontal,
} from 'lucide-react';
import { CategoryBreakdownItem, TransactionCategory } from '../types/finance';
import { formatCurrency } from '../utils/formatCurrency';

interface CategorySummaryProps {
  items: CategoryBreakdownItem[];
  totalExpense: number;
}

const CATEGORY_STYLE: Record<
  TransactionCategory,
  { barColor: string; badgeBg: string; badgeText: string; icon: React.ReactNode }
> = {
  'Makan & Minum': {
    barColor: 'bg-orange-500',
    badgeBg: 'bg-orange-50 border-orange-200',
    badgeText: 'text-orange-700',
    icon: <Utensils className="w-3.5 h-3.5 text-orange-600" />,
  },
  Transportasi: {
    barColor: 'bg-sky-500',
    badgeBg: 'bg-sky-50 border-sky-200',
    badgeText: 'text-sky-700',
    icon: <Car className="w-3.5 h-3.5 text-sky-600" />,
  },
  'Tagihan & Utilitas': {
    barColor: 'bg-amber-500',
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeText: 'text-amber-700',
    icon: <Zap className="w-3.5 h-3.5 text-amber-600" />,
  },
  'Belanja & Kebutuhan': {
    barColor: 'bg-purple-500',
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeText: 'text-purple-700',
    icon: <ShoppingBag className="w-3.5 h-3.5 text-purple-600" />,
  },
  Hiburan: {
    barColor: 'bg-pink-500',
    badgeBg: 'bg-pink-50 border-pink-200',
    badgeText: 'text-pink-700',
    icon: <Film className="w-3.5 h-3.5 text-pink-600" />,
  },
  'Tabungan & Investasi': {
    barColor: 'bg-teal-500',
    badgeBg: 'bg-teal-50 border-teal-200',
    badgeText: 'text-teal-700',
    icon: <PiggyBank className="w-3.5 h-3.5 text-teal-600" />,
  },
  'Gaji & Pemasukan': {
    barColor: 'bg-emerald-500',
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeText: 'text-emerald-700',
    icon: <Briefcase className="w-3.5 h-3.5 text-emerald-600" />,
  },
  Lainnya: {
    barColor: 'bg-slate-500',
    badgeBg: 'bg-slate-100 border-slate-200',
    badgeText: 'text-slate-700',
    icon: <MoreHorizontal className="w-3.5 h-3.5 text-slate-600" />,
  },
};

export const CategorySummary: React.FC<CategorySummaryProps> = ({
  items,
  totalExpense,
}) => {
  return (
    <section
      aria-label="Ringkasan Pengeluaran per Kategori"
      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Alokasi Pengeluaran
            </h2>
            <p className="text-xs text-slate-500">
              Distribusi pengeluaran per kategori bulan ini
            </p>
          </div>
        </div>
      </div>

      {items.length === 0 || totalExpense === 0 ? (
        <div className="py-8 px-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
          <p className="text-xs font-medium text-slate-500">
            Belum ada data pengeluaran pada bulan ini untuk dianalisis.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const style = CATEGORY_STYLE[item.category] || CATEGORY_STYLE['Lainnya'];
            return (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md border ${style.badgeBg} shrink-0`}
                    >
                      {style.icon}
                    </span>
                    <span className="font-bold text-slate-800 truncate">
                      {item.category}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      ({item.count}x)
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="w-12 text-right text-[11px] font-bold text-slate-500 tabular-nums">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Horizontal Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${style.barColor}`}
                    style={{ width: `${Math.max(2, Math.min(100, item.percentage))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};


import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import { DashboardStats } from '../types';
import { formatINR } from '../utils/formatters';

interface SummaryCardsProps {
  stats: DashboardStats;
  monthLabel?: string;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, monthLabel }) => {
  const periodText = monthLabel || 'This Month';
  const leftover = stats.leftoverBalance ?? (stats.totalIncome - stats.totalExpenses - stats.savings - stats.emergencyFund - stats.lentBorrowed);

  return (
    <div
      id="summary-cards-container"
      className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 shrink-0"
    >
      {/* 1. Total Income for Selected Month */}
      <div
        id="card-income"
        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-800 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Income ({periodText})
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
            {formatINR(stats.totalIncome)}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1 truncate">
            Total earnings recorded for {periodText}
          </p>
        </div>
      </div>

      {/* 2. Total Expenses for Selected Month */}
      <div
        id="card-expenses"
        className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-rose-300 dark:hover:border-rose-800 transition-all"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Expenses ({periodText})
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight truncate">
            {formatINR(stats.totalExpenses)}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1 truncate">
            Total spending recorded for {periodText}
          </p>
        </div>
      </div>

      {/* 3. Leftover Balance for Selected Month (Income − Expenses − Savings − Emergency − Lent/Borrowed) */}
      <div
        id="card-leftover-balance"
        className={`bg-white dark:bg-slate-900 p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition-all ${
          leftover >= 0
            ? 'border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800'
            : 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Leftover Balance ({periodText})
          </span>
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              leftover >= 0
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400'
                : 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
            }`}
          >
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-2xl sm:text-3xl font-black tracking-tight truncate ${
              leftover >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {leftover >= 0 ? '' : '−'}{formatINR(Math.abs(leftover))}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1 truncate">
            Income − Expenses − Savings − Emergency − Lent
          </p>
        </div>
      </div>
    </div>
  );
};

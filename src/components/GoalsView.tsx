import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  ShieldCheck,
  ArrowLeftRight,
  TrendingUp,
  Search,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Target,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import {
  Transaction,
  TransactionType,
  GoalsTimeframe,
  GoalsStats,
} from '../types';
import {
  calculateGoalsStats,
  filterGoalsTransactions,
} from '../utils/calculations';
import {
  formatINR,
  formatDate,
  formatMonthYear,
  getPreviousMonthKey,
  getNextMonthKey,
  getCurrentMonthKey,
  getCurrentYearKey,
} from '../utils/formatters';
import { ConfirmationDialog } from './ConfirmationDialog';

interface GoalsViewProps {
  transactions: Transaction[];
  onOpenAddGoal?: (type: TransactionType) => void;
  onDeleteTransaction?: (rowIndex: number) => Promise<void>;
  onDeleteTransactionsBatch?: (rowIndices: number[]) => Promise<void>;
  sheetUrl?: string;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  transactions,
  onOpenAddGoal,
  onDeleteTransaction,
  onDeleteTransactionsBatch,
  sheetUrl: _sheetUrl,
}) => {
  // Timeframe state: 'month' | 'year' | 'alltime' (Goals timeframe kept intact)
  const [timeframe, setTimeframe] = useState<GoalsTimeframe>('alltime');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthKey());
  const [selectedYear, setSelectedYear] = useState<string>(getCurrentYearKey());

  // Search & Type filter in Goals table
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Selected row indices for bulk deletion
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());

  // Dialog state for single and bulk deletion
  const [pendingDeleteIndices, setPendingDeleteIndices] = useState<number[] | null>(null);
  const [pendingDeleteTx, setPendingDeleteTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate stats for current timeframe
  const goalsStats: GoalsStats = useMemo(() => {
    return calculateGoalsStats(transactions, timeframe, selectedMonth, selectedYear);
  }, [transactions, timeframe, selectedMonth, selectedYear]);

  // Filter transactions for current timeframe and search
  const filteredGoalsTransactions = useMemo(() => {
    const periodTxs = filterGoalsTransactions(transactions, timeframe, selectedMonth, selectedYear);
    return periodTxs.filter((tx) => {
      const matchesType = filterType === 'ALL' || tx.type === filterType;
      const matchesSearch =
        searchTerm === '' ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.amount.toString().includes(searchTerm) ||
        tx.date.includes(searchTerm);
      return matchesType && matchesSearch;
    });
  }, [transactions, timeframe, selectedMonth, selectedYear, filterType, searchTerm]);

  // Valid row indices in current filtered view
  const currentFilteredIndices = useMemo(() => {
    return filteredGoalsTransactions
      .map((tx) => tx.rowIndex)
      .filter((idx): idx is number => typeof idx === 'number');
  }, [filteredGoalsTransactions]);

  // Check if all visible transactions are selected
  const isAllSelected = useMemo(() => {
    if (currentFilteredIndices.length === 0) return false;
    return currentFilteredIndices.every((idx) => selectedRowIndices.has(idx));
  }, [currentFilteredIndices, selectedRowIndices]);

  const isSomeSelected = useMemo(() => {
    if (isAllSelected) return false;
    return currentFilteredIndices.some((idx) => selectedRowIndices.has(idx));
  }, [currentFilteredIndices, selectedRowIndices, isAllSelected]);

  // Toggle selection for a single transaction
  const handleToggleSelectRow = (rowIndex: number) => {
    setSelectedRowIndices((prev) => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  };

  // Toggle Select All
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIndices((prev) => {
        const next = new Set(prev);
        currentFilteredIndices.forEach((idx) => next.delete(idx));
        return next;
      });
    } else {
      setSelectedRowIndices((prev) => {
        const next = new Set(prev);
        currentFilteredIndices.forEach((idx) => next.add(idx));
        return next;
      });
    }
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedRowIndices(new Set());
  };

  // Trigger bulk delete confirmation
  const handleTriggerBulkDelete = () => {
    const indicesToDelete = Array.from(selectedRowIndices);
    if (indicesToDelete.length === 0) return;
    setPendingDeleteIndices(indicesToDelete);
    setPendingDeleteTx(null);
  };

  // Trigger single delete confirmation
  const handleTriggerSingleDelete = (tx: Transaction) => {
    if (!tx.rowIndex) return;
    setPendingDeleteTx(tx);
    setPendingDeleteIndices([tx.rowIndex]);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    setSelectedMonth((prev) => getPreviousMonthKey(prev));
  };
  const handleNextMonth = () => {
    setSelectedMonth((prev) => getNextMonthKey(prev));
  };

  // Year navigation handlers
  const handlePrevYear = () => {
    setSelectedYear((prev) => String(parseInt(prev, 10) - 1));
  };
  const handleNextYear = () => {
    setSelectedYear((prev) => String(parseInt(prev, 10) + 1));
  };

  // Get type visual badge styling
  const getTypeStyle = (type: TransactionType) => {
    switch (type) {
      case 'Savings':
        return {
          textColor: 'text-blue-600 dark:text-blue-400',
          badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: <PiggyBank className="w-3.5 h-3.5" />,
        };
      case 'Emergency Fund':
        return {
          textColor: 'text-amber-600 dark:text-amber-400',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
        };
      case 'Lent & Borrowed':
        return {
          textColor: 'text-purple-600 dark:text-purple-400',
          badgeBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
        };
      default:
        return {
          textColor: 'text-slate-700 dark:text-slate-300',
          badgeBg: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          icon: null,
        };
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDeleteIndices || pendingDeleteIndices.length === 0) return;

    setIsDeleting(true);
    try {
      if (onDeleteTransactionsBatch) {
        await onDeleteTransactionsBatch(pendingDeleteIndices);
      } else if (onDeleteTransaction && pendingDeleteIndices.length === 1) {
        await onDeleteTransaction(pendingDeleteIndices[0]);
      } else if (onDeleteTransaction) {
        for (const idx of [...pendingDeleteIndices].sort((a, b) => b - a)) {
          await onDeleteTransaction(idx);
        }
      }

      setSelectedRowIndices((prev) => {
        const next = new Set(prev);
        pendingDeleteIndices.forEach((idx) => next.delete(idx));
        return next;
      });

      setPendingDeleteIndices(null);
      setPendingDeleteTx(null);
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate allocation percentages
  const totalAllocated = goalsStats.totalAllocated;
  const savingsPct = totalAllocated > 0 ? Math.round((goalsStats.savings / totalAllocated) * 100) : 0;
  const emergencyPct = totalAllocated > 0 ? Math.round((goalsStats.emergencyFund / totalAllocated) * 100) : 0;
  const selectedCount = selectedRowIndices.size;

  return (
    <div id="goals-view-container" className="space-y-5">
      {/* 1. Header & Timeframe Switcher (Month / Year / All-Time) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Goals & Reserves Tracker
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Track long-term savings, emergency funds, and lent/borrowed balances
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe selector controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Pill: Month | Year | All-Time */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              id="btn-goals-timeframe-month"
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'month'
                  ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Month View
            </button>
            <button
              type="button"
              id="btn-goals-timeframe-year"
              onClick={() => setTimeframe('year')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'year'
                  ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Year View
            </button>
            <button
              type="button"
              id="btn-goals-timeframe-alltime"
              onClick={() => setTimeframe('alltime')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeframe === 'alltime'
                  ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              All-Time
            </button>
          </div>

          {/* Sub-Navigator when in Month mode */}
          {timeframe === 'month' && (
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="Previous Month"
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 px-2 min-w-[100px] text-center">
                {formatMonthYear(selectedMonth)}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Next Month"
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sub-Navigator when in Year mode */}
          {timeframe === 'year' && (
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={handlePrevYear}
                title="Previous Year"
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-100 px-2 min-w-[60px] text-center">
                {selectedYear}
              </span>
              <button
                type="button"
                onClick={handleNextYear}
                title="Next Year"
                className="p-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-md transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Savings & Investments */}
        <div
          id="card-goals-savings"
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Total Savings
            </span>
            <div className="w-7 h-7 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">
              {formatINR(goalsStats.savings)}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
              Investments, mutual funds & SIP
            </p>
          </div>
        </div>

        {/* 2. Emergency Fund Reserves */}
        <div
          id="card-goals-emergency"
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Emergency Fund
            </span>
            <div className="w-7 h-7 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {formatINR(goalsStats.emergencyFund)}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
              Liquid emergency reserves
            </p>
          </div>
        </div>

        {/* 3. Lent & Borrowed */}
        <div
          id="card-goals-lent-borrowed"
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Lent / Borrowed
            </span>
            <div className="w-7 h-7 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400 tracking-tight">
              {formatINR(goalsStats.lentBorrowed)}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
              Outstanding receivables & debts
            </p>
          </div>
        </div>

        {/* 4. Total Capital Preserved */}
        <div
          id="card-goals-total-allocated"
          className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Capital Preserved
            </span>
            <div className="w-7 h-7 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 tracking-tight">
              {formatINR(goalsStats.totalAllocated)}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
              Savings + Emergency Fund
            </p>
          </div>
        </div>
      </div>

      {/* 3. Visual Allocation Breakdown Bar */}
      {totalAllocated > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 transition-colors">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Reserves Allocation Ratio</span>
            <div className="flex items-center gap-4 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                Savings: {savingsPct}% ({formatINR(goalsStats.savings)})
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Emergency: {emergencyPct}% ({formatINR(goalsStats.emergencyFund)})
              </span>
            </div>
          </div>
          {/* Allocation Progress Bar */}
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${savingsPct}%` }}
              className="bg-blue-500 h-full transition-all duration-500"
              title={`Savings: ${savingsPct}%`}
            />
            <div
              style={{ width: `${emergencyPct}%` }}
              className="bg-amber-500 h-full transition-all duration-500"
              title={`Emergency Fund: ${emergencyPct}%`}
            />
          </div>
        </div>
      )}

      {/* 4. Goals Activity Table & List */}
      <div
        id="goals-activity-card"
        className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col transition-colors"
      >
        {/* Header & Controls */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Goals Activity Log
            </h3>
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              ({filteredGoalsTransactions.length} entries in{' '}
              {timeframe === 'month'
                ? formatMonthYear(selectedMonth)
                : timeframe === 'year'
                ? selectedYear
                : 'All-Time'}
              )
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Bulk Delete Selected Button */}
            {selectedCount > 0 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  id="btn-goals-delete-selected"
                  onClick={handleTriggerBulkDelete}
                  className="py-1.5 px-3 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer animate-fadeIn"
                >
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Delete Selected ({selectedCount})</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="py-1.5 px-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2 pointer-events-none" />
              <input
                type="text"
                id="goals-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search category, note..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Type Filter */}
            <select
              id="goals-filter-type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="py-1.5 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">All Goals</option>
              <option value="Savings">Savings</option>
              <option value="Emergency Fund">Emergency Fund</option>
              <option value="Lent & Borrowed">Lent & Borrowed</option>
            </select>

            {/* Quick Add Goal Trigger */}
            {onOpenAddGoal && (
              <button
                type="button"
                id="btn-goals-add-entry"
                onClick={() => onOpenAddGoal('Savings')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Goal Entry</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Select All Bar */}
        {filteredGoalsTransactions.length > 0 && (
          <div className="md:hidden px-4 py-2 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleToggleSelectAll}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
              />
              <span>Select All ({filteredGoalsTransactions.length})</span>
            </label>

            {selectedCount > 0 && (
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                {selectedCount} selected
              </span>
            )}
          </div>
        )}

        {/* Table Content */}
        {filteredGoalsTransactions.length === 0 ? (
          <div
            id="empty-goals-transactions"
            className="py-12 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 p-6"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-500 mb-3">
              <PiggyBank className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">No goals activity found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              {timeframe === 'month'
                ? `No savings, emergency fund, or lent/borrowed transactions for ${formatMonthYear(
                    selectedMonth
                  )}.`
                : timeframe === 'year'
                ? `No savings or goals entries recorded for year ${selectedYear}.`
                : 'Start recording your savings, investments, and emergency reserves to build your goals history.'}
            </p>
            {onOpenAddGoal && (
              <button
                type="button"
                onClick={() => onOpenAddGoal('Savings')}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Savings</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 shadow-xs">
                  <tr className="text-slate-400 dark:text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                    <th className="w-10 px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={handleToggleSelectAll}
                        title={isAllSelected ? 'Deselect all' : 'Select all'}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : isSomeSelected ? (
                          <MinusSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Description / Note</th>
                    <th className="px-5 py-3 text-right font-semibold">Amount</th>
                    {(onDeleteTransaction || onDeleteTransactionsBatch) && (
                      <th className="px-4 py-3 text-center font-semibold">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                  {filteredGoalsTransactions.map((tx) => {
                    const style = getTypeStyle(tx.type);
                    const isSelected = tx.rowIndex !== undefined && selectedRowIndices.has(tx.rowIndex);

                    return (
                      <tr
                        key={tx.id || `${tx.date}-${tx.amount}-${tx.rowIndex}`}
                        className={`transition-colors group ${
                          isSelected
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="w-10 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (tx.rowIndex !== undefined) {
                                handleToggleSelectRow(tx.rowIndex);
                              }
                            }}
                            className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{tx.category}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[11px] font-bold ${style.badgeBg}`}
                          >
                            {style.icon}
                            {tx.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 italic text-slate-400 dark:text-slate-500 text-[11px] max-w-xs truncate">
                          {tx.description || <span className="not-italic text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className={`px-5 py-3 text-right font-bold text-xs ${style.textColor} whitespace-nowrap`}>
                          {formatINR(tx.amount)}
                        </td>
                        {(onDeleteTransaction || onDeleteTransactionsBatch) && (
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <button
                              type="button"
                              title="Delete entry from Google Sheet"
                              onClick={() => handleTriggerSingleDelete(tx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-md transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGoalsTransactions.map((tx) => {
                const style = getTypeStyle(tx.type);
                const isSelected = tx.rowIndex !== undefined && selectedRowIndices.has(tx.rowIndex);

                return (
                  <div
                    key={tx.id || `${tx.date}-${tx.amount}-${tx.rowIndex}`}
                    className={`p-3.5 flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (tx.rowIndex !== undefined) {
                            handleToggleSelectRow(tx.rowIndex);
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold border ${style.badgeBg}`}>
                          {style.icon}
                          {tx.type}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{formatDate(tx.date)}</span>
                      </div>
                      <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{tx.category}</div>
                      {tx.description && (
                        <div className="text-[11px] italic text-slate-400 dark:text-slate-500 truncate mt-0.5">
                          {tx.description}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className={`font-bold text-xs sm:text-sm text-right ${style.textColor}`}>
                        {formatINR(tx.amount)}
                      </div>
                      {(onDeleteTransaction || onDeleteTransactionsBatch) && (
                        <button
                          type="button"
                          onClick={() => handleTriggerSingleDelete(tx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={pendingDeleteIndices !== null && pendingDeleteIndices.length > 0}
        title={
          pendingDeleteIndices && pendingDeleteIndices.length > 1
            ? `Delete ${pendingDeleteIndices.length} Goal Entries?`
            : 'Delete Goal Entry?'
        }
        message={
          pendingDeleteIndices && pendingDeleteIndices.length > 1
            ? `Are you sure you want to permanently delete the ${pendingDeleteIndices.length} selected entries from your Google Sheet?`
            : pendingDeleteTx
            ? `Are you sure you want to remove row #${pendingDeleteTx.rowIndex} (${pendingDeleteTx.category} - ${formatINR(
                pendingDeleteTx.amount || 0
              )}) from your Google Sheet?`
            : `Are you sure you want to delete the selected entry from your Google Sheet?`
        }
        confirmLabel={
          pendingDeleteIndices && pendingDeleteIndices.length > 1
            ? `Delete ${pendingDeleteIndices.length} from Sheet`
            : 'Delete from Sheet'
        }
        cancelLabel="Cancel"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setPendingDeleteIndices(null);
          setPendingDeleteTx(null);
        }}
      />
    </div>
  );
};

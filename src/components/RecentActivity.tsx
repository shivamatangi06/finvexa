import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ShieldCheck,
  ArrowLeftRight,
  Search,
  Plus,
  Trash2,
  Receipt,
  CheckSquare,
  Square,
  MinusSquare,
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatINR, formatDate, formatMonthYear } from '../utils/formatters';
import { ConfirmationDialog } from './ConfirmationDialog';

interface RecentActivityProps {
  transactions: Transaction[];
  selectedMonth?: string;
  onAddNewClick?: () => void;
  onDeleteTransaction?: (rowIndex: number) => Promise<void>;
  onDeleteTransactionsBatch?: (rowIndices: number[]) => Promise<void>;
  sheetUrl?: string;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  transactions,
  selectedMonth,
  onAddNewClick,
  onDeleteTransaction,
  onDeleteTransactionsBatch,
  sheetUrl: _sheetUrl,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'month' | 'all'>('month');

  // Selected row indices for bulk deletion
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  
  // Dialog state for single and bulk deletion
  const [pendingDeleteIndices, setPendingDeleteIndices] = useState<number[] | null>(null);
  const [pendingDeleteTx, setPendingDeleteTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Month-filtered vs All-time transactions
  const scopedTransactions = useMemo(() => {
    if (scopeFilter === 'month' && selectedMonth) {
      return transactions.filter((tx) => tx.date && tx.date.startsWith(selectedMonth));
    }
    return transactions;
  }, [transactions, selectedMonth, scopeFilter]);

  const filteredTransactions = useMemo(() => {
    return scopedTransactions.filter((tx) => {
      const matchesType = filterType === 'ALL' || tx.type === filterType;
      const matchesSearch =
        searchTerm === '' ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.amount.toString().includes(searchTerm) ||
        tx.date.includes(searchTerm);
      return matchesType && matchesSearch;
    });
  }, [scopedTransactions, filterType, searchTerm]);

  // Valid row indices in current filtered view
  const currentFilteredIndices = useMemo(() => {
    return filteredTransactions
      .map((tx) => tx.rowIndex)
      .filter((idx): idx is number => typeof idx === 'number');
  }, [filteredTransactions]);

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
      // Deselect all visible
      setSelectedRowIndices((prev) => {
        const next = new Set(prev);
        currentFilteredIndices.forEach((idx) => next.delete(idx));
        return next;
      });
    } else {
      // Select all visible
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

  // Confirm delete handler (works for single and bulk)
  const handleConfirmDelete = async () => {
    if (!pendingDeleteIndices || pendingDeleteIndices.length === 0) return;

    setIsDeleting(true);
    try {
      if (onDeleteTransactionsBatch) {
        await onDeleteTransactionsBatch(pendingDeleteIndices);
      } else if (onDeleteTransaction && pendingDeleteIndices.length === 1) {
        await onDeleteTransaction(pendingDeleteIndices[0]);
      } else if (onDeleteTransaction) {
        // Fallback sequentially
        for (const idx of [...pendingDeleteIndices].sort((a, b) => b - a)) {
          await onDeleteTransaction(idx);
        }
      }

      // Remove deleted items from selection
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

  const getTypeStyle = (type: TransactionType) => {
    switch (type) {
      case 'Income':
        return {
          textColor: 'text-emerald-600 dark:text-emerald-400',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          sign: '+',
          icon: <TrendingUp className="w-3 h-3" />,
        };
      case 'Expense':
        return {
          textColor: 'text-rose-600 dark:text-rose-400',
          badgeBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          sign: '−',
          icon: <TrendingDown className="w-3 h-3" />,
        };
      case 'Savings':
        return {
          textColor: 'text-blue-600 dark:text-blue-400',
          badgeBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          sign: '•',
          icon: <PiggyBank className="w-3 h-3" />,
        };
      case 'Emergency Fund':
        return {
          textColor: 'text-amber-600 dark:text-amber-400',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          sign: '•',
          icon: <ShieldCheck className="w-3 h-3" />,
        };
      case 'Lent & Borrowed':
        return {
          textColor: 'text-purple-600 dark:text-purple-400',
          badgeBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          sign: '⇄',
          icon: <ArrowLeftRight className="w-3 h-3" />,
        };
      default:
        return {
          textColor: 'text-slate-700 dark:text-slate-300',
          badgeBg: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          sign: '',
          icon: null,
        };
    }
  };

  const monthTitle = selectedMonth ? formatMonthYear(selectedMonth) : 'Selected Month';

  // Selected count
  const selectedCount = selectedRowIndices.size;

  return (
    <div
      id="recent-activity-card"
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col transition-colors"
    >
      {/* Top Header & Search/Filter Controls */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/40">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
            Recent Transactions
          </h3>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            ({filteredTransactions.length} of {transactions.length})
          </span>

          {/* Month / All Scope Switcher */}
          {selectedMonth && (
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-[11px] font-bold ml-1">
              <button
                type="button"
                onClick={() => setScopeFilter('month')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  scopeFilter === 'month'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {monthTitle}
              </button>
              <button
                type="button"
                onClick={() => setScopeFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  scopeFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All Months
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk Delete Selected Button */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="btn-delete-selected-transactions"
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

          {/* Search input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              id="recent-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search category, note..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type Filter */}
          <select
            id="recent-filter-type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="py-1.5 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
            <option value="Savings">Savings</option>
            <option value="Emergency Fund">Emergency Fund</option>
            <option value="Lent & Borrowed">Lent & Borrowed</option>
          </select>
        </div>
      </div>

      {/* Mobile Select All Bar when transactions exist */}
      {filteredTransactions.length > 0 && (
        <div className="md:hidden px-4 py-2 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
            />
            <span>Select All ({filteredTransactions.length})</span>
          </label>

          {selectedCount > 0 && (
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
              {selectedCount} selected
            </span>
          )}
        </div>
      )}

      {/* Empty State */}
      {transactions.length === 0 ? (
        <div
          id="empty-transactions-container"
          className="py-12 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900 p-6"
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <Receipt className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">No transactions yet.</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Your transactions sheet is ready. Record your first entry to start tracking.
          </p>
          {onAddNewClick && (
            <button
              type="button"
              id="btn-empty-add-transaction"
              onClick={onAddNewClick}
              className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Transaction</span>
            </button>
          )}
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-10 text-center bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
          {scopeFilter === 'month'
            ? `No transactions recorded for ${monthTitle}. You can toggle "All Months" to view all records.`
            : 'No transactions match your search filter.'}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-white dark:bg-slate-900 shadow-xs z-10">
                <tr className="text-slate-400 dark:text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                  {/* Select All Checkbox Column */}
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
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                  {(onDeleteTransaction || onDeleteTransactionsBatch) && (
                    <th className="px-4 py-3 text-center font-semibold">Action</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
                {filteredTransactions.map((tx) => {
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
                      {/* Checkbox Column */}
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
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                        {tx.category}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold ${style.badgeBg}`}
                        >
                          {style.icon}
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 italic text-slate-400 dark:text-slate-500 text-[11px] max-w-xs truncate">
                        {tx.description || <span className="not-italic text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className={`px-5 py-3 text-right font-bold text-xs ${style.textColor} whitespace-nowrap`}>
                        {style.sign} {formatINR(tx.amount)}
                      </td>
                      {(onDeleteTransaction || onDeleteTransactionsBatch) && (
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            title="Delete transaction from Google Sheet"
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

          {/* Mobile Card View with Checkboxes */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {filteredTransactions.map((tx) => {
              const style = getTypeStyle(tx.type);
              const isSelected = tx.rowIndex !== undefined && selectedRowIndices.has(tx.rowIndex);

              return (
                <div
                  key={tx.id || `${tx.date}-${tx.amount}-${tx.rowIndex}`}
                  className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40'
                      : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Mobile Checkbox */}
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
                      {style.sign} {formatINR(tx.amount)}
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

      {/* Confirmation Dialog for Deleting Single or Multiple Transactions from Google Sheet */}
      <ConfirmationDialog
        isOpen={pendingDeleteIndices !== null && pendingDeleteIndices.length > 0}
        title={
          pendingDeleteIndices && pendingDeleteIndices.length > 1
            ? `Delete ${pendingDeleteIndices.length} Transactions?`
            : 'Delete Transaction?'
        }
        message={
          pendingDeleteIndices && pendingDeleteIndices.length > 1
            ? `Are you sure you want to permanently delete the ${pendingDeleteIndices.length} selected transactions from your Google Sheet? This cannot be undone and will update your spreadsheet immediately.`
            : pendingDeleteTx
            ? `Are you sure you want to remove row #${pendingDeleteTx.rowIndex} (${pendingDeleteTx.category} - ${formatINR(
                pendingDeleteTx.amount || 0
              )}) from your Google Sheet?`
            : `Are you sure you want to delete the selected transaction from your Google Sheet?`
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

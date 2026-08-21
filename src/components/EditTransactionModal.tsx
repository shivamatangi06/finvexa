import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  IndianRupee,
  Tag,
  FileText,
  Save,
  Trash2,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ShieldCheck,
  ArrowLeftRight,
} from 'lucide-react';
import { Transaction, TransactionType, CategoryData } from '../types';
import { getTodayDateString, normalizeDateString } from '../utils/formatters';

interface EditTransactionModalProps {
  isOpen: boolean;
  transaction: Transaction | null;
  categories: CategoryData;
  onClose: () => void;
  onSave: (
    rowIndex: number,
    updatedData: {
      date: string;
      type: TransactionType;
      category: string;
      amount: number;
      description: string;
    }
  ) => Promise<void>;
  onDelete?: (rowIndex: number) => Promise<void>;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  transaction,
  categories,
  onClose,
  onSave,
  onDelete,
}) => {
  const [type, setType] = useState<TransactionType>('Expense');
  const [category, setCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [description, setDescription] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state with selected transaction
  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount ? String(transaction.amount) : '');
      setDate(transaction.date ? normalizeDateString(transaction.date) : getTodayDateString());
      setDescription(transaction.description || '');

      const availableList =
        transaction.type === 'Income'
          ? categories.incomeCategories
          : transaction.type === 'Expense'
          ? categories.expenseCategories
          : transaction.type === 'Savings'
          ? categories.savingsCategories
          : transaction.type === 'Emergency Fund'
          ? categories.emergencyFundCategories
          : categories.lentBorrowedCategories;

      if (availableList.includes(transaction.category)) {
        setCategory(transaction.category);
        setIsCustomCategory(false);
        setCustomCategory('');
      } else {
        setCategory('__custom__');
        setIsCustomCategory(true);
        setCustomCategory(transaction.category);
      }
      setErrorMessage(null);
    }
  }, [transaction, categories]);

  if (!isOpen || !transaction) return null;

  const currentCategoriesList =
    type === 'Income'
      ? categories.incomeCategories
      : type === 'Expense'
      ? categories.expenseCategories
      : type === 'Savings'
      ? categories.savingsCategories
      : type === 'Emergency Fund'
      ? categories.emergencyFundCategories
      : categories.lentBorrowedCategories;

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const nextCategories =
      newType === 'Income'
        ? categories.incomeCategories
        : newType === 'Expense'
        ? categories.expenseCategories
        : newType === 'Savings'
        ? categories.savingsCategories
        : newType === 'Emergency Fund'
        ? categories.emergencyFundCategories
        : categories.lentBorrowedCategories;

    if (nextCategories.length > 0) {
      setCategory(nextCategories[0]);
      setIsCustomCategory(false);
    } else {
      setCategory('__custom__');
      setIsCustomCategory(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category.trim();
    if (!finalCategory) {
      setErrorMessage('Please select or specify a category.');
      return;
    }

    if (!transaction.rowIndex) {
      setErrorMessage('Unable to modify: row index in Google Sheet is missing.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(transaction.rowIndex, {
        date,
        type,
        category: finalCategory,
        amount: parsedAmount,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update transaction in Google Sheet.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="edit-transaction-modal"
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative transition-colors"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-5">
          <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Modify Excel / Google Sheet Record</span>
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Editing Row #{transaction.rowIndex} in Transactions sheet. Changes sync instantly.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selector Tabs */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleTypeChange('Expense')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'Expense'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Expense</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('Income')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'Income'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Income</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('Savings')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'Savings'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <PiggyBank className="w-3.5 h-3.5" />
                <span>Savings</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('Emergency Fund')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'Emergency Fund'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Emergency</span>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('Lent & Borrowed')}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 col-span-2 sm:col-span-2 cursor-pointer ${
                  type === 'Lent & Borrowed'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Lent & Borrowed</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Amount (₹ INR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-slate-400 dark:text-slate-500 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-bold text-base focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Category
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <select
                value={isCustomCategory ? '__custom__' : category}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomCategory(true);
                  } else {
                    setIsCustomCategory(false);
                    setCategory(e.target.value);
                  }
                }}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {currentCategoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="__custom__">+ Custom Category...</option>
              </select>
            </div>

            {isCustomCategory && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name..."
                required
                className="mt-2 w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            )}
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Transaction Date (Saved as DD-MM-YYYY in Sheet)
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-semibold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Description / Notes (Optional)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add optional note or payment ref..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {onDelete && transaction.rowIndex ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Delete this row from Google Sheet?')) {
                    setIsSaving(true);
                    try {
                      await onDelete(transaction.rowIndex!);
                      onClose();
                    } finally {
                      setIsSaving(false);
                    }
                  }
                }}
                disabled={isSaving}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Updating Sheet...' : 'Update Sheet Record'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

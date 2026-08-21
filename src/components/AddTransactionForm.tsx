import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  ShieldCheck,
  ArrowLeftRight,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  IndianRupee,
  Tag,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { TransactionType, CategoryData } from '../types';
import { getTodayDateString } from '../utils/formatters';

interface AddTransactionFormProps {
  categories: CategoryData;
  initialType?: TransactionType;
  onSave: (transaction: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
  }) => Promise<void>;
  onSuccessCallback?: () => void;
  isCompact?: boolean;
  sheetUrl?: string;
}

export const AddTransactionForm: React.FC<AddTransactionFormProps> = ({
  categories,
  initialType = 'Expense',
  onSave,
  onSuccessCallback,
  sheetUrl,
}) => {
  const [type, setType] = useState<TransactionType>(initialType);
  const [category, setCategory] = useState<string>('');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [description, setDescription] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Sync initialType when it changes
  useEffect(() => {
    if (initialType) {
      setType(initialType);
    }
  }, [initialType]);

  // Determine category options strictly based on Type
  const currentCategoryList = React.useMemo(() => {
    switch (type) {
      case 'Income':
        return categories.incomeCategories;
      case 'Expense':
        return categories.expenseCategories;
      case 'Savings':
        return categories.savingsCategories;
      case 'Emergency Fund':
        return categories.emergencyFundCategories;
      case 'Lent & Borrowed':
        return categories.lentBorrowedCategories;
      default:
        return [];
    }
  }, [type, categories]);

  // Reset or set default category when type or category list changes
  useEffect(() => {
    if (currentCategoryList.length > 0) {
      if (!currentCategoryList.includes(category)) {
        setCategory(currentCategoryList[0]);
      }
    } else {
      setCategory('');
    }
    setErrors({});
  }, [type, currentCategoryList]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!date) {
      newErrors.date = 'Date is required.';
    }

    if (!type) {
      newErrors.type = 'Transaction type is required.';
    }

    const finalCat = category === '__custom__' ? customCategory.trim() : category.trim();
    if (!finalCat) {
      newErrors.category = 'Category is required.';
    }

    const numAmount = parseFloat(amount);
    if (!amount || isNaN(numAmount)) {
      newErrors.amount = 'Valid numeric amount is required.';
    } else if (numAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero (₹).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);

    if (!validate()) {
      return;
    }

    const finalCategory = category === '__custom__' ? customCategory.trim() : category.trim();
    const numericAmount = parseFloat(amount);

    setIsSubmitting(true);
    try {
      await onSave({
        date,
        type,
        category: finalCategory,
        amount: numericAmount,
        description: description.trim(),
      });

      // Show success feedback
      setSuccessMessage(`Recorded ₹${numericAmount.toLocaleString('en-IN')} as ${type}`);

      // Clear form
      setAmount('');
      setDescription('');
      setCustomCategory('');
      setDate(getTodayDateString());
      setErrors({});

      if (onSuccessCallback) {
        onSuccessCallback();
      }

      // Hide success message after 4 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to record transaction. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeConfig: {
    [key in TransactionType]: { label: string; icon: React.ReactNode; activeColor: string };
  } = {
    Income: {
      label: 'Income',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
      activeColor: 'bg-emerald-600 text-white shadow-xs',
    },
    Expense: {
      label: 'Expense',
      icon: <TrendingDown className="w-3.5 h-3.5" />,
      activeColor: 'bg-rose-600 text-white shadow-xs',
    },
    Savings: {
      label: 'Savings',
      icon: <PiggyBank className="w-3.5 h-3.5" />,
      activeColor: 'bg-blue-600 text-white shadow-xs',
    },
    'Emergency Fund': {
      label: 'Emergency',
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      activeColor: 'bg-amber-500 text-white shadow-xs',
    },
    'Lent & Borrowed': {
      label: 'Lent/Borrow',
      icon: <ArrowLeftRight className="w-3.5 h-3.5" />,
      activeColor: 'bg-purple-600 text-white shadow-xs',
    },
  };

  return (
    <div
      id="add-transaction-form-card"
      className="bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Add Transaction
          </h2>
          {sheetUrl ? (
            <a
              href={sheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline transition-colors"
              title="Open connected Google Sheet in new tab"
            >
              <span>Google Sheets</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">
              Google Sheets
            </span>
          )}
        </div>

        {successMessage && (
          <div
            id="form-success-banner"
            className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errors.form && (
          <div
            id="form-error-banner"
            className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-medium"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errors.form}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 1. Transaction Type Selector */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1 tracking-wider">
              Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 p-1 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              {(Object.keys(typeConfig) as TransactionType[]).map((t) => {
                const isSelected = type === t;
                return (
                  <button
                    type="button"
                    key={t}
                    id={`type-btn-${t.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => setType(t)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? typeConfig[t].activeColor
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="mb-0.5">{typeConfig[t].icon}</div>
                    <span className="truncate w-full text-center text-[10px]">
                      {typeConfig[t].label}
                    </span>
                  </button>
                );
              })}
            </div>
            {errors.type && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">{errors.type}</p>}
          </div>

          {/* 2. Amount Input (INR) */}
          <div>
            <label
              htmlFor="tx-amount"
              className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1 tracking-wider"
            >
              Amount (INR ₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
              <input
                type="number"
                step="any"
                min="0"
                id="tx-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="₹ 0.00"
                className={`w-full pl-8 pr-3 py-2 bg-slate-50/70 dark:bg-slate-800 border rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  errors.amount ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            {errors.amount && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">{errors.amount}</p>}
          </div>

          {/* 3. Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="tx-category"
                className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block tracking-wider"
              >
                Category <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {type === 'Income' ? 'Col A' : type === 'Expense' ? 'Col B' : 'Spreadsheet'}
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`w-full pl-8 pr-8 py-2 bg-slate-50/70 dark:bg-slate-800 border rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer ${
                  errors.category ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {currentCategoryList.length === 0 && (
                  <option value="" className="text-slate-400">No categories found</option>
                )}
                {currentCategoryList.map((cat) => (
                  <option key={cat} value={cat} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800">
                    {cat}
                  </option>
                ))}
                <option value="__custom__" className="text-indigo-600 dark:text-indigo-400 font-semibold bg-white dark:bg-slate-800">
                  + Other / Custom Category...
                </option>
              </select>
            </div>

            {category === '__custom__' && (
              <div className="mt-2">
                <input
                  type="text"
                  id="tx-custom-category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter category name..."
                  className="w-full px-3 py-2 bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {errors.category && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">{errors.category}</p>}
          </div>

          {/* 4. Date Picker */}
          <div>
            <label
              htmlFor="tx-date"
              className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1 tracking-wider"
            >
              Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <input
                type="date"
                id="tx-date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 bg-slate-50/70 dark:bg-slate-800 border rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  errors.date ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                }`}
              />
            </div>
            {errors.date && <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-medium">{errors.date}</p>}
          </div>

          {/* 5. Description */}
          <div>
            <label
              htmlFor="tx-description"
              className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1 tracking-wider"
            >
              Description <span className="text-slate-400 dark:text-slate-500 font-normal lowercase">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 pt-2 pointer-events-none text-slate-400 dark:text-slate-500">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                id="tx-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Weekly Supermarket Trip"
                className="w-full pl-8 pr-3 py-2 bg-slate-50/70 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* 6. Submit Button */}
          <button
            type="submit"
            id="btn-save-transaction"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold py-3 rounded-lg text-xs mt-2 shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Saving to Google Sheets...</span>
              </>
            ) : (
              <span>Save Transaction</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

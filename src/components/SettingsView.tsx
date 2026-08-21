import React, { useState } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  LogOut,
  Plus,
  CheckCircle2,
  ExternalLink,
  IndianRupee,
  Database,
  Layers,
  Loader2,
  Sun,
  Moon,
  Laptop,
  Lock,
  KeyRound,
  Shield,
} from 'lucide-react';
import { CategoryData, SpreadsheetInfo, ThemeMode } from '../types';
import { SecurityPinModal, PinModalMode } from './SecurityPinModal';
import { hasSecurityPinSet } from '../utils/security';

interface SettingsViewProps {
  sheetInfo: SpreadsheetInfo | null;
  categories: CategoryData;
  userEmail?: string | null;
  userName?: string | null;
  userPhoto?: string | null;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onRefresh: () => Promise<void>;
  onAddCategory: (type: 'Income' | 'Expense', categoryName: string) => Promise<void>;
  onSignOut: () => Promise<void>;
  isRefreshing?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  sheetInfo,
  categories: _categories,
  userEmail,
  userName,
  userPhoto,
  currentTheme,
  onThemeChange,
  onRefresh,
  onAddCategory,
  onSignOut,
  isRefreshing = false,
}) => {
  const [newCatType, setNewCatType] = useState<'Income' | 'Expense'>('Expense');
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [catSuccess, setCatSuccess] = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<PinModalMode>('change');

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsAddingCat(true);
    setCatSuccess(null);
    setCatError(null);

    try {
      await onAddCategory(newCatType, newCatName.trim());
      setCatSuccess(`Successfully created "${newCatName.trim()}" in ${newCatType} Categories directly in your Google Sheet.`);
      setNewCatName('');
      setTimeout(() => setCatSuccess(null), 5000);
    } catch (err: any) {
      setCatError(err.message || 'Failed to add category to Google Sheets.');
    } finally {
      setIsAddingCat(false);
    }
  };

  return (
    <div id="settings-view" className="space-y-5 max-w-4xl mx-auto pb-6">
      {/* 1. Appearance / Theme Option (Light, Dark, System Default) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="mb-4">
          <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500" />
            Appearance & Theme
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            Choose your preferred interface theme across all devices
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light Theme */}
          <button
            type="button"
            id="theme-option-light"
            onClick={() => onThemeChange('light')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              currentTheme === 'light'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              {currentTheme === 'light' && (
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Light Mode</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Crisp and bright workspace
              </div>
            </div>
          </button>

          {/* Dark Theme */}
          <button
            type="button"
            id="theme-option-dark"
            onClick={() => onThemeChange('dark')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              currentTheme === 'dark'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-200 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              {currentTheme === 'dark' && (
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Dark Mode</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                High contrast, eye-safe dark theme
              </div>
            </div>
          </button>

          {/* System Default */}
          <button
            type="button"
            id="theme-option-system"
            onClick={() => onThemeChange('system')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
              currentTheme === 'system'
                ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              {currentTheme === 'system' && (
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">System Default</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Sync automatically with device OS
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Create New Categories Directly in Google Sheet */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Create New Category in Google Sheet
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Add custom categories directly into your Google Spreadsheet (<span className="font-mono font-semibold text-slate-600 dark:text-slate-300">Categories!A:B</span>)
            </p>
          </div>
        </div>

        {catSuccess && (
          <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{catSuccess}</span>
          </div>
        )}

        {catError && (
          <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs font-medium">
            {catError}
          </div>
        )}

        {/* Add Category Form */}
        <form onSubmit={handleAddCategorySubmit} className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Category Type Option */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Category Type
              </label>
              <select
                id="select-category-type"
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as 'Income' | 'Expense')}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Expense">Expense Category (Column B)</option>
                <option value="Income">Income Category (Column A)</option>
              </select>
            </div>

            {/* Category Name Input */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                New Category Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="input-new-category-name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Health Insurance, Freelance Project, Subscriptions..."
                  className="flex-1 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  id="btn-submit-add-category"
                  disabled={isAddingCat || !newCatName.trim()}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {isAddingCat ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  )}
                  <span>Create Category</span>
                </button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
            New categories will instantly append to your Google Sheet and become immediately selectable in transaction forms.
          </p>
        </form>
      </div>

      {/* 3. Goals & Reserves Security PIN */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Goals & Reserves Security Lock
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Protects sensitive balances and reveals amounts only after entering your 4-digit PIN
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-settings-change-pin"
              onClick={() => {
                setPinModalMode('change');
                setIsPinModalOpen(true);
              }}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change PIN</span>
            </button>

            <button
              type="button"
              id="btn-settings-set-pin"
              onClick={() => {
                setPinModalMode('setup');
                setIsPinModalOpen(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Set Custom PIN</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {hasSecurityPinSet() ? 'Custom Security PIN is Active' : 'Default Security PIN (1234)'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Amounts in Goals are automatically masked upon navigating away from the protected view.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Google Spreadsheet Connection Status */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Connected Google Spreadsheet
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">Spreadsheet-backed persistent data</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-settings-sync-now"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>

            {sheetInfo?.url && (
              <a
                href={sheetInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <span>Open in Sheets</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Spreadsheet Name:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">{sheetInfo?.name || 'FINVEXA - Finance Tracker'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Category Source:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">Categories!A:B (A=Income, B=Expense)</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-500 dark:text-slate-400">Transactions Source:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">Transactions!A:E</span>
          </div>
          {sheetInfo?.id && (
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Spreadsheet ID:</span>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[200px] sm:max-w-md">
                {sheetInfo.id}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 4. App Info & Currency Settings */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-4 flex items-center gap-2">
          <IndianRupee className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Application & Currency
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Base Currency</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
              <span>Indian Rupee (₹)</span>
              <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold rounded-md border border-indigo-200 dark:border-indigo-800">
                INR
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Indian numbering format (e.g. ₹1,50,000) for all transactions and charts.
            </p>
          </div>

          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Storage Architecture</div>
            <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Google Sheets REST API</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Direct cloud-backed persistent database stored safely in your personal Google Drive.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Connected Account & Sign Out */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          {userPhoto ? (
            <img
              src={userPhoto}
              alt="User profile"
              className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-sm">
              {userName ? userName[0].toUpperCase() : 'U'}
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-white">{userName || 'Google Account'}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{userEmail || 'Connected with Google Sheets'}</div>
          </div>
        </div>

        <button
          type="button"
          id="btn-sign-out"
          onClick={onSignOut}
          className="px-4 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Security PIN Modal */}
      <SecurityPinModal
        isOpen={isPinModalOpen}
        initialMode={pinModalMode}
        onClose={() => setIsPinModalOpen(false)}
        onSuccessUnlock={() => {}}
      />
    </div>
  );
};

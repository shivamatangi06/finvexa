/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LogOut,
  Plus,
  CheckCircle2,
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
  Target,
  PiggyBank,
  ShieldCheck,
  Check,
  TrendingUp,
} from 'lucide-react';
import { CategoryData, SpreadsheetInfo, ThemeMode } from '../types';
import { hasSecurityPinSet } from '../utils/security';
import {
  getSavingsTarget,
  setSavingsTarget,
  getEmergencyFundTarget,
  setEmergencyFundTarget,
} from '../utils/targets';
import { formatINR } from '../utils/formatters';

interface SettingsViewProps {
  sheetInfo?: SpreadsheetInfo | null;
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
  isUnlocked?: boolean;
  onOpenUnlockModal?: () => void;
  onOpenChangePinModal?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  sheetInfo: _sheetInfo,
  categories: _categories,
  userEmail,
  userName,
  userPhoto,
  currentTheme,
  onThemeChange,
  onRefresh: _onRefresh,
  onAddCategory,
  onSignOut,
  isRefreshing: _isRefreshing = false,
  isUnlocked = false,
  onOpenUnlockModal,
  onOpenChangePinModal,
}) => {
  // Category creation state
  const [newCatType, setNewCatType] = useState<'Income' | 'Expense'>('Expense');
  const [newCatName, setNewCatName] = useState('');
  const [isAddingCat, setIsAddingCat] = useState(false);
  const [catSuccess, setCatSuccess] = useState<string | null>(null);
  const [catError, setCatError] = useState<string | null>(null);

  // Targets state & target values
  const [savingsInput, setSavingsInput] = useState<string>(() => getSavingsTarget().toString());
  const [emergencyInput, setEmergencyInput] = useState<string>(() => getEmergencyFundTarget().toString());
  const [targetSuccess, setTargetSuccess] = useState<string | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);

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

  const handleSaveTargetsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSavings = parseFloat(savingsInput);
    const parsedEmergency = parseFloat(emergencyInput);

    if (isNaN(parsedSavings) || parsedSavings <= 0) {
      setTargetError('Savings target must be a valid positive amount.');
      return;
    }
    if (isNaN(parsedEmergency) || parsedEmergency <= 0) {
      setTargetError('Emergency fund target must be a valid positive amount.');
      return;
    }

    setSavingsTarget(parsedSavings);
    setEmergencyFundTarget(parsedEmergency);
    setTargetError(null);
    setTargetSuccess('Financial targets saved successfully! Goals and progress percentages updated.');
    setTimeout(() => setTargetSuccess(null), 4000);
  };

  const parsedSavingsNum = parseFloat(savingsInput) || 0;
  const parsedEmergencyNum = parseFloat(emergencyInput) || 0;
  const combinedTargetNum = parsedSavingsNum + parsedEmergencyNum;

  const savingsPresets = [50000, 100000, 200000, 500000, 1000000];
  const emergencyPresets = [25000, 50000, 100000, 200000, 300000];

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
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Sun className="w-4 h-4" />
              </div>
              {currentTheme === 'light' && (
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Light Theme</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Clean, high contrast for daylight
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
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              {currentTheme === 'dark' && (
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Dark Theme</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Deep navy, comfortable in low light
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

      {/* 2. Financial Targets Configuration (Protected by 4-Digit PIN Security Lock) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Financial Targets Configuration
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Set target goals for Savings & Emergency Fund to track progress in Goals view
            </p>
          </div>
        </div>

        {targetSuccess && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2 font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{targetSuccess}</span>
          </div>
        )}

        {targetError && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium animate-fadeIn">
            {targetError}
          </div>
        )}

        {/* If Locked: Display Protected Locked Card centered */}
        {!isUnlocked ? (
          <div className="p-6 sm:p-8 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center text-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Financial Targets are Protected by PIN Lock
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Unlock with your 4-digit security PIN to configure Savings & Emergency Fund targets.
              </div>
            </div>

            <button
              type="button"
              id="btn-settings-unlock-targets"
              onClick={onOpenUnlockModal}
              className="mt-1 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Unlock to Edit Targets</span>
            </button>
          </div>
        ) : (
          /* If Unlocked: Display Full Target Configuration Form */
          <form onSubmit={handleSaveTargetsSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Savings Target */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="settings-savings-target-input" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <PiggyBank className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Savings & Investment Target</span>
                    </label>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                      {formatINR(parsedSavingsNum)}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 dark:text-slate-500">₹</span>
                    <input
                      type="number"
                      id="settings-savings-target-input"
                      value={savingsInput}
                      onChange={(e) => {
                        setSavingsInput(e.target.value);
                        setTargetError(null);
                      }}
                      min="1000"
                      step="1000"
                      placeholder="100000"
                      className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {savingsPresets.map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setSavingsInput(amt.toString())}
                        className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                          parsedSavingsNum === amt
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {formatINR(amt)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Emergency Fund Target */}
              <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="settings-emergency-target-input" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Emergency Fund Target</span>
                    </label>
                    <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                      {formatINR(parsedEmergencyNum)}
                    </span>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 dark:text-slate-500">₹</span>
                    <input
                      type="number"
                      id="settings-emergency-target-input"
                      value={emergencyInput}
                      onChange={(e) => {
                        setEmergencyInput(e.target.value);
                        setTargetError(null);
                      }}
                      min="1000"
                      step="1000"
                      placeholder="50000"
                      className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {emergencyPresets.map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setEmergencyInput(amt.toString())}
                        className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                          parsedEmergencyNum === amt
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                        }`}
                      >
                        {formatINR(amt)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Combined Capital Preserved Target Preview */}
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-indigo-900 dark:text-indigo-200">Combined Capital Preserved Target</span>
                  <p className="text-[11px] text-indigo-600/80 dark:text-indigo-400/80">Savings Target + Emergency Fund Target</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-base font-black text-indigo-700 dark:text-indigo-300 font-mono">
                  {formatINR(combinedTargetNum)}
                </div>
                <button
                  type="submit"
                  id="btn-save-settings-targets"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Save Targets</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* 3. Create New Category in Google Sheet (Responsive, perfectly aligned) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Create New Category in Google Sheet
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Add custom categories directly into your Google Spreadsheet for Expenses or Income
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

        {/* Add Category Form - Fully responsive layout preventing overflow */}
        <form onSubmit={handleAddCategorySubmit} className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
            {/* Category Type Option */}
            <div className="md:col-span-4">
              <label htmlFor="select-category-type" className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Category Type
              </label>
              <select
                id="select-category-type"
                value={newCatType}
                onChange={(e) => setNewCatType(e.target.value as 'Income' | 'Expense')}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Expense">Expenses Category</option>
                <option value="Income">Income Category</option>
              </select>
            </div>

            {/* Category Name Input */}
            <div className="md:col-span-5">
              <label htmlFor="input-new-category-name" className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                New Category Name
              </label>
              <input
                type="text"
                id="input-new-category-name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Health Insurance, Subscriptions..."
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Create Category Submit Button */}
            <div className="md:col-span-3">
              <button
                type="submit"
                id="btn-submit-add-category"
                disabled={isAddingCat || !newCatName.trim()}
                className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
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

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            New categories will instantly append to your Google Sheet and become immediately selectable in transaction forms.
          </p>
        </form>
      </div>

      {/* 4. Goals & Reserves Security PIN Management */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 md:p-6 shadow-xs border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Goals & Reserves Security Lock
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
              Protects sensitive balances and targets; reveals data only after entering your 4-digit PIN
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-settings-change-pin"
              onClick={onOpenChangePinModal}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change PIN</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {hasSecurityPinSet() ? 'Custom Security PIN is Active' : 'Default Security PIN (1234)'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Amounts and targets are automatically masked upon navigating away from the protected view.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. App Info & Currency Settings */}
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

      {/* 6. Connected Account & Sign Out */}
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
    </div>
  );
};

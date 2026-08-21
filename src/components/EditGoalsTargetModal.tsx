/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Target, PiggyBank, ShieldCheck, Check, X, TrendingUp } from 'lucide-react';
import { formatINR } from '../utils/formatters';

interface EditGoalsTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSavingsTarget: number;
  currentEmergencyTarget: number;
  onSaveTargets: (newSavingsTarget: number, newEmergencyTarget: number) => void;
}

export const EditGoalsTargetModal: React.FC<EditGoalsTargetModalProps> = ({
  isOpen,
  onClose,
  currentSavingsTarget,
  currentEmergencyTarget,
  onSaveTargets,
}) => {
  const [savingsInput, setSavingsInput] = useState(currentSavingsTarget.toString());
  const [emergencyInput, setEmergencyInput] = useState(currentEmergencyTarget.toString());
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsedSavings = parseFloat(savingsInput) || 0;
  const parsedEmergency = parseFloat(emergencyInput) || 0;
  const combinedTarget = parsedSavings + parsedEmergency;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedSavings <= 0) {
      setError('Savings target must be greater than ₹0');
      return;
    }
    if (parsedEmergency <= 0) {
      setError('Emergency fund target must be greater than ₹0');
      return;
    }

    onSaveTargets(parsedSavings, parsedEmergency);
    onClose();
  };

  const savingsPresets = [50000, 100000, 200000, 500000, 1000000];
  const emergencyPresets = [25000, 50000, 100000, 200000, 300000];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="edit-goals-target-modal"
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative transition-colors"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Configure Financial Targets</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set your target milestones for Savings & Emergency Fund
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          {/* 1. Savings Target */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Savings & Investment Target</span>
              </label>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">
                {formatINR(parsedSavings)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 dark:text-slate-500">₹</span>
              <input
                type="number"
                id="input-savings-target"
                value={savingsInput}
                onChange={(e) => {
                  setSavingsInput(e.target.value);
                  setError(null);
                }}
                min="1000"
                step="1000"
                placeholder="100000"
                className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {savingsPresets.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setSavingsInput(amt.toString())}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                    parsedSavings === amt
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  {formatINR(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Emergency Fund Target */}
          <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Emergency Fund Target</span>
              </label>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono">
                {formatINR(parsedEmergency)}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 dark:text-slate-500">₹</span>
              <input
                type="number"
                id="input-emergency-target"
                value={emergencyInput}
                onChange={(e) => {
                  setEmergencyInput(e.target.value);
                  setError(null);
                }}
                min="1000"
                step="1000"
                placeholder="50000"
                className="w-full pl-7 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {emergencyPresets.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setEmergencyInput(amt.toString())}
                  className={`px-2 py-1 text-[11px] font-semibold rounded-md border transition-colors cursor-pointer ${
                    parsedEmergency === amt
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                  }`}
                >
                  {formatINR(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Combined Capital Preserved Target Summary */}
          <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <div>
                <span className="font-bold text-indigo-900 dark:text-indigo-200">Combined Capital Preserved Target</span>
                <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80">Savings + Emergency Fund</p>
              </div>
            </div>
            <div className="text-sm font-black text-indigo-700 dark:text-indigo-300 font-mono">
              {formatINR(combinedTarget)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-goals-targets"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Targets</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

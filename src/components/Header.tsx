import React from 'react';
import {
  RefreshCw,
  Settings,
  CheckCircle2,
  LayoutDashboard,
  Target,
} from 'lucide-react';
import { SpreadsheetInfo, AppViewTab } from '../types';
import { formatINR } from '../utils/formatters';

interface HeaderProps {
  sheetInfo: SpreadsheetInfo | null;
  netBalance?: number;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
  onOpenSettings: () => void;
  userEmail?: string | null;
  userPhoto?: string | null;
  activeDesktopTab?: AppViewTab;
  onTabChange?: (tab: AppViewTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  sheetInfo: _sheetInfo,
  netBalance,
  onRefresh,
  isRefreshing,
  onOpenSettings,
  userEmail,
  userPhoto,
  activeDesktopTab = 'dashboard',
  onTabChange,
}) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 h-9 w-9 rounded-xl flex items-center justify-center shadow-xs shrink-0 text-white">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                FINVEXA
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Live Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[160px] sm:max-w-xs font-semibold tracking-wide">
              Track. Save. Grow.
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs (Dashboard & Goals) */}
        {onTabChange && (
          <nav className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              id="desktop-tab-dashboard"
              onClick={() => onTabChange('dashboard')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeDesktopTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
            <button
              type="button"
              id="desktop-tab-goals"
              onClick={() => onTabChange('goals')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeDesktopTab === 'goals'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Target className="w-4 h-4" />
              <span>Goals</span>
            </button>
          </nav>
        )}

        {/* Right: Balance & Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {typeof netBalance === 'number' && (
            <div className="hidden lg:flex flex-col items-end pr-3 border-r border-slate-200 dark:border-slate-800">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">
                Live Balance
              </span>
              <span className={`text-base font-extrabold ${netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatINR(netBalance)}
              </span>
            </div>
          )}

          {/* Sync Button */}
          <button
            type="button"
            id="btn-header-refresh"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Sync with Google Sheets"
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 bg-slate-50 dark:bg-slate-800/80 hover:bg-indigo-50/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-500 dark:text-slate-400'}`}
            />
            <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync'}</span>
          </button>

          {/* Settings Trigger */}
          <button
            type="button"
            id="btn-header-settings"
            onClick={onOpenSettings}
            title="Open Settings"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>

          {/* User Avatar */}
          {userPhoto ? (
            <img
              src={userPhoto}
              alt="Profile"
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {userEmail ? userEmail[0].toUpperCase() : 'U'}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

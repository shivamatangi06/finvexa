/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebase';
import {
  findOrCreateFinanceSpreadsheet,
  readCategories,
  readTransactions,
  appendTransaction,
  addCategoryToSheet,
  deleteTransactionRow,
  deleteTransactionsBatch,
} from './services/sheets';
import {
  Transaction,
  TransactionType,
  CategoryData,
  DashboardStats,
  SpreadsheetInfo,
  MobileTab,
  AppViewTab,
  ThemeMode,
} from './types';
import {
  calculateDashboardStats,
  calculateCurrentMonthExpenses,
} from './utils/calculations';
import {
  formatINR,
  getCurrentMonthKey,
  formatMonthYear,
} from './utils/formatters';
import { getInitialTheme, applyTheme } from './utils/theme';

import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { DashboardMonthNav } from './components/DashboardMonthNav';
import { AddTransactionForm } from './components/AddTransactionForm';
import { ExpensePieChart } from './components/ExpensePieChart';
import { TrendLineChart } from './components/TrendLineChart';
import { RecentActivity } from './components/RecentActivity';
import { GoalsView } from './components/GoalsView';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SettingsView } from './components/SettingsView';
import { AuthScreen } from './components/AuthScreen';
import {
  Plus,
  Minus,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  X,
  Wallet,
  Activity,
} from 'lucide-react';

export default function App() {
  // Theme State (Light / Dark / System Default)
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(currentTheme);

    // If system theme, listen to OS theme change events
    if (currentTheme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        applyTheme('system');
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [currentTheme]);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setCurrentTheme(newTheme);
    applyTheme(newTheme);
  };

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Spreadsheet Data State
  const [sheetInfo, setSheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [categories, setCategories] = useState<CategoryData>({
    incomeCategories: [],
    expenseCategories: [],
    savingsCategories: [],
    emergencyFundCategories: [],
    lentBorrowedCategories: [],
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Navigation & View State
  const [activeDesktopTab, setActiveDesktopTab] = useState<AppViewTab>('dashboard');
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('home');
  const [selectedDashboardMonth, setSelectedDashboardMonth] = useState<string>(getCurrentMonthKey());
  const [preSelectedType, setPreSelectedType] = useState<TransactionType>('Expense');
  const [isDesktopSettingsOpen, setIsDesktopSettingsOpen] = useState<boolean>(false);

  // Initialize Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, cachedToken) => {
        setCurrentUser(user);
        setToken(cachedToken);
        setIsAuthLoading(false);
      },
      () => {
        setCurrentUser(null);
        setToken(null);
        setIsAuthLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch / Sync Spreadsheet Data
  const loadData = useCallback(
    async (accessToken: string, showRefreshSpinner = false) => {
      if (showRefreshSpinner) {
        setIsRefreshing(true);
      } else {
        setIsLoadingData(true);
      }
      setErrorMessage(null);

      try {
        // 1. Locate or initialize the Personal Finance Tracker spreadsheet
        const info = await findOrCreateFinanceSpreadsheet(accessToken);
        setSheetInfo(info);

        // 2. Read dynamic Categories
        const catData = await readCategories(accessToken, info.id);
        setCategories(catData);

        // 3. Read Transactions (Transactions!A2:E)
        const txList = await readTransactions(accessToken, info.id);
        setTransactions(txList);
      } catch (err: any) {
        console.error('Error loading finance data:', err);
        setErrorMessage(err.message || 'Failed to sync with your Google Spreadsheet.');
      } finally {
        setIsLoadingData(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  // Load spreadsheet data when token becomes available
  useEffect(() => {
    if (token) {
      loadData(token);
    }
  }, [token, loadData]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const authResult = await googleSignIn();
      if (authResult) {
        setCurrentUser(authResult.user);
        setToken(authResult.accessToken);
        await loadData(authResult.accessToken);
      }
    } catch (err: any) {
      console.error('Sign-in error:', err);
      setAuthError(err.message || 'Sign in failed. Please grant the requested spreadsheet permissions.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    await logout();
    setCurrentUser(null);
    setToken(null);
    setSheetInfo(null);
    setTransactions([]);
    setIsDesktopSettingsOpen(false);
    setActiveMobileTab('home');
    setActiveDesktopTab('dashboard');
  };

  // Handle Manual Refresh
  const handleManualRefresh = async () => {
    const currentToken = token || getAccessToken();
    if (currentToken) {
      await loadData(currentToken, true);
    }
  };

  // Handle Save Transaction
  const handleSaveTransaction = async (newTx: {
    date: string;
    type: TransactionType;
    category: string;
    amount: number;
    description: string;
  }) => {
    const currentToken = token || getAccessToken();
    if (!currentToken || !sheetInfo) {
      throw new Error('Google Spreadsheet connection is unavailable. Please sign in again.');
    }

    await appendTransaction(currentToken, sheetInfo.id, newTx);
    await loadData(currentToken, true);

    if (activeMobileTab === 'add') {
      setActiveMobileTab('home');
    }
  };

  // Handle Add Category to Sheet
  const handleAddCategory = async (type: 'Income' | 'Expense', categoryName: string) => {
    const currentToken = token || getAccessToken();
    if (!currentToken || !sheetInfo) {
      throw new Error('Google Spreadsheet connection is unavailable.');
    }

    await addCategoryToSheet(currentToken, sheetInfo.id, type, categoryName);
    const updatedCats = await readCategories(currentToken, sheetInfo.id);
    setCategories(updatedCats);
  };

  // Handle Delete Single Transaction
  const handleDeleteTransaction = async (rowIndex: number) => {
    const currentToken = token || getAccessToken();
    if (!currentToken || !sheetInfo) {
      throw new Error('Google Spreadsheet connection is unavailable.');
    }

    await deleteTransactionRow(currentToken, sheetInfo.id, rowIndex);
    await loadData(currentToken, true);
  };

  // Handle Delete Batch Transactions
  const handleDeleteTransactionsBatch = async (rowIndices: number[]) => {
    const currentToken = token || getAccessToken();
    if (!currentToken || !sheetInfo) {
      throw new Error('Google Spreadsheet connection is unavailable.');
    }

    await deleteTransactionsBatch(currentToken, sheetInfo.id, rowIndices);
    await loadData(currentToken, true);
  };

  // Quick Action Handlers (+ Income & − Expense)
  const handleOpenAddIncome = () => {
    setPreSelectedType('Income');
    setActiveMobileTab('add');
  };

  const handleOpenAddExpense = () => {
    setPreSelectedType('Expense');
    setActiveMobileTab('add');
  };

  const handleOpenAddGoal = (type: TransactionType) => {
    setPreSelectedType(type);
    setActiveMobileTab('add');
    setActiveDesktopTab('dashboard');
  };

  // Dashboard Stats scoped to selected month
  const stats: DashboardStats = useMemo(() => {
    return calculateDashboardStats(transactions, selectedDashboardMonth);
  }, [transactions, selectedDashboardMonth]);

  // Overall lifetime net balance for header
  const overallStats: DashboardStats = useMemo(() => {
    return calculateDashboardStats(transactions);
  }, [transactions]);

  // Category Expenses for selected month
  const currentMonthExpenses = useMemo(() => {
    return calculateCurrentMonthExpenses(
      transactions,
      categories.expenseCategories,
      selectedDashboardMonth
    );
  }, [transactions, categories.expenseCategories, selectedDashboardMonth]);

  const monthLabel = formatMonthYear(selectedDashboardMonth);

  // Loading Splash Screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg mb-4 animate-pulse">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Connecting to FINVEXA...
        </p>
      </div>
    );
  }

  // Not Authenticated -> Show Auth Screen
  if (!currentUser || !token) {
    return (
      <AuthScreen
        onSignIn={handleSignIn}
        isLoading={isLoggingIn}
        errorMessage={authError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans antialiased transition-colors duration-200">
      {/* Top Header with Desktop Navigation Tabs */}
      <Header
        sheetInfo={sheetInfo}
        onRefresh={handleManualRefresh}
        isRefreshing={isRefreshing}
        onOpenSettings={() => {
          setIsDesktopSettingsOpen(true);
          setActiveMobileTab('settings');
        }}
        userEmail={currentUser.email}
        userPhoto={currentUser.photoURL}
        netBalance={overallStats.netBalance}
        activeDesktopTab={activeDesktopTab}
        onTabChange={(tab) => setActiveDesktopTab(tab)}
      />

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/60 border-b border-rose-200 dark:border-rose-800 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-medium text-rose-800 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={handleManualRefresh}
              className="px-2 py-0.5 bg-rose-100 dark:bg-rose-900/80 hover:bg-rose-200 dark:hover:bg-rose-900 rounded text-rose-900 dark:text-rose-200 font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-5 lg:p-6 mb-16 md:mb-6 flex flex-col gap-5">
        {/* ========================================================================= */}
        {/* MOBILE VIEW (Screens controlled by mobile bottom navigation)              */}
        {/* ========================================================================= */}
        <div className="md:hidden">
          {/* MOBILE TAB 1: HOME (DASHBOARD) */}
          {activeMobileTab === 'home' && (
            <div className="space-y-4">
              {/* Month Navigation on Mobile */}
              <DashboardMonthNav
                selectedMonth={selectedDashboardMonth}
                onMonthChange={setSelectedDashboardMonth}
              />

              {/* 1. Mobile Net Balance Hero Card */}
              <div className="bg-slate-900 dark:bg-slate-900/90 text-white rounded-2xl p-5 shadow-xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Net Balance
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/30">
                    INR (₹)
                  </span>
                </div>
                <div
                  className={`text-3xl font-extrabold tracking-tight mt-2 ${
                    overallStats.netBalance >= 0 ? 'text-white' : 'text-rose-400'
                  }`}
                >
                  {formatINR(overallStats.netBalance)}
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Overall Wallet Balance Across All Accounts
                </p>
              </div>

              {/* 2. Top Action Buttons (+ Income & − Expense) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  id="mobile-btn-add-income"
                  onClick={handleOpenAddIncome}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>+ Income</span>
                </button>

                <button
                  type="button"
                  id="mobile-btn-add-expense"
                  onClick={handleOpenAddExpense}
                  className="py-3 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Minus className="w-4 h-4 stroke-[2.5]" />
                  <span>− Expense</span>
                </button>
              </div>

              {/* 3. Mobile Income, Expenses & Leftover Balance for Selected Month */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-semibold mb-0.5">
                    <span className="text-[9px] uppercase font-bold">Income</span>
                    <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {formatINR(stats.totalIncome)}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-semibold mb-0.5">
                    <span className="text-[9px] uppercase font-bold">Expenses</span>
                    <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="text-sm font-bold text-rose-600 dark:text-rose-400 truncate">
                    {formatINR(stats.totalExpenses)}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                  <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 font-semibold mb-0.5">
                    <span className="text-[9px] uppercase font-bold">Leftover</span>
                    <Activity className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className={`text-sm font-bold truncate ${stats.leftoverBalance >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {stats.leftoverBalance >= 0 ? '' : '−'}{formatINR(Math.abs(stats.leftoverBalance))}
                  </div>
                </div>
              </div>

              {/* 4. Mobile Expense Breakdown Pie Chart */}
              <ExpensePieChart data={currentMonthExpenses} monthLabel={monthLabel} />

              {/* 5. Mobile Recent Activity Section */}
              <RecentActivity
                transactions={transactions}
                onAddNewClick={() => setActiveMobileTab('add')}
                onDeleteTransaction={handleDeleteTransaction}
                onDeleteTransactionsBatch={handleDeleteTransactionsBatch}
                sheetUrl={sheetInfo?.url}
                selectedMonth={selectedDashboardMonth}
              />
            </div>
          )}

          {/* MOBILE TAB 2: GOALS TAB */}
          {activeMobileTab === 'goals' && (
            <div className="space-y-4">
              <GoalsView
                transactions={transactions}
                onOpenAddGoal={handleOpenAddGoal}
                onDeleteTransaction={handleDeleteTransaction}
                onDeleteTransactionsBatch={handleDeleteTransactionsBatch}
                sheetUrl={sheetInfo?.url}
              />
            </div>
          )}

          {/* MOBILE TAB 3: ADD NEW */}
          {activeMobileTab === 'add' && (
            <div className="space-y-4">
              <AddTransactionForm
                categories={categories}
                initialType={preSelectedType}
                onSave={handleSaveTransaction}
                onSuccessCallback={() => {
                  setActiveMobileTab('home');
                }}
              />
            </div>
          )}

          {/* MOBILE TAB 4: ANALYSIS */}
          {activeMobileTab === 'analysis' && (
            <div className="space-y-4">
              <ExpensePieChart data={currentMonthExpenses} monthLabel={monthLabel} />
              <TrendLineChart
                transactions={transactions}
                selectedMonth={selectedDashboardMonth}
              />
            </div>
          )}

          {/* MOBILE TAB 5: SETTINGS */}
          {activeMobileTab === 'settings' && (
            <SettingsView
              sheetInfo={sheetInfo}
              categories={categories}
              userEmail={currentUser.email}
              userName={currentUser.displayName}
              userPhoto={currentUser.photoURL}
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
              onRefresh={handleManualRefresh}
              onAddCategory={handleAddCategory}
              onSignOut={handleSignOut}
              isRefreshing={isRefreshing}
            />
          )}
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP VIEW (Tabbed: Dashboard & Goals)                                  */}
        {/* ========================================================================= */}
        <div className="hidden md:flex md:flex-col gap-5">
          {activeDesktopTab === 'dashboard' ? (
            <>
              {/* Month Navigation Control Bar */}
              <DashboardMonthNav
                selectedMonth={selectedDashboardMonth}
                onMonthChange={setSelectedDashboardMonth}
              />

              {/* Top Metric Cards: Net Balance, Total Income, Total Expenses, Cash Flow */}
              <SummaryCards stats={stats} monthLabel={monthLabel} />

              {/* Main Grid: Left Charts (2 cols) + Right Add Form (1 col) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Left Area: Charts */}
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <ExpensePieChart data={currentMonthExpenses} monthLabel={monthLabel} />
                  <TrendLineChart
                    transactions={transactions}
                    selectedMonth={selectedDashboardMonth}
                  />
                </div>

                {/* Right/Sidebar Area: Always Available Quick Add Transaction Form */}
                <div className="lg:col-span-1">
                  <AddTransactionForm
                    categories={categories}
                    initialType={preSelectedType}
                    onSave={handleSaveTransaction}
                  />
                </div>
              </div>

              {/* Bottom Area: Full Recent Activity Table */}
              <RecentActivity
                transactions={transactions}
                onDeleteTransaction={handleDeleteTransaction}
                onDeleteTransactionsBatch={handleDeleteTransactionsBatch}
                sheetUrl={sheetInfo?.url}
                selectedMonth={selectedDashboardMonth}
              />
            </>
          ) : (
            /* DESKTOP GOALS VIEW */
            <GoalsView
              transactions={transactions}
              onOpenAddGoal={handleOpenAddGoal}
              onDeleteTransaction={handleDeleteTransaction}
              onDeleteTransactionsBatch={handleDeleteTransactionsBatch}
              sheetUrl={sheetInfo?.url}
            />
          )}
        </div>
      </main>

      {/* Desktop Settings Modal */}
      {isDesktopSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div
            id="desktop-settings-modal"
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative transition-colors"
          >
            <button
              type="button"
              onClick={() => setIsDesktopSettingsOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-6 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Settings & Preferences
            </h2>

            <SettingsView
              sheetInfo={sheetInfo}
              categories={categories}
              userEmail={currentUser.email}
              userName={currentUser.displayName}
              userPhoto={currentUser.photoURL}
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
              onRefresh={handleManualRefresh}
              onAddCategory={handleAddCategory}
              onSignOut={handleSignOut}
              isRefreshing={isRefreshing}
            />
          </div>
        </div>
      )}

      {/* Sticky Mobile Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeMobileTab}
        onTabChange={(tab) => {
          setActiveMobileTab(tab);
          if (tab === 'add') {
            setPreSelectedType('Expense');
          }
        }}
      />
    </div>
  );
}

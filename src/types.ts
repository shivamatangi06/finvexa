export type TransactionType =
  | 'Income'
  | 'Expense'
  | 'Savings'
  | 'Emergency Fund'
  | 'Lent & Borrowed';

export interface Transaction {
  id?: string;
  rowIndex?: number; // 1-based row index in Google Sheet
  date: string; // YYYY-MM-DD
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
}

export interface CategoryData {
  incomeCategories: string[];
  expenseCategories: string[];
  savingsCategories: string[];
  emergencyFundCategories: string[];
  lentBorrowedCategories: string[];
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  emergencyFund: number;
  lentBorrowed: number;
  netBalance: number;
  cashFlow?: number;
  leftoverBalance: number;
}

export interface GoalsStats {
  savings: number;
  emergencyFund: number;
  lentBorrowed: number;
  totalAllocated: number;
}

export interface CategoryExpense {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface TrendDataPoint {
  dateKey: string; // YYYY-MM-DD or YYYY-MM
  displayDate: string;
  income: number;
  expense: number;
}

export type TrendViewMode = 'daily' | 'monthly';

export type GoalsTimeframe = 'month' | 'year' | 'alltime';

export type AppViewTab = 'dashboard' | 'goals';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface SpreadsheetInfo {
  id: string;
  name: string;
  url: string;
  createdTime?: string;
  transactionsCount: number;
}

export type MobileTab = 'home' | 'goals' | 'add' | 'analysis' | 'settings';


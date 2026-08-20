import {
  Transaction,
  DashboardStats,
  GoalsStats,
  GoalsTimeframe,
  CategoryExpense,
  TrendDataPoint,
  TrendViewMode,
} from '../types';
import { getCurrentMonthKey } from './formatters';

// Refined, accessible color palette for expense categories
const CATEGORY_COLORS = [
  '#2563EB', // Blue
  '#DC2626', // Red
  '#059669', // Emerald
  '#D97706', // Amber
  '#7C3AED', // Purple
  '#DB2777', // Pink
  '#0891B2', // Cyan
  '#EA580C', // Orange
  '#4F46E5', // Indigo
  '#65A30D', // Lime
  '#9333EA', // Violet
  '#0D9488', // Teal
  '#BE123C', // Rose
  '#475569', // Slate
];

/**
 * Computes dashboard financial totals:
 * - Total Income = SUM(Amount WHERE Type = 'Income')
 * - Total Expenses = SUM(Amount WHERE Type = 'Expense')
 * - Savings = SUM(Amount WHERE Type = 'Savings')
 * - Emergency Fund = SUM(Amount WHERE Type = 'Emergency Fund')
 * - Lent & Borrowed = SUM(Amount WHERE Type = 'Lent & Borrowed')
 * - Leftover Balance = Total Income - Total Expenses - Savings - Emergency Fund - Lent & Borrowed (for the selected month)
 * - Net Balance = All-time net or monthly leftover balance
 */
export function calculateDashboardStats(
  transactions: Transaction[],
  monthKey?: string
): DashboardStats {
  let totalIncome = 0;
  let totalExpenses = 0;
  let savings = 0;
  let emergencyFund = 0;
  let lentBorrowed = 0;
  let allTimeNetBalance = 0;

  // First calculate all-time net balance
  for (const tx of transactions) {
    const amt = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : 0;
    if (tx.type === 'Income') allTimeNetBalance += amt;
    else if (tx.type === 'Expense') allTimeNetBalance -= amt;
    else if (tx.type === 'Savings') allTimeNetBalance -= amt;
    else if (tx.type === 'Emergency Fund') allTimeNetBalance -= amt;
    else if (tx.type === 'Lent & Borrowed') allTimeNetBalance -= amt;
  }

  // Calculate monthly stats if monthKey provided
  for (const tx of transactions) {
    if (monthKey && (!tx.date || !tx.date.startsWith(monthKey))) {
      continue;
    }
    const amt = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : 0;
    switch (tx.type) {
      case 'Income':
        totalIncome += amt;
        break;
      case 'Expense':
        totalExpenses += amt;
        break;
      case 'Savings':
        savings += amt;
        break;
      case 'Emergency Fund':
        emergencyFund += amt;
        break;
      case 'Lent & Borrowed':
        lentBorrowed += amt;
        break;
    }
  }

  const cashFlow = totalIncome - totalExpenses;
  // Leftover Balance for selected month = Income − Expenses − Savings − Emergency Fund − Lent/Borrowed
  const leftoverBalance = totalIncome - totalExpenses - savings - emergencyFund - lentBorrowed;
  const netBalance = monthKey ? leftoverBalance : allTimeNetBalance;

  return {
    totalIncome,
    totalExpenses,
    savings,
    emergencyFund,
    lentBorrowed,
    netBalance,
    cashFlow,
    leftoverBalance,
  };
}

/**
 * Calculates expense breakdown grouped by Category for a given monthKey (e.g. "2026-08").
 */
export function calculateCurrentMonthExpenses(
  transactions: Transaction[],
  expenseCategoryList: string[],
  monthKey?: string
): CategoryExpense[] {
  const targetMonthKey = monthKey || getCurrentMonthKey();

  const expenseMap = new Map<string, number>();
  let totalMonthExpense = 0;

  // Set of valid expense categories (lowercased for resilient matching)
  const validCategoriesSet = new Set(expenseCategoryList.map((c) => c.trim().toLowerCase()));

  for (const tx of transactions) {
    if (tx.type !== 'Expense') continue;
    if (!tx.date || !tx.date.startsWith(targetMonthKey)) continue;

    const trimmedCat = (tx.category || 'Other Expense').trim();
    const isKnown = validCategoriesSet.size === 0 || validCategoriesSet.has(trimmedCat.toLowerCase());
    const finalCategory = isKnown ? trimmedCat : 'Other Expense';

    const amt = tx.amount > 0 ? tx.amount : 0;
    const current = expenseMap.get(finalCategory) || 0;
    expenseMap.set(finalCategory, current + amt);
    totalMonthExpense += amt;
  }

  if (totalMonthExpense === 0 || expenseMap.size === 0) {
    return [];
  }

  const result: CategoryExpense[] = [];
  let colorIndex = 0;

  // Sort categories by highest amount first
  const sortedEntries = Array.from(expenseMap.entries()).sort((a, b) => b[1] - a[1]);

  for (const [category, amount] of sortedEntries) {
    const percentage = Math.round((amount / totalMonthExpense) * 100);
    result.push({
      category,
      amount,
      percentage,
      color: CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length],
    });
    colorIndex++;
  }

  return result;
}

/**
 * Computes Goals & Reserves financial metrics for a specific timeframe (Month, Year, or All-Time).
 */
export function calculateGoalsStats(
  transactions: Transaction[],
  timeframe: GoalsTimeframe,
  selectedMonthKey: string,
  selectedYearKey: string
): GoalsStats {
  let savings = 0;
  let emergencyFund = 0;
  let lentBorrowed = 0;

  for (const tx of transactions) {
    if (tx.type !== 'Savings' && tx.type !== 'Emergency Fund' && tx.type !== 'Lent & Borrowed') {
      continue;
    }

    if (timeframe === 'month') {
      if (!tx.date || !tx.date.startsWith(selectedMonthKey)) continue;
    } else if (timeframe === 'year') {
      if (!tx.date || !tx.date.startsWith(selectedYearKey)) continue;
    }

    const amt = typeof tx.amount === 'number' && !isNaN(tx.amount) ? tx.amount : 0;
    if (tx.type === 'Savings') {
      savings += amt;
    } else if (tx.type === 'Emergency Fund') {
      emergencyFund += amt;
    } else if (tx.type === 'Lent & Borrowed') {
      lentBorrowed += amt;
    }
  }

  return {
    savings,
    emergencyFund,
    lentBorrowed,
    totalAllocated: savings + emergencyFund,
  };
}

/**
 * Filters transactions that belong to Goals (Savings, Emergency Fund, Lent & Borrowed) for given timeframe.
 */
export function filterGoalsTransactions(
  transactions: Transaction[],
  timeframe: GoalsTimeframe,
  selectedMonthKey: string,
  selectedYearKey: string
): Transaction[] {
  return transactions.filter((tx) => {
    if (tx.type !== 'Savings' && tx.type !== 'Emergency Fund' && tx.type !== 'Lent & Borrowed') {
      return false;
    }
    if (timeframe === 'month') {
      return tx.date && tx.date.startsWith(selectedMonthKey);
    }
    if (timeframe === 'year') {
      return tx.date && tx.date.startsWith(selectedYearKey);
    }
    return true;
  });
}

/**
 * Generates trend series data for Income vs Expense.
 * Supports Daily (YYYY-MM-DD) and Monthly (YYYY-MM) aggregation.
 */
export function calculateTrendData(
  transactions: Transaction[],
  mode: TrendViewMode,
  monthFilter?: string
): TrendDataPoint[] {
  const map = new Map<string, { income: number; expense: number }>();

  for (const tx of transactions) {
    if (!tx.date) continue;
    if (tx.type !== 'Income' && tx.type !== 'Expense') continue;

    if (mode === 'daily' && monthFilter && !tx.date.startsWith(monthFilter)) {
      continue;
    }

    let key = tx.date;
    if (mode === 'monthly') {
      key = tx.date.substring(0, 7); // YYYY-MM
    }

    if (!map.has(key)) {
      map.set(key, { income: 0, expense: 0 });
    }

    const current = map.get(key)!;
    const amt = tx.amount > 0 ? tx.amount : 0;

    if (tx.type === 'Income') {
      current.income += amt;
    } else if (tx.type === 'Expense') {
      current.expense += amt;
    }
  }

  const sortedKeys = Array.from(map.keys()).sort();

  return sortedKeys.map((key) => {
    let displayDate = key;
    if (mode === 'monthly') {
      const [y, m] = key.split('-');
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      displayDate = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
    } else {
      const parts = key.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        displayDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      }
    }

    const item = map.get(key)!;
    return {
      dateKey: key,
      displayDate,
      income: item.income,
      expense: item.expense,
    };
  });
}


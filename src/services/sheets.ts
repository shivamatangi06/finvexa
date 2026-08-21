import { Transaction, TransactionType, CategoryData, SpreadsheetInfo } from '../types';
import { normalizeDateString, formatDateToDDMMYYYY } from '../utils/formatters';

const SHEETS_BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets';
const DRIVE_BASE_URL = 'https://www.googleapis.com/drive/v3';

export const DEFAULT_INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Bonus',
  'Interest',
  'Other Income',
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Food',
  'Groceries',
  'Rent',
  'Electricity',
  'Water',
  'Internet',
  'Transport',
  'Fuel',
  'Shopping',
  'Entertainment',
  'Medical',
  'Education',
  'Bills',
  'Other Expense',
];

export const DEFAULT_SAVINGS_CATEGORIES = [
  'Mutual Funds',
  'Fixed Deposit',
  'Recurring Deposit',
  'Stocks & Equity',
  'Gold & Precious Metals',
  'PPF / EPF',
  'Retirement Fund',
  'Other Savings',
];

export const DEFAULT_EMERGENCY_CATEGORIES = [
  'Bank Liquid Reserve',
  'Emergency High-Yield',
  'Cash at Hand',
  'Medical Contingency',
  'Other Emergency Reserve',
];

export const DEFAULT_LENT_BORROWED_CATEGORIES = [
  'Lent to Friend / Family',
  'Borrowed from Friend / Family',
  'Personal Loan Advance',
  'Loan Repayment Received',
  'Loan Repayment Paid',
  'Other Lent / Borrowed',
];

/**
 * Handles API errors gracefully and formats human-readable messages.
 */
function handleApiError(error: unknown, action: string): Error {
  console.error(`Google API Error during ${action}:`, error);
  if (error instanceof Error) {
    if (error.message.includes('401') || error.message.includes('UNAUTHENTICATED')) {
      return new Error('Your Google session has expired. Please sign in again to continue.');
    }
    if (error.message.includes('403') || error.message.includes('PERMISSION_DENIED')) {
      return new Error('Access denied. Please ensure you have granted spreadsheet permissions.');
    }
    if (error.message.includes('404')) {
      return new Error('Connected Google Spreadsheet was not found. Please check your Google Drive.');
    }
    return error;
  }
  return new Error(`Unable to ${action}. Please check your internet connection and try again.`);
}

/**
 * Searches user's Google Drive for an existing "Personal Finance Tracker" spreadsheet.
 * If none exists, creates a new one with initialized sheets and headers.
 */
export async function findOrCreateFinanceSpreadsheet(accessToken: string): Promise<SpreadsheetInfo> {
  try {
    // 1. Search Google Drive for existing sheet
    const query = encodeURIComponent(
      "(name = 'FINVEXA - Finance Tracker' or name = 'Personal Finance Tracker') and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false"
    );
    const driveSearchUrl = `${DRIVE_BASE_URL}/files?q=${query}&fields=files(id,name,webViewLink,createdTime)&orderBy=modifiedTime desc&pageSize=1`;

    const searchRes = await fetch(driveSearchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!searchRes.ok) {
      const errJson = await searchRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to search Google Drive (HTTP ${searchRes.status})`);
    }

    const searchData = await searchRes.json();
    const existingFile = searchData.files && searchData.files.length > 0 ? searchData.files[0] : null;

    if (existingFile) {
      // Ensure the existing spreadsheet has Transactions and Categories tabs
      await ensureSpreadsheetStructure(accessToken, existingFile.id);
      return {
        id: existingFile.id,
        name: existingFile.name,
        url: existingFile.webViewLink || `https://docs.google.com/spreadsheets/d/${existingFile.id}`,
        createdTime: existingFile.createdTime,
        transactionsCount: 0,
      };
    }

    // 2. Create new spreadsheet if not found
    return await createNewFinanceSpreadsheet(accessToken);
  } catch (error) {
    throw handleApiError(error, 'connecting to your Google Spreadsheet');
  }
}

/**
 * Creates a brand new "Personal Finance Tracker" spreadsheet with Transactions and Categories sheets.
 */
export async function createNewFinanceSpreadsheet(accessToken: string): Promise<SpreadsheetInfo> {
  try {
    const payload = {
      properties: {
        title: 'FINVEXA - Finance Tracker',
      },
      sheets: [
        {
          properties: {
            title: 'Transactions',
            gridProperties: { rowCount: 1000, columnCount: 10, frozenRowCount: 1 },
          },
        },
        {
          properties: {
            title: 'Categories',
            gridProperties: { rowCount: 100, columnCount: 5, frozenRowCount: 1 },
          },
        },
      ],
    };

    const createRes = await fetch(SHEETS_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!createRes.ok) {
      const errJson = await createRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to create spreadsheet (HTTP ${createRes.status})`);
    }

    const createdSheet = await createRes.json();
    const spreadsheetId = createdSheet.spreadsheetId;

    // Seed headers and default starter categories
    await seedInitialData(accessToken, spreadsheetId);

    return {
      id: spreadsheetId,
      name: 'FINVEXA - Finance Tracker',
      url: createdSheet.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      createdTime: new Date().toISOString(),
      transactionsCount: 0,
    };
  } catch (error) {
    throw handleApiError(error, 'creating new Google Spreadsheet');
  }
}

/**
 * Ensures both Transactions and Categories tabs exist in the spreadsheet and have proper headers.
 */
async function ensureSpreadsheetStructure(accessToken: string, spreadsheetId: string): Promise<void> {
  const metaRes = await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}?fields=sheets(properties(sheetId,title))`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!metaRes.ok) {
    const errJson = await metaRes.json().catch(() => ({}));
    throw new Error(errJson.error?.message || 'Could not verify spreadsheet sheets.');
  }

  const metaData = await metaRes.json();
  const sheets = metaData.sheets || [];
  const titles = sheets.map((s: { properties?: { title?: string } }) => s.properties?.title || '');

  const requests: any[] = [];

  if (!titles.includes('Transactions')) {
    requests.push({
      addSheet: {
        properties: {
          title: 'Transactions',
          gridProperties: { frozenRowCount: 1 },
        },
      },
    });
  }

  if (!titles.includes('Categories')) {
    requests.push({
      addSheet: {
        properties: {
          title: 'Categories',
          gridProperties: { frozenRowCount: 1 },
        },
      },
    });
  }

  if (requests.length > 0) {
    await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
  }

  // Check if header row exists in Transactions
  const txHeaderRes = await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values/Transactions!A1:E1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const txHeaderData = await txHeaderRes.json().catch(() => ({}));
  if (!txHeaderData.values || txHeaderData.values.length === 0) {
    await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values/Transactions!A1:E1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [['Date', 'Type', 'Category', 'Amount', 'Description']],
      }),
    });
  }

  // Check if Categories tab has data
  const catRes = await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values/Categories!A1:B20`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const catData = await catRes.json().catch(() => ({}));
  if (!catData.values || catData.values.length === 0) {
    await seedCategories(accessToken, spreadsheetId);
  }
}

/**
 * Seeds initial headers and starter categories into a new spreadsheet.
 */
async function seedInitialData(accessToken: string, spreadsheetId: string): Promise<void> {
  // 1. Transactions Header
  await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values/Transactions!A1:E1?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [['Date', 'Type', 'Category', 'Amount', 'Description']],
    }),
  });

  // 2. Categories Headers and initial values
  await seedCategories(accessToken, spreadsheetId);
}

/**
 * Seeds Categories tab with Column A (Income Categories) and Column B (Expense Categories).
 */
async function seedCategories(accessToken: string, spreadsheetId: string): Promise<void> {
  const maxRows = Math.max(DEFAULT_INCOME_CATEGORIES.length, DEFAULT_EXPENSE_CATEGORIES.length);
  const rows: string[][] = [['Income Categories', 'Expense Categories']];

  for (let i = 0; i < maxRows; i++) {
    const inc = DEFAULT_INCOME_CATEGORIES[i] || '';
    const exp = DEFAULT_EXPENSE_CATEGORIES[i] || '';
    rows.push([inc, exp]);
  }

  await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}/values/Categories!A1:B${rows.length}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: rows }),
  });
}

/**
 * Reads Categories from Categories sheet:
 * Column A: Income Categories (A2:A)
 * Column B: Expense Categories (B2:B)
 */
export async function readCategories(accessToken: string, spreadsheetId: string): Promise<CategoryData> {
  try {
    const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values/Categories!A2:B100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to read categories (HTTP ${res.status})`);
    }

    const data = await res.json();
    const rows = data.values || [];

    const incomeCategories: string[] = [];
    const expenseCategories: string[] = [];

    rows.forEach((row: string[]) => {
      const inc = row[0]?.trim();
      const exp = row[1]?.trim();
      if (inc && !incomeCategories.includes(inc)) incomeCategories.push(inc);
      if (exp && !expenseCategories.includes(exp)) expenseCategories.push(exp);
    });

    return {
      incomeCategories: incomeCategories.length > 0 ? incomeCategories : DEFAULT_INCOME_CATEGORIES,
      expenseCategories: expenseCategories.length > 0 ? expenseCategories : DEFAULT_EXPENSE_CATEGORIES,
      savingsCategories: DEFAULT_SAVINGS_CATEGORIES,
      emergencyFundCategories: DEFAULT_EMERGENCY_CATEGORIES,
      lentBorrowedCategories: DEFAULT_LENT_BORROWED_CATEGORIES,
    };
  } catch (error) {
    throw handleApiError(error, 'reading categories from Google Sheets');
  }
}

/**
 * Reads all transactions from Transactions!A2:E
 */
export async function readTransactions(accessToken: string, spreadsheetId: string): Promise<Transaction[]> {
  try {
    const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values/Transactions!A2:E?valueRenderOption=FORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to read transactions (HTTP ${res.status})`);
    }

    const data = await res.json();
    const rows = data.values || [];

    const transactions: Transaction[] = [];

    rows.forEach((row: string[], index: number) => {
      // Row index is index + 2 (1-based, skipping header row)
      const rowIndex = index + 2;
      const rawDate = row[0] !== undefined ? row[0] : '';
      const date = normalizeDateString(rawDate);
      const type = (row[1]?.trim() || 'Expense') as TransactionType;
      const category = row[2]?.trim() || 'Uncategorized';
      
      // Clean amount: strip currency symbols, commas, whitespace
      const rawAmount = row[3] !== undefined ? String(row[3]).replace(/[₹$,\s]/g, '') : '0';
      const amount = parseFloat(rawAmount);
      const description = row[4]?.trim() || '';

      if (date && !isNaN(amount) && amount > 0) {
        transactions.push({
          id: `tx-${rowIndex}-${date}`,
          rowIndex,
          date,
          type,
          category,
          amount,
          description,
        });
      }
    });

    // Return newest transactions first (sorted by date descending, then row index descending)
    return transactions.sort((a, b) => {
      if (b.date !== a.date) {
        return b.date.localeCompare(a.date);
      }
      return (b.rowIndex || 0) - (a.rowIndex || 0);
    });
  } catch (error) {
    throw handleApiError(error, 'fetching transactions from Google Sheets');
  }
}

/**
 * Appends a new transaction row to Transactions!A:E
 * Columns: Date (DD-MM-YYYY), Type, Category, Amount, Description
 */
export async function appendTransaction(
  accessToken: string,
  spreadsheetId: string,
  transaction: Omit<Transaction, 'id' | 'rowIndex'>
): Promise<void> {
  try {
    const formattedDate = formatDateToDDMMYYYY(transaction.date);
    const rowValues = [
      formattedDate,
      transaction.type,
      transaction.category,
      transaction.amount,
      transaction.description || '',
    ];

    const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values/Transactions!A:E:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to record transaction (HTTP ${res.status})`);
    }
  } catch (error) {
    throw handleApiError(error, 'saving transaction to Google Sheets');
  }
}

/**
 * Modifies an existing transaction row in Google Sheets (Transactions!A{rowIndex}:E{rowIndex})
 * Columns: Date (DD-MM-YYYY), Type, Category, Amount, Description
 */
export async function updateTransactionRow(
  accessToken: string,
  spreadsheetId: string,
  rowIndex: number,
  transaction: Omit<Transaction, 'id' | 'rowIndex'>
): Promise<void> {
  try {
    const formattedDate = formatDateToDDMMYYYY(transaction.date);
    const rowValues = [
      formattedDate,
      transaction.type,
      transaction.category,
      transaction.amount,
      transaction.description || '',
    ];

    const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values/Transactions!A${rowIndex}:E${rowIndex}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Failed to update transaction in Google Sheet (HTTP ${res.status})`);
    }
  } catch (error) {
    throw handleApiError(error, 'modifying transaction in Google Sheets');
  }
}

/**
 * Adds a new Category to Google Sheets Categories tab:
 * Column A: Income Category
 * Column B: Expense Category
 */
export async function addCategoryToSheet(
  accessToken: string,
  spreadsheetId: string,
  type: 'Income' | 'Expense',
  categoryName: string
): Promise<void> {
  try {
    const trimmed = categoryName.trim();
    if (!trimmed) return;

    // Read current categories to find first available row
    const url = `${SHEETS_BASE_URL}/${spreadsheetId}/values/Categories!A2:B100`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    const rows: string[][] = data.values || [];

    const colIndex = type === 'Income' ? 0 : 1;
    const colLetter = type === 'Income' ? 'A' : 'B';

    // Find next empty row in that column
    let targetRow = 2;
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i] || !rows[i][colIndex] || rows[i][colIndex].trim() === '') {
        targetRow = i + 2;
        break;
      }
      targetRow = i + 3;
    }

    const updateUrl = `${SHEETS_BASE_URL}/${spreadsheetId}/values/Categories!${colLetter}${targetRow}?valueInputOption=USER_ENTERED`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[trimmed]],
      }),
    });

    if (!updateRes.ok) {
      const errJson = await updateRes.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Failed to update category in Google Sheets.');
    }
  } catch (error) {
    throw handleApiError(error, 'adding category to Google Sheets');
  }
}

/**
 * Deletes a single transaction row from Transactions tab.
 */
export async function deleteTransactionRow(
  accessToken: string,
  spreadsheetId: string,
  rowIndex: number
): Promise<void> {
  return deleteTransactionsBatch(accessToken, spreadsheetId, [rowIndex]);
}

/**
 * Bulk deletes multiple transaction rows from Transactions tab.
 * Uses batchUpdate with descending row indexes to prevent row shift misalignment.
 */
export async function deleteTransactionsBatch(
  accessToken: string,
  spreadsheetId: string,
  rowIndices: number[]
): Promise<void> {
  if (!rowIndices || rowIndices.length === 0) return;
  try {
    // Get sheetId of "Transactions" sheet
    const metaRes = await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}?fields=sheets(properties(sheetId,title))`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const metaData = await metaRes.json();
    const txSheet = metaData.sheets?.find((s: any) => s.properties?.title === 'Transactions');
    const sheetId = txSheet?.properties?.sheetId ?? 0;

    // Sort row indices descending so deleting high rows first doesn't shift lower row indices
    const sortedIndices = Array.from(new Set(rowIndices)).sort((a, b) => b - a);

    const requests = sortedIndices.map((rowIndex) => ({
      deleteDimension: {
        range: {
          sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex - 1, // 0-indexed, inclusive
          endIndex: rowIndex, // 0-indexed, exclusive
        },
      },
    }));

    const res = await fetch(`${SHEETS_BASE_URL}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || 'Failed to delete transactions from Google Sheet.');
    }
  } catch (error) {
    throw handleApiError(error, 'deleting transaction rows from Google Sheets');
  }
}

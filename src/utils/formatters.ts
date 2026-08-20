/**
 * Formats a numeric value into Indian Rupee format (₹) with Indian digit grouping.
 * e.g., 1500 -> ₹1,500
 *       25000 -> ₹25,000
 *       125000 -> ₹1,25,000
 *       10000000 -> ₹1,00,00,000
 */
export function formatINR(amount: number, includeDecimals = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: includeDecimals && absAmount % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  });

  const formatted = formatter.format(absAmount);
  // Ensure the ₹ symbol has standard spacing if needed, or standard ₹ prefix
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Returns a compact INR representation for tight charts/axis.
 * e.g., 50000 -> ₹50K, 1500000 -> ₹15L, 20000000 -> ₹2Cr
 */
export function formatCompactINR(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₹0';
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}₹${(abs / 10000000).toFixed(1).replace(/\.0$/, '')}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}₹${(abs / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  if (abs >= 1000) {
    return `${sign}₹${(abs / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return `${sign}₹${abs}`;
}

/**
 * Formats a Date object or YYYY-MM-DD string to user-friendly Indian format (e.g. 20 Aug 2026).
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
    const d = new Date(dateString);
    return isNaN(d.getTime())
      ? dateString
      : d.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
  } catch {
    return dateString;
  }
}

/**
 * Gets today's date formatted as YYYY-MM-DD in local time.
 */
export function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets the current month and year string in YYYY-MM format.
 */
export function getCurrentMonthKey(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Gets the readable name for current month, e.g. "August 2026"
 */
export function getCurrentMonthName(): string {
  const today = new Date();
  return today.toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formats a YYYY-MM key into readable string (e.g. "2026-08" -> "August 2026")
 */
export function formatMonthYear(monthKey: string): string {
  if (!monthKey || !monthKey.includes('-')) return monthKey;
  try {
    const [year, month] = monthKey.split('-');
    const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
    return d.toLocaleDateString('en-IN', {
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return monthKey;
  }
}

/**
 * Gets current 4-digit year as string, e.g. "2026"
 */
export function getCurrentYearKey(): string {
  return String(new Date().getFullYear());
}

/**
 * Calculates previous month key (e.g. "2026-08" -> "2026-07", "2026-01" -> "2025-12")
 */
export function getPreviousMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) - 1;
  if (month < 1) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Calculates next month key (e.g. "2026-08" -> "2026-09", "2026-12" -> "2027-01")
 */
export function getNextMonthKey(monthKey: string): string {
  const [yearStr, monthStr] = monthKey.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}


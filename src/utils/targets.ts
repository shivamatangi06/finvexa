/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const SAVINGS_TARGET_KEY = 'finvexa_savings_target';
const EMERGENCY_TARGET_KEY = 'finvexa_emergency_target';

export const DEFAULT_SAVINGS_TARGET = 100000; // ₹1,00,000
export const DEFAULT_EMERGENCY_TARGET = 50000; // ₹50,000

/**
 * Get configured Savings Target (defaults to ₹1,00,000)
 */
export function getSavingsTarget(): number {
  try {
    const val = localStorage.getItem(SAVINGS_TARGET_KEY);
    if (!val) return DEFAULT_SAVINGS_TARGET;
    const num = parseFloat(val);
    return isNaN(num) || num <= 0 ? DEFAULT_SAVINGS_TARGET : num;
  } catch {
    return DEFAULT_SAVINGS_TARGET;
  }
}

/**
 * Set and persist Savings Target
 */
export function setSavingsTarget(amount: number): void {
  try {
    if (amount > 0) {
      localStorage.setItem(SAVINGS_TARGET_KEY, amount.toString());
    }
  } catch (err) {
    console.error('Failed to save savings target', err);
  }
}

/**
 * Get configured Emergency Fund Target (defaults to ₹50,000)
 */
export function getEmergencyFundTarget(): number {
  try {
    const val = localStorage.getItem(EMERGENCY_TARGET_KEY);
    if (!val) return DEFAULT_EMERGENCY_TARGET;
    const num = parseFloat(val);
    return isNaN(num) || num <= 0 ? DEFAULT_EMERGENCY_TARGET : num;
  } catch {
    return DEFAULT_EMERGENCY_TARGET;
  }
}

/**
 * Set and persist Emergency Fund Target
 */
export function setEmergencyFundTarget(amount: number): void {
  try {
    if (amount > 0) {
      localStorage.setItem(EMERGENCY_TARGET_KEY, amount.toString());
    }
  } catch (err) {
    console.error('Failed to save emergency fund target', err);
  }
}

/**
 * Calculates progress percentage toward a target
 */
export function calculateTargetProgress(achieved: number, target: number): {
  percentage: number;
  cappedPercentage: number;
  remaining: number;
} {
  if (!target || target <= 0) {
    return { percentage: 0, cappedPercentage: 0, remaining: 0 };
  }
  const ratio = (achieved / target) * 100;
  const percentage = Math.round(ratio);
  const cappedPercentage = Math.min(100, Math.max(0, percentage));
  const remaining = Math.max(0, target - achieved);
  return { percentage, cappedPercentage, remaining };
}

/**
 * Calculates combined progress toward combined Savings + Emergency Fund targets
 */
export function calculateCombinedCapitalPreservedProgress(
  savingsAchieved: number,
  emergencyAchieved: number,
  savingsTarget: number,
  emergencyTarget: number
): {
  combinedAchieved: number;
  combinedTarget: number;
  percentage: number;
  cappedPercentage: number;
  remaining: number;
} {
  const combinedAchieved = Math.max(0, savingsAchieved) + Math.max(0, emergencyAchieved);
  const combinedTarget = Math.max(1, savingsTarget + emergencyTarget);
  const ratio = (combinedAchieved / combinedTarget) * 100;
  const percentage = Math.round(ratio);
  const cappedPercentage = Math.min(100, Math.max(0, percentage));
  const remaining = Math.max(0, combinedTarget - combinedAchieved);

  return {
    combinedAchieved,
    combinedTarget,
    percentage,
    cappedPercentage,
    remaining,
  };
}

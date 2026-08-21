/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const PIN_STORAGE_KEY = 'finvexa_security_pin';

/**
 * Simple hash helper to avoid storing plain text PINs directly.
 */
function hashPin(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    const char = pin.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `fx_${Math.abs(hash).toString(36)}_${pin.length}`;
}

/**
 * Checks if a custom PIN is already configured in local storage.
 */
export function hasSecurityPinSet(): boolean {
  try {
    return !!localStorage.getItem(PIN_STORAGE_KEY);
  } catch {
    return false;
  }
}

/**
 * Saves a new security PIN.
 */
export function setSecurityPin(newPin: string): boolean {
  try {
    if (!newPin || newPin.length < 4) return false;
    const hashed = hashPin(newPin.trim());
    localStorage.setItem(PIN_STORAGE_KEY, hashed);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifies if the entered PIN matches the stored PIN.
 * If no PIN is configured yet, defaults to '1234' or accepts the newly set PIN.
 */
export function verifySecurityPin(enteredPin: string): boolean {
  try {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (!stored) {
      // Default initial PIN is 1234 if not configured
      return enteredPin.trim() === '1234';
    }
    return stored === hashPin(enteredPin.trim());
  } catch {
    return enteredPin.trim() === '1234';
  }
}

/**
 * Changes existing security PIN after validating current PIN.
 */
export function changeSecurityPin(currentPin: string, newPin: string): { success: boolean; error?: string } {
  if (!verifySecurityPin(currentPin)) {
    return { success: false, error: 'Current PIN is incorrect.' };
  }
  if (!newPin || newPin.length < 4) {
    return { success: false, error: 'New PIN must be at least 4 digits.' };
  }
  setSecurityPin(newPin);
  return { success: true };
}

/**
 * Resets security PIN to default (1234).
 */
export function resetSecurityPin(): void {
  try {
    localStorage.removeItem(PIN_STORAGE_KEY);
  } catch {
    // Ignore storage error
  }
}

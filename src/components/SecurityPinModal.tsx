/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  X,
  AlertCircle,
  CheckCircle2,
  Delete,
  ArrowLeft,
} from 'lucide-react';
import {
  verifySecurityPin,
  setSecurityPin,
  hasSecurityPinSet,
  changeSecurityPin,
} from '../utils/security';

export type PinModalMode = 'unlock' | 'setup' | 'change';

interface SecurityPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessUnlock: () => void;
  initialMode?: PinModalMode;
}

export const SecurityPinModal: React.FC<SecurityPinModalProps> = ({
  isOpen,
  onClose,
  onSuccessUnlock,
  initialMode = 'unlock',
}) => {
  const isPinConfigured = hasSecurityPinSet();
  const [mode, setMode] = useState<PinModalMode>(
    initialMode === 'unlock' && !isPinConfigured ? 'unlock' : initialMode
  );

  // States for PIN entry
  const [pin, setPin] = useState<string>('');
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [step, setStep] = useState<number>(1); // For multi-step setup/change

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Initialize and Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setStep(1);
      setErrorMessage(null);
      setSuccessMessage(null);
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  // Keyboard support for typing digits
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitClick(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, step, mode, currentPin, newPin, confirmPin]);

  if (!isOpen) return null;

  const handleDigitClick = (digit: string) => {
    setErrorMessage(null);
    if (mode === 'unlock') {
      if (pin.length < 4) {
        const nextPin = pin + digit;
        setPin(nextPin);
        if (nextPin.length === 4) {
          validateUnlock(nextPin);
        }
      }
    } else if (mode === 'setup') {
      if (step === 1) {
        if (newPin.length < 4) {
          const next = newPin + digit;
          setNewPin(next);
          if (next.length === 4) {
            setTimeout(() => setStep(2), 180);
          }
        }
      } else {
        if (confirmPin.length < 4) {
          const next = confirmPin + digit;
          setConfirmPin(next);
          if (next.length === 4) {
            validateSetup(newPin, next);
          }
        }
      }
    } else if (mode === 'change') {
      if (step === 1) {
        if (currentPin.length < 4) {
          const next = currentPin + digit;
          setCurrentPin(next);
          if (next.length === 4) {
            if (verifySecurityPin(next)) {
              setTimeout(() => setStep(2), 180);
            } else {
              setErrorMessage('Incorrect current PIN.');
              setTimeout(() => setCurrentPin(''), 500);
            }
          }
        }
      } else if (step === 2) {
        if (newPin.length < 4) {
          const next = newPin + digit;
          setNewPin(next);
          if (next.length === 4) {
            setTimeout(() => setStep(3), 180);
          }
        }
      } else if (step === 3) {
        if (confirmPin.length < 4) {
          const next = confirmPin + digit;
          setConfirmPin(next);
          if (next.length === 4) {
            validateChange(currentPin, newPin, next);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    setErrorMessage(null);
    if (mode === 'unlock') {
      setPin((prev) => prev.slice(0, -1));
    } else if (mode === 'setup') {
      if (step === 1) setNewPin((prev) => prev.slice(0, -1));
      else setConfirmPin((prev) => prev.slice(0, -1));
    } else if (mode === 'change') {
      if (step === 1) setCurrentPin((prev) => prev.slice(0, -1));
      else if (step === 2) setNewPin((prev) => prev.slice(0, -1));
      else setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setErrorMessage(null);
    if (mode === 'unlock') setPin('');
    else if (mode === 'setup') {
      if (step === 1) setNewPin('');
      else setConfirmPin('');
    } else if (mode === 'change') {
      if (step === 1) setCurrentPin('');
      else if (step === 2) setNewPin('');
      else setConfirmPin('');
    }
  };

  const validateUnlock = (entered: string) => {
    if (verifySecurityPin(entered)) {
      setSuccessMessage('PIN Verified! Unlocking amounts...');
      setTimeout(() => {
        onSuccessUnlock();
        onClose();
      }, 350);
    } else {
      setErrorMessage('Incorrect PIN. Please try again.');
      setTimeout(() => setPin(''), 600);
    }
  };

  const validateSetup = (nPin: string, cPin: string) => {
    if (nPin !== cPin) {
      setErrorMessage('PINs do not match. Please try again.');
      setConfirmPin('');
      setStep(1);
      setNewPin('');
      return;
    }
    setSecurityPin(nPin);
    setSuccessMessage('PIN configured successfully! Unlocking...');
    setTimeout(() => {
      onSuccessUnlock();
      onClose();
    }, 450);
  };

  const validateChange = (cPin: string, nPin: string, confPin: string) => {
    if (nPin !== confPin) {
      setErrorMessage('New PINs do not match. Please try again.');
      setConfirmPin('');
      setStep(2);
      return;
    }
    const res = changeSecurityPin(cPin, nPin);
    if (res.success) {
      setSuccessMessage('Security PIN changed successfully!');
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      setErrorMessage(res.error || 'Failed to update PIN.');
    }
  };

  // Active digit count for visual indicator dots (4 digits)
  const getActiveDigitsCount = () => {
    if (mode === 'unlock') return pin.length;
    if (mode === 'setup') return step === 1 ? newPin.length : confirmPin.length;
    if (mode === 'change') {
      if (step === 1) return currentPin.length;
      if (step === 2) return newPin.length;
      return confirmPin.length;
    }
    return 0;
  };

  const activeDigits = getActiveDigitsCount();

  const getHeaderTitle = () => {
    if (mode === 'unlock') return 'Unlock Goals & Reserves';
    if (mode === 'setup') return 'Set Security PIN';
    return 'Change Security PIN';
  };

  const getHeaderSubtitle = () => {
    if (mode === 'unlock') return 'Enter 4-digit PIN to reveal amounts';
    if (mode === 'setup') return step === 1 ? 'Enter 4-digit PIN' : 'Confirm 4-digit PIN';
    if (step === 1) return 'Enter current PIN';
    if (step === 2) return 'Enter new 4-digit PIN';
    return 'Confirm new PIN';
  };

  return (
    <div
      id="security-pin-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div
        id="security-pin-card"
        className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all animate-scaleUp"
      >
        {/* Header - Centered on mobile & desktop */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              {mode === 'unlock' ? (
                <Lock className="w-4 h-4" />
              ) : (
                <KeyRound className="w-4 h-4" />
              )}
            </div>
            <div className="text-left">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {getHeaderTitle()}
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                {getHeaderSubtitle()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content & Action Area */}
        <div className="p-4 sm:p-5 flex flex-col items-center text-center">
          {/* Status and Error / Success feedback */}
          {errorMessage && (
            <div className="w-full mb-3 px-3 py-2 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-center gap-2 text-center animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="w-full mb-3 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-2 text-center">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Visual PIN Indicator Dots (4 dots) */}
          <div className="flex items-center justify-center gap-3 my-3">
            {[0, 1, 2, 3].map((index) => {
              const isFilled = index < activeDigits;
              return (
                <div
                  key={index}
                  className={`transition-all duration-150 w-4 h-4 rounded-full ${
                    isFilled
                      ? 'bg-indigo-600 dark:bg-indigo-500 scale-110 shadow-sm shadow-indigo-500/30'
                      : 'border-2 border-slate-300 dark:border-slate-700 bg-transparent'
                  }`}
                />
              );
            })}
          </div>

          {/* Responsive Numeric Keypad Grid (0-9) */}
          <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                id={`btn-pin-${num}`}
                onClick={() => handleDigitClick(String(num))}
                className="h-11 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-100 font-bold text-base sm:text-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs"
              >
                {num}
              </button>
            ))}
            {/* Clear */}
            <button
              type="button"
              id="btn-pin-clear"
              onClick={handleClear}
              className="h-11 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/80 active:scale-95 text-slate-500 dark:text-slate-400 font-semibold text-xs flex items-center justify-center transition-all cursor-pointer"
            >
              Clear
            </button>
            {/* 0 digit */}
            <button
              type="button"
              id="btn-pin-0"
              onClick={() => handleDigitClick('0')}
              className="h-11 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-100 font-bold text-base sm:text-lg flex items-center justify-center transition-all cursor-pointer shadow-2xs"
            >
              0
            </button>
            {/* Backspace */}
            <button
              type="button"
              id="btn-pin-backspace"
              onClick={handleBackspace}
              className="h-11 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/80 active:scale-95 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-all cursor-pointer"
            >
              <Delete className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Footer Action Links */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 w-full flex items-center justify-center text-xs px-1">
            {mode === 'unlock' ? (
              <button
                type="button"
                id="btn-modal-change-pin"
                onClick={() => {
                  setMode('change');
                  setStep(1);
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setCurrentPin('');
                  setNewPin('');
                  setConfirmPin('');
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-bold transition-colors cursor-pointer"
              >
                Change PIN
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode('unlock');
                  setStep(1);
                  setPin('');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold mx-auto cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Unlock</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

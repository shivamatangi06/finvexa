import React from 'react';
import {
  Wallet,
  Check,
} from 'lucide-react';

interface AuthScreenProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  errorMessage?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 transition-colors">
      <div className="max-w-md w-full">
        {/* Brand Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <div className="flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
              <Wallet className="w-7 h-7 text-white" />
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              FINVEXA
            </h1>
            <p className="text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider mt-1">
              Track. Save. Grow.
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed font-medium">
              Real-time income, expense & savings tracking backed directly by Google Sheets.
            </p>
          </div>

          {/* Highlights */}
          <div className="space-y-2.5 mb-6 bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className="leading-snug">
                <strong className="text-slate-900 dark:text-white">Google Sheets as Database:</strong> 100% private, cloud-persisted in your own Google Drive.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className="leading-snug">
                <strong className="text-slate-900 dark:text-white">INR (₹) Formatting:</strong> Instant calculations for Net Balance, Savings & Daily Trends.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <span className="leading-snug">
                <strong className="text-slate-900 dark:text-white">Dynamic Categories:</strong> Automatically synchronized from your spreadsheet.
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-medium text-rose-800 dark:text-rose-300 leading-relaxed">
              {errorMessage}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            type="button"
            id="google-sign-in-btn"
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 active:bg-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs text-xs sm:text-sm font-bold text-slate-800 dark:text-white transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Connecting to Google...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 font-medium mt-4 leading-normal">
            By connecting, you grant permission to create and update your dedicated <em>Personal Finance Tracker</em> spreadsheet in Google Drive.
          </p>
        </div>
      </div>
    </div>
  );
};

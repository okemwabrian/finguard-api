import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, Lock, FileCheck2, TrendingUp, ArrowLeft, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CURRENT_YEAR = new Date().getFullYear();

export default function AuthLayout({ title, subtitle, children }) {
  const { theme, toggleTheme } = useTheme();

  const features = [
    {
      icon: Sparkles,
      title: 'Automated Credit Risk Scoring',
      desc: 'Automated 0–100 risk grading with deterministic Debt-to-Income fallback.',
      accent: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
    },
    {
      icon: Lock,
      title: 'Enterprise RBAC & Audit Trail',
      desc: 'Strict separation of duties across Officers, Analysts, Auditors, and Admins.',
      accent: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    },
    {
      icon: FileCheck2,
      title: 'Instant Receipts & Transparency',
      desc: 'Track every loan in real time and generate official underwriting receipts.',
      accent: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    },
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#090d16] relative overflow-hidden transition-colors">
      {/* Ambient Gradient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-200/40 dark:bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-amber-200/35 dark:bg-amber-900/12 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/3 w-96 h-96 bg-rose-200/35 dark:bg-rose-900/12 rounded-full blur-3xl pointer-events-none" />

      {/* Left Showcase Panel */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative z-10 p-12 flex-col justify-between border-r border-slate-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 via-rose-500 to-amber-500 text-white shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white block">FinGuard</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Intelligent Loan Origination & Risk Platform</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          </div>
        </div>

        {/* Center Hero Copy & 3D Feature Cards */}
        <div className="max-w-xl space-y-7 my-auto py-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <TrendingUp className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              Next-Gen Credit Underwriting
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
              Smarter lending decisions, powered by{' '}
              <span className="bg-gradient-to-r from-blue-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
                real-time analysis
              </span>
              .
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Apply for loans, score credit risk in seconds, and maintain a tamper-proof compliance trail—all in one clean workspace.
            </p>
          </div>

          <div className="space-y-3.5">
            {features.map(({ icon: Icon, title: featTitle, desc, accent }) => (
              <div
                key={featTitle}
                className="card-3d flex items-start gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60"
              >
                <div className={`p-2.5 rounded-xl border shrink-0 ${accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{featTitle}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200/80 dark:border-slate-700/60 pt-5">
          <span>Trusted Digital Lending</span>
          <span>© {CURRENT_YEAR} FinGuard</span>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="lg:col-span-6 xl:col-span-5 relative z-10 flex items-center justify-center p-6 sm:p-10 bg-white/80 dark:bg-slate-900/80">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 via-rose-500 to-amber-500 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">FinGuard</span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>
              <Link to="/" className="text-xs font-semibold text-blue-600 dark:text-blue-400">Home</Link>
            </div>
          </div>

          <div className="card-3d bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

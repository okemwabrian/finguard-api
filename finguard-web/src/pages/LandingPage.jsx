import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, FileText, Lock, ArrowRight, CheckCircle2, TrendingUp, CreditCard, Calculator, Sun, Moon, Users, BarChart3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/axios';

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [siteConfig, setSiteConfig] = useState({
    heroModel: 'VAULT_3D',
    heroBadge: 'Intelligent Credit & Digital Lending',
    heroTitle: 'Modern Lending, Built on Trust',
    heroSubtitle: 'Apply for personal or business financing in minutes. FinGuard pairs real-time credit risk scoring with transparent disbursement tracking, daily interest clarity, and instant digital receipts.',
  });

  useEffect(() => {
    api.get('/api/public/site-config')
      .then(({ data }) => setSiteConfig((current) => ({ ...current, ...data })))
      .catch(() => { /* use defaults */ });
  }, []);

  const heroModel = ['VAULT_3D', 'ANALYTICS_ORBIT', 'CARD_STACK_3D'].includes(siteConfig.heroModel)
    ? siteConfig.heroModel
    : 'VAULT_3D';

  const cards = [
    {
      icon: Sparkles,
      title: 'Instant Automated Risk Scoring',
      desc: 'Every loan application is evaluated by the FinGuard Risk Engine with a deterministic Debt-to-Income model for 100% uptime.',
      badge: 'Risk Engine',
      lightColor: 'bg-amber-50 text-amber-700 border-amber-200',
      darkColor: 'dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    },
    {
      icon: Lock,
      title: 'Role-Based Security',
      desc: 'Dedicated portals for Users, Loan Officers, Credit Analysts, Auditors, and Administrators with strict IDOR protection.',
      badge: 'Enterprise RBAC',
      lightColor: 'bg-blue-50 text-blue-700 border-blue-200',
      darkColor: 'dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
    },
    {
      icon: FileText,
      title: 'Official Digital Receipts & Schedules',
      desc: 'Track approved amounts, disbursement progress, daily interest accrual, and printable receipts with complete audit trails.',
      badge: 'Audit Ready',
      lightColor: 'bg-rose-50 text-rose-700 border-rose-200',
      darkColor: 'dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
    },
  ];

  const stats = [
    { icon: Users, label: 'Active Borrowers', value: '2,000+' },
    { icon: BarChart3, label: 'Loans Processed', value: '10,000+' },
    { icon: TrendingUp, label: 'Approval Rate', value: '94%' },
  ];

  return (
    <div className="landing-page min-h-screen bg-white dark:bg-[#090d16] text-slate-900 dark:text-slate-100 relative overflow-hidden transition-colors">
      {/* Ambient Gradient Orbs */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-32 right-1/4 w-80 h-80 bg-amber-200/35 dark:bg-amber-900/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 left-10 w-72 h-72 bg-emerald-200/30 dark:bg-emerald-900/15 rounded-full blur-3xl pointer-events-none" />

      {/* Public Navbar */}
      <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#1e1b4b] via-indigo-600 to-emerald-500 text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">FinGuard</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Toggle Light / Dark Mode"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              aria-pressed={theme === 'dark'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            {user ? (
              <Link
                to={user.role === 'USER' || user.role === 'BORROWER' ? '/portal' : '/dashboard'}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
              >
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
                >
                  Get Started <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with 3D Showcase */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Copy */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs text-slate-700 dark:text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {siteConfig.heroBadge}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              {siteConfig.heroTitle}
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {siteConfig.heroSubtitle}
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition"
              >
                Start Loan Application
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 shadow-xs transition"
              >
                Staff & User Login
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Instant DTI Scoring
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" /> 24/7 Active Support
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-500" /> Daily Interest Calculator
              </span>
            </div>
          </div>

          {/* Right 3D Interactive Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="card-3d relative rounded-3xl bg-gradient-to-br from-[#1e1b4b] via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-indigo-800/60 overflow-hidden">
              {/* Glow effects */}
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className={`hero-model hero-model--${heroModel}`} aria-hidden="true">
                <span className="hero-model__shape" />
                <span className="hero-model__ring" />
                <span className="hero-model__tile" />
              </div>

              {/* Top Card Row */}
              <div className="relative flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/10 border border-white/15">
                    <CreditCard className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-indigo-300 font-semibold">Live Facility</div>
                    <div className="text-sm font-bold">FinGuard Credit Console</div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  LOW RISK • 18/100
                </span>
              </div>

              {/* Floating Metric Tiles */}
              <div className="relative grid grid-cols-2 gap-3.5 mb-5">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 animate-float-gentle">
                  <div className="text-[11px] text-indigo-200">Approved Amount</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono mt-1">KES 500,000</div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full w-4/5 bg-emerald-400 rounded-full animate-shimmer-bar" />
                  </div>
                  <div className="text-[10px] text-emerald-300 mt-1">80% Disbursed</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15" style={{ animationDelay: '1s' }}>
                  <div className="text-[11px] text-indigo-200 flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-amber-300" /> Daily Interest
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 mt-1">KES 164.38</div>
                  <div className="text-[10px] text-slate-300 mt-2">12.0% p.a. Reducing Balance</div>
                </div>
              </div>

              {/* Chart Bars with animation */}
              <div className="relative p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="font-semibold text-indigo-200 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Origination Velocity
                  </span>
                  <span className="text-emerald-300 font-bold">+28.4%</span>
                </div>
                <div className="flex items-end gap-2 h-16">
                  {[35, 52, 46, 68, 62, 85, 78, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500 to-emerald-400 opacity-85 animate-chart-bar-grow"
                      style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 shadow-xs">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {cards.map(({ icon: Icon, title, desc, badge, lightColor, darkColor }) => (
            <div key={title} className="card-3d bg-white dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/60 rounded-2xl p-7 flex flex-col justify-between transition-colors">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-xl border ${lightColor} ${darkColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${lightColor} ${darkColor}`}>
                    {badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Verified & Audit-Logged
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-slate-200/80 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-950 to-indigo-600 text-white">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">FinGuard</span>
            <span>• Trusted Digital Lending Platform</span>
          </div>
          <span>© {new Date().getFullYear()} FinGuard. All rights reserved.</span>
        </footer>
      </main>
    </div>
  );
}

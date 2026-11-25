import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, FileText, Lock, ArrowRight, CheckCircle2, TrendingUp, CreditCard, Calculator, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function LandingPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const cards = [
    {
      icon: Sparkles,
      title: 'Instant Automated Risk Scoring',
      desc: 'Every loan application is evaluated by our FinGuard Risk Engine with a deterministic Debt-to-Income model for 100% uptime.',
      badge: 'Risk Engine',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      icon: Lock,
      title: 'Role-Based Security',
      desc: 'Dedicated portals for Users, Loan Officers, Credit Analysts, Auditors, and Administrators with strict IDOR protection.',
      badge: 'Enterprise RBAC',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      icon: FileText,
      title: 'Official Digital Receipts & Schedules',
      desc: 'Track approved amounts, disbursement progress, daily interest accrual, and printable receipts with complete audit trails.',
      badge: 'Audit Ready',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden">
      {/* Ambient 3D Gradient Orbs */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-32 right-1/4 w-80 h-80 bg-amber-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Public Navbar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[#1e1b4b] via-indigo-600 to-emerald-500 text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">FinGuard</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition cursor-pointer"
              title="Toggle Light / Dark Mode"
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
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition"
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
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 shadow-xs text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              AI-Powered Underwriting & Digital Lending
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Modern Lending,{' '}
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent">
                Built on Trust
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Apply for personal or business financing in minutes. FinGuard pairs real-time credit risk scoring with transparent disbursement tracking, daily interest clarity, and instant digital receipts.
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
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-xs transition"
              >
                Staff & User Login
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-slate-500">
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

          {/* Right 3D Isometric Interactive Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="card-3d relative rounded-3xl bg-gradient-to-br from-[#1e1b4b] via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl border border-indigo-800/60 overflow-hidden">
              {/* Glow inside card */}
              <div className="absolute -top-20 -right-20 w-56 h-56 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

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

              {/* 3D Floating Metric Tiles */}
              <div className="relative grid grid-cols-2 gap-3.5 mb-5">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                  <div className="text-[11px] text-indigo-200">Approved Amount</div>
                  <div className="text-xl sm:text-2xl font-bold font-mono mt-1">KES 500,000</div>
                  <div className="mt-2 h-1.5 rounded-full bg-white/15 overflow-hidden">
                    <div className="h-full w-4/5 bg-emerald-400 rounded-full" />
                  </div>
                  <div className="text-[10px] text-emerald-300 mt-1">80% Disbursed</div>
                </div>

                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
                  <div className="text-[11px] text-indigo-200 flex items-center gap-1">
                    <Calculator className="w-3.5 h-3.5 text-amber-300" /> Daily Interest
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-amber-300 mt-1">KES 164.38</div>
                  <div className="text-[10px] text-slate-300 mt-2">12.0% p.a. Reducing Balance</div>
                </div>
              </div>

              {/* Mini 3D Chart Bars */}
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
                      className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500 to-emerald-400 opacity-85"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3D Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {cards.map(({ icon: Icon, title, desc, badge, color }) => (
            <div key={title} className="card-3d bg-white border border-slate-200/90 rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className={`p-3 rounded-xl border ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-1 text-[11px] font-semibold rounded-full border ${color}`}>
                    {badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                Verified & Audit-Logged
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

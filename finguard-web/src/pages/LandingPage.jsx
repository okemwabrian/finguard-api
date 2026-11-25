import { Link } from 'react-router-dom';
import { ShieldCheck, Sparkles, FileText, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  const cards = [
    {
      icon: Sparkles,
      title: 'Instant AI Credit Scoring',
      desc: 'Every loan application is evaluated by our FinGuard Risk Engine with a deterministic Debt-to-Income model for 100% uptime.',
      badge: 'AI Engine',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      icon: Lock,
      title: 'Role-Based Security',
      desc: 'Dedicated portals for Borrowers, Loan Officers, Credit Analysts, Auditors, and Administrators with strict IDOR protection.',
      badge: 'Enterprise RBAC',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      icon: FileText,
      title: 'Official Digital Receipts',
      desc: 'Generate and print verified loan origination and approval receipts complete with risk scores and reviewer notes.',
      badge: 'Audit Ready',
      color: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 relative overflow-hidden">
      {/* Soft Yellow / Red / Blue Ambient Orbs */}
      <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-32 right-1/4 w-80 h-80 bg-amber-200/35 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-96 left-10 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Public Navbar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 via-rose-500 to-amber-500 text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">FinGuard</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
              >
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-blue-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
                >
                  Apply Now <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 shadow-xs text-slate-700">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            AI-Powered Loan Origination & Compliance
          </span>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Modern Lending,{' '}
            <span className="bg-gradient-to-r from-blue-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              Built on Trust
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Apply for personal or business financing in minutes. FinGuard pairs real-time credit risk scoring with transparent human underwriting and instant digital receipts.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 transition"
            >
              Start Loan Application
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm border border-slate-200 shadow-xs transition"
            >
              Staff & Borrower Login
            </Link>
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
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Verified & Audit-Logged
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

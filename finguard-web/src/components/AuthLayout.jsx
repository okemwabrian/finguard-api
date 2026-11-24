import { ShieldCheck, Sparkles, Lock, FileCheck2, TrendingUp } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function AuthLayout({ title, subtitle, children }) {
  const features = [
    {
      icon: Sparkles,
      title: 'Gemini AI Credit Risk Scoring',
      desc: 'Automated 0–100 risk grading with deterministic Debt-to-Income fallback.',
    },
    {
      icon: Lock,
      title: 'Enterprise RBAC & Audit Trail',
      desc: 'Strict separation of duties across Officers, Analysts, Auditors, and Admins.',
    },
    {
      icon: FileCheck2,
      title: 'Transparent Underwriting',
      desc: 'Real-time loan tracking from application to final human sign-off.',
    },
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50">
      {/* Left Decorative Fintech Showcase Panel */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-12 flex-col justify-between">
        {/* Subtle decorative glow orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Brand */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight block">FinGuard AI</span>
            <span className="text-xs text-indigo-200/80">Intelligent Loan Origination & Risk Platform</span>
          </div>
        </div>

        {/* Center Hero Copy & Feature Cards */}
        <div className="relative z-10 max-w-xl space-y-8 my-auto py-8">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-400/25">
              <TrendingUp className="w-3.5 h-3.5" />
              Next-Gen Credit Underwriting
            </span>
            <h1 className="text-4xl font-bold tracking-tight leading-tight">
              Smarter lending decisions, backed by <span className="text-indigo-300">real-time AI</span>.
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Streamline borrower applications, score credit risk in seconds, and maintain a tamper-proof compliance trail—all in one unified workspace.
            </p>
          </div>

          <div className="space-y-3.5">
            {features.map(({ icon: Icon, title: featTitle, desc }) => (
              <div
                key={featTitle}
                className="flex items-start gap-3.5 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs"
              >
                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{featTitle}</h3>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Trust Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-5">
          <span>256-bit JWT Security • BCrypt-12</span>
          <span>© {CURRENT_YEAR} FinGuard AI</span>
        </div>
      </div>

      {/* Right White Auth Form Panel */}
      <div className="lg:col-span-6 xl:col-span-5 flex items-center justify-center p-6 sm:p-10 bg-gradient-to-br from-white via-white to-indigo-50/40">
        <div className="w-full max-w-md">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center gap-2.5 mb-8">
            <div className="p-2 rounded-xl bg-indigo-600 text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">FinGuard AI</span>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-2xl p-8 shadow-xl shadow-slate-200/50">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h2>
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

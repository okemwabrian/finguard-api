import { Sparkles, ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function RiskDistributionChart({ stats, loading }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200/90 shadow-sm rounded-xl p-5 animate-pulse space-y-4">
        <div className="h-5 w-64 bg-slate-200 rounded"></div>
        <div className="h-4 bg-slate-100 rounded-full w-full"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="h-20 bg-slate-50 border border-slate-100 rounded-lg"></div>
          <div className="h-20 bg-slate-50 border border-slate-100 rounded-lg"></div>
          <div className="h-20 bg-slate-50 border border-slate-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const totalScored = (stats.lowRiskCount || 0) + (stats.mediumRiskCount || 0) + (stats.highRiskCount || 0);

  return (
    <div className="bg-white border border-slate-200/90 shadow-xs rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Gemini AI Credit Risk Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Automated underwriting risk distribution across evaluated loans
            </p>
          </div>
        </div>

        <div className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
          {totalScored} {totalScored === 1 ? 'loan evaluated' : 'loans evaluated'}
        </div>
      </div>

      {/* Visual Stacked Distribution Bar */}
      {totalScored === 0 ? (
        <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
          No loan applications evaluated by Gemini AI yet.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {stats.lowRiskPercentage > 0 && (
              <div
                style={{ width: `${stats.lowRiskPercentage}%` }}
                className="bg-emerald-500 hover:bg-emerald-600 transition-all duration-300 relative group cursor-pointer"
                title={`Low Risk: ${stats.lowRiskCount} (${stats.lowRiskPercentage}%)`}
              />
            )}
            {stats.mediumRiskPercentage > 0 && (
              <div
                style={{ width: `${stats.mediumRiskPercentage}%` }}
                className="bg-amber-400 hover:bg-amber-500 transition-all duration-300 relative group cursor-pointer"
                title={`Medium Risk: ${stats.mediumRiskCount} (${stats.mediumRiskPercentage}%)`}
              />
            )}
            {stats.highRiskPercentage > 0 && (
              <div
                style={{ width: `${stats.highRiskPercentage}%` }}
                className="bg-rose-500 hover:bg-rose-600 transition-all duration-300 relative group cursor-pointer"
                title={`High Risk: ${stats.highRiskCount} (${stats.highRiskPercentage}%)`}
              />
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
            <span>Score 0 (Prime)</span>
            <span>Score 50</span>
            <span>Score 100 (Default Risk)</span>
          </div>
        </div>
      )}

      {/* Risk Tier Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {/* Low Risk */}
        <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Low Risk (0–39)
            </span>
            <span className="text-xs font-bold text-emerald-700">
              {stats.lowRiskPercentage || 0}%
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {stats.lowRiskCount || 0}{' '}
            <span className="text-xs font-normal text-slate-500">loans</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Eligible for fast-track underwriting; solid debt-to-income margin.
          </p>
        </div>

        {/* Medium Risk */}
        <div className="p-3.5 rounded-lg bg-amber-50/50 border border-amber-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              Medium Risk (40–69)
            </span>
            <span className="text-xs font-bold text-amber-700">
              {stats.mediumRiskPercentage || 0}%
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {stats.mediumRiskCount || 0}{' '}
            <span className="text-xs font-normal text-slate-500">loans</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Standard review; analyst verifies secondary income and collateral.
          </p>
        </div>

        {/* High Risk */}
        <div className="p-3.5 rounded-lg bg-rose-50/50 border border-rose-200/80 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
              High Risk (70–100)
            </span>
            <span className="text-xs font-bold text-rose-700">
              {stats.highRiskPercentage || 0}%
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            {stats.highRiskCount || 0}{' '}
            <span className="text-xs font-normal text-slate-500">loans</span>
          </div>
          <p className="text-[11px] text-slate-600 mt-1">
            Elevated DTI or default risk; requires senior committee sign-off.
          </p>
        </div>
      </div>
    </div>
  );
}

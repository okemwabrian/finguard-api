import { Landmark, Clock, CheckCircle2, ShieldAlert } from 'lucide-react';
import { CardSkeleton } from './SkeletonLoader';
import { useAuth } from '../context/AuthContext';

export default function KpiSummaryCards({ stats, loading }) {
  const { user } = useAuth();
  const isBorrower = user?.role === 'USER';

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    {
      title: isBorrower ? 'Your Loan Volume' : 'Total Portfolio Volume',
      value: `KES ${Number(stats.totalVolumeKes || 0).toLocaleString('en-KE', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`,
      subtext: `${stats.totalLoansCount || 0} total applications`,
      icon: Landmark,
      color: 'indigo',
      iconBg: 'bg-indigo-50 border-indigo-200 text-indigo-600',
    },
    {
      title: 'Pending Underwriting',
      value: stats.pendingCount + stats.underReviewCount,
      subtext: `${stats.pendingCount} pending • ${stats.underReviewCount} under review`,
      icon: Clock,
      color: 'amber',
      iconBg: 'bg-amber-50 border-amber-200 text-amber-600',
      badge: stats.pendingCount > 0 ? `${stats.pendingCount} new` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      title: 'Approval Rate',
      value: `${stats.approvalRate || 0}%`,
      subtext: `${stats.approvedCount} approved • ${stats.rejectedCount} rejected`,
      icon: CheckCircle2,
      color: 'emerald',
      iconBg: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    },
    {
      title: 'High-Risk Alerts',
      value: stats.highRiskCount || 0,
      subtext: `${stats.highRiskPercentage || 0}% of scored portfolio`,
      icon: ShieldAlert,
      color: 'rose',
      iconBg: 'bg-rose-50 border-rose-200 text-rose-600',
      badge: stats.highRiskCount > 0 ? 'Review Needed' : 'Safe',
      badgeColor: stats.highRiskCount > 0
        ? 'bg-rose-100 text-rose-800 border-rose-200'
        : 'bg-slate-100 text-slate-700 border-slate-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow rounded-xl p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-slate-900">
                  {card.value}
                </span>
                {card.badge && (
                  <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{card.subtext}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

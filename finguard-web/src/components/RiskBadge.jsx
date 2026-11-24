export default function RiskBadge({ level, score }) {
  const styles = {
    LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
    HIGH: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const badgeStyle = styles[level] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badgeStyle}`}>
      <span>{level || 'N/A'}</span>
      {score !== null && score !== undefined && (
        <span className="opacity-80">• {score}/100</span>
      )}
    </span>
  );
}

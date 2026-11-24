export default function RiskBadge({ level, score }) {
  const styles = {
    LOW: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    MEDIUM: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    HIGH: 'bg-red-500/15 text-red-400 border-red-500/30',
  };

  const badgeStyle = styles[level] || 'bg-slate-800 text-slate-300 border-slate-700';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${badgeStyle}`}>
      <span>{level || 'N/A'}</span>
      {score !== null && score !== undefined && (
        <span className="opacity-80">• {score}/100</span>
      )}
    </span>
  );
}

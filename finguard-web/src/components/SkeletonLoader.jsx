export function CardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/90 shadow-sm rounded-xl p-5 animate-pulse space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 bg-slate-200 rounded"></div>
        <div className="h-8 w-8 bg-slate-200 rounded-lg"></div>
      </div>
      <div className="h-7 w-36 bg-slate-200 rounded"></div>
      <div className="h-3 w-44 bg-slate-100 rounded"></div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-1.5"></div>
          {i === 0 && <div className="h-3 bg-slate-100 rounded w-1/2"></div>}
        </td>
      ))}
    </tr>
  );
}

export function QueueCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200/90 shadow-sm rounded-xl p-5 animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-40 bg-slate-200 rounded"></div>
          <div className="h-3 w-64 bg-slate-100 rounded"></div>
        </div>
        <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-100 rounded-lg p-3">
        <div className="h-8 bg-slate-200/60 rounded"></div>
        <div className="h-8 bg-slate-200/60 rounded"></div>
        <div className="h-8 bg-slate-200/60 rounded"></div>
        <div className="h-8 bg-slate-200/60 rounded"></div>
      </div>
    </div>
  );
}

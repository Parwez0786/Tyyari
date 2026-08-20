export function completedSet(progress) {
  return new Set(progress?.questionIds || []);
}

export function countCompleted(ids, done) {
  return (ids || []).filter((id) => done.has(id)).length;
}

export function Donut({ value, total, label }) {
  const safeTotal = Math.max(total, 0);
  const safeValue = Math.min(Math.max(value, 0), safeTotal || value);
  const pct = safeTotal ? safeValue / safeTotal : 0;
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = c * pct;
  return (
    <div className="flex items-center gap-4">
      <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0 text-ink">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" className="text-white/10" strokeWidth="12" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-brand"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="56" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="800">
          {safeValue}/{safeTotal || 0}
        </text>
        <text x="60" y="74" textAnchor="middle" fill="currentColor" className="text-mute" fontSize="10" fontWeight="600" opacity="0.7">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      {label && <p className="text-sm leading-6 text-mute">{label}</p>}
    </div>
  );
}

export function ProgressBar({ label, value, total }) {
  const pct = total ? Math.round((100 * value) / total) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-semibold">
        <span className="truncate text-ink">{label}</span>
        <span className="shrink-0 text-mute">{value}/{total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

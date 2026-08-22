export function BarChart({ series, color = "#f97316" }) {
  const max = Math.max(1, ...series.map((row) => row.value));
  const width = 560;
  const height = 180;
  const pad = { l: 8, r: 8, t: 12, b: 28 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const gap = 6;
  const barW = series.length ? (innerW - gap * (series.length - 1)) / series.length : innerW;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full" role="img">
      {series.map((row, index) => {
        const h = (row.value / max) * innerH;
        const x = pad.l + index * (barW + gap);
        const y = pad.t + innerH - h;
        const label = row.label.length > 6 ? row.label.slice(5) : row.label;
        return (
          <g key={row.label}>
            <rect x={x} y={y} width={barW} height={Math.max(h, 2)} rx="6" fill={color} opacity={row.value ? 0.95 : 0.25} />
            <text x={x + barW / 2} y={height - 8} textAnchor="middle" fill="currentColor" className="text-mute" fontSize="10">
              {label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function HBarList({ series, color = "#f97316" }) {
  const max = Math.max(1, ...series.map((row) => row.value));
  return (
    <div className="space-y-3">
      {series.map((row) => (
        <div key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold">
            <span className="truncate">{row.label}</span>
            <span className="text-mute">{row.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${Math.round((100 * row.value) / max)}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
      {!series.length && <p className="text-sm text-mute">Nothing to chart yet.</p>}
    </div>
  );
}

export function Donut({ segments, center, sub }) {
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  const r = 46;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width="132" height="132" viewBox="0 0 132 132" className="shrink-0">
        <circle cx="66" cy="66" r={r} fill="none" stroke="currentColor" className="text-white/10" strokeWidth="14" />
        {total > 0 && segments.map((item) => {
          const dash = c * (item.value / total);
          const node = (
            <circle
              key={item.label}
              cx="66"
              cy="66"
              r={r}
              fill="none"
              stroke={item.color}
              strokeWidth="14"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 66 66)"
            />
          );
          offset += dash;
          return node;
        })}
        <text x="66" y="62" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="800">{center}</text>
        {sub && (
          <text x="66" y="80" textAnchor="middle" fill="currentColor" className="text-mute" fontSize="10" fontWeight="600" opacity="0.7">
            {sub}
          </text>
        )}
      </svg>
      <ul className="min-w-[140px] space-y-2 text-sm">
        {segments.map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
            <span className="font-semibold text-mute">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function lastDays(n) {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function countByDay(items, getDate, days) {
  const map = Object.fromEntries(days.map((day) => [day, 0]));
  for (const item of items) {
    const key = getDate(item);
    if (key && key in map) map[key] += 1;
  }
  return days.map((date) => ({ label: date.slice(5), value: map[date], date }));
}

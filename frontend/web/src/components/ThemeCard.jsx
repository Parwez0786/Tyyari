const TONES = {
  brand: {
    wrap: "border-brand/25 bg-gradient-to-br from-brand/15 via-card to-card",
    a: "bg-brand/20",
    b: "bg-blue-500/10",
  },
  blue: {
    wrap: "border-brand/25 bg-gradient-to-br from-blue-500/15 via-card to-card",
    a: "bg-blue-500/15",
    b: "bg-brand/10",
  },
  violet: {
    wrap: "border-fuchsia-500/25 bg-gradient-to-br from-fuchsia-500/15 via-card to-card",
    a: "bg-fuchsia-500/20",
    b: "bg-brand/10",
  },
  mint: {
    wrap: "border-brand/25 bg-gradient-to-br from-emerald-500/20 via-card to-card",
    a: "bg-emerald-500/30",
    b: "bg-brand/15",
  },
  lime: {
    wrap: "border-brand/25 bg-gradient-to-br from-lime-500/20 via-card to-card",
    a: "bg-lime-500/30",
    b: "bg-brand/15",
  },
  quiet: {
    wrap: "border-line bg-card",
  },
  danger: {
    wrap: "border-rose-500/25 bg-gradient-to-br from-rose-500/15 via-card to-card",
    a: "bg-rose-500/15",
    b: "bg-brand/10",
  },
};

export default function ThemeCard({ tone = "brand", compact = false, className = "", innerClassName = "", children }) {
  const look = TONES[tone] || TONES.brand;
  return (
    <article className={`relative min-w-0 overflow-hidden border ${look.wrap} ${compact ? "rounded-2xl p-4" : "rounded-[28px] p-6"} ${className}`}>
      {look.a && (
        <div className={`pointer-events-none absolute rounded-full blur-3xl ${look.a} ${
          compact ? "-right-10 -top-12 h-32 w-32" : "-right-16 -top-20 h-56 w-56"
        }`} />
      )}
      {look.b && (
        <div className={`pointer-events-none absolute rounded-full blur-3xl ${look.b} ${
          compact ? "-bottom-12 left-6 h-28 w-28" : "-bottom-24 left-10 h-48 w-48"
        }`} />
      )}
      <div className={`relative ${innerClassName}`}>{children}</div>
    </article>
  );
}

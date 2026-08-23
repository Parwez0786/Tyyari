import { useState } from "react";
import { COMPANY_ICONS, companyIconUrl } from "../utils/companyIcons";

const DIFFICULTY = {
  EASY: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  MEDIUM: "border-amber-400/30 bg-amber-400/15 text-amber-400",
  HARD: "border-rose-500/30 bg-rose-500/15 text-rose-400",
};

export function DifficultyBadge({ difficulty }) {
  const key = (difficulty || "MEDIUM").toUpperCase();
  return (
    <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold capitalize ${DIFFICULTY[key] || DIFFICULTY.MEDIUM}`}>
      {key.charAt(0) + key.slice(1).toLowerCase()}
    </span>
  );
}

export function CompanyMark({ name, size = "md" }) {
  const [failed, setFailed] = useState(false);
  const src = companyIconUrl(name);
  const box = size === "sm" ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[11px]";
  const bg = COMPANY_ICONS[name]?.color || "#3f3f46";
  const fallback = !src || failed;

  return (
    <span
      title={name}
      className={`inline-flex ${box} shrink-0 items-center justify-center overflow-hidden rounded-full leading-none ring-2 ring-[var(--card)] ${fallback ? "font-bold text-white" : "bg-white"}`}
      style={fallback ? { backgroundColor: bg } : undefined}
    >
      {fallback ? (
        name.charAt(0)
      ) : (
        <img
          src={src}
          alt=""
          className="block h-full w-full object-contain p-0.5"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export function CompanyTags({ companies, compact = false }) {
  if (!companies?.length) return null;
  if (compact) {
    return (
      <div className="flex items-center pl-1">
        {companies.slice(0, 8).map((name, index) => (
          <span key={name} className="relative" style={{ marginLeft: index ? -8 : 0, zIndex: 8 - index }}>
            <CompanyMark name={name} size="sm" />
          </span>
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {companies.map((name) => (
        <span
          key={name}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-field px-2 py-0.5 text-xs font-medium text-ink"
        >
          <CompanyMark name={name} size="sm" />
          {name}
        </span>
      ))}
    </div>
  );
}

export function QuestionMeta({ data, center = false, compact = false }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${center ? "justify-center" : ""}`}>
      <DifficultyBadge difficulty={data.difficulty} />
      <CompanyTags companies={data.companies} compact={compact} />
    </div>
  );
}

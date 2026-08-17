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

  if (!src || failed) {
    return (
      <span
        title={name}
        className={`inline-flex items-center justify-center rounded-full font-bold text-white ring-2 ring-[var(--card)] ${box}`}
        style={{ backgroundColor: bg }}
      >
        {name.charAt(0)}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      title={name}
      className={`${box} rounded-full bg-white object-contain p-px ring-2 ring-[var(--card)]`}
      onError={() => setFailed(true)}
    />
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
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-neutral-200"
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

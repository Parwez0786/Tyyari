import { Link } from "react-router-dom";
import { useEntitled, isPremiumLocked } from "../hooks/usePremium";
import { CompanyMark, DifficultyBadge } from "./QuestionMeta";

const ctaByType = {
  HLD: "Start Design",
  LLD: "Start Coding",
  DSA: "Start Solving",
  FRONTEND: "Start Challenge",
  CS: "Start Quiz",
  OA: "Start Assessment",
};

export default function ProblemCard({ question, onStart, completed = false }) {
  const q = question;
  const entitled = useEntitled();
  const locked = isPremiumLocked(q, entitled);
  const cta = completed ? "Solve again" : (ctaByType[q.type] || "Start");

  return (
    <article className={`flex flex-col rounded-xl border p-5 text-white shadow-sm ${completed ? "border-emerald-500/40 bg-card" : "border-white/10 bg-card"}`}>
      <div className="flex items-start justify-between gap-3">
        <DifficultyBadge difficulty={q.difficulty} />
        <span className="flex h-6 items-center gap-2 text-neutral-500">
          {completed && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">Done</span>}
          {locked && <LockIcon />}
          <TypeIcon type={q.type} />
        </span>
      </div>

      <h3 className="mt-4 text-lg font-bold leading-snug">{q.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-neutral-400">
        {q.description || "Open this problem to read the full prompt, constraints, and hints before you start."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {(q.companies || []).slice(0, 5).map((name) => (
          <CompanyMark key={name} name={name} />
        ))}
      </div>

      <div className="mt-auto pt-5">
        {locked ? (
          <Link
            to="/premium"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm font-semibold text-brand hover:bg-white/10"
          >
            <LockIcon />
            Upgrade to Premium
          </Link>
        ) : onStart ? (
          <button
            type="button"
            onClick={() => onStart(q)}
            className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            {cta}
            <span aria-hidden="true">→</span>
          </button>
        ) : (
          <Link
            to={`/questions/${q.id}`}
            className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            {cta}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </article>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-brand">
      <path d="M17 9h-1V7A4 4 0 0 0 7 7v2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-8-2a2 2 0 1 1 4 0v2H9V7Zm8 12H6v-8h11v8Z" />
    </svg>
  );
}

function TypeIcon({ type }) {
  if (type === "DSA") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    );
  }
  if (type === "LLD" || type === "FRONTEND") {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="5" rx="1" />
      <rect x="3" y="10" width="18" height="5" rx="1" />
      <rect x="3" y="16" width="18" height="4" rx="1" />
    </svg>
  );
}

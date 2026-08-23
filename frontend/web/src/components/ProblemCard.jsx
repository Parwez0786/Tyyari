import { memo } from "react";
import { Link } from "react-router-dom";
import { QuestionType, ThemeTone } from "../data/enums";
import { useEntitled, isPremiumLocked } from "../hooks/usePremium";
import { CompanyMark, DifficultyBadge } from "./QuestionMeta";
import ThemeCard from "./ThemeCard";

const ctaByType = {
  [QuestionType.HLD]: "Start Design",
  [QuestionType.LLD]: "Start Coding",
  [QuestionType.DSA]: "Start Solving",
  [QuestionType.FRONTEND]: "Start Challenge",
  [QuestionType.CS]: "Start Quiz",
  [QuestionType.OA]: "Start Assessment",
};

const TONE_BY_TYPE = {
  [QuestionType.HLD]: ThemeTone.BRAND,
  [QuestionType.LLD]: ThemeTone.BLUE,
  [QuestionType.DSA]: ThemeTone.MINT,
  [QuestionType.FRONTEND]: ThemeTone.VIOLET,
  [QuestionType.CS]: ThemeTone.LIME,
  [QuestionType.OA]: ThemeTone.BLUE,
};

function ProblemCard({ question, onStart, completed = false }) {
  const q = question;
  const entitled = useEntitled();
  const locked = isPremiumLocked(q, entitled);
  const cta = completed ? "Solve again" : (ctaByType[q?.type] || "Start");
  const tone = completed ? "mint" : TONE_BY_TYPE[q?.type] || "brand";

  return (
    <ThemeCard tone={tone} className="h-full !rounded-[24px] !p-5" innerClassName="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        <DifficultyBadge difficulty={q?.difficulty} />
        <span className="flex h-6 items-center gap-2">
          {completed && <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">Done</span>}
          {locked && <LockIcon />}
        </span>
      </div>

      <h3 className="mt-4 text-lg font-bold leading-snug">{q?.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-mute">
        {q?.description || "Open this problem to read the full prompt, constraints, and hints before you start."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {(q?.companies || []).slice(0, 5).map((name) => (
          <CompanyMark key={name} name={name} />
        ))}
      </div>

      <div className="mt-auto pt-5">
        {locked ? (
          <Link
            to="/premium"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand/10 py-3 text-sm font-semibold text-brand hover:border-brand/50"
          >
            <LockIcon />
            Upgrade to Premium
          </Link>
        ) : onStart ? (
          <button
            type="button"
            onClick={() => onStart(q)}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-field/80 px-4 py-3 text-sm font-semibold hover:border-brand/40"
          >
            {cta}
            <span aria-hidden="true">→</span>
          </button>
        ) : (
          <Link
            to={`/questions/${q?.id}`}
            className="flex w-full items-center justify-between rounded-xl border border-line bg-field/80 px-4 py-3 text-sm font-semibold hover:border-brand/40"
          >
            {cta}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </ThemeCard>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-brand">
      <path d="M17 9h-1V7A4 4 0 0 0 7 7v2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-8-2a2 2 0 1 1 4 0v2H9V7Zm8 12H6v-8h11v8Z" />
    </svg>
  );
}

export default memo(ProblemCard);

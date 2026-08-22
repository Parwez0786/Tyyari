import { Link } from "react-router-dom";
import { useEntitled, isPremiumLocked } from "../hooks/usePremium";

const badge = {
  EASY: "bg-green-50 text-easy dark:bg-green-950/40",
  MEDIUM: "bg-blue-50 text-medium dark:bg-blue-950/40",
  HARD: "bg-rose-50 text-hard dark:bg-rose-950/40",
};

export default function QuestionCard({ question, actionLabel = "Open", index }) {
  const q = question;
  const locked = isPremiumLocked(q, useEntitled());
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        {index != null && (
          <span className="mt-0.5 w-7 shrink-0 text-sm font-semibold text-mute">{index}</span>
        )}
        <div className="min-w-0">
          <p className="font-semibold">{q.title}</p>
          <p className="mt-1 truncate text-sm text-mute">
            {q.type}
            {(q.companies || []).length ? ` · ${(q.companies || []).slice(0, 3).join(", ")}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:pl-4">
        {q.difficulty && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge[q.difficulty] || badge.MEDIUM}`}>
            {q.difficulty}
          </span>
        )}
        <Link
          to={locked ? "/premium" : `/questions/${q.id}`}
          className="btn-ghost !px-4 !py-1.5 text-sm"
        >
          {locked ? "Upgrade" : actionLabel}
        </Link>
      </div>
    </article>
  );
}

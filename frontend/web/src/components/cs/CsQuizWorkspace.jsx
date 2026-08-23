import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { subjectLabel } from "../../data/labels";
import { DifficultyBadge } from "../QuestionMeta";
import { loadSubmission, saveSubmission } from "../../services/submissions";

export default function CsQuizWorkspace({ data, backTo = "/practice/CS", backLabel = "Back to CS practice" }) {
  const quiz = Array.isArray(data.quiz) ? data.quiz : [];
  const key = `tyyari.cs.${data.id}`;
  const [picks, setPicks] = useState(() => loadDraft(key, quiz.length));
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(() => Boolean(localStorage.getItem(key)));

  const total = quiz.length;
  const answered = picks.filter((pick) => pick >= 0).length;

  useEffect(() => {
    let cancelled = false;
    const hadDraft = Boolean(localStorage.getItem(key));
    const items = Array.isArray(data.quiz) ? data.quiz : [];
    loadSubmission(data.id).then((saved) => {
      if (cancelled) return;
      if (saved) {
        setSubmitted(true);
        if (!hadDraft && Array.isArray(saved.quizAnswers) && saved.quizAnswers.length) {
          setPicks(padPicks(saved.quizAnswers, items.length));
          setScore(typeof saved.quizScore === "number" ? saved.quizScore : grade(items, saved.quizAnswers));
          setRevealed(true);
        }
      }
      setReady(true);
    }).catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, [data.id, data.quiz, key]);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify({ picks }));
  }, [key, picks]);

  function choose(index, option) {
    if (revealed) return;
    setPicks((prev) => {
      const next = [...prev];
      next[index] = option;
      return next;
    });
  }

  async function submit() {
    if (submitting || !total) return;
    const nextScore = grade(quiz, picks);
    setScore(nextScore);
    setRevealed(true);
    setSubmitting(true);
    try {
      await saveSubmission({
        questionId: data.id,
        questionType: "CS",
        view: "quiz",
        quizScore: nextScore,
        quizTotal: total,
        quizAnswers: picks,
      });
      setSubmitted(true);
    } catch {
      /* keep local answers */
    } finally {
      setSubmitting(false);
    }
  }

  function retry() {
    setRevealed(false);
    setScore(null);
  }

  if (!ready) {
    return <p className="p-6 text-sm text-mute">Loading quiz…</p>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3">
        <Link
          to={backTo}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-mute hover:bg-field hover:text-ink"
          aria-label={backLabel}
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{data.title}</h1>
        <ThemeToggle compact />
        {revealed && (
          <button
            type="button"
            onClick={retry}
            className="inline-flex h-9 shrink-0 items-center rounded-lg bg-white/10 px-3 text-sm font-semibold text-ink hover:bg-white/15"
          >
            Try again
          </button>
        )}
        <button
          type="button"
          onClick={submit}
          disabled={submitting || !total}
          className="inline-flex h-9 shrink-0 items-center rounded-lg bg-white/10 px-3 text-sm font-semibold text-ink hover:bg-white/15 disabled:opacity-60"
        >
          {submitting ? "Saving…" : revealed ? "Resubmit" : submitted ? "Submit again" : "Submit"}
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={data.difficulty} />
            {data.subType && (
              <span className="rounded-full border border-line px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-mute">
                {subjectLabel(data.subType)}
              </span>
            )}
            <span className="text-xs font-semibold text-mute">{total} questions</span>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">{data.title}</h2>
          <p className="mt-2 text-sm leading-6 text-mute">{data.description}</p>

          {revealed && (
            <div className="mt-6 rounded-2xl border border-line bg-card px-5 py-4">
              <p className="label-caps">Score</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums">
                {score ?? 0} / {total}
              </p>
              <p className="mt-1 text-sm text-mute">
                {submitted ? "Saved like a practice submit — it counts on your dashboard." : "Sign in to save this score to your progress."}
              </p>
            </div>
          )}

          {!total && (
            <p className="mt-8 text-sm text-mute">This quiz has no questions yet.</p>
          )}

          <ol className="mt-8 space-y-5">
            {quiz.map((item, index) => {
              const pick = picks[index] ?? -1;
              const correct = item.answerIndex;
              return (
                <li key={`${item.prompt}-${index}`} className="rounded-2xl border border-line bg-card p-5">
                  <p className="text-sm font-semibold leading-6">
                    <span className="mr-2 text-mute">{index + 1}.</span>
                    {item.prompt}
                  </p>
                  <div className="mt-4 grid gap-2">
                    {(item.options || []).map((option, optionIndex) => {
                      const selected = pick === optionIndex;
                      const showCorrect = revealed && optionIndex === correct;
                      const showWrong = revealed && selected && optionIndex !== correct;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => choose(index, optionIndex)}
                          disabled={revealed}
                          className={`rounded-xl border px-4 py-3 text-left text-sm leading-6 transition ${
                            showCorrect
                              ? "border-emerald-500/50 bg-emerald-500/10 text-ink"
                              : showWrong
                                ? "border-red-500/40 bg-red-500/10 text-ink"
                                : selected
                                  ? "border-brand/50 bg-brand/10 text-ink"
                                  : "border-line bg-surface text-ink hover:border-brand/30"
                          } disabled:cursor-default`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ol>

          {!!total && (
            <p className="mt-6 text-center text-xs text-mute">
              {answered} of {total} answered
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function grade(quiz, picks) {
  return quiz.reduce((sum, item, index) => sum + ((picks[index] ?? -1) === item.answerIndex ? 1 : 0), 0);
}

function padPicks(answers, length) {
  const next = Array.from({ length }, () => -1);
  answers.forEach((value, index) => {
    if (index < length && typeof value === "number") next[index] = value;
  });
  return next;
}

function loadDraft(key, length) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "null");
    if (raw && Array.isArray(raw.picks)) return padPicks(raw.picks, length);
  } catch {
    /* empty draft */
  }
  return Array.from({ length }, () => -1);
}

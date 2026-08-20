import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { ListChecks, Map } from "lucide-react";
import Layout from "../components/Layout";
import { completedSet, ProgressBar } from "../components/ProgressCharts";
import { contentApi, userApi } from "../services/api";
import {
  ROADMAPS,
  ROLES,
  flattenQuestions,
  itemHref,
  itemTrack,
  roleFromProfile,
} from "../data/roadmaps";

export default function Learn() {
  const [params, setParams] = useSearchParams();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: userApi.profile });
  const progressQuery = useQuery({ queryKey: ["practice-progress"], queryFn: userApi.practiceProgress });
  const libraryQuery = useQuery({
    queryKey: ["roadmap-library"],
    queryFn: async () => {
      const types = ["HLD", "LLD", "DSA", "FRONTEND", "CS"];
      const pages = await Promise.all(types.map((type) => contentApi.questions({ type, page: 1, limit: 50 })));
      const bySlug = {};
      pages.forEach((page) => {
        (page?.data?.items || []).forEach((item) => {
          if (item.slug) bySlug[item.slug] = item;
        });
      });
      return bySlug;
    },
  });
  const sheetsQuery = useQuery({ queryKey: ["sheets"], queryFn: () => contentApi.sheets() });

  const profileRole = roleFromProfile(profileQuery.data?.data?.targetRole);
  const role = params.get("role") === "SDE-2" || params.get("role") === "SDE-1"
    ? params.get("role")
    : profileRole;
  const meta = ROLES.find((item) => item.id === role) || ROLES[0];
  const weeks = ROADMAPS[role] || ROADMAPS["SDE-1"];
  const done = completedSet(progressQuery.data?.data);
  const bySlug = libraryQuery.data || {};
  const sheets = sheetsQuery.data?.data ?? [];
  const sheetBySlug = Object.fromEntries(sheets.map((sheet) => [sheet.slug, sheet]));

  const stats = useMemo(
    () => weeks.map((week) => weekStats(week, done, bySlug, sheetBySlug)),
    [weeks, progressQuery.data, libraryQuery.data, sheetsQuery.data],
  );
  const questions = flattenQuestions(weeks);
  const questionDone = questions.filter((item) => done.has(bySlug[item.slug]?.id)).length;
  const current = stats.find((row) => row.done < row.total) || stats[stats.length - 1];

  function setRole(next) {
    const nextParams = new URLSearchParams(params);
    nextParams.set("role", next);
    setParams(nextParams, { replace: true });
  }

  return (
    <Layout>
      <section className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            <Map size={12} />
            Learn
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Week-by-week roadmap</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">{meta.blurb}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {ROLES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRole(item.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  role === item.id ? "bg-brand text-white" : "bg-white/5 text-ink hover:bg-white/10"
                }`}
              >
                {item.title}
              </button>
            ))}
            {profileQuery.data?.data?.targetRole && (
              <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-mute">
                Target · {profileQuery.data.data.targetRole}
              </span>
            )}
          </div>
          <div className="mt-5 max-w-md">
            <ProgressBar
              label={`${questionDone} of ${questions.length} path questions submitted`}
              value={questionDone}
              total={questions.length}
            />
          </div>
          {current && (
            <p className="mt-3 text-sm text-mute">
              Next focus: <span className="font-semibold text-ink">Week {current.week} · {current.title}</span>
            </p>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-4">
        {weeks.map((week, index) => {
          const row = stats[index];
          return (
            <article key={week.week} id={`week-${week.week}`} className="rounded-[24px] border border-line bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">Week {week.week}</p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight">{week.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-mute">{week.focus}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${row.done >= row.total ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-mute"}`}>
                  {row.done}/{row.total}
                </span>
              </div>
              <div className="mt-4">
                <ProgressBar label="This week" value={row.done} total={row.total} />
              </div>
              <ul className="mt-4 grid gap-2">
                {week.items.map((item) => {
                  const complete = isComplete(item, done, bySlug, sheetBySlug);
                  const href = itemHref(item);
                  return (
                    <li key={`${item.kind}-${item.slug}`}>
                      <Link
                        to={href}
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition hover:border-brand/40 ${
                          complete ? "border-emerald-500/30 bg-emerald-500/5" : "border-line bg-surface"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{item.title}</p>
                          <p className="mt-0.5 text-xs text-mute">{itemTrack(item)}</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-brand">
                          {complete ? "Done" : item.kind === "sheet" ? (
                            <span className="inline-flex items-center gap-1">
                              <ListChecks size={14} />
                              Open
                            </span>
                          ) : "Go →"}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </Layout>
  );
}

function weekStats(week, done, bySlug, sheetBySlug) {
  const countable = week.items.filter((item) => item.kind === "question" || item.kind === "sheet");
  const finished = countable.filter((item) => isComplete(item, done, bySlug, sheetBySlug)).length;
  return { week: week.week, title: week.title, done: finished, total: countable.length || 1 };
}

function isComplete(item, done, bySlug, sheetBySlug) {
  if (item.kind === "question") {
    const id = bySlug[item.slug]?.id;
    return Boolean(id && done.has(id));
  }
  if (item.kind === "sheet") {
    const ids = sheetBySlug[item.slug]?.questionIds || [];
    return ids.length > 0 && ids.every((id) => done.has(id));
  }
  return false;
}

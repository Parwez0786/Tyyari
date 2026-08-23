import { Link } from "react-router-dom";
import { ListChecks, Map } from "lucide-react";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import { ProgressBar } from "../components/ProgressCharts";
import { RoadmapItemKind } from "../data/enums";
import { itemHref, itemTrack } from "../data/roadmaps";
import { useLearn } from "../hooks/useLearn";

export default function Learn() {
  const l = useLearn();

  if (l.isLoading) {
    return (
      <Layout>
        <Loader fill />
      </Layout>
    );
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
          <p className="mt-2 max-w-2xl text-sm leading-6 text-mute">{l.meta.blurb}</p>
          {l.isError && (
            <p className="mt-3 text-sm text-hard">Could not load the question library for this path. Refresh to retry.</p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {l.roles.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => l.setRole(item.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  l.role === item.id ? "bg-brand text-white" : "bg-white/5 text-ink hover:bg-white/10"
                }`}
              >
                {item.title}
              </button>
            ))}
            {l.targetRole && (
              <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-mute">
                Target · {l.targetRole}
              </span>
            )}
          </div>
          <div className="mt-5 max-w-md">
            <ProgressBar
              label={`${l.questionDone} of ${l.questionTotal} path questions submitted`}
              value={l.questionDone}
              total={l.questionTotal}
            />
          </div>
          {l.current && (
            <p className="mt-3 text-sm text-mute">
              Next focus: <span className="font-semibold text-ink">Week {l.current.week} · {l.current.title}</span>
            </p>
          )}
        </div>
      </section>

      <div className="mt-6 grid gap-4">
        {l.weeks.map((week, index) => {
          const row = l.stats[index];
          return (
            <article key={week.week} id={`week-${week.week}`} className="rounded-[24px] border border-line bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">Week {week.week}</p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight">{week.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-mute">{week.focus}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${row?.done >= row?.total ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-mute"}`}>
                  {row?.done}/{row?.total}
                </span>
              </div>
              <div className="mt-4">
                <ProgressBar label="This week" value={row?.done} total={row?.total} />
              </div>
              <ul className="mt-4 grid gap-2">
                {week.items.map((item) => {
                  const complete = l.isComplete(item);
                  return (
                    <li key={`${item.kind}-${item.slug}`}>
                      <Link
                        to={itemHref(item)}
                        className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition hover:border-brand/40 ${
                          complete ? "border-emerald-500/30 bg-emerald-500/5" : "border-line bg-surface"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{item.title}</p>
                          <p className="mt-0.5 text-xs text-mute">{itemTrack(item)}</p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-brand">
                          {complete ? "Done" : item.kind === RoadmapItemKind.SHEET ? (
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

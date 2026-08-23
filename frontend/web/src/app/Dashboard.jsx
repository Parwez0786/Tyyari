import { Link } from "react-router-dom";
import {
  CalendarDays,
  Flame,
  ListChecks,
  Map,
  Shuffle,
  Sparkles,
  Target,
  Undo2,
} from "lucide-react";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import Avatar from "../components/Avatar";
import ThemeCard from "../components/ThemeCard";
import { CompanyMark, DifficultyBadge } from "../components/QuestionMeta";
import { Donut, ProgressBar } from "../components/ProgressCharts";
import { difficultyLabel, targetRoleLabel, typeLabel, viewLabel } from "../data/labels";
import { QuestionType, practicePath } from "../data/enums";
import { DAY_LABELS, WEEK_GOAL, useDashboard } from "../hooks/useDashboard";

export default function Dashboard() {
  const d = useDashboard();

  if (d.isLoading) {
    return (
      <Layout>
        <Loader fill />
      </Layout>
    );
  }

  return (
    <Layout>
      <ThemeCard className="sm:p-8" innerClassName="flex flex-wrap items-start gap-5">
          <Avatar name={d.profile?.name} email={d.email} size="lg" square />
          <div className="min-w-0 flex-1">
            <p className="font-hand text-2xl text-brand">{d.greeting}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{d.firstName}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-mute">{d.nudge}</p>
            {d.profileError && (
              <p className="mt-2 text-sm text-hard">Could not load your profile. Refresh — your streak still lives on the server.</p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="tab-chip tab-chip-on !font-bold uppercase tracking-wide">
                {d.xp.name}
              </span>
              {d.profile?.targetRole && (
                <Link to="/learn" className="tab-chip">
                  {targetRoleLabel(d.profile?.targetRole)} path
                </Link>
              )}
              {d.companies.map((name) => (
                <span key={name} className="tab-chip">{name}</span>
              ))}
              {d.entitled ? (
                <span className="rounded-full border border-premium/30 bg-blue-500/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-premium">
                  Premium
                </span>
              ) : (
                <Link to="/premium" className="rounded-full border border-premium/30 bg-blue-500/15 px-3 py-1.5 text-xs font-semibold text-premium hover:bg-blue-500/25">
                  Upgrade
                </Link>
              )}
            </div>
            <div className="mt-4 max-w-md">
              <ProgressBar
                label={d.xp.next ? `${d.xp.toNext} more to ${d.xp.next}` : "Max rank unlocked"}
                value={d.xp.value}
                total={d.xp.total}
              />
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
            <div className={`rounded-2xl border px-4 py-3 ${d.streak ? "border-brand/40 bg-brand/10" : "border-line bg-field"}`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-mute">
                <Flame size={14} className={d.streak ? "text-brand" : "text-mute"} />
                Streak
              </div>
              <p className="mt-1 text-3xl font-extrabold tracking-tight">
                {d.streak}
                <span className="ml-1 text-sm font-semibold text-mute">day{d.streak === 1 ? "" : "s"}</span>
              </p>
              <p className="mt-1 text-xs text-mute">{d.todayDone ? `${d.todayDone} submitted today` : "Submit once to keep it"}</p>
            </div>
            <WeekStrip week={d.week} />
            <div className="rounded-2xl border border-line bg-field px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-mute">This week</p>
              <p className="mt-1 text-lg font-extrabold">{d.weekDone}/{WEEK_GOAL}</p>
              <ProgressBar label="Weekly quest" value={Math.min(d.weekDone, WEEK_GOAL)} total={WEEK_GOAL} />
            </div>
          </div>
      </ThemeCard>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {d.potd && (
          <ThemeCard tone="mint">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              <CalendarDays size={12} />
              Problem of the day
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{d.potd.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <DifficultyBadge difficulty={d.potd.difficulty} />
              {d.potdDone && (
                <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-400">
                  Done
                </span>
              )}
            </div>
            {(d.potd.companies || []).length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {(d.potd.companies || []).slice(0, 5).map((name) => (
                  <CompanyMark key={name} name={name} />
                ))}
              </div>
            )}
            <p className="mt-3 text-sm text-mute">
              A new DSA problem each day. Same pick for everyone until midnight.
            </p>
            {d.potdLocked ? (
              <Link to="/premium" className="btn-brand mt-5 inline-flex !px-5 !py-2.5">
                Upgrade to unlock
              </Link>
            ) : (
              <Link to={d.hrefFor(d.potd.id, d.potd.type)} className="btn-brand mt-5 inline-flex !px-5 !py-2.5">
                {d.potdDone ? "Solve again" : "Solve now"}
              </Link>
            )}
          </ThemeCard>
        )}
        {d.lastQuestion ? (
          <ThemeCard tone="quiet">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-mute">
              <Undo2 size={12} />
              Jump back in
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{d.lastQuestion.title}</h2>
            <p className="mt-2 text-sm text-mute">
              Last submit · {typeLabel(d.lastQuestion.type)}
              {d.lastView ? ` · ${viewLabel(d.lastView)}` : ""}
            </p>
            <Link
              to={d.hrefFor(d.lastQuestion.id, d.lastQuestion.type, d.lastView)}
              className="btn-ghost mt-5 inline-flex !px-5 !py-2.5"
            >
              Resume
            </Link>
          </ThemeCard>
        ) : (
          <ThemeCard tone="quiet" className="border-dashed">
            <p className="label-caps">Jump back in</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">No save yet</h2>
            <p className="mt-2 text-sm text-mute">Submit any problem and this tile becomes your resume button.</p>
          </ThemeCard>
        )}
      </section>

      <ThemeCard tone="blue" className="mt-6">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-premium">
          <Map size={12} />
          Roadmap
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{d.pathRole} · 8 weeks</h2>
        <p className="mt-2 max-w-2xl text-sm text-mute">
          Week 1 is {d.path[0].title}. Each week deep-links into questions and sheets you already have.
        </p>
        <Link to={`/learn?role=${d.pathRole}`} className="btn-brand mt-5 inline-flex !px-5 !py-2.5">
          Open path
        </Link>
      </ThemeCard>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {d.gap && (
          <article className={`rounded-[24px] border border-line bg-gradient-to-br p-5 ${d.gap.accent}`}>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
              <Target size={12} />
              Weakest track
            </p>
            <h3 className="mt-2 text-lg font-bold">{d.gap.title}</h3>
            <p className="mt-1 text-sm text-mute">{d.gap.done} of {d.gap.total} submitted. Close the gap here first.</p>
            <Link to={d.gap.practice} className="mt-4 inline-block text-sm font-semibold text-brand">Train {typeLabel(d.gap.type)} →</Link>
          </article>
        )}
        {d.surprise && (
          <ThemeCard tone="violet" compact>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-fuchsia-400">
              <Shuffle size={12} />
              Surprise round
            </p>
            <h3 className="mt-2 line-clamp-2 text-lg font-bold">{d.surprise.title}</h3>
            <p className="mt-1 text-sm text-mute">{typeLabel(d.surprise.type)} · A random unpublished-for-you problem.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={d.hrefFor(d.surprise.id, d.surprise.type)} className="text-sm font-semibold text-brand">Open →</Link>
              <button type="button" onClick={d.shuffle} className="text-sm font-semibold text-mute hover:text-ink">
                Shuffle
              </button>
            </div>
          </ThemeCard>
        )}
        <ThemeCard tone="quiet" compact>
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
            <Sparkles size={12} />
            Coach note
          </p>
          <h3 className="mt-2 text-lg font-bold">Tip of the day</h3>
          <p className="mt-2 text-sm leading-6 text-mute">{d.tip}</p>
        </ThemeCard>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <ThemeCard tone="quiet">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="label-caps">Your report</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight">Prep snapshot</h2>
            </div>
            <Link to="/practice" className="text-sm font-semibold text-brand">All tracks</Link>
          </div>
          <div className="mt-5">
            <Donut
              value={d.completed}
              total={d.libraryTotal}
              label={`${d.completed} submitted across the library. Sheets and practice share this count.`}
            />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Sheets" value={`${d.sheetDone}/${d.sheetTotal}`} hint="fixed sets" />
            <Stat label="OA saved" value={`${d.oaCompleted}/${d.oaTotal}`} hint="timed rounds" />
            <Stat label="Today" value={`${d.todayDone}`} hint="unique submits" />
          </div>
        </ThemeCard>

        <ThemeCard tone="blue">
          <p className="label-caps">Badges</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">Earn the next one</h2>
          {d.nextBadge && (
            <div className="mt-4 rounded-2xl border border-brand/30 bg-brand/10 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-brand">Next unlock</p>
              <p className="mt-1 font-semibold">{d.nextBadge.title}</p>
              <div className="mt-2">
                <ProgressBar label={d.nextBadge.hint} value={d.nextBadge.value} total={d.nextBadge.total} />
              </div>
            </div>
          )}
          <div className="mt-4 grid gap-3">
            {d.badges.map((badge) => (
              <BadgeRow key={badge.title} earned={badge.earned} title={badge.title} detail={badge.detail} />
            ))}
          </div>
        </ThemeCard>
      </section>

      {(d.companyItems.length > 0 || d.oaSet) && (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {d.companyItems.length > 0 && (
            <ThemeCard tone="quiet">
              <p className="label-caps">Company drill</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight">{d.company} tagged problems</h2>
              <p className="mt-2 text-sm text-mute">From your target list. Clear these before a loop.</p>
              <div className="mt-4 grid gap-2">
                {d.companyItems.map((question) => (
                  <Link
                    key={question.id}
                    to={d.hrefFor(question.id, question.type)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-field px-4 py-3 hover:border-brand/40"
                  >
                    <span className="min-w-0 truncate font-semibold">{question.title}</span>
                    <span className="shrink-0 text-xs text-mute">{typeLabel(question.type)}</span>
                  </Link>
                ))}
              </div>
            </ThemeCard>
          )}
          {d.oaSet && (
            <ThemeCard tone="blue">
              <p className="label-caps">Simulate pressure</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight">{d.oaSet.title}</h2>
              <p className="mt-2 text-sm text-mute">
                {d.oaSet.durationMinutes} min · {d.oaSet.questionCount} questions · camera on. Closest thing to a company OA.
              </p>
              <Link to={practicePath(QuestionType.OA)} className="btn-ghost mt-5 inline-flex !px-5 !py-2.5">
                Enter OA lobby
              </Link>
            </ThemeCard>
          )}
        </section>
      )}

      <section className="mt-6">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="label-caps">Playbooks</p>
            <h2 className="mt-1 text-xl font-extrabold tracking-tight">Pick a mode. Come back tomorrow.</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {d.playbooks.map((track) => {
            const Icon = track.Icon;
            return (
              <article
                key={track.type}
                className={`group flex h-full flex-col rounded-[24px] border border-line bg-gradient-to-br p-5 transition hover:-translate-y-0.5 hover:border-brand/40 ${track.accent}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${track.chip}`}>
                    <Icon size={18} />
                  </span>
                  <span className="text-2xl font-extrabold tabular-nums text-ink">{track.pct}%</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{track.title}</h3>
                <p className="mt-1 text-sm leading-6 text-mute">{track.hook}</p>
                <div className="mt-4">
                  <ProgressBar label={`${track.value}/${track.total}`} value={track.value} total={track.total} />
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Link to={track.practice} className="btn-ghost !px-4 !py-2 text-sm group-hover:border-brand/40">
                    Play
                  </Link>
                  {track.sheet && (
                    <Link to={track.sheet} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-card/80 px-4 py-2 text-sm font-semibold hover:border-brand/40">
                      <ListChecks size={14} className="text-brand" />
                      Sheet
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {d.queue.length > 0 && (
        <ThemeCard tone="quiet" className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="label-caps">Queue</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight">Don&apos;t break the chain</h2>
            </div>
            <Link to="/practice/DSA" className="text-sm font-semibold text-brand">More DSA</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {d.queue.map((question, index) => (
              <Link
                key={question.id}
                to={d.hrefFor(question.id, question.type)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-field px-4 py-3.5 transition hover:border-brand/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{index + 1}. {question.title}</p>
                  <p className="mt-0.5 text-xs text-mute">{question.difficulty ? difficultyLabel(question.difficulty) : typeLabel(QuestionType.DSA)}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-brand">Go →</span>
              </Link>
            ))}
          </div>
        </ThemeCard>
      )}
    </Layout>
  );
}

function WeekStrip({ week }) {
  return (
    <div className="flex items-center justify-between gap-1 rounded-2xl border border-line bg-field px-3 py-2.5">
      {week.map((on, index) => (
        <div key={DAY_LABELS[index]} className="flex flex-col items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded-full ${on ? "bg-brand shadow-[0_0_10px_rgba(249,115,22,0.8)]" : "bg-line"}`} />
          <span className="text-[10px] font-semibold text-mute">{DAY_LABELS[index]}</span>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-field px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
      <p className="text-xs text-mute">{hint}</p>
    </div>
  );
}

function BadgeRow({ earned, title, detail }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 ${earned ? "border-brand/30 bg-brand/10" : "border-line bg-field"}`}>
      <Sparkles size={16} className={`mt-0.5 ${earned ? "text-brand" : "text-mute"}`} />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-mute">{earned ? "Unlocked" : detail}</p>
      </div>
    </div>
  );
}

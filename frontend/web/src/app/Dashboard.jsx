import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Camera,
  Code2,
  Flame,
  LayoutTemplate,
  ListChecks,
  BookOpen,
  Map,
  Network,
  Puzzle,
  Shuffle,
  Sparkles,
  Target,
  Undo2,
  Zap,
} from "lucide-react";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import { DifficultyBadge } from "../components/QuestionMeta";
import { completedSet, countCompleted, Donut, ProgressBar } from "../components/ProgressCharts";
import { contentApi, userApi, authApi } from "../services/api";
import { ROADMAPS, roleFromProfile } from "../data/roadmaps";

const TRACKS = [
  {
    type: "HLD",
    title: "System Design",
    hook: "Design systems interviewers actually ask.",
    practice: "/practice/HLD",
    sheet: "/sheets/hld-core-sheet",
    Icon: Network,
    accent: "from-orange-500/20 to-amber-500/5",
  },
  {
    type: "LLD",
    title: "Low Level Design",
    hook: "Ship OOP and machine-coding in a real editor.",
    practice: "/practice/LLD",
    sheet: "/sheets/lld-machine-coding",
    Icon: Puzzle,
    accent: "from-sky-500/20 to-cyan-500/5",
  },
  {
    type: "DSA",
    title: "DSA",
    hook: "Run testcases. Chase the next Accepted.",
    practice: "/practice/DSA",
    sheet: "/sheets/dsa-sde-sheet",
    Icon: Code2,
    accent: "from-emerald-500/20 to-teal-500/5",
  },
  {
    type: "FRONTEND",
    title: "Frontend",
    hook: "Build UI with live desktop and mobile preview.",
    practice: "/practice/FRONTEND",
    sheet: "/sheets/frontend-ui-sheet",
    Icon: LayoutTemplate,
    accent: "from-fuchsia-500/20 to-pink-500/5",
  },
  {
    type: "CS",
    title: "CS Fundamentals",
    hook: "Short OS, DBMS, OOP, and networks quizzes.",
    practice: "/practice/CS",
    Icon: BookOpen,
    accent: "from-lime-500/20 to-emerald-500/5",
  },
  {
    type: "OA",
    title: "Online Assessment",
    hook: "Timed, camera-gated DSA — like the real OA.",
    practice: "/practice/OA",
    Icon: Camera,
    accent: "from-blue-500/20 to-indigo-500/5",
  },
];

const RANKS = [
  { name: "Day one", xp: 0 },
  { name: "Building", xp: 1 },
  { name: "On a roll", xp: 8 },
  { name: "Interview ready", xp: 20 },
];

const QUEST_TYPES = ["DSA", "HLD", "LLD", "FRONTEND", "CS"];
const DAY_LABELS = ["6d", "5d", "4d", "3d", "2d", "Y", "T"];
const WEEK_GOAL = 5;
const TIPS = [
  "Talk out loud. Interviewers grade the path, not only the final answer.",
  "For HLD, lock users, QPS, and storage before you draw a single box.",
  "Write brute force first. Then name the bottleneck in one sentence.",
  "In LLD, list classes and ownership before you open the editor.",
  "Dry-run one example on paper. Most bugs show up there.",
  "Frontend rounds: make the empty, loading, and error states obvious.",
  "CS quizzes: commit to an answer before you peek. Phone screens love OS and DBMS.",
  "OA timing: skip a stuck problem after 12 minutes. Come back later.",
  "End every design with trade-offs. That is the senior signal.",
];

export default function Dashboard() {
  const questType = QUEST_TYPES[new Date().getDay() % QUEST_TYPES.length];
  const [shuffle, setShuffle] = useState(0);
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: userApi.profile });
  const meQuery = useQuery({ queryKey: ["me"], queryFn: authApi.me });
  const goalsQuery = useQuery({ queryKey: ["goals"], queryFn: userApi.goals });
  const progressQuery = useQuery({ queryKey: ["practice-progress"], queryFn: userApi.practiceProgress });
  const sheetsQuery = useQuery({ queryKey: ["sheets"], queryFn: () => contentApi.sheets() });
  const oaQuery = useQuery({ queryKey: ["assessment-sets"], queryFn: contentApi.assessmentSets });
  const questQuery = useQuery({
    queryKey: ["quest", questType],
    queryFn: () => contentApi.questions({ type: questType, limit: 8, page: 1 }),
  });
  const continueQuery = useQuery({
    queryKey: ["continue"],
    queryFn: () => contentApi.questions({ type: "DSA", limit: 8, page: 1 }),
  });
  const libraryQuery = useQuery({
    queryKey: ["library-totals"],
    queryFn: async () => {
      const types = ["HLD", "LLD", "DSA", "FRONTEND", "CS"];
      const pages = await Promise.all(types.map((type) => contentApi.questions({ type, page: 1, limit: 1 })));
      return Object.fromEntries(types.map((type, index) => [type, pages[index]?.data?.total || 0]));
    },
  });
  const goals = goalsQuery.data?.data;
  const progress = progressQuery.data?.data;
  const company = (goals?.targetCompanies || [])[0];
  const companyQuery = useQuery({
    queryKey: ["company-drill", company],
    queryFn: () => contentApi.questions({ company, limit: 5, page: 1 }),
    enabled: Boolean(company),
  });
  const lastQuery = useQuery({
    queryKey: ["question", progress?.lastQuestionId],
    queryFn: () => contentApi.question(progress.lastQuestionId),
    enabled: Boolean(progress?.lastQuestionId),
  });

  const profile = profileQuery.data?.data;
  const email = meQuery.data?.data?.email;
  const done = completedSet(progress);
  const sheets = sheetsQuery.data?.data ?? [];
  const assessments = oaQuery.data?.data ?? [];
  const questPool = questQuery.data?.data?.items ?? [];
  const items = continueQuery.data?.data?.items ?? [];
  const library = libraryQuery.data || {};
  const companies = (goals?.targetCompanies || []).slice(0, 3);

  const firstName = (profile?.name || "there").split(" ")[0];
  const byType = Object.fromEntries((progress?.byType || []).map((item) => [item.type, item.completed]));
  const libraryTotal = ["HLD", "LLD", "DSA", "FRONTEND", "CS"].reduce((sum, type) => sum + (library[type] || 0), 0);
  const completed = progress?.completed || 0;
  const sheetIds = [...new Set(sheets.flatMap((sheet) => sheet.questionIds || []))];
  const sheetDone = countCompleted(sheetIds, done);
  const oaTotal = assessments.reduce((sum, set) => sum + (set.questionCount || 0), 0);
  const nextQuest = questPool.filter((item) => !done.has(item.id));
  const quest = nextQuest[0] || questPool[0];
  const queue = items.filter((item) => !done.has(item.id)).slice(0, 4);
  const companyItems = (companyQuery.data?.data?.items ?? []).filter((item) => !done.has(item.id)).slice(0, 3);
  const lastQuestion = lastQuery.data?.data;
  const streak = progress?.streakDays || 0;
  const todayDone = progress?.todayCompleted || 0;
  const weekDone = progress?.weekCompleted || 0;
  const week = progress?.weekActive?.length === 7 ? progress.weekActive : Array(7).fill(false);
  const xp = rankProgress(completed);
  const nudge = streakNudge(streak, todayDone);
  const gap = weakestTrack(byType, library);
  const nextBadge = nextBadgeFor({ completed, streak, hld: byType.HLD || 0, sheetDone });
  const tip = TIPS[new Date().getDate() % TIPS.length];
  const surprisePool = useMemo(
    () => [...questPool, ...items].filter((item, index, list) => !done.has(item.id) && list.findIndex((row) => row.id === item.id) === index),
    [questPool, items, progress?.questionIds],
  );
  const surprise = surprisePool.length ? surprisePool[(daySeed() + shuffle) % surprisePool.length] : null;
  const oaSet = assessments[0];
  const pathRole = roleFromProfile(profile?.targetRole);
  const path = ROADMAPS[pathRole] || ROADMAPS["SDE-1"];

  return (
    <Layout>
      <section className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-5">
          <Avatar name={profile?.name} email={email} size="lg" square />
          <div className="min-w-0 flex-1">
            <p className="font-hand text-2xl text-brand">{greeting()}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{firstName}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-mute">{nudge}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                {xp.name}
              </span>
              {profile?.targetRole && (
                <Link to="/learn" className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-ink hover:bg-white/10">
                  {profile.targetRole} path
                </Link>
              )}
              {companies.map((name) => (
                <span key={name} className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-mute">{name}</span>
              ))}
            </div>
            <div className="mt-4 max-w-md">
              <ProgressBar
                label={xp.next ? `${xp.toNext} more to ${xp.next}` : "Max rank unlocked"}
                value={xp.value}
                total={xp.total}
              />
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[220px]">
            <div className={`rounded-2xl border px-4 py-3 ${streak ? "border-brand/40 bg-brand/10" : "border-line bg-white/5"}`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-mute">
                <Flame size={14} className={streak ? "text-brand" : "text-mute"} />
                Streak
              </div>
              <p className="mt-1 text-3xl font-extrabold tracking-tight">
                {streak}
                <span className="ml-1 text-sm font-semibold text-mute">day{streak === 1 ? "" : "s"}</span>
              </p>
              <p className="mt-1 text-xs text-mute">{todayDone ? `${todayDone} submitted today` : "Submit once to keep it"}</p>
            </div>
            <WeekStrip week={week} />
            <div className="rounded-2xl border border-line bg-white/5 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-mute">This week</p>
              <p className="mt-1 text-lg font-extrabold">{weekDone}/{WEEK_GOAL}</p>
              <ProgressBar label="Weekly quest" value={Math.min(weekDone, WEEK_GOAL)} total={WEEK_GOAL} />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {quest && (
          <article className="overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-brand/15 via-card to-card p-6">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              <Zap size={12} />
              Today&apos;s {questType} quest
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{quest.title}</h2>
            <div className="mt-2">
              <DifficultyBadge difficulty={quest.difficulty} />
            </div>
            <p className="mt-3 text-sm text-mute">One focused round. Submit it to protect the streak.</p>
            <Link to={hrefFor(quest.id, quest.type)} className="btn-brand mt-5 inline-flex !px-5 !py-2.5">
              Solve now
            </Link>
          </article>
        )}
        {lastQuestion ? (
          <article className="rounded-[28px] border border-line bg-card p-6">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-mute">
              <Undo2 size={12} />
              Jump back in
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{lastQuestion.title}</h2>
            <p className="mt-2 text-sm text-mute">
              Last submit · {lastQuestion.type}
              {progress?.lastView ? ` · ${progress.lastView}` : ""}
            </p>
            <Link
              to={hrefFor(lastQuestion.id, lastQuestion.type, progress?.lastView)}
              className="btn-ghost mt-5 inline-flex !px-5 !py-2.5"
            >
              Resume
            </Link>
          </article>
        ) : (
          <article className="rounded-[28px] border border-dashed border-line bg-card p-6">
            <p className="label-caps">Jump back in</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">No save yet</h2>
            <p className="mt-2 text-sm text-mute">Submit any problem and this tile becomes your resume button.</p>
          </article>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-[28px] border border-line bg-gradient-to-br from-brand/15 via-card to-card p-6">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
          <Map size={12} />
          Roadmap
        </p>
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{pathRole} · 8 weeks</h2>
        <p className="mt-2 max-w-2xl text-sm text-mute">
          Week 1 is {path[0].title}. Each week deep-links into questions and sheets you already have.
        </p>
        <Link to={`/learn?role=${pathRole}`} className="btn-brand mt-5 inline-flex !px-5 !py-2.5">
          Open path
        </Link>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {gap && (
          <article className="rounded-[24px] border border-line bg-card p-5">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
              <Target size={12} />
              Weakest track
            </p>
            <h3 className="mt-2 text-lg font-bold">{gap.title}</h3>
            <p className="mt-1 text-sm text-mute">{gap.done} of {gap.total} submitted. Close the gap here first.</p>
            <Link to={gap.practice} className="mt-4 inline-block text-sm font-semibold text-brand">Train {gap.type} →</Link>
          </article>
        )}
        {surprise && (
          <article className="rounded-[24px] border border-line bg-card p-5">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
              <Shuffle size={12} />
              Surprise round
            </p>
            <h3 className="mt-2 line-clamp-2 text-lg font-bold">{surprise.title}</h3>
            <p className="mt-1 text-sm text-mute">{surprise.type} · A random unpublished-for-you problem.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={hrefFor(surprise.id, surprise.type)} className="text-sm font-semibold text-brand">Open →</Link>
              <button type="button" onClick={() => setShuffle((n) => n + 1)} className="text-sm font-semibold text-mute hover:text-ink">
                Shuffle
              </button>
            </div>
          </article>
        )}
        <article className="rounded-[24px] border border-line bg-card p-5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
            <Sparkles size={12} />
            Coach note
          </p>
          <h3 className="mt-2 text-lg font-bold">Tip of the day</h3>
          <p className="mt-2 text-sm leading-6 text-mute">{tip}</p>
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[28px] border border-line bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="label-caps">Your report</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight">Prep snapshot</h2>
            </div>
            <Link to="/practice" className="text-sm font-semibold text-brand">All tracks</Link>
          </div>
          <div className="mt-5">
            <Donut
              value={completed}
              total={libraryTotal}
              label={`${completed} submitted across the library. Sheets and practice share this count.`}
            />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Sheets" value={`${sheetDone}/${sheetIds.length || 0}`} hint="fixed sets" />
            <Stat label="OA saved" value={`${progress?.oaCompleted || 0}/${oaTotal || 0}`} hint="timed rounds" />
            <Stat label="Today" value={`${todayDone}`} hint="unique submits" />
          </div>
        </article>

        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="label-caps">Badges</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">Earn the next one</h2>
          {nextBadge && (
            <div className="mt-4 rounded-2xl border border-brand/30 bg-brand/10 p-3">
              <p className="text-xs font-bold uppercase tracking-wide text-brand">Next unlock</p>
              <p className="mt-1 font-semibold">{nextBadge.title}</p>
              <div className="mt-2">
                <ProgressBar label={nextBadge.hint} value={nextBadge.value} total={nextBadge.total} />
              </div>
            </div>
          )}
          <div className="mt-4 grid gap-3">
            <BadgeRow earned={completed >= 1} title="First submit" detail="Log any practice answer" />
            <BadgeRow earned={streak >= 3} title="On a streak" detail="Show up 3 days in a row" />
            <BadgeRow earned={completed >= 5} title="Warm-up complete" detail="Submit 5 unique questions" />
            <BadgeRow earned={(byType.HLD || 0) >= 1} title="System designer" detail="Submit one HLD design" />
            <BadgeRow earned={sheetDone >= 3} title="Sheet hunter" detail="Finish 3 sheet problems" />
          </div>
        </article>
      </section>

      {(companyItems.length > 0 || oaSet) && (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          {companyItems.length > 0 && (
            <article className="rounded-[28px] border border-line bg-card p-6">
              <p className="label-caps">Company drill</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight">{company} tagged problems</h2>
              <p className="mt-2 text-sm text-mute">From your target list. Clear these before a loop.</p>
              <div className="mt-4 grid gap-2">
                {companyItems.map((question) => (
                  <Link
                    key={question.id}
                    to={hrefFor(question.id, question.type)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line px-4 py-3 hover:border-brand/40"
                  >
                    <span className="min-w-0 truncate font-semibold">{question.title}</span>
                    <span className="shrink-0 text-xs text-mute">{question.type}</span>
                  </Link>
                ))}
              </div>
            </article>
          )}
          {oaSet && (
            <article className="rounded-[28px] border border-line bg-gradient-to-br from-blue-500/15 via-card to-card p-6">
              <p className="label-caps">Simulate pressure</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight">{oaSet.title}</h2>
              <p className="mt-2 text-sm text-mute">
                {oaSet.durationMinutes} min · {oaSet.questionCount} questions · camera on. Closest thing to a company OA.
              </p>
              <Link to="/practice/OA" className="btn-ghost mt-5 inline-flex !px-5 !py-2.5">
                Enter OA lobby
              </Link>
            </article>
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
          {TRACKS.map((track) => {
            const value = track.type === "OA" ? (progress?.oaCompleted || 0) : (byType[track.type] || 0);
            const total = track.type === "OA" ? oaTotal : (library[track.type] || 0);
            const pct = total ? Math.round((100 * value) / total) : 0;
            const Icon = track.Icon;
            return (
              <article
                key={track.type}
                className={`group flex flex-col rounded-[24px] border border-line bg-gradient-to-br ${track.accent} p-5 transition hover:-translate-y-0.5 hover:border-brand/40`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/20 text-ink">
                    <Icon size={18} />
                  </span>
                  <span className="text-2xl font-extrabold tabular-nums text-ink">{pct}%</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{track.title}</h3>
                <p className="mt-1 text-sm leading-6 text-mute">{track.hook}</p>
                <div className="mt-4">
                  <ProgressBar label={`${value}/${total}`} value={value} total={total} />
                </div>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Link to={track.practice} className="btn-ghost !px-4 !py-2 text-sm group-hover:border-brand/40">
                    Play
                  </Link>
                  {track.sheet && (
                    <Link to={track.sheet} className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10">
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

      {queue.length > 0 && (
        <section className="mt-6 rounded-[28px] border border-line bg-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="label-caps">Queue</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight">Don&apos;t break the chain</h2>
            </div>
            <Link to="/practice/DSA" className="text-sm font-semibold text-brand">More DSA</Link>
          </div>
          <div className="mt-4 grid gap-3">
            {queue.map((question, index) => (
              <Link
                key={question.id}
                to={hrefFor(question.id, question.type)}
                className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 transition hover:border-brand/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{index + 1}. {question.title}</p>
                  <p className="mt-0.5 text-xs text-mute">{question.difficulty || "DSA"}</p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-brand">Go →</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Layout>
  );
}

function hrefFor(id, type, view) {
  if (type === "HLD") {
    return view ? `/questions/${id}?view=${view}` : `/questions/${id}`;
  }
  if (type === "CS") return `/questions/${id}`;
  if (type === "OA") return "/practice/OA";
  return `/questions/${id}?view=code`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning session";
  if (hour < 17) return "Afternoon grind";
  return "Night round";
}

function rankProgress(completed) {
  let current = RANKS[0];
  let next = RANKS[1];
  for (let i = 0; i < RANKS.length; i += 1) {
    if (completed >= RANKS[i].xp) {
      current = RANKS[i];
      next = RANKS[i + 1] || null;
    }
  }
  if (!next) {
    return { name: current.name, value: 1, total: 1, next: "", toNext: 0 };
  }
  return {
    name: current.name,
    value: completed - current.xp,
    total: next.xp - current.xp,
    next: next.name,
    toNext: Math.max(next.xp - completed, 0),
  };
}

function weakestTrack(byType, library) {
  return TRACKS.filter((track) => track.type !== "OA")
    .map((track) => {
      const total = library[track.type] || 0;
      const done = byType[track.type] || 0;
      return { ...track, total, done, pct: total ? done / total : 1 };
    })
    .sort((a, b) => a.pct - b.pct || a.total - b.total)[0];
}

function nextBadgeFor({ completed, streak, hld, sheetDone }) {
  const badges = [
    { title: "First submit", value: completed, total: 1, hint: "Submit 1 question" },
    { title: "On a streak", value: streak, total: 3, hint: "3 days in a row" },
    { title: "Warm-up complete", value: completed, total: 5, hint: "5 unique submits" },
    { title: "System designer", value: hld, total: 1, hint: "Submit 1 HLD" },
    { title: "Sheet hunter", value: sheetDone, total: 3, hint: "3 sheet problems" },
  ];
  return badges.find((badge) => badge.value < badge.total) || null;
}

function streakNudge(streak, todayDone) {
  if (todayDone > 0 && streak > 1) {
    return `Streak is safe. ${streak} days live — one more problem makes tomorrow easier.`;
  }
  if (todayDone > 0) {
    return "Logged for today. Come back tomorrow and start a real streak.";
  }
  if (streak > 0) {
    return `You have a ${streak}-day streak. Submit once today so it does not reset.`;
  }
  return "Submit one problem today. Streaks, badges, and your report all start from that.";
}

function daySeed() {
  const now = new Date();
  return now.getFullYear() * 1000 + now.getMonth() * 40 + now.getDate();
}

function WeekStrip({ week }) {
  return (
    <div className="flex items-center justify-between gap-1 rounded-2xl border border-line bg-white/5 px-3 py-2.5">
      {week.map((on, index) => (
        <div key={DAY_LABELS[index]} className="flex flex-col items-center gap-1">
          <span className={`h-2.5 w-2.5 rounded-full ${on ? "bg-brand shadow-[0_0_10px_rgba(249,115,22,0.8)]" : "bg-white/15"}`} />
          <span className="text-[10px] font-semibold text-mute">{DAY_LABELS[index]}</span>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-white/5 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</p>
      <p className="mt-1 text-xl font-extrabold">{value}</p>
      <p className="text-xs text-mute">{hint}</p>
    </div>
  );
}

function BadgeRow({ earned, title, detail }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border px-3 py-2.5 ${earned ? "border-brand/30 bg-brand/10" : "border-line bg-white/5"}`}>
      <Sparkles size={16} className={`mt-0.5 ${earned ? "text-brand" : "text-mute"}`} />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-mute">{earned ? "Unlocked" : detail}</p>
      </div>
    </div>
  );
}

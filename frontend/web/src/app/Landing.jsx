import { Link } from "react-router-dom";
import {
  BookOpen,
  Camera,
  Code2,
  Flame,
  LayoutTemplate,
  ListChecks,
  Network,
  Puzzle,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Layout from "../components/Layout";
import { useAuthStore } from "../stores/authStore";

const TRACKS = [
  {
    type: "HLD",
    title: "System Design",
    hook: "Blueprint or whiteboard. Submit canvas, math, and trade-offs.",
    to: "/practice/HLD",
    sheet: "/sheets/hld-core-sheet",
    Icon: Network,
    accent: "from-orange-500/20 to-amber-500/5",
  },
  {
    type: "LLD",
    title: "Low Level Design",
    hook: "OOP and machine-coding in a real multi-file editor.",
    to: "/practice/LLD",
    sheet: "/sheets/lld-machine-coding",
    Icon: Puzzle,
    accent: "from-sky-500/20 to-cyan-500/5",
  },
  {
    type: "DSA",
    title: "DSA",
    hook: "Run testcases. Chase the next Accepted.",
    to: "/practice/DSA",
    sheet: "/sheets/dsa-sde-sheet",
    Icon: Code2,
    accent: "from-emerald-500/20 to-teal-500/5",
  },
  {
    type: "FRONTEND",
    title: "Frontend",
    hook: "React UI with live desktop and mobile preview.",
    to: "/practice/FRONTEND",
    sheet: "/sheets/frontend-ui-sheet",
    Icon: LayoutTemplate,
    accent: "from-fuchsia-500/20 to-pink-500/5",
  },
  {
    type: "CS",
    title: "CS Fundamentals",
    hook: "Short OS, DBMS, OOP, and networks quizzes.",
    to: "/practice/CS",
    Icon: BookOpen,
    accent: "from-lime-500/20 to-emerald-500/5",
  },
  {
    type: "OA",
    title: "Online Assessment",
    hook: "Timed, camera-gated DSA — like the real OA.",
    to: "/practice/OA",
    Icon: Camera,
    accent: "from-blue-500/20 to-indigo-500/5",
  },
];

const SHEETS = [
  {
    tag: "HLD",
    title: "HLD Core Sheet",
    detail: "URL shorteners, feeds, chat, and streaming — worked in order.",
    to: "/sheets/hld-core-sheet",
    accent: "from-orange-500/15 via-card to-card",
  },
  {
    tag: "LLD",
    title: "LLD Machine Coding",
    detail: "Parking lots, caches, and booking systems in a multi-file editor.",
    to: "/sheets/lld-machine-coding",
    accent: "from-sky-500/15 via-card to-card",
  },
  {
    tag: "DSA",
    title: "SDE-1 DSA Sheet",
    detail: "Arrays, hashing, search, graphs, and backtracking.",
    to: "/sheets/dsa-sde-sheet",
    accent: "from-emerald-500/15 via-card to-card",
  },
  {
    tag: "FRONTEND",
    title: "Frontend UI Sheet",
    detail: "Todo, feeds, and pixel-perfect UI with desktop and mobile preview.",
    to: "/sheets/frontend-ui-sheet",
    accent: "from-fuchsia-500/15 via-card to-card",
  },
];

const PATH = [
  { step: "01", title: "DSA", detail: "Patterns, testcases, and speed.", to: "/learn?role=SDE-1" },
  { step: "02", title: "LLD", detail: "Classes, ownership, machine coding.", to: "/learn?role=SDE-1" },
  { step: "03", title: "HLD", detail: "Users, QPS, and trade-offs.", to: "/learn?role=SDE-2" },
  { step: "04", title: "Frontend + CS", detail: "UI rounds and phone-screen quizzes.", to: "/learn" },
  { step: "05", title: "OA", detail: "Timed sets with the camera on.", to: "/practice/OA" },
];

const COMPANIES = ["Google", "Meta", "Amazon", "Netflix", "Uber", "Microsoft", "Airbnb"];

const FAQS = [
  {
    q: "What can I practice on Tyyari?",
    a: "DSA, High-Level Design, Low-Level Design, frontend machine coding, CS fundamentals quizzes, and camera-gated online assessments. Filter by company, topic, and difficulty.",
  },
  {
    q: "Practice vs sheets?",
    a: "Practice is the full library. Sheets are fixed sets — the same list for every user — so you can grind a track in order.",
  },
  {
    q: "Is there a roadmap?",
    a: "Yes. Learn opens an 8-week SDE-1 or SDE-2 path. Each week links into existing DSA, HLD, LLD, CS, frontend, and OA items. Progress is your practice submits.",
  },
  {
    q: "Is there an AI mock interviewer?",
    a: "Not in this phase. You get the question library, sheets, and guided practice rounds. Mock interviews here open curated questions — not a live AI interviewer.",
  },
  {
    q: "What is free vs Premium?",
    a: "Phase 1 is the practice library. Upgrade to Premium is visual only for now — no payments. You keep access to published questions after you create an account.",
  },
];

export default function Landing() {
  const authed = Boolean(useAuthStore((s) => s.accessToken));
  const primaryTo = authed ? "/dashboard" : "/register";
  const primaryLabel = authed ? "Open dashboard" : "Get started free";

  return (
    <Layout publicPage>
      <section className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="font-hand text-2xl text-brand">Built with and for engineers</p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl sm:leading-[1.08]">
              Interview prep that feels like a real session.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-mute sm:text-base">
              Tyyari is an SDE workspace: DSA with testcases, HLD on a blueprint, LLD in a multi-file editor, frontend preview, CS quizzes, and timed camera OAs.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={primaryTo} className="btn-brand !px-6 !py-3">{primaryLabel}</Link>
              <Link to={authed ? "/practice" : "/login"} className="btn-ghost !px-6 !py-3">
                {authed ? "Open practice" : "I already have an account"}
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {COMPANIES.map((name) => (
                <span key={name} className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-mute">{name}</span>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-brand/40 bg-brand/10 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-mute">
                <Flame size={14} className="text-brand" />
                Daily loop
              </div>
              <p className="mt-1 text-3xl font-extrabold tracking-tight">6 tracks</p>
              <p className="mt-1 text-xs text-mute">Submit once. Streak, badges, and the report all start there.</p>
            </div>
            <div className="flex items-center justify-between gap-1 rounded-2xl border border-line bg-white/5 px-3 py-2.5">
              {["DSA", "HLD", "LLD", "UI", "CS", "OA"].map((label, index) => (
                <div key={label} className="flex flex-col items-center gap-1">
                  <span className={`h-2.5 w-2.5 rounded-full ${index < 4 ? "bg-brand shadow-[0_0_10px_rgba(249,115,22,0.8)]" : "bg-white/15"}`} />
                  <span className="text-[10px] font-semibold text-mute">{label}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-line bg-white/5 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-mute">What you get</p>
              <p className="mt-1 text-lg font-extrabold">Practice + sheets + OA</p>
              <p className="text-xs text-mute">Library for browsing. Sheets for order. OA for pressure.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <article className="overflow-hidden rounded-[24px] border border-line bg-gradient-to-br from-brand/15 via-card to-card p-5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            <Zap size={12} />
            Today&apos;s quest
          </p>
          <h3 className="mt-2 text-lg font-bold">One focused round</h3>
          <p className="mt-1 text-sm leading-6 text-mute">Dashboard rotates a DSA, HLD, LLD, Frontend, or CS problem so you always have a next move.</p>
        </article>
        <article className="rounded-[24px] border border-line bg-card p-5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
            <Target size={12} />
            Weakest track
          </p>
          <h3 className="mt-2 text-lg font-bold">Close the gap first</h3>
          <p className="mt-1 text-sm leading-6 text-mute">Progress is unique practice submits. Sheets and the dashboard share that count.</p>
        </article>
        <article className="rounded-[24px] border border-line bg-card p-5">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
            <Sparkles size={12} />
            Coach note
          </p>
          <h3 className="mt-2 text-lg font-bold">Talk the path</h3>
          <p className="mt-1 text-sm leading-6 text-mute">Interviewers grade how you get there — not only the final answer.</p>
        </article>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <p className="label-caps">Playbooks</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Pick a mode. Come back tomorrow.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TRACKS.map((track) => {
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
                  <span className="text-xs font-bold uppercase tracking-[0.14em] text-mute">{track.type}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold">{track.title}</h3>
                <p className="mt-1 text-sm leading-6 text-mute">{track.hook}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  <Link to={track.to} className="btn-ghost !px-4 !py-2 text-sm group-hover:border-brand/40">
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

      <section className="mt-8">
        <p className="label-caps">Your path</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">From coding basics to pressure rounds</h2>
        <p className="mt-2 max-w-2xl text-sm text-mute">
          An 8-week SDE-1 or SDE-2 plan that opens the same questions and sheets as Practice.{" "}
          <Link to="/learn" className="font-semibold text-brand">Open the roadmap →</Link>
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PATH.map((item) => (
            <Link key={item.step} to={item.to} className="rounded-[24px] border border-line bg-card p-5 transition hover:-translate-y-0.5 hover:border-brand/40">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-brand text-sm font-extrabold text-white">
                {item.step}
              </span>
              <p className="mt-3 font-bold">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-mute">{item.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <p className="label-caps">Curated sets</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Sheets are a fixed grind</h2>
        <p className="mt-2 max-w-2xl text-sm text-mute">Same list for every user. Practice is the full library if you want to browse everything.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {SHEETS.map((sheet) => (
            <Link
              key={sheet.tag}
              to={sheet.to}
              className={`group rounded-[24px] border border-line bg-gradient-to-br ${sheet.accent} p-6 transition hover:-translate-y-0.5 hover:border-brand/40`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{sheet.tag}</span>
                <ListChecks size={16} className="text-brand" />
              </div>
              <h3 className="mt-3 text-xl font-bold">{sheet.title}</h3>
              <p className="mt-2 text-sm leading-6 text-mute">{sheet.detail}</p>
              <span className="mt-5 inline-block text-sm font-semibold text-brand group-hover:underline">Open sheet →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="rounded-[28px] border border-line bg-gradient-to-br from-blue-500/15 via-card to-card p-6">
          <p className="label-caps">Simulate pressure</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">Camera-gated OA</h2>
          <p className="mt-2 text-sm leading-6 text-mute">
            Timed DSA sets with a camera check before you enter. Closest thing to a company online assessment.
          </p>
          <Link to="/practice/OA" className="btn-ghost mt-5 inline-flex !px-5 !py-2.5">
            Enter OA lobby
          </Link>
        </article>
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="label-caps">How scoring works</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight">One submit. Same progress.</h2>
          <p className="mt-2 text-sm leading-6 text-mute">
            Practice submits count toward sheets, streaks, and the dashboard report. CS quizzes save a score the same way. OA stays separate so a timed round does not mark the library done.
          </p>
          <Link to={primaryTo} className="mt-5 inline-block text-sm font-semibold text-brand">
            {authed ? "See your report →" : "Create an account →"}
          </Link>
        </article>
      </section>

      <section className="mt-8 rounded-[28px] border border-line bg-card p-6 sm:p-8">
        <p className="label-caps">FAQ</p>
        <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-line">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-4">
              <summary className="cursor-pointer list-none font-semibold marker:content-none">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-mute group-open:hidden">+</span>
                  <span className="hidden text-mute group-open:inline">−</span>
                </span>
              </summary>
              <p className="mt-2 text-sm leading-6 text-mute">{item.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to={primaryTo} className="btn-brand">{primaryLabel}</Link>
          {!authed && <Link to="/onboarding" className="btn-premium">View Premium</Link>}
        </div>
      </section>
    </Layout>
  );
}

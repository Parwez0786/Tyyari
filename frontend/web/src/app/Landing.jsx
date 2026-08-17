import { Link } from "react-router-dom";
import Layout from "../components/Layout";

const stats = [
  { value: "6", label: "Interview tracks" },
  { value: "HLD + LLD", label: "Design sheets" },
  { value: "50+", label: "Company tags" },
  { value: "Phase 1", label: "Practice library" },
];

const companies = ["Google", "Meta", "Amazon", "Netflix", "Uber", "Microsoft", "Airbnb"];

const roadmap = [
  { step: "1", title: "DSA Fundamentals", detail: "Arrays, trees, graphs, and dynamic programming." },
  { step: "2", title: "Low Level Design", detail: "Object-oriented patterns and machine coding." },
  { step: "3", title: "High Level Design", detail: "Scale systems with caching, sharding, and load balancing." },
  { step: "4", title: "Frontend & OA", detail: "UI challenges and timed online assessments." },
  { step: "5", title: "Mock rounds", detail: "Guided practice that feels like the real interview loop." },
];

const features = [
  {
    title: "Company-wise DSA",
    detail: "Filter questions by company, topic, and difficulty. Work through the same patterns asked at top tech companies.",
    to: "/practice/DSA",
    badge: "DSA",
  },
  {
    title: "System design sheets",
    detail: "Topic-wise HLD and LLD problems with clear progression — from URL shorteners to large-scale systems.",
    to: "/practice/HLD",
    badge: "HLD",
  },
  {
    title: "Frontend challenges",
    detail: "Machine-coding style UI problems for frontend rounds, with company and topic tags.",
    to: "/practice/FRONTEND",
    badge: "UI",
  },
  {
    title: "CS fundamentals",
    detail: "OS, DBMS, OOP, and networks — short theory prompts you can drill before a phone screen.",
    to: "/practice/CS",
    badge: "CS",
  },
];

const faqs = [
  {
    q: "What can I practice on Tyyari?",
    a: "DSA, High-Level Design, Low-Level Design, frontend machine coding, CS fundamentals, and online assessments. Filter by company, topic, tags, and difficulty.",
  },
  {
    q: "Is there an AI mock interviewer?",
    a: "Not in this phase. You get the question library, sheets, and guided practice rounds. Mock interviews here open curated questions — not a live AI interviewer.",
  },
  {
    q: "What is free vs Premium?",
    a: "Phase 1 is the practice library. Upgrade to Premium is visual only for now — no payments. You’ll keep access to published questions after you create an account.",
  },
  {
    q: "How do I start?",
    a: "Create an account with a valid email, confirm the inbox link, set your target role, then open a sheet or the question library.",
  },
];

export default function Landing() {
  return (
    <Layout publicPage>
      <section className="pb-6 pt-4 text-center sm:pb-10 sm:pt-8">
        <p className="label-caps">Built with and for engineers</p>
        <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-6xl sm:leading-[1.05]">
          Master DSA, System Design, and Frontend interviews.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-mute sm:text-lg">
          Tyyari is an interview-prep workspace for SDE rounds. One library for DSA, HLD, LLD, frontend, CS, and OAs — with company tags and progress-style sheets.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/register" className="btn-black !px-6 !py-3">Get started free</Link>
          <Link to="/practice/HLD" className="btn-ghost !px-6 !py-3">Browse HLD sheet</Link>
        </div>
        <p className="mt-5 font-hand text-2xl text-brand">Join engineers preparing with Tyyari</p>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-line bg-surface px-4 py-5 text-center">
            <p className="text-xl font-extrabold sm:text-2xl">{s.value}</p>
            <p className="mt-1 text-xs text-mute sm:text-sm">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.16em] text-mute">Trusted patterns from top companies</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {companies.map((c) => (
            <span key={c} className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-mute">
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <p className="label-caps">Your path</p>
        <h2 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight">From coding basics to system design</h2>
        <div className="mt-8 grid gap-3 md:grid-cols-5">
          {roadmap.map((item) => (
            <div key={item.step} className="rounded-2xl border border-line bg-surface p-4">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {item.step}
              </span>
              <p className="mt-3 font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-mute">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <p className="label-caps">Structured practice sheets</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight">System Design Sheet</h2>
        <p className="mt-2 max-w-2xl text-mute">Topic-wise HLD and LLD problem sheets with company tags and a clear progression.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <SheetCard
            tag="HLD"
            title="High Level Design Sheet"
            detail="Curated architecture problems from URL shorteners to large-scale systems."
            to="/practice/HLD"
          />
          <SheetCard
            tag="LLD"
            title="Low Level Design Sheet"
            detail="Machine-coding and OOP design problems. Progress from patterns to full interview systems."
            soon
          />
        </div>
      </section>

      <section className="mt-16">
        <p className="label-caps">One platform</p>
        <h2 className="mt-2 max-w-xl text-3xl font-extrabold tracking-tight">Complete preparation, one workspace</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {features.map((f) =>
            f.badge === "HLD" ? (
              <Link key={f.title} to={f.to} className="rounded-2xl border border-line bg-surface p-6 hover:border-brand/40">
                <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-brand dark:bg-orange-950/40">{f.badge}</span>
                <p className="mt-3 text-lg font-bold">{f.title}</p>
                <p className="mt-2 text-sm leading-6 text-mute">{f.detail}</p>
              </Link>
            ) : (
              <div key={f.title} className="rounded-2xl border border-line bg-surface p-6 opacity-70">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-brand dark:bg-orange-950/40">{f.badge}</span>
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mute">Coming soon</span>
                </div>
                <p className="mt-3 text-lg font-bold">{f.title}</p>
                <p className="mt-2 text-sm leading-6 text-mute">{f.detail}</p>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-line bg-surface p-8 sm:p-10">
        <p className="label-caps">FAQ</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Frequently asked questions</h2>
        <div className="mt-8 divide-y divide-line">
          {faqs.map((item) => (
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
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/register" className="btn-black">Start free</Link>
          <Link to="/onboarding" className="btn-premium">View Premium</Link>
        </div>
      </section>
    </Layout>
  );
}

function SheetCard({ tag, title, detail, to, soon }) {
  return (
    <div className={`rounded-3xl border border-line bg-surface p-6 ${soon ? "opacity-70" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{tag}</span>
        {soon && (
          <span className="rounded-full border border-line px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mute">Coming soon</span>
        )}
      </div>
      <h3 className="mt-3 text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-mute">{detail}</p>
      <div className="mt-4 flex gap-2 text-xs font-semibold text-mute">
        <span className="rounded-full border border-line px-3 py-1">25</span>
        <span className="rounded-full border border-line px-3 py-1">75</span>
        <span className="rounded-full bg-brand px-3 py-1 text-white">150</span>
        <span className="self-center">problems</span>
      </div>
      {soon ? (
        <span className="btn-black mt-6 pointer-events-none opacity-60">Coming soon</span>
      ) : (
        <Link to={to} className="btn-black mt-6">Open {tag} sheet</Link>
      )}
    </div>
  );
}

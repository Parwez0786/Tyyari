import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Camera, Clock } from "lucide-react";
import Layout from "../components/Layout";
import ModeOverlay from "../components/ModeOverlay";
import ProblemCard from "../components/ProblemCard";
import { CompanyTags, DifficultyBadge } from "../components/QuestionMeta";
import { formatClock, isActive, loadSession, remainingMs } from "../components/oa/session";
import { typeLabel } from "../data/labels";
import { contentApi } from "../services/api";

const TYPES = [
  { key: "HLD", title: "System Design (HLD)", detail: "High-level architecture problems" },
  { key: "LLD", title: "Low Level Design", detail: "OOP and machine coding" },
  { key: "DSA", title: "DSA", detail: "Data structures and algorithms" },
  { key: "FRONTEND", title: "Frontend Coding", detail: "UI machine-coding rounds" },
  { key: "CS", title: "CS Fundamentals", detail: "OS, DBMS, OOP, networks" },
  { key: "OA", title: "Online Assessment", detail: "Timed DSA sets with camera check" },
];

const SHEET_BY_TYPE = {
  HLD: "hld-core-sheet",
  LLD: "lld-machine-coding",
  DSA: "dsa-sde-sheet",
  FRONTEND: "frontend-ui-sheet",
};

const PAGE = {
  HLD: {
    title: "System Design Problems",
    subtitle: "The full HLD library. Filter by company and difficulty, then open any problem.",
  },
  LLD: {
    title: "Low Level Design Problems",
    subtitle: "The full LLD library. Practice OOP and machine-coding rounds in a multi-file editor.",
  },
  DSA: {
    title: "DSA Problems",
    subtitle: "The full DSA library. Solve any published problem with testcases.",
  },
  FRONTEND: {
    title: "Frontend Problems",
    subtitle: "The full frontend library. Build React UI challenges with desktop and mobile preview.",
  },
  CS: {
    title: "CS Fundamentals",
    subtitle: "Drill OS, DBMS, OOP, and networks before a phone screen.",
  },
  OA: {
    title: "Online Assessments",
    subtitle: "Timed DSA sets with a camera check before you enter — closer to a real online assessment.",
  },
};

const DIFFS = ["EASY", "MEDIUM", "HARD"];

export default function Practice() {
  const { type: typeParam } = useParams();
  const type = (typeParam || "").toUpperCase();
  const selected = Boolean(PAGE[type]);

  if (!selected) {
    return (
      <Layout>
        <section className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight">Practice</h1>
          <p className="mt-3 text-mute">The question library. Pick a track and open any problem.</p>
          <p className="mt-2 text-sm text-mute">
            Want a curated set instead?{" "}
            <Link to="/sheets/hld-core-sheet" className="font-semibold text-brand">Open sheets</Link>
          </p>
        </section>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {TYPES.map((item) =>
            item.key === "HLD" || item.key === "LLD" || item.key === "DSA" || item.key === "OA" || item.key === "FRONTEND" || item.key === "CS" ? (
              <Link key={item.key} to={`/practice/${item.key}`} className="rounded-2xl border border-line bg-surface p-6 text-left hover:border-brand/40">
                <p className="text-xs font-bold tracking-[0.14em] text-brand">{typeLabel(item.key)}</p>
                <p className="mt-2 text-lg font-bold">{item.title}</p>
                <p className="mt-1 text-sm text-mute">{item.detail}</p>
              </Link>
            ) : (
              <div key={item.key} className="rounded-2xl border border-line bg-surface p-6 text-left opacity-70">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold tracking-[0.14em] text-brand">{typeLabel(item.key)}</p>
                  <span className="rounded-full border border-line px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mute">Coming soon</span>
                </div>
                <p className="mt-2 text-lg font-bold">{item.title}</p>
                <p className="mt-1 text-sm text-mute">{item.detail}</p>
              </div>
            ),
          )}
        </div>
      </Layout>
    );
  }

  if (type !== "HLD" && type !== "LLD" && type !== "DSA" && type !== "OA" && type !== "FRONTEND" && type !== "CS") {
    return (
      <Layout>
        <ComingSoon title={PAGE[type].title} />
      </Layout>
    );
  }

  return type === "OA" ? <OaSheet /> : <TypeSheet type={type} />;
}

function ComingSoon({ title }) {
  return (
    <section className="mx-auto max-w-lg py-16 text-center">
      <p className="label-caps">Coming soon</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-mute">This track is not open yet. HLD, LLD, DSA, Frontend, CS, and OA are available now.</p>
      <Link to="/practice/HLD" className="btn-black mt-8">Open HLD practice</Link>
    </section>
  );
}

function TypeSheet({ type }) {
  const meta = PAGE[type];
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("");
  const [picked, setPicked] = useState(null);

  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: contentApi.companies });
  const topicsQuery = useQuery({
    queryKey: ["topics", type],
    queryFn: () => contentApi.topics(type),
    enabled: type === "CS",
  });
  const questionsQuery = useQuery({
    queryKey: ["questions", type, difficulty, company, topic, search],
    queryFn: () => contentApi.questions({ type, difficulty, company, topic, search, page: 1, limit: 60 }),
  });

  const items = questionsQuery.data?.data?.items ?? [];

  function startQuestion(question) {
    if (type === "HLD") {
      setPicked(question);
      return;
    }
    if (type === "LLD" || type === "DSA" || type === "FRONTEND") {
      navigate(`/questions/${question.id}?view=code`);
      return;
    }
    navigate(`/questions/${question.id}`);
  }

  function pickMode(view) {
    if (!picked) return;
    navigate(`/questions/${picked.id}?view=${view}`);
  }

  return (
    <Layout>
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{meta.title}</h1>
        <p className="mt-3 text-[15px] text-mute">{meta.subtitle}</p>
        {SHEET_BY_TYPE[type] && (
          <p className="mt-2 text-sm text-mute">
            Looking for a curated set?{" "}
            <Link to={`/sheets/${SHEET_BY_TYPE[type]}`} className="font-semibold text-brand">Open {typeLabel(type)} sheet</Link>
          </p>
        )}
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="relative block min-w-0 flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center text-mute">
            <SearchIcon />
          </span>
          <input
            className="field search-field mt-0"
            placeholder="Search by title, like two sum or YouTube"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <label className="relative block sm:w-40">
          <select className="field mt-0 appearance-none pr-10" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">Difficulty</option>
            {DIFFS.map((d) => (
              <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <Chevron />
        </label>
        <label className="relative block sm:w-44">
          <select className="field mt-0 appearance-none pr-10" value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="">All Companies</option>
            {(companiesQuery.data?.data ?? []).map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <Chevron />
        </label>
        {type === "CS" && (
          <label className="relative block sm:w-48">
            <select className="field mt-0 appearance-none pr-10" value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">All topics</option>
              {(topicsQuery.data?.data ?? []).map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
            <Chevron />
          </label>
        )}
      </div>

      {questionsQuery.isLoading && (
        <p className="mt-10 text-center text-sm text-mute">Loading {type.toLowerCase()} problems…</p>
      )}
      {questionsQuery.isError && (
        <p className="mt-10 text-center text-sm text-hard">Could not load this track. Refresh, or try another filter.</p>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map((q) => (
          <ProblemCard key={q.id} question={q} onStart={() => startQuestion(q)} />
        ))}
      </div>
      {!questionsQuery.isLoading && !questionsQuery.isError && !items.length && (
        <p className="mt-10 text-center text-sm text-mute">
          No problems match these filters. Clear search or company, or open the{" "}
          {SHEET_BY_TYPE[type] ? (
            <Link to={`/sheets/${SHEET_BY_TYPE[type]}`} className="font-semibold text-brand">{typeLabel(type)} sheet</Link>
          ) : (
            "full library"
          )}
          .
        </p>
      )}
      {picked && (
        <ModeOverlay
          question={picked}
          onPick={pickMode}
          onClose={() => setPicked(null)}
        />
      )}
    </Layout>
  );
}

function OaSheet() {
  const meta = PAGE.OA;
  const navigate = useNavigate();
  const setsQuery = useQuery({ queryKey: ["assessment-sets"], queryFn: contentApi.assessmentSets });
  const sets = setsQuery.data?.data ?? [];

  return (
    <Layout>
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{meta.title}</h1>
        <p className="mt-3 text-[15px] text-mute">{meta.subtitle}</p>
      </section>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {sets.map((set) => (
          <AssessmentCard key={set.id} set={set} onStart={() => navigate(`/oa/${set.id}/precheck`)} />
        ))}
      </div>
      {setsQuery.isLoading && (
        <p className="mt-10 text-center text-sm text-mute">Loading timed assessment sets…</p>
      )}
      {setsQuery.isError && (
        <p className="mt-10 text-center text-sm text-hard">Could not load OA sets. Refresh and try again.</p>
      )}
      {!setsQuery.isLoading && !setsQuery.isError && !sets.length && (
        <p className="mt-10 text-center text-sm text-mute">No assessments are published yet. Practice DSA while you wait.</p>
      )}
    </Layout>
  );
}

function AssessmentCard({ set, onStart }) {
  const session = loadSession(set.id);
  const active = isActive(session);
  const submitted = Boolean(session?.submittedAt);
  const cta = submitted ? "View result" : active ? `Resume · ${formatClock(remainingMs(session))}` : "Start Assessment";

  return (
    <article className="flex flex-col rounded-xl border border-white/10 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <DifficultyBadge difficulty={set.difficulty} />
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-mute">
          <Camera size={13} className="text-brand" />
          Camera
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug">{set.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-mute">{set.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-ink">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} className="text-brand" />
          {set.durationMinutes} min
        </span>
        <span>{set.questionCount} DSA problems</span>
      </div>
      <div className="mt-4">
        <CompanyTags companies={set.companies} />
      </div>
      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={onStart}
          className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10"
        >
          {cta}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

function Chevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-mute">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

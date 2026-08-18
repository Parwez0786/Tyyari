import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import ModeOverlay from "../components/ModeOverlay";
import ProblemCard from "../components/ProblemCard";
import { contentApi } from "../services/api";

const TYPES = [
  { key: "HLD", title: "System Design (HLD)", detail: "High-level architecture problems" },
  { key: "LLD", title: "Low Level Design", detail: "OOP and machine coding" },
  { key: "DSA", title: "DSA", detail: "Data structures and algorithms" },
  { key: "FRONTEND", title: "Frontend Coding", detail: "UI machine-coding rounds" },
  { key: "CS", title: "CS Fundamentals", detail: "OS, DBMS, networks" },
  { key: "OA", title: "Online Assessment", detail: "Timed coding questions" },
];

const PAGE = {
  HLD: {
    title: "System Design Problems",
    subtitle: "Practice High-Level Design (HLD) with company-tagged questions and a structured sheet.",
  },
  LLD: {
    title: "Low Level Design Problems",
    subtitle: "Practice OOP and machine-coding rounds in a full multi-file code editor.",
  },
  DSA: {
    title: "DSA Problems",
    subtitle: "Practice data structures and algorithms in a LeetCode-style editor.",
  },
  FRONTEND: {
    title: "Frontend Problems",
    subtitle: "Build UI challenges that show up in frontend machine-coding rounds.",
  },
  CS: {
    title: "CS Fundamentals",
    subtitle: "Drill OS, DBMS, OOP, and networks before a phone screen.",
  },
  OA: {
    title: "Online Assessments",
    subtitle: "Timed-style questions from company OA patterns.",
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
          <p className="mt-3 text-mute">Pick a track. Each one opens a card grid of problems.</p>
        </section>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {TYPES.map((item) =>
            item.key === "HLD" || item.key === "LLD" || item.key === "DSA" ? (
              <Link key={item.key} to={`/practice/${item.key}`} className="rounded-2xl border border-line bg-surface p-6 text-left hover:border-brand/40">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{item.key}</p>
                <p className="mt-2 text-lg font-bold">{item.title}</p>
                <p className="mt-1 text-sm text-mute">{item.detail}</p>
              </Link>
            ) : (
              <div key={item.key} className="rounded-2xl border border-line bg-surface p-6 text-left opacity-70">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{item.key}</p>
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

  if (type !== "HLD" && type !== "LLD" && type !== "DSA") {
    return (
      <Layout>
        <ComingSoon title={PAGE[type].title} />
      </Layout>
    );
  }

  return <TypeSheet type={type} />;
}

function ComingSoon({ title }) {
  return (
    <section className="mx-auto max-w-lg py-16 text-center">
      <p className="label-caps">Coming soon</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-mute">This track is not open yet. HLD, LLD, and DSA are available now.</p>
      <Link to="/practice/HLD" className="btn-black mt-8">Open HLD sheet</Link>
    </section>
  );
}

function TypeSheet({ type }) {
  const meta = PAGE[type];
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [company, setCompany] = useState("");
  const [picked, setPicked] = useState(null);

  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: contentApi.companies });
  const questionsQuery = useQuery({
    queryKey: ["questions", type, difficulty, company, search],
    queryFn: () => contentApi.questions({ type, difficulty, company, search, page: 1, limit: 60 }),
  });

  const items = questionsQuery.data?.data?.items ?? [];

  function startQuestion(question) {
    if (type === "HLD") {
      setPicked(question);
      return;
    }
    if (type === "LLD" || type === "DSA") {
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
      </section>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <label className="relative block min-w-0 flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center text-mute">
            <SearchIcon />
          </span>
          <input
            className="field search-field mt-0"
            placeholder="Search problems..."
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
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {items.map((q) => (
          <ProblemCard key={q.id} question={q} onStart={() => startQuestion(q)} />
        ))}
      </div>
      {!questionsQuery.isLoading && !items.length && (
        <p className="mt-10 text-center text-sm text-mute">No problems match these filters.</p>
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

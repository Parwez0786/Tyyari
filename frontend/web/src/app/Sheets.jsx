import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { Code2, LayoutTemplate, ListChecks, Network, Puzzle } from "lucide-react";
import Layout from "../components/Layout";
import ThemeCard from "../components/ThemeCard";
import { completedSet, countCompleted, Donut, ProgressBar } from "../components/ProgressCharts";
import { typeLabel } from "../data/labels";
import { contentApi, userApi } from "../services/api";

const TYPES = [
  { key: "HLD", title: "System Design", Icon: Network, hero: "brand" },
  { key: "LLD", title: "Low Level Design", Icon: Puzzle, hero: "blue" },
  { key: "DSA", title: "DSA", Icon: Code2, hero: "mint" },
  { key: "FRONTEND", title: "Frontend", Icon: LayoutTemplate, hero: "violet" },
];

const TYPE_META = Object.fromEntries(TYPES.map((item) => [item.key, item]));

export default function Sheets() {
  const [params, setParams] = useSearchParams();
  const type = (params.get("type") || "").toUpperCase();
  const selected = TYPES.some((item) => item.key === type) ? type : "HLD";
  const track = TYPE_META[selected];
  const Icon = track.Icon;
  useEffect(() => {
    if (type !== selected) {
      setParams({ type: selected }, { replace: true });
    }
  }, [type, selected, setParams]);
  const query = useQuery({
    queryKey: ["sheets", selected],
    queryFn: () => contentApi.sheets(selected),
  });
  const progressQuery = useQuery({
    queryKey: ["practice-progress"],
    queryFn: userApi.practiceProgress,
  });
  const sheets = query.data?.data ?? [];
  const done = completedSet(progressQuery.data?.data);

  if (query.isLoading) {
    return (
      <Layout>
        <p className="mt-8 text-sm text-mute">Loading {selected} sheets…</p>
      </Layout>
    );
  }

  if (sheets.length === 1) {
    const sheet = sheets[0];
    return <Navigate to={`/sheets/${sheet.slug || sheet.id}`} replace />;
  }

  const allIds = [...new Set(sheets.flatMap((sheet) => sheet.questionIds || []))];
  const total = allIds.length;
  const completed = countCompleted(allIds, done);

  function setTab(key) {
    setParams({ type: key }, { replace: true });
  }

  return (
    <Layout>
      <ThemeCard tone={track.hero} className="sm:p-8">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
          <Icon size={12} />
          {typeLabel(selected)}
        </p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl">{track.title} sheets</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-mute">
          Every user gets the same fixed question set. Submit an answer to mark a problem complete.
        </p>
      </ThemeCard>

      <div className="mt-6 flex flex-wrap gap-2">
        {TYPES.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={`tab-chip ${selected === item.key ? "tab-chip-on" : ""}`}
          >
            {item.title}
          </button>
        ))}
      </div>

      {sheets.length > 0 && (
        <ThemeCard tone="quiet" className="mx-auto mt-6 max-w-xl">
          <Donut
            value={completed}
            total={total}
            label={`You have completed ${completed} of ${total} questions in ${selected} sheets.`}
          />
        </ThemeCard>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sheets.map((sheet) => (
          <SheetCard key={sheet.id} sheet={sheet} done={done} tone={track.hero} />
        ))}
      </div>
      {!sheets.length && (
        <ThemeCard tone="quiet" className="mt-6 text-center">
          <p className="text-sm text-mute">
            No {selected} sheets are published yet. Browse the{" "}
            <Link to={`/practice/${selected}`} className="font-semibold text-brand">{selected} practice library</Link>
            {" "}instead.
          </p>
        </ThemeCard>
      )}
    </Layout>
  );
}

function SheetCard({ sheet, done, tone }) {
  const total = (sheet.questionIds || []).length || sheet.questionCount || 0;
  const completed = countCompleted(sheet.questionIds, done);
  return (
    <ThemeCard tone={tone} className="h-full !rounded-[24px] !p-5" innerClassName="flex h-full flex-col">
      <h3 className="text-lg font-bold leading-snug">{sheet.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-mute">{sheet.description}</p>
      <div className="mt-4">
        <ProgressBar label={`${completed} of ${total} completed`} value={completed} total={total} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-ink">
        <span className="inline-flex items-center gap-1.5">
          <ListChecks size={14} className="text-brand" />
          {total} questions
        </span>
      </div>
      <div className="mt-auto pt-5">
        <Link
          to={`/sheets/${sheet.slug || sheet.id}`}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-field/80 px-4 py-3 text-sm font-semibold hover:border-brand/40"
        >
          Open sheet
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </ThemeCard>
  );
}

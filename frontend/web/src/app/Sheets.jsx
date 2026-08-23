import { Link, Navigate } from "react-router-dom";
import { ListChecks } from "lucide-react";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import ThemeCard from "../components/ThemeCard";
import { countCompleted, Donut, ProgressBar } from "../components/ProgressCharts";
import { typeLabel } from "../data/labels";
import { useSheets } from "../hooks/useSheets";

export default function Sheets() {
  const { selected, track, tabs, setTab, sheets, done, isLoading, loneSheet, completed, total } = useSheets();
  const Icon = track.Icon;

  if (isLoading) {
    return (
      <Layout>
        <Loader fill />
      </Layout>
    );
  }

  if (loneSheet) {
    return <Navigate to={`/sheets/${loneSheet.slug || loneSheet.id}`} replace />;
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
        {tabs.map((item) => (
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

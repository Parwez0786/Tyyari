import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { ListChecks } from "lucide-react";
import Layout from "../components/Layout";
import { completedSet, countCompleted, Donut, ProgressBar } from "../components/ProgressCharts";
import { CompanyTags, DifficultyBadge } from "../components/QuestionMeta";
import { contentApi, userApi } from "../services/api";

const TYPES = ["HLD", "LLD", "DSA", "FRONTEND"];

export default function Sheets() {
  const [params, setParams] = useSearchParams();
  const type = (params.get("type") || "").toUpperCase();
  const selected = TYPES.includes(type) ? type : "HLD";
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
        <p className="mt-8 text-sm text-mute">Loading sheet…</p>
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

  return (
    <Layout>
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{selected} sheets</h1>
        <p className="mt-3 text-[15px] text-mute">
          Every user gets the same fixed question set. Submit an answer to mark a problem complete.
        </p>
      </section>

      {sheets.length > 0 && (
        <section className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-card p-5">
          <Donut
            value={completed}
            total={total}
            label={`You have completed ${completed} of ${total} questions in ${selected} sheets.`}
          />
        </section>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {sheets.map((sheet) => (
          <SheetCard key={sheet.id} sheet={sheet} done={done} />
        ))}
      </div>
      {!sheets.length && (
        <p className="mt-10 text-center text-sm text-mute">No sheets published for this track yet.</p>
      )}
    </Layout>
  );
}

function SheetCard({ sheet, done }) {
  const total = (sheet.questionIds || []).length || sheet.questionCount || 0;
  const completed = countCompleted(sheet.questionIds, done);
  return (
    <article className="flex flex-col rounded-xl border border-white/10 bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <DifficultyBadge difficulty={sheet.difficulty} />
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mute">
          {sheet.type}
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug">{sheet.title}</h3>
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
      <div className="mt-4">
        <CompanyTags companies={sheet.companies} />
      </div>
      <div className="mt-auto pt-5">
        <Link
          to={`/sheets/${sheet.slug || sheet.id}`}
          className="flex w-full items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold hover:bg-white/10"
        >
          Open sheet
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

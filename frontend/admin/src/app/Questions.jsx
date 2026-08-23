import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import { QUESTION_TYPES } from "../data/questionTypes";
import { useDialog } from "../components/Dialog";
import { adminApi } from "../services/api";

const DIFFICULTY = {
  EASY: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  MEDIUM: "border-amber-400/30 bg-amber-400/15 text-amber-400",
  HARD: "border-rose-500/30 bg-rose-500/15 text-rose-400",
};

export default function Questions() {
  const client = useQueryClient();
  const dialog = useDialog();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-questions"],
    queryFn: () => adminApi.questions({ limit: 50 }),
  });
  const items = data?.data?.items ?? [];
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.title, item.type, item.difficulty, ...(item.companies || [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, search]);

  const grouped = useMemo(
    () => QUESTION_TYPES.map((type) => ({
      type,
      items: filtered.filter((item) => String(item.type || "").toUpperCase() === type.key),
    })),
    [filtered],
  );

  async function togglePublish(question) {
    await adminApi.publish(question.id, !question.published);
    client.invalidateQueries({ queryKey: ["admin-questions"] });
  }

  async function remove(question) {
    if (!await dialog.confirm(`Delete “${question.title}”? This removes it from the candidate library.`, {
      title: "Delete question",
      confirmLabel: "Delete",
    })) return;
    await adminApi.deleteQuestion(question.id);
    client.invalidateQueries({ queryKey: ["admin-questions"] });
  }

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Your workspace"
        title="Questions"
        detail="Each track is its own section. Add a DSA problem, an HLD prompt, or a CS quiz without mixing the fields."
        action={<Link to="/questions/new" className="btn-brand">New question</Link>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mute">{filtered.length} of {items.length} in the catalog</p>
        <input
          className="field mt-0 w-full max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, type, company"
        />
      </div>

      {isLoading && <p className="text-sm text-mute">Loading the catalog…</p>}
      {isError && <p className="text-sm text-hard">{error.message || "Could not load questions."}</p>}

      <div className="space-y-4">
        {grouped.map(({ type, items: rows }) => (
          <section key={type.key} className={`rounded-[28px] border border-line bg-gradient-to-br p-5 sm:p-6 ${type.accent}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">{type.title}</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight">{type.title}</h2>
                <p className="mt-1 text-sm text-mute">{type.hook} · {rows.length} in this list</p>
              </div>
              <Link to={`/questions/new/${type.key}`} className="btn-brand !px-4 !py-2 text-sm">
                {type.add}
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {rows.map((q, index) => (
                <article
                  key={q.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/90 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 w-7 shrink-0 text-sm font-semibold text-mute">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold">{q.title}</p>
                      <p className="mt-1 truncate text-sm text-mute">
                        {(q.companies || []).length ? (q.companies || []).slice(0, 3).join(", ") : type.title}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {q.difficulty && (
                          <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${DIFFICULTY[q.difficulty] || DIFFICULTY.MEDIUM}`}>
                            {q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}
                          </span>
                        )}
                        {q.premium && (
                          <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-premium">
                            Premium
                          </span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          q.published ? "bg-brand/15 text-brand" : "bg-white/5 text-mute"
                        }`}>
                          {q.published ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:pl-4">
                    <Link to={`/questions/${q.id}`} className="btn-ghost !px-4 !py-1.5 text-sm">Edit</Link>
                    <button type="button" className="btn-brand !px-4 !py-1.5 text-sm" onClick={() => togglePublish(q)}>
                      {q.published ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" className="btn-ghost !px-4 !py-1.5 !text-hard text-sm" onClick={() => remove(q)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {!isLoading && !rows.length && (
                <div className="rounded-2xl border border-dashed border-line bg-surface/70 px-5 py-7 text-center">
                  <p className="font-semibold">No {type.title} questions yet</p>
                  <p className="mt-1 text-sm text-mute">
                    <Link to={`/questions/new/${type.key}`} className="font-semibold text-brand">{type.add}</Link>
                    {" "}with the fields this track uses.
                  </p>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

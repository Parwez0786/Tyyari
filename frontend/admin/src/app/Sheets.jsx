import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import { QUESTION_TYPES } from "../data/questionTypes";
import { adminApi } from "../services/api";

const SHEET_TYPES = QUESTION_TYPES.filter((type) => ["DSA", "HLD", "LLD", "FRONTEND"].includes(type.key));

const DIFFICULTY = {
  EASY: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  MEDIUM: "border-amber-400/30 bg-amber-400/15 text-amber-400",
  HARD: "border-rose-500/30 bg-rose-500/15 text-rose-400",
};

export default function Sheets() {
  const client = useQueryClient();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-sheets"],
    queryFn: adminApi.sheets,
  });
  const items = data?.data ?? [];
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.title, item.slug, item.type, item.difficulty, ...(item.companies || [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, search]);

  const grouped = useMemo(
    () => SHEET_TYPES.map((type) => ({
      type,
      items: filtered.filter((item) => String(item.type || "").toUpperCase() === type.key),
    })),
    [filtered],
  );

  async function togglePublish(sheet) {
    await adminApi.publishSheet(sheet.id, !sheet.published);
    client.invalidateQueries({ queryKey: ["admin-sheets"] });
  }

  async function remove(sheet) {
    if (!window.confirm(`Delete “${sheet.title}”? Candidates will lose this grind list.`)) return;
    await adminApi.deleteSheet(sheet.id);
    client.invalidateQueries({ queryKey: ["admin-sheets"] });
  }

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Catalog"
        title="Sheets"
        detail="Ordered HLD, LLD, DSA, and Frontend lists candidates grind. Create the sheet, pick the question order, then publish."
        action={<Link to="/sheets/new" className="btn-brand">New sheet</Link>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mute">{filtered.length} of {items.length} sheets</p>
        <input
          className="field mt-0 w-full max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, type, company"
        />
      </div>

      {isLoading && <p className="text-sm text-mute">Loading sheets…</p>}
      {isError && <p className="text-sm text-hard">{error.message || "Could not load sheets."}</p>}

      <div className="space-y-4">
        {grouped.map(({ type, items: rows }) => (
          <section key={type.key} className={`rounded-[28px] border border-line bg-gradient-to-br p-5 sm:p-6 ${type.accent}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">{type.key}</p>
                <h2 className="mt-1 text-xl font-extrabold tracking-tight">{type.title} sheets</h2>
                <p className="mt-1 text-sm text-mute">{rows.length} in this list</p>
              </div>
              <Link to={`/sheets/new?type=${type.key}`} className="btn-brand !px-4 !py-2 text-sm">
                Add {type.title} sheet
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {rows.map((sheet, index) => (
                <article
                  key={sheet.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/90 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 w-7 shrink-0 text-sm font-semibold text-mute">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="font-semibold">{sheet.title}</p>
                      <p className="mt-1 truncate text-sm text-mute">
                        {sheet.slug} · {(sheet.questionSlugs || []).length} questions
                        {(sheet.companies || []).length ? ` · ${(sheet.companies || []).slice(0, 3).join(", ")}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {sheet.difficulty && (
                          <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${DIFFICULTY[sheet.difficulty] || DIFFICULTY.MEDIUM}`}>
                            {labelDiff(sheet.difficulty)}
                          </span>
                        )}
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          sheet.published ? "bg-brand/15 text-brand" : "bg-white/5 text-mute"
                        }`}>
                          {sheet.published ? "Published" : "Draft"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:pl-4">
                    <Link to={`/sheets/${sheet.id}`} className="btn-ghost !px-4 !py-1.5 text-sm">Edit</Link>
                    <button type="button" className="btn-brand !px-4 !py-1.5 text-sm" onClick={() => togglePublish(sheet)}>
                      {sheet.published ? "Unpublish" : "Publish"}
                    </button>
                    <button type="button" className="btn-ghost !px-4 !py-1.5 !text-hard text-sm" onClick={() => remove(sheet)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {!isLoading && !rows.length && (
                <div className="rounded-2xl border border-dashed border-line bg-surface/70 px-5 py-7 text-center">
                  <p className="font-semibold">No {type.title} sheets yet</p>
                  <p className="mt-1 text-sm text-mute">
                    <Link to={`/sheets/new?type=${type.key}`} className="font-semibold text-brand">Create one</Link>
                    {" "}and pick the question order.
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

function labelDiff(value) {
  const text = String(value || "");
  return text.charAt(0) + text.slice(1).toLowerCase();
}

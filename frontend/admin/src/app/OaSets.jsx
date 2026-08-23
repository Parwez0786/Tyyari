import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import { useAdminOaSets } from "../hooks/useAdminOaSets";

const DIFFICULTY = {
  EASY: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  MEDIUM: "border-amber-400/30 bg-amber-400/15 text-amber-400",
  HARD: "border-rose-500/30 bg-rose-500/15 text-rose-400",
};

export default function OaSets() {
  const { isLoading, isError, error, items, search, setSearch, filtered, togglePublish, remove } = useAdminOaSets();

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Catalog"
        title="OA sets"
        detail="Timed camera rounds. Set title, duration, company, difficulty, and the DSA question list."
        action={<Link to="/oa/new" className="btn-brand">New OA set</Link>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-mute">{filtered.length} of {items.length} sets</p>
        <input
          className="field mt-0 w-full max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title, company, difficulty"
        />
      </div>

      {isLoading && <p className="text-sm text-mute">Loading OA sets…</p>}
      {isError && <p className="text-sm text-hard">{error.message || "Could not load OA sets."}</p>}

      <section className="rounded-[28px] border border-line bg-gradient-to-br from-blue-500/20 to-indigo-500/5 p-5 sm:p-6">
        <div className="space-y-2">
          {filtered.map((set, index) => (
            <article
              key={set.id}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/90 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 w-7 shrink-0 text-sm font-semibold text-mute">{index + 1}</span>
                <div className="min-w-0">
                  <p className="font-semibold">{set.title}</p>
                  <p className="mt-1 truncate text-sm text-mute">
                    {set.durationMinutes} min · {(set.questionSlugs || []).length} DSA
                    {(set.companies || []).length ? ` · ${(set.companies || []).slice(0, 3).join(", ")}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {set.difficulty && (
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${DIFFICULTY[set.difficulty] || DIFFICULTY.MEDIUM}`}>
                        {labelDiff(set.difficulty)}
                      </span>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      set.published ? "bg-brand/15 text-brand" : "bg-white/5 text-mute"
                    }`}>
                      {set.published ? "Published" : "Draft"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2 sm:pl-4">
                <Link to={`/oa/${set.id}`} className="btn-ghost !px-4 !py-1.5 text-sm">Edit</Link>
                <button type="button" className="btn-brand !px-4 !py-1.5 text-sm" onClick={() => togglePublish(set)}>
                  {set.published ? "Unpublish" : "Publish"}
                </button>
                <button type="button" className="btn-ghost !px-4 !py-1.5 !text-hard text-sm" onClick={() => remove(set)}>
                  Delete
                </button>
              </div>
            </article>
          ))}
          {!isLoading && !filtered.length && (
            <div className="rounded-2xl border border-dashed border-line bg-surface/70 px-5 py-7 text-center">
              <p className="font-semibold">No OA sets yet</p>
              <p className="mt-1 text-sm text-mute">
                <Link to="/oa/new" className="font-semibold text-brand">Create a timed set</Link>
                {" "}with a DSA list, duration, and company.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function labelDiff(value) {
  const text = String(value || "");
  return text.charAt(0) + text.slice(1).toLowerCase();
}

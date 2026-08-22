import { useMemo, useState } from "react";

export default function QuestionOrderPicker({
  slugs,
  onChange,
  pool = [],
  loading = false,
  emptyHint = "Add a question from the pool to set the order candidates see.",
}) {
  const [search, setSearch] = useState("");
  const bySlug = useMemo(() => {
    const map = {};
    for (const item of pool) {
      if (item.slug) map[item.slug] = item;
    }
    return map;
  }, [pool]);

  const selected = slugs.map((slug) => bySlug[slug] || { slug, title: slug, missing: true });
  const chosen = new Set(slugs);
  const q = search.trim().toLowerCase();
  const available = pool.filter((item) => {
    if (!item.slug || chosen.has(item.slug)) return false;
    if (!q) return true;
    return [item.title, item.slug, item.difficulty, ...(item.companies || [])]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  function move(index, delta) {
    const next = index + delta;
    if (next < 0 || next >= slugs.length) return;
    const copy = slugs.slice();
    [copy[index], copy[next]] = [copy[next], copy[index]];
    onChange(copy);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Order on the sheet</p>
        <p className="mt-1 text-xs text-mute">First item is question 1. Use up/down to rearrange.</p>
        <ol className="mt-3 space-y-2">
          {selected.map((item, index) => (
            <li
              key={`${item.slug}-${index}`}
              className="flex items-center gap-2 rounded-2xl border border-line bg-surface px-3 py-2.5"
            >
              <span className="w-6 shrink-0 text-sm font-semibold text-mute">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{item.title}</p>
                <p className="truncate text-xs text-mute">
                  {item.slug}
                  {item.difficulty ? ` · ${labelDiff(item.difficulty)}` : ""}
                  {item.missing ? " · not in this type pool" : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <IconBtn label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>↑</IconBtn>
                <IconBtn label="Move down" disabled={index === slugs.length - 1} onClick={() => move(index, 1)}>↓</IconBtn>
                <IconBtn label="Remove" onClick={() => onChange(slugs.filter((_, i) => i !== index))}>×</IconBtn>
              </div>
            </li>
          ))}
          {!selected.length && (
            <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-mute">
              {emptyHint}
            </li>
          )}
        </ol>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Add from the catalog</p>
        <input
          className="field mt-3"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or slug"
        />
        {loading && <p className="mt-3 text-sm text-mute">Loading questions…</p>}
        <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
          {available.map((item) => (
            <li
              key={item.id || item.slug}
              className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{item.title}</p>
                <p className="truncate text-xs text-mute">
                  {item.slug}
                  {item.difficulty ? ` · ${labelDiff(item.difficulty)}` : ""}
                  {item.published === false ? " · draft" : ""}
                </p>
              </div>
              <button
                type="button"
                className="btn-brand !px-3 !py-1.5 text-xs"
                onClick={() => onChange([...slugs, item.slug])}
              >
                Add
              </button>
            </li>
          ))}
          {!loading && !available.length && (
            <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-mute">
              {pool.length ? "Every matching question is already on the list." : "No questions of this type yet. Add them under Questions first."}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function IconBtn({ label, onClick, disabled, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold hover:bg-field disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}

function labelDiff(value) {
  const text = String(value || "");
  return text.charAt(0) + text.slice(1).toLowerCase();
}

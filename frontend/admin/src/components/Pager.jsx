export default function Pager({ page, pages, total, pageSize, onPage }) {
  if (!total || total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <p className="text-xs text-mute">{from}–{to} of {total}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn-ghost !px-3 !py-1.5 text-xs"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Prev
        </button>
        <span className="text-xs font-semibold">{page} / {pages}</span>
        <button
          type="button"
          className="btn-ghost !px-3 !py-1.5 text-xs"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

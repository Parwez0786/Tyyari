import { useEffect, useMemo, useState } from "react";

export const PAGE_SIZE = 10;

export function usePager(items, resetKey, pageSize = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / pageSize) || 1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const slice = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return { page, setPage, pages, total, pageSize, slice };
}

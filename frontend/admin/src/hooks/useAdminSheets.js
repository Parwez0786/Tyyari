import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDialog } from "../components/Dialog";
import { QUESTION_TYPES } from "../data/questionTypes";
import { adminApi } from "../services/api";

const SHEET_TYPES = QUESTION_TYPES.filter((type) => ["DSA", "HLD", "LLD", "FRONTEND"].includes(type.key));

export function useAdminSheets() {
  const client = useQueryClient();
  const dialog = useDialog();
  const query = useQuery({
    queryKey: ["admin-sheets"],
    queryFn: adminApi.sheets,
  });
  const items = query.data?.data ?? [];
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
    if (!await dialog.confirm(`Delete “${sheet.title}”? Candidates will lose this grind list.`, {
      title: "Delete sheet",
      confirmLabel: "Delete",
    })) return;
    await adminApi.deleteSheet(sheet.id);
    client.invalidateQueries({ queryKey: ["admin-sheets"] });
  }

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    items,
    search,
    setSearch,
    filtered,
    grouped,
    togglePublish,
    remove,
  };
}

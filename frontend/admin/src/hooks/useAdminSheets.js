import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useDialog } from "../components/Dialog";
import { SHEET_TYPES as SHEET_TYPE_KEYS } from "../data/enums";
import { QUESTION_TYPES, typeMeta } from "../data/questionTypes";
import { adminApi } from "../services/api";

const SHEET_TYPES = QUESTION_TYPES.filter((type) => SHEET_TYPE_KEYS.includes(type.key));

export function useAdminSheets() {
  const client = useQueryClient();
  const dialog = useDialog();
  const [params, setParams] = useSearchParams();
  const query = useQuery({
    queryKey: ["admin-sheets"],
    queryFn: adminApi.sheets,
  });
  const items = query.data?.data ?? [];
  const [search, setSearch] = useState("");
  const requested = String(params.get("type") || "").toUpperCase();
  const tab = SHEET_TYPES.some((type) => type.key === requested) ? requested : SHEET_TYPES[0].key;

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

  const tabs = useMemo(
    () => SHEET_TYPES.map((type) => ({
      ...type,
      count: items.filter((item) => String(item.type || "").toUpperCase() === type.key).length,
    })),
    [items],
  );

  const selected = useMemo(() => {
    const type = typeMeta(tab);
    return {
      type,
      items: filtered.filter((item) => String(item.type || "").toUpperCase() === type.key),
    };
  }, [filtered, tab]);

  function setTab(key) {
    const next = new URLSearchParams(params);
    if (key === SHEET_TYPES[0].key) next.delete("type");
    else next.set("type", key);
    setParams(next, { replace: true });
  }

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
    tab,
    setTab,
    tabs,
    selected,
    togglePublish,
    remove,
  };
}

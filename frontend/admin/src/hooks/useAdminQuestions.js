import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useDialog } from "../components/Dialog";
import { QUESTION_TYPES, typeMeta } from "../data/questionTypes";
import { adminApi } from "../services/api";

export function useAdminQuestions() {
  const client = useQueryClient();
  const dialog = useDialog();
  const [params, setParams] = useSearchParams();
  const query = useQuery({
    queryKey: ["admin-questions"],
    queryFn: () => adminApi.questions({ limit: 50 }),
  });
  const items = query.data?.data?.items ?? [];
  const [search, setSearch] = useState("");
  const requested = String(params.get("type") || "").toUpperCase();
  const tab = QUESTION_TYPES.some((type) => type.key === requested) ? requested : QUESTION_TYPES[0].key;

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

  const tabs = useMemo(
    () => QUESTION_TYPES.map((type) => ({
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
    if (key === QUESTION_TYPES[0].key) next.delete("type");
    else next.set("type", key);
    setParams(next, { replace: true });
  }

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

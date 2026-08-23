import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDialog } from "../components/Dialog";
import { adminApi } from "../services/api";

export function useAdminOaSets() {
  const client = useQueryClient();
  const dialog = useDialog();
  const query = useQuery({
    queryKey: ["admin-oa"],
    queryFn: adminApi.assessmentSets,
  });
  const items = query.data?.data ?? [];
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) =>
      [item.title, item.slug, item.difficulty, ...(item.companies || [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, search]);

  async function togglePublish(set) {
    await adminApi.publishAssessmentSet(set.id, !set.published);
    client.invalidateQueries({ queryKey: ["admin-oa"] });
  }

  async function remove(set) {
    if (!await dialog.confirm(`Delete “${set.title}”? This timed camera round will disappear for candidates.`, {
      title: "Delete OA set",
      confirmLabel: "Delete",
    })) return;
    await adminApi.deleteAssessmentSet(set.id);
    client.invalidateQueries({ queryKey: ["admin-oa"] });
  }

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    items,
    search,
    setSearch,
    filtered,
    togglePublish,
    remove,
  };
}

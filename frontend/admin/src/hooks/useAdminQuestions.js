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
    queryFn: () => adminApi.questions({ limit: 200 }),
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
    try {
      await adminApi.deleteQuestion(question.id);
      client.invalidateQueries({ queryKey: ["admin-questions"] });
    } catch (err) {
      await dialog.alert(err?.message || "Could not delete this question.");
    }
  }

  async function clone(question) {
    try {
      const json = await adminApi.question(question.id);
      const q = json?.data || {};
      const stamp = Date.now().toString(36);
      await adminApi.createQuestion({
        type: q.type || question.type,
        subType: q.subType || null,
        title: `${q.title || question.title} (copy)`,
        slug: `${String(q.slug || q.title || "question").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-copy-${stamp}`,
        description: q.description || "",
        difficulty: q.difficulty || "MEDIUM",
        topics: q.topics || [],
        companies: q.companies || [],
        tags: q.tags || [],
        constraints: q.constraints || [],
        functionalRequirements: q.functionalRequirements || [],
        nonFunctionalRequirements: q.nonFunctionalRequirements || [],
        examples: q.examples || [],
        testcases: q.testcases || [],
        starterFiles: q.starterFiles || [],
        estimates: q.estimates || "",
        canvasNotes: q.canvasNotes || "",
        quiz: q.quiz || [],
        hints: q.hints || [],
        published: false,
        premium: Boolean(q.premium || question.premium),
      });
      await client.invalidateQueries({ queryKey: ["admin-questions"] });
      await dialog.alert("Draft copy created. It is unpublished until you publish it.", {
        title: "Question cloned",
        tone: "ok",
      });
    } catch (err) {
      await dialog.alert(err?.message || "Could not clone this question.");
    }
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
    clone,
  };
}

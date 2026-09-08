import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useDialog } from "../components/Dialog";
import { REVIEW_STATUS_LIST } from "../data/enums";
import { QUESTION_TYPES, typeMeta } from "../data/questionTypes";
import { adminApi } from "../services/api";

const PAGE_SIZE = 12;

export function useAdminQuestions() {
  const client = useQueryClient();
  const dialog = useDialog();
  const [params, setParams] = useSearchParams();
  const requested = String(params.get("type") || "").toUpperCase();
  const tab = QUESTION_TYPES.some((type) => type.key === requested) ? requested : QUESTION_TYPES[0].key;
  const reviewStatus = REVIEW_STATUS_LIST.includes(String(params.get("review") || "").toUpperCase())
    ? String(params.get("review")).toUpperCase()
    : "";
  const search = params.get("q") || "";
  const page = Math.max(1, Number(params.get("page") || 1) || 1);
  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = searchInput.trim();
      if (next === search) return;
      patchParams({ q: next || null, page: null });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const query = useQuery({
    queryKey: ["admin-questions", tab, search, reviewStatus, page],
    queryFn: () => adminApi.questions({
      type: tab,
      search,
      reviewStatus: reviewStatus || undefined,
      page,
      limit: PAGE_SIZE,
    }),
  });
  const countsQuery = useQuery({
    queryKey: ["admin-question-counts", search, reviewStatus],
    queryFn: () => adminApi.questionCounts({
      search,
      reviewStatus: reviewStatus || undefined,
    }),
  });

  const items = query.data?.data?.items ?? [];
  const total = Number(query.data?.data?.total || 0);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  const counts = countsQuery.data?.data || {};

  const tabs = useMemo(
    () => QUESTION_TYPES.map((type) => ({
      ...type,
      count: Number(counts[type.key] || 0),
    })),
    [counts],
  );

  const selected = useMemo(() => ({
    type: typeMeta(tab),
    items,
  }), [tab, items]);

  function patchParams(patch) {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([key, value]) => {
      if (value == null || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    if (patch.type === QUESTION_TYPES[0].key) next.delete("type");
    setParams(next, { replace: true });
  }

  function setTab(key) {
    patchParams({ type: key === QUESTION_TYPES[0].key ? null : key, page: null });
  }

  function setReview(status) {
    patchParams({ review: status || null, page: null });
  }

  function setPage(nextPage) {
    patchParams({ page: nextPage <= 1 ? null : nextPage });
  }

  async function togglePublish(question) {
    await adminApi.publish(question.id, !question.published);
    client.invalidateQueries({ queryKey: ["admin-questions"] });
    client.invalidateQueries({ queryKey: ["admin-question-counts"] });
  }

  async function remove(question) {
    let usageNote = "";
    try {
      const usage = (await adminApi.questionUsage(question.id))?.data || {};
      const sheets = usage.sheets || [];
      const sets = usage.assessmentSets || [];
      if (sheets.length || sets.length) {
        const sheetNames = sheets.map((item) => item.title).join(", ");
        const setNames = sets.map((item) => item.title).join(", ");
        usageNote = [
          sheets.length ? `Sheets: ${sheetNames}` : "",
          sets.length ? `OA sets: ${setNames}` : "",
        ].filter(Boolean).join(". ");
      }
    } catch {
      usageNote = "";
    }
    const message = usageNote
      ? `“${question.title}” is still on ${usageNote}. Delete it anyway?`
      : `Delete “${question.title}”? This removes it from the candidate library.`;
    if (!await dialog.confirm(message, {
      title: usageNote ? "Question is in use" : "Delete question",
      confirmLabel: "Delete",
    })) return;
    try {
      await adminApi.deleteQuestion(question.id);
      client.invalidateQueries({ queryKey: ["admin-questions"] });
      client.invalidateQueries({ queryKey: ["admin-question-counts"] });
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
        editorial: q.editorial || "",
        editorialVideoUrl: q.editorialVideoUrl || "",
        acceptedCode: q.acceptedCode || [],
        reviewStatus: "DRAFT",
        reviewer: "",
        reviewNote: "",
        scheduledPublishAt: null,
        published: false,
        premium: Boolean(q.premium || question.premium),
      });
      await client.invalidateQueries({ queryKey: ["admin-questions"] });
      await client.invalidateQueries({ queryKey: ["admin-question-counts"] });
      await dialog.alert("Draft copy created. It is unpublished until you publish it.", {
        title: "Question cloned",
        tone: "ok",
      });
    } catch (err) {
      await dialog.alert(err?.message || "Could not clone this question.");
    }
  }

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function exportJson() {
    try {
      const json = await adminApi.exportQuestions();
      download("questions.json", JSON.stringify(json?.data ?? [], null, 2), "application/json");
    } catch (err) {
      await dialog.alert(err?.message || "Could not export questions.");
    }
  }

  async function exportCsv() {
    try {
      const csv = await adminApi.exportQuestionsCsv();
      download("questions.csv", csv, "text/csv");
    } catch (err) {
      await dialog.alert(err?.message || "Could not export questions.");
    }
  }

  async function importFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const name = String(file.name || "").toLowerCase();
      let result;
      if (name.endsWith(".csv") || file.type === "text/csv") {
        result = await adminApi.importQuestionsCsv(text);
      } else {
        const parsed = JSON.parse(text);
        const items = Array.isArray(parsed) ? parsed : (parsed.items || parsed.data || []);
        result = await adminApi.importQuestions(items);
      }
      const created = result?.data?.created ?? 0;
      const skipped = result?.data?.skipped ?? 0;
      const errors = result?.data?.errors || [];
      await client.invalidateQueries({ queryKey: ["admin-questions"] });
      await client.invalidateQueries({ queryKey: ["admin-question-counts"] });
      await dialog.alert(
        `${created} created, ${skipped} skipped.${errors.length ? `\n${errors.slice(0, 5).join("\n")}` : ""}`,
        { title: "Import finished", tone: created ? "ok" : "warning" },
      );
    } catch (err) {
      await dialog.alert(err?.message || "Could not import this file.");
    }
  }

  return {
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    items,
    total,
    page,
    pages,
    pageSize: PAGE_SIZE,
    setPage,
    search: searchInput,
    setSearch: setSearchInput,
    reviewStatus,
    setReview,
    tab,
    setTab,
    tabs,
    selected,
    togglePublish,
    remove,
    clone,
    exportJson,
    exportCsv,
    importFile,
  };
}

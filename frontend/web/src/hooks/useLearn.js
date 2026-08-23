import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { completedSet } from "../components/ProgressCharts";
import { LIBRARY_TYPES, RoadmapItemKind, TargetRole } from "../data/enums";
import {
  ROADMAPS,
  ROLES,
  flattenQuestions,
  roleFromProfile,
} from "../data/roadmaps";
import { contentApi, userApi } from "../services/api";

export function useLearn() {
  const [params, setParams] = useSearchParams();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: userApi.profile });
  const progressQuery = useQuery({ queryKey: ["practice-progress"], queryFn: userApi.practiceProgress });
  const libraryQuery = useQuery({
    queryKey: ["roadmap-library"],
    queryFn: async () => {
      const types = LIBRARY_TYPES;
      const pages = await Promise.all(types.map((type) => contentApi.questions({ type, page: 1, limit: 50 })));
      const bySlug = {};
      pages.forEach((page) => {
        (page?.data?.items || []).forEach((item) => {
          if (item.slug) bySlug[item.slug] = item;
        });
      });
      return bySlug;
    },
  });
  const sheetsQuery = useQuery({ queryKey: ["sheets"], queryFn: () => contentApi.sheets() });

  const profileRole = roleFromProfile(profileQuery.data?.data?.targetRole);
  const role = params.get("role") === TargetRole.SDE_2 || params.get("role") === TargetRole.SDE_1
    ? params.get("role")
    : profileRole;
  const meta = ROLES.find((item) => item.id === role) || ROLES[0];
  const weeks = ROADMAPS[role] || ROADMAPS[TargetRole.SDE_1];
  const done = useMemo(() => completedSet(progressQuery.data?.data), [progressQuery.data]);
  const bySlug = libraryQuery.data || {};
  const sheets = sheetsQuery.data?.data ?? [];
  const sheetBySlug = useMemo(
    () => Object.fromEntries(sheets.map((sheet) => [sheet.slug, sheet])),
    [sheets],
  );
  const stats = useMemo(
    () => weeks.map((week) => weekStats(week, done, bySlug, sheetBySlug)),
    [weeks, done, bySlug, sheetBySlug],
  );
  const questions = useMemo(() => flattenQuestions(weeks), [weeks]);
  const questionDone = useMemo(
    () => questions.filter((item) => done.has(bySlug[item.slug]?.id)).length,
    [questions, done, bySlug],
  );
  const current = useMemo(
    () => stats.find((row) => row.done < row.total) || stats[stats.length - 1],
    [stats],
  );

  const setRole = useCallback((next) => {
    const nextParams = new URLSearchParams(params);
    nextParams.set("role", next);
    setParams(nextParams, { replace: true });
  }, [params, setParams]);

  const complete = useCallback(
    (item) => isComplete(item, done, bySlug, sheetBySlug),
    [done, bySlug, sheetBySlug],
  );

  return {
    role,
    roles: ROLES,
    setRole,
    meta,
    weeks,
    stats,
    done,
    bySlug,
    sheetBySlug,
    questionDone,
    questionTotal: questions.length,
    current,
    targetRole: profileQuery.data?.data?.targetRole,
    isLoading: libraryQuery.isLoading || progressQuery.isLoading,
    isError: libraryQuery.isError,
    isComplete: complete,
  };
}

function weekStats(week, done, bySlug, sheetBySlug) {
  const countable = week.items.filter((item) => item.kind === RoadmapItemKind.QUESTION || item.kind === RoadmapItemKind.SHEET);
  const finished = countable.filter((item) => isComplete(item, done, bySlug, sheetBySlug)).length;
  return { week: week.week, title: week.title, done: finished, total: countable.length || 1 };
}

function isComplete(item, done, bySlug, sheetBySlug) {
  if (item.kind === RoadmapItemKind.QUESTION) {
    const id = bySlug[item.slug]?.id;
    return Boolean(id && done.has(id));
  }
  if (item.kind === RoadmapItemKind.SHEET) {
    const ids = sheetBySlug[item.slug]?.questionIds || [];
    return ids.length > 0 && ids.every((id) => done.has(id));
  }
  return false;
}

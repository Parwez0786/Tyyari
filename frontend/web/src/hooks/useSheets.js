import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Code2, LayoutTemplate, Network, Puzzle } from "lucide-react";
import { completedSet, countCompleted } from "../components/ProgressCharts";
import { QuestionType, ThemeTone } from "../data/enums";
import { contentApi, userApi } from "../services/api";

export const SHEET_TABS = [
  { key: QuestionType.HLD, title: "System Design", Icon: Network, hero: ThemeTone.BRAND },
  { key: QuestionType.LLD, title: "Low Level Design", Icon: Puzzle, hero: ThemeTone.BLUE },
  { key: QuestionType.DSA, title: "DSA", Icon: Code2, hero: ThemeTone.MINT },
  { key: QuestionType.FRONTEND, title: "Frontend", Icon: LayoutTemplate, hero: ThemeTone.VIOLET },
];

export function useSheets() {
  const [params, setParams] = useSearchParams();
  const type = (params.get("type") || "").toUpperCase();
  const selected = SHEET_TABS.some((item) => item.key === type) ? type : QuestionType.HLD;
  const track = SHEET_TABS.find((item) => item.key === selected) || SHEET_TABS[0];

  useEffect(() => {
    if (type !== selected) {
      setParams({ type: selected }, { replace: true });
    }
  }, [type, selected, setParams]);

  const query = useQuery({
    queryKey: ["sheets", selected],
    queryFn: () => contentApi.sheets(selected),
  });
  const progressQuery = useQuery({
    queryKey: ["practice-progress"],
    queryFn: userApi.practiceProgress,
  });
  const sheets = query.data?.data ?? [];
  const done = useMemo(() => completedSet(progressQuery.data?.data), [progressQuery.data]);
  const allIds = useMemo(
    () => [...new Set(sheets.flatMap((sheet) => sheet.questionIds || []))],
    [sheets],
  );
  const completed = useMemo(() => countCompleted(allIds, done), [allIds, done]);

  return {
    selected,
    track,
    tabs: SHEET_TABS,
    setTab: (key) => setParams({ type: key }, { replace: true }),
    sheets,
    done,
    isLoading: query.isLoading,
    loneSheet: sheets.length === 1 ? sheets[0] : null,
    completed,
    total: allIds.length,
  };
}

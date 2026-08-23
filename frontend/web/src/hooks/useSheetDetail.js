import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { completedSet, countCompleted } from "../components/ProgressCharts";
import { QuestionType, ThemeTone, ViewMode, practicePath } from "../data/enums";
import { contentApi, userApi } from "../services/api";
import { questionHref } from "../utils/questionHref";

const HERO_BY_TYPE = {
  [QuestionType.HLD]: ThemeTone.BRAND,
  [QuestionType.LLD]: ThemeTone.BLUE,
  [QuestionType.DSA]: ThemeTone.MINT,
  [QuestionType.FRONTEND]: ThemeTone.VIOLET,
};

export function useSheetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [picked, setPicked] = useState(null);
  const query = useQuery({ queryKey: ["sheet", id], queryFn: () => contentApi.sheet(id) });
  const progressQuery = useQuery({
    queryKey: ["practice-progress"],
    queryFn: userApi.practiceProgress,
  });
  const sheet = query.data?.data;
  const questions = sheet?.questions ?? [];
  const sheetKey = sheet?.slug || sheet?.id || id;
  const done = useMemo(() => completedSet(progressQuery.data?.data), [progressQuery.data]);
  const completed = useMemo(
    () => countCompleted(questions.map((item) => item.id), done),
    [questions, done],
  );

  const startQuestion = useCallback((question) => {
    if (question.type === QuestionType.HLD) {
      setPicked(question);
      return;
    }
    navigate(questionHref(question.id, question.type, ViewMode.CODE, sheetKey));
  }, [navigate, sheetKey]);

  const pickMode = useCallback((view) => {
    if (!picked) return;
    navigate(questionHref(picked.id, picked.type, view, sheetKey));
  }, [picked, navigate, sheetKey]);

  const closePicked = useCallback(() => setPicked(null), []);

  return {
    sheet,
    questions,
    done,
    completed,
    isLoading: query.isLoading,
    isError: query.isError,
    hero: HERO_BY_TYPE[sheet?.type] || ThemeTone.BRAND,
    backTo: practicePath(sheet?.type || QuestionType.HLD),
    backLabel: `← ${sheet?.type || QuestionType.HLD} practice`,
    picked,
    closePicked,
    startQuestion,
    pickMode,
  };
}

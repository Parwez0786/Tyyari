import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { QuestionType, ViewMode, practicePath } from "../data/enums";
import { contentApi } from "../services/api";

export function useQuestion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = useQuery({ queryKey: ["question", id], queryFn: () => contentApi.question(id) });
  const data = q.data?.data;
  const view = params.get("view");
  const sheet = params.get("sheet");
  const hld = data?.type === QuestionType.HLD;
  const lld = data?.type === QuestionType.LLD;
  const dsa = data?.type === QuestionType.DSA;
  const frontend = data?.type === QuestionType.FRONTEND;
  const cs = data?.type === QuestionType.CS;
  const canvas = view === ViewMode.BLUEPRINT || view === ViewMode.WHITEBOARD;
  const lldCode = lld && (view === ViewMode.CODE || !view);
  const dsaCode = dsa && (view === ViewMode.CODE || !view);
  const feCode = frontend && (view === ViewMode.CODE || !view);
  const needPick = hld && !canvas;
  const workspace = !data?.locked && ((hld && canvas) || lldCode || dsaCode || feCode || cs);
  const backTo = sheet ? `/sheets/${sheet}` : practicePath(data?.type || QuestionType.DSA);
  const backLabel = sheet ? "Back to sheet" : `Back to ${data?.type || "practice"}`;
  const unknownType = Boolean(data && !data.locked && !hld && !lld && !dsa && !frontend && !cs);

  function setView(next) {
    const nextParams = new URLSearchParams(params);
    nextParams.set("view", next);
    setParams(nextParams, { replace: true });
  }

  return {
    data,
    view,
    sheet,
    hld,
    lld,
    dsa,
    frontend,
    cs,
    lldCode,
    dsaCode,
    feCode,
    needPick,
    workspace,
    backTo,
    backLabel,
    unknownType,
    isLoading: q.isLoading,
    isError: q.isError,
    setView,
    closeOverlay: () => navigate(backTo),
  };
}

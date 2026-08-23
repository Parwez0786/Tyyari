import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCamera } from "../components/oa/useCamera";
import { enterFullscreen, isActive, isExpired, loadSession, startSession, submitSession } from "../components/oa/session";
import { contentApi } from "../services/api";

export function useOaPrecheck() {
  const { id } = useParams();
  const navigate = useNavigate();
  const camera = useCamera();
  const [agreed, setAgreed] = useState(false);
  const q = useQuery({ queryKey: ["assessment-set", id], queryFn: () => contentApi.assessmentSet(id) });
  const data = q.data?.data;
  const session = useMemo(() => loadSession(data?.id || id), [data?.id, id]);
  const active = isActive(session);
  const expired = isExpired(session);
  const submitted = Boolean(session?.submittedAt);
  const canEnter = camera.ready && agreed;
  const problemCount = data?.questions?.length || 0;
  const cta = submitted || expired ? "View result" : active ? "Resume Assessment" : "Start Assessment";

  async function begin() {
    if (!data || !canEnter) return;
    if (submitted || expired) {
      if (expired && !submitted) submitSession(data.id);
      navigate(`/oa/${data.id}/exam`, { replace: true });
      return;
    }
    if (!active) startSession(data.id, data.durationMinutes);
    await enterFullscreen();
    navigate(`/oa/${data.id}/exam`, { replace: true });
  }

  return {
    data,
    camera,
    agreed,
    setAgreed,
    canEnter,
    problemCount,
    cta,
    begin,
    isLoading: q.isLoading,
    isError: q.isError,
  };
}

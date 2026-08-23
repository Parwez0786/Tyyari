import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useDialog } from "../components/Dialog";
import { useCamera } from "../components/oa/useCamera";
import {
  enterFullscreen,
  exitFullscreen,
  isActive,
  loadSession,
  remainingMs,
  saveSession,
  submitSession,
} from "../components/oa/session";
import { QuestionType, ViewMode, practicePath } from "../data/enums";
import { contentApi } from "../services/api";
import { dsaFiles, oaDraftFromStorage, saveSubmission } from "../services/submissions";

export function useOaExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dialog = useDialog();
  const camera = useCamera();
  const cameraStop = useRef(camera.stop);
  cameraStop.current = camera.stop;
  const setQuery = useQuery({ queryKey: ["assessment-set", id], queryFn: () => contentApi.assessmentSet(id) });
  const data = setQuery.data?.data;
  const [session, setSession] = useState(() => loadSession(id));
  const [index, setIndex] = useState(() => loadSession(id)?.index || 0);
  const questions = data?.questions || [];
  const current = questions[Math.min(index, Math.max(questions.length - 1, 0))];
  const questionQuery = useQuery({
    queryKey: ["question", current?.id],
    queryFn: () => contentApi.question(current.id),
    enabled: Boolean(current?.id),
  });
  const snapshotRef = useRef(null);
  const question = questionQuery.data?.data;
  const submitted = Boolean(session?.submittedAt);
  const needsCamera = !submitted && !camera.ready;

  useEffect(() => {
    camera.enable();
    enterFullscreen();
  }, []);

  useEffect(() => {
    if (!data) return;
    const next = loadSession(data.id);
    if (!next) {
      navigate(`/oa/${data.id}/precheck`, { replace: true });
      return;
    }
    setSession(next);
    setIndex(next.index || 0);
  }, [data, navigate]);

  const finish = useCallback(async (ask = false) => {
    if (ask && !await dialog.confirm("Submit this assessment? You cannot change answers after this.", {
      title: "Submit assessment",
      confirmLabel: "Submit",
    })) return;
    if (!data) return;
    try {
      const currentSnap = snapshotRef.current?.();
      const jobs = [];
      if (currentSnap) jobs.push(saveSubmission({ ...currentSnap, assessmentSetId: data.id, questionType: QuestionType.DSA }));
      (data.questions || []).forEach((item) => {
        if (item.id === currentSnap?.questionId) return;
        const draft = oaDraftFromStorage(data.id, item.id);
        if (!draft?.codeByLang) return;
        jobs.push(saveSubmission({
          questionId: item.id,
          questionType: QuestionType.DSA,
          assessmentSetId: data.id,
          language: draft.language || "java",
          view: ViewMode.CODE,
          files: dsaFiles(draft.codeByLang),
        }));
      });
      await Promise.all(jobs);
    } catch {
      /* session still locks locally */
    }
    const next = submitSession(data.id);
    setSession(next);
    cameraStop.current();
    exitFullscreen();
  }, [data, dialog]);

  useEffect(() => {
    if (!session || session.submittedAt) return;
    if (remainingMs(session) <= 0) finish();
  }, [session, finish]);

  function selectQuestion(nextIndex) {
    const snap = snapshotRef.current?.();
    if (snap) saveSubmission({ ...snap, assessmentSetId: data.id, questionType: QuestionType.DSA }).catch(() => {});
    setIndex(nextIndex);
    const next = { ...(loadSession(data.id) || session || {}), index: nextIndex };
    saveSession(data.id, next);
    setSession(next);
  }

  async function leave() {
    if (submitted || await dialog.confirm("Leave this assessment? The timer keeps running until you submit or time runs out.", {
      title: "Leave assessment",
      confirmLabel: "Leave",
    })) {
      camera.stop();
      exitFullscreen();
      navigate(practicePath(QuestionType.OA));
    }
  }

  return {
    data,
    session,
    index,
    questions,
    question,
    submitted,
    needsCamera,
    camera,
    snapshotRef,
    isLoading: setQuery.isLoading,
    questionLoading: questionQuery.isLoading,
    timerActive: Boolean(session && isActive(session)),
    finish,
    selectQuestion,
    leave,
  };
}

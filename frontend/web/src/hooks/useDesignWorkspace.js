import { useEffect, useRef, useState } from "react";
import { QuestionType } from "../data/enums";
import { loadSubmission, saveSubmission } from "../services/submissions";

export function useDesignWorkspace(data, view) {
  const apiRef = useRef(null);
  const notesRef = useRef(null);
  const key = `tyyari.${view}.${data.id}`;
  const [ready, setReady] = useState(() => Boolean(localStorage.getItem(key)));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSubmission(data.id).then((saved) => {
      if (cancelled) return;
      if (saved) setSubmitted(true);
      if (!localStorage.getItem(key) && saved?.canvas) {
        localStorage.setItem(key, JSON.stringify(saved.canvas));
      }
      hydrateNotes(data.id, saved);
      setReady(true);
    }).catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, [data.id, key]);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      let canvas = apiRef.current?.getState?.();
      if (!canvas) {
        try {
          canvas = JSON.parse(localStorage.getItem(key) || "{}");
        } catch {
          canvas = {};
        }
      }
      const notes = readNotes(notesRef.current, data.id);
      await saveSubmission({
        questionId: data.id,
        questionType: QuestionType.HLD,
        view,
        canvas,
        math: notes.math,
        explanation: notes.explanation,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    apiRef,
    notesRef,
    key,
    ready,
    submitted,
    submitting,
    submit,
    download: () => apiRef.current?.download(),
  };
}

function notesKey(questionId) {
  return `tyyari.notes.${questionId}`;
}

function readNotes(api, questionId) {
  const live = api?.getState?.();
  if (live) {
    return { math: live.math || "", explanation: live.explanation || "" };
  }
  try {
    const saved = JSON.parse(localStorage.getItem(notesKey(questionId)) || "{}");
    return { math: saved.math || "", explanation: saved.explanation || "" };
  } catch {
    return { math: "", explanation: "" };
  }
}

function hydrateNotes(questionId, saved) {
  const math = saved?.math || "";
  const explanation = saved?.explanation || "";
  if (!math && !explanation) return;
  try {
    const current = JSON.parse(localStorage.getItem(notesKey(questionId)) || "{}");
    if (current.math || current.explanation) return;
  } catch {
    // seed from the saved submission
  }
  localStorage.setItem(notesKey(questionId), JSON.stringify({ math, explanation }));
}

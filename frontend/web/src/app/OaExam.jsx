import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import DsaWorkspace from "../components/code/DsaWorkspace";
import Layout from "../components/Layout";
import CameraPreview from "../components/oa/CameraPreview";
import ExamTimer from "../components/oa/ExamTimer";
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
import { contentApi } from "../services/api";
import { dsaFiles, oaDraftFromStorage, saveSubmission } from "../services/submissions";

export default function OaExam() {
  const { id } = useParams();
  const navigate = useNavigate();
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
    if (ask && !window.confirm("Submit this assessment? You cannot change answers after this.")) return;
    if (!data) return;
    try {
      const currentSnap = snapshotRef.current?.();
      const jobs = [];
      if (currentSnap) jobs.push(saveSubmission({ ...currentSnap, assessmentSetId: data.id, questionType: "DSA" }));
      (data.questions || []).forEach((item) => {
        if (item.id === currentSnap?.questionId) return;
        const draft = oaDraftFromStorage(data.id, item.id);
        if (!draft?.codeByLang) return;
        jobs.push(saveSubmission({
          questionId: item.id,
          questionType: "DSA",
          assessmentSetId: data.id,
          language: draft.language || "java",
          view: "code",
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
  }, [data]);

  useEffect(() => {
    if (!session || session.submittedAt) return;
    if (remainingMs(session) <= 0) finish();
  }, [session, finish]);

  function selectQuestion(nextIndex) {
    const snap = snapshotRef.current?.();
    if (snap) saveSubmission({ ...snap, assessmentSetId: data.id, questionType: "DSA" }).catch(() => {});
    setIndex(nextIndex);
    const next = { ...(loadSession(data.id) || session || {}), index: nextIndex };
    saveSession(data.id, next);
    setSession(next);
  }

  function leave() {
    if (submitted || window.confirm("Leave this assessment? The timer keeps running until you submit or time runs out.")) {
      camera.stop();
      exitFullscreen();
      navigate("/practice/OA");
    }
  }

  if (setQuery.isLoading) {
    return (
      <Layout fill hideNav>
        <p className="p-6 text-sm text-mute">Loading assessment…</p>
      </Layout>
    );
  }

  if (submitted) {
    return (
      <Layout>
        <section className="mx-auto max-w-lg py-16 text-center">
          <p className="label-caps">Assessment complete</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{data?.title}</h1>
          <p className="mt-3 text-sm text-mute">
            Your last answer for each question was saved to your account. Practice submissions for the same problems are stored separately.
          </p>
          <ul className="mt-8 space-y-2 text-left text-sm">
            {questions.map((item) => (
              <li key={item.id} className="rounded-xl border border-line bg-surface px-4 py-3 font-semibold">
                {item.title}
              </li>
            ))}
          </ul>
          <Link to="/practice/OA" className="btn-black mt-8">Back to OA sets</Link>
        </section>
      </Layout>
    );
  }

  return (
    <Layout wide fill hideNav>
      <div className="relative flex min-h-0 flex-1 flex-col bg-canvas">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-3">
          <button
            type="button"
            onClick={leave}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-mute hover:bg-white/5 hover:text-ink"
          >
            Leave
          </button>
          <h1 className="hidden min-w-0 truncate text-sm font-semibold text-ink sm:block">{data?.title}</h1>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
            {questions.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectQuestion(i)}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold ${
                  i === index ? "bg-white/10 text-ink" : "text-mute hover:bg-white/5 hover:text-ink"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {session && isActive(session) && <ExamTimer session={session} onExpire={finish} />}
          {!needsCamera && <CameraPreview videoRef={camera.videoRef} ready={camera.ready} compact />}
          <button
            type="button"
            onClick={() => finish(true)}
            className="inline-flex h-9 shrink-0 items-center rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Submit
          </button>
        </header>

        {needsCamera && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-6">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 text-center">
              <Camera size={28} className="mx-auto text-brand" />
              <h2 className="mt-3 text-lg font-bold">Camera required</h2>
              <p className="mt-2 text-sm text-mute">
                Enable your camera to continue this assessment. The timer keeps running.
              </p>
              <div className="mx-auto mt-4 max-w-xs">
                <CameraPreview videoRef={camera.videoRef} ready={camera.ready} />
              </div>
              {camera.error && <p className="mt-3 text-sm text-rose-400">{camera.error}</p>}
              <button type="button" onClick={camera.enable} className="btn-black mt-5">
                Enable camera
              </button>
            </div>
          </div>
        )}

        {question && (
          <DsaWorkspace
            key={question.id}
            data={question}
            storageKey={`tyyari.oa.${data.id}.${question.id}`}
            assessmentSetId={data.id}
            snapshotRef={snapshotRef}
            hideBack
            hideHints
            hideSubmit
            backTo="/practice/OA"
          />
        )}
        {!question && questionQuery.isLoading && (
          <p className="p-6 text-sm text-mute">Loading problem…</p>
        )}
      </div>
    </Layout>
  );
}

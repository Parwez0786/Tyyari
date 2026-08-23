import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Camera } from "lucide-react";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import CameraPreview from "../components/oa/CameraPreview";
import ExamTimer from "../components/oa/ExamTimer";
import { QuestionType, practicePath } from "../data/enums";
import { useOaExam } from "../hooks/useOaExam";

const DsaWorkspace = lazy(() => import("../components/code/DsaWorkspace"));

export default function OaExam() {
  const e = useOaExam();

  if (e.isLoading) {
    return (
      <Layout fill hideNav>
        <Loader fill />
      </Layout>
    );
  }

  if (e.submitted) {
    return (
      <Layout>
        <section className="mx-auto max-w-lg py-16 text-center">
          <p className="label-caps">Assessment complete</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{e.data?.title}</h1>
          <p className="mt-3 text-sm text-mute">
            Your last answer for each question was saved to your account. Practice submissions for the same problems are stored separately.
          </p>
          <ul className="mt-8 space-y-2 text-left text-sm">
            {e.questions.map((item) => (
              <li key={item.id} className="rounded-xl border border-line bg-surface px-4 py-3 font-semibold">
                {item.title}
              </li>
            ))}
          </ul>
          <Link to={practicePath(QuestionType.OA)} className="btn-black mt-8">Back to OA sets</Link>
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
            onClick={e.leave}
            className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold text-mute hover:bg-white/5 hover:text-ink"
          >
            Leave
          </button>
          <h1 className="hidden min-w-0 truncate text-sm font-semibold text-ink sm:block">{e.data?.title}</h1>
          <div className="flex min-w-0 flex-1 items-center justify-center gap-1">
            {e.questions.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => e.selectQuestion(i)}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-bold ${
                  i === e.index ? "bg-white/10 text-ink" : "text-mute hover:bg-white/5 hover:text-ink"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {e.timerActive && <ExamTimer session={e.session} onExpire={e.finish} />}
          {!e.needsCamera && <CameraPreview videoRef={e.camera.videoRef} ready={e.camera.ready} compact />}
          <button
            type="button"
            onClick={() => e.finish(true)}
            className="inline-flex h-9 shrink-0 items-center rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Submit
          </button>
        </header>

        {e.needsCamera && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 p-6">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-6 text-center">
              <Camera size={28} className="mx-auto text-brand" />
              <h2 className="mt-3 text-lg font-bold">Camera required</h2>
              <p className="mt-2 text-sm text-mute">
                Enable your camera to continue this assessment. The timer keeps running.
              </p>
              <div className="mx-auto mt-4 max-w-xs">
                <CameraPreview videoRef={e.camera.videoRef} ready={e.camera.ready} />
              </div>
              {e.camera.error && <p className="mt-3 text-sm text-rose-400">{e.camera.error}</p>}
              <button type="button" onClick={e.camera.enable} className="btn-black mt-5">
                Enable camera
              </button>
            </div>
          </div>
        )}

        {e.question && (
          <Suspense fallback={<Loader fill />}>
            <DsaWorkspace
              key={e.question.id}
              data={e.question}
              storageKey={`tyyari.oa.${e.data?.id}.${e.question.id}`}
              assessmentSetId={e.data?.id}
              snapshotRef={e.snapshotRef}
              hideBack
              hideHints
              hideSubmit
              backTo={practicePath(QuestionType.OA)}
            />
          </Suspense>
        )}
        {!e.question && e.questionLoading && (
          <Loader fill />
        )}
      </div>
    </Layout>
  );
}

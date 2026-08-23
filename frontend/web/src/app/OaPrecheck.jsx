import { Link } from "react-router-dom";
import { Camera, FileText, Monitor, Shield } from "lucide-react";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import CameraPreview from "../components/oa/CameraPreview";
import { QuestionType, practicePath } from "../data/enums";
import { useOaPrecheck } from "../hooks/useOaPrecheck";

export default function OaPrecheck() {
  const p = useOaPrecheck();

  if (p.isLoading) {
    return (
      <Layout>
        <Loader fill />
      </Layout>
    );
  }

  return (
    <Layout>
      {p.isError && (
        <section className="mx-auto max-w-lg py-16 text-center">
          <p className="label-caps">Assessment missing</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">This OA set is not available</h1>
          <p className="mt-3 text-sm text-mute">It may be unpublished. Pick another set from the OA lobby.</p>
          <Link to={practicePath(QuestionType.OA)} className="btn-black mt-8">Back to OA lobby</Link>
        </section>
      )}
      {p.data && (
        <div className="mx-auto max-w-xl">
          <Link to={practicePath(QuestionType.OA)} className="text-sm font-medium text-blue-600 dark:text-blue-400">← Back</Link>
          <article className="mt-4 rounded-3xl border border-line bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8 dark:bg-card dark:shadow-none">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-ink">{p.data?.title}</h1>
            <p className="mt-2 text-[15px] text-slate-500 dark:text-mute">
              Please read the instructions carefully before starting.
            </p>

            <InstructionBlock icon={Monitor} title="Environment Rules">
              <li>The assessment will run in <strong>Full Screen</strong> mode.</li>
              <li>Exiting full screen may be recorded as a violation.</li>
              <li>Do not switch tabs or windows during the test.</li>
              <li>Ensure you have a stable internet connection.</li>
            </InstructionBlock>

            <InstructionBlock icon={Shield} title="Proctoring & Privacy">
              <li><strong>Webcam access is mandatory</strong> for this assessment.</li>
              <li>The camera stays in your browser so we can confirm a live feed. Tyyari does not upload the video.</li>
              <li>Ensure your face is clearly visible within the frame.</li>
              <li>No other person should be present in the room.</li>
            </InstructionBlock>

            <InstructionBlock icon={FileText} title="Assessment Format">
              <li><strong>Duration:</strong> {p.data?.durationMinutes} minutes.</li>
              <li><strong>Problems:</strong> {p.problemCount} coding {p.problemCount === 1 ? "problem" : "problems"}.</li>
              <li>You can solve problems in any order.</li>
              <li>Click &apos;Submit Assessment&apos; to finish early.</li>
            </InstructionBlock>

            <label className="mt-8 flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-mute">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 accent-blue-600"
                checked={p.agreed}
                onChange={(event) => p.setAgreed(event.target.checked)}
              />
              I have read and understood the instructions. I agree to the proctoring terms and environment rules.
            </label>

            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-base font-bold text-blue-600 dark:text-blue-400">
                <Camera size={18} strokeWidth={2} />
                System Check
              </h2>
              <div className="mt-4">
                <CameraPreview videoRef={p.camera.videoRef} ready={p.camera.ready} variant="check" />
              </div>
              {p.camera.error && <p className="mt-3 text-sm text-rose-500">{p.camera.error}</p>}
            </section>

            <button
              type="button"
              onClick={p.camera.enable}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-600 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/40"
            >
              <Camera size={16} />
              {p.camera.ready ? "Camera enabled" : "Enable Camera"}
            </button>

            <button
              type="button"
              onClick={p.begin}
              disabled={!p.canEnter}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:bg-slate-300 disabled:text-white disabled:hover:bg-slate-300 dark:disabled:bg-white/15 dark:disabled:text-slate-400"
            >
              {p.cta}
              <span aria-hidden="true">→</span>
            </button>
            {!p.canEnter && (
              <p className="mt-3 text-center text-sm text-slate-400">
                {!p.camera.ready ? "Enable camera to proceed" : "Accept the instructions to proceed"}
              </p>
            )}
          </article>
        </div>
      )}
    </Layout>
  );
}

function InstructionBlock({ icon: Icon, title, children }) {
  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-ink">
        <Icon size={18} className="text-blue-600 dark:text-blue-400" strokeWidth={2} />
        {title}
      </h2>
      <ul className="mt-3 list-disc space-y-2.5 pl-6 text-[15px] leading-6 text-slate-600 dark:text-mute">
        {children}
      </ul>
    </section>
  );
}

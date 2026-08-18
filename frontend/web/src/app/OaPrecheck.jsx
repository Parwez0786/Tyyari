import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Camera, FileText, Monitor, Shield } from "lucide-react";
import Layout from "../components/Layout";
import CameraPreview from "../components/oa/CameraPreview";
import { useCamera } from "../components/oa/useCamera";
import { enterFullscreen, isActive, isExpired, loadSession, startSession, submitSession } from "../components/oa/session";
import { contentApi } from "../services/api";

export default function OaPrecheck() {
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

  return (
    <Layout>
      {q.isLoading && <p className="text-sm text-mute">Loading assessment…</p>}
      {data && (
        <div className="mx-auto max-w-xl">
          <Link to="/practice/OA" className="text-sm font-medium text-blue-600 dark:text-blue-400">← Back</Link>
          <article className="mt-4 rounded-3xl border border-line bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8 dark:bg-card dark:shadow-none">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-ink">{data.title}</h1>
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
              <li>Your video feed will be monitored for proctoring purposes.</li>
              <li>Ensure your face is clearly visible within the frame.</li>
              <li>No other person should be present in the room.</li>
            </InstructionBlock>

            <InstructionBlock icon={FileText} title="Assessment Format">
              <li><strong>Duration:</strong> {data.durationMinutes} minutes.</li>
              <li><strong>Problems:</strong> {problemCount} coding {problemCount === 1 ? "problem" : "problems"}.</li>
              <li>You can solve problems in any order.</li>
              <li>Click &apos;Submit Assessment&apos; to finish early.</li>
            </InstructionBlock>

            <label className="mt-8 flex items-start gap-3 text-sm leading-6 text-slate-600 dark:text-mute">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600 accent-blue-600"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              I have read and understood the instructions. I agree to the proctoring terms and environment rules.
            </label>

            <section className="mt-8">
              <h2 className="flex items-center gap-2 text-base font-bold text-blue-600 dark:text-blue-400">
                <Camera size={18} strokeWidth={2} />
                System Check
              </h2>
              <div className="mt-4">
                <CameraPreview videoRef={camera.videoRef} ready={camera.ready} variant="check" />
              </div>
              {camera.error && <p className="mt-3 text-sm text-rose-500">{camera.error}</p>}
            </section>

            <button
              type="button"
              onClick={camera.enable}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-blue-600 px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950/40"
            >
              <Camera size={16} />
              {camera.ready ? "Camera enabled" : "Enable Camera"}
            </button>

            <button
              type="button"
              onClick={begin}
              disabled={!canEnter}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:bg-slate-300 disabled:text-white disabled:hover:bg-slate-300 dark:disabled:bg-white/15 dark:disabled:text-slate-400"
            >
              {cta}
              <span aria-hidden="true">→</span>
            </button>
            {!canEnter && (
              <p className="mt-3 text-center text-sm text-slate-400">
                {!camera.ready ? "Enable camera to proceed" : "Accept the instructions to proceed"}
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

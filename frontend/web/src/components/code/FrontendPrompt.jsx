import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { CompanyTags } from "../QuestionMeta";

export default function FrontendPrompt({ data, submitted = false }) {
  const [tab, setTab] = useState("problem");
  const features = data?.functionalRequirements || [];
  const constraints = [...(data?.constraints || []), ...(data?.nonFunctionalRequirements || [])];
  const tip = data?.hints?.[0] || "Focus on functionality first, then polish the styling.";

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-white/10 bg-card">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-white/10 px-2">
        {["problem", "solution", "history"].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`h-8 rounded-lg px-3 text-sm font-semibold capitalize ${
              tab === id ? "bg-white/10 text-ink" : "text-mute hover:text-ink"
            }`}
          >
            {id}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "problem" && (
          <>
            {data?.companies?.length ? (
              <section className="mb-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Popular at</p>
                <div className="mt-2">
                  <CompanyTags companies={data.companies} />
                </div>
              </section>
            ) : null}
            <section>
              <h2 className="text-sm font-bold text-ink">Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-mute">{data?.description}</p>
            </section>
            <Section title="Features" items={features} />
            <Section title="Constraints" items={constraints} />
            <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-amber-400">
                <Lightbulb size={13} />
                Pro tip
              </p>
              <p className="mt-1.5 text-sm leading-6 text-ink">{tip}</p>
            </div>
          </>
        )}
        {tab === "solution" && (
          <p className="text-sm leading-6 text-mute">
            Official write-ups are not unlocked yet. Build the features in the problem tab, then Submit so this attempt is saved to your account.
          </p>
        )}
        {tab === "history" && <HistoryTab questionId={data?.id} submitted={submitted} />}
      </div>
    </aside>
  );
}

function Section({ title, items }) {
  if (!items?.length) return null;
  return (
    <section className="mt-5">
      <h2 className="text-sm font-bold text-ink">{title}</h2>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-mute">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

function HistoryTab({ questionId, submitted }) {
  let saved = null;
  try {
    saved = JSON.parse(localStorage.getItem(`tyyari.fe.${questionId}`) || "null");
  } catch {
    saved = null;
  }
  return (
    <div className="space-y-3 text-sm leading-6 text-mute">
      <p>Auto-save keeps drafts on this device. Submit stores your last answer in your account.</p>
      {saved?.files ? <p className="text-ink">{saved.files.length} files in the last snapshot.</p> : <p>No snapshot yet.</p>}
      {submitted ? <p className="text-ink">Last answer is saved to your account.</p> : <p>No submit yet.</p>}
    </div>
  );
}

import { useState } from "react";
import { ChevronRight, FileText, Lightbulb } from "lucide-react";
import { QuestionMeta } from "./QuestionMeta";

export default function PromptCard({ data, hideHints = false }) {
  const dsa = data.type === "DSA" || data.type === "OA";
  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-r border-white/10 bg-card">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <FileText size={15} className="text-brand" />
        <p className="text-sm font-semibold text-ink">Description</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <QuestionMeta data={data} compact />
        <h2 className="mt-4 text-lg font-bold leading-snug text-ink">{data.title}</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-mute">{data.description}</p>
        {dsa ? <DsaDetails data={data} hideHints={hideHints} /> : <RequirementsLists data={data} />}
      </div>
    </aside>
  );
}

export function RequirementsBlock({ data }) {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <RequirementCard title="Functional requirements" items={data.functionalRequirements} tone="func" />
      <RequirementCard title="Non-functional requirements" items={data.nonFunctionalRequirements} tone="nfr" />
    </div>
  );
}

function DsaDetails({ data, hideHints = false }) {
  return (
    <div className="mt-5 space-y-4">
      {(data.examples || []).map((example, index) => (
        <section key={`${example.input}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
          <h3 className="text-sm font-semibold text-ink">Example {index + 1}</h3>
          {example.input ? (
            <ExampleField label="Input" value={example.input} />
          ) : null}
          {example.output ? (
            <ExampleField label="Output" value={example.output} />
          ) : null}
          {example.explanation ? (
            <p className="mt-2 text-sm leading-6 text-mute">
              <span className="font-semibold text-ink">Explanation: </span>
              {example.explanation}
            </p>
          ) : null}
        </section>
      ))}
      <RequirementCard title="Constraints" items={data.constraints} tone="nfr" />
      {!hideHints && <HintList items={data.hints} />}
      <TopicPills items={data.topics} />
    </div>
  );
}

function ExampleField({ label, value }) {
  return (
    <div className="mt-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">{label}</p>
      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap font-mono text-xs leading-5 text-ink">{value}</pre>
    </div>
  );
}

function HintList({ items }) {
  const list = items || [];
  if (!list.length) return null;
  return (
    <section>
      <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
        <Lightbulb size={13} className="text-amber-400" />
        Hints
      </h3>
      <div className="mt-2 space-y-2">
        {list.map((item, index) => (
          <HintRow key={item} index={index} text={item} />
        ))}
      </div>
    </section>
  );
}

function HintRow({ index, text }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold text-ink"
      >
        <ChevronRight size={14} className={`text-mute transition ${open ? "rotate-90" : ""}`} />
        Hint {index + 1}
      </button>
      {open && <p className="border-t border-white/10 px-3 py-2 text-sm leading-6 text-mute">{text}</p>}
    </div>
  );
}

function TopicPills({ items }) {
  const list = items || [];
  if (!list.length) return null;
  return (
    <section>
      <h3 className="text-xs font-semibold text-ink">Topics</h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {list.map((topic) => (
          <span key={topic} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-mute">
            {topic}
          </span>
        ))}
      </div>
    </section>
  );
}

function RequirementsLists({ data }) {
  return (
    <div className="mt-5 space-y-3">
      <RequirementCard title="Functional requirements" items={data.functionalRequirements} tone="func" />
      <RequirementCard title="Non-functional requirements" items={data.nonFunctionalRequirements} tone="nfr" />
      <RequirementCard title="Constraints" items={data.constraints} tone="nfr" />
      <RequirementCard title="Hints" items={data.hints} tone="hint" />
    </div>
  );
}

function RequirementCard({ title, items, tone = "func" }) {
  const list = items || [];
  if (!list.length) return null;
  const dot = tone === "nfr" ? "bg-rose-400" : tone === "hint" ? "bg-amber-400" : "bg-sky-400";
  return (
    <section>
      <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        {title}
      </h3>
      <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-ink">
        <ul className="space-y-2">
          {list.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-40" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

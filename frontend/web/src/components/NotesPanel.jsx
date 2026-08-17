import { useEffect, useRef, useState } from "react";
import { Info, PanelRightClose } from "lucide-react";

export default function NotesPanel({ questionId, onCollapse }) {
  const key = `tyyari.notes.${questionId}`;
  const [math, setMath] = useState("");
  const [explanation, setExplanation] = useState("");
  const saveTimer = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) || "{}");
      setMath(saved.math || "");
      setExplanation(saved.explanation || "");
    } catch {
      setMath("");
      setExplanation("");
    }
  }, [key]);

  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify({ math, explanation }));
    }, 250);
    return () => clearTimeout(saveTimer.current);
  }, [key, math, explanation]);

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden border-l border-line bg-card">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink">Analysis & math</p>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-mute hover:bg-field hover:text-ink"
            aria-label="Collapse panel"
          >
            <PanelRightClose size={15} />
          </button>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        <label className="flex min-h-[140px] flex-1 flex-col">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
            Back-of-envelope math
            <Info size={12} className="text-mute" />
          </span>
          <textarea
            className="mt-2 min-h-0 flex-1 resize-none rounded-xl border border-line bg-field p-3 text-sm leading-6 text-ink outline-none placeholder:text-mute/70"
            placeholder="e.g., 1M DAU * 10KB = 10GB/day..."
            value={math}
            onChange={(e) => setMath(e.target.value)}
          />
        </label>
        <label className="flex min-h-[160px] flex-1 flex-col">
          <span className="text-xs font-semibold text-ink">Design explanation</span>
          <textarea
            className="mt-2 min-h-0 flex-1 resize-none rounded-xl border border-line bg-field p-3 text-sm leading-6 text-ink outline-none placeholder:text-mute/70"
            placeholder="Explain your architectural choices..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
          />
        </label>
      </div>
      <div className="shrink-0 p-4">
        <button
          type="button"
          disabled
          title="Coming soon"
          className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white opacity-80"
          style={{ background: "linear-gradient(90deg, #3b82f6 0%, #ec4899 100%)" }}
        >
          <PlayIcon />
          Run AI Analysis
          <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px] uppercase tracking-wide">Soon</span>
        </button>
      </div>
    </aside>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7L8 5Z" />
    </svg>
  );
}

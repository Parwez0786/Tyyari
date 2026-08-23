import { useEffect } from "react";
import { typeLabel } from "../data/labels";
import { QuestionMeta } from "./QuestionMeta";

export default function ModeOverlay({ question, onPick, onClose }) {
  const lld = question.type === "LLD";

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="mode-overlay-title"
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-white/10 bg-neutral-950 p-5 shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] text-amber-400">{typeLabel(question.type)}</p>
            <h2 id="mode-overlay-title" className="mt-1 text-xl font-bold text-white sm:text-2xl">{question.title}</h2>
            <div className="mt-3">
              <QuestionMeta data={question} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="mt-4 text-sm text-neutral-400">
          {lld
            ? "Choose how you want to work. Blueprint for classes and ownership. Whiteboard if you would rather talk through the design by hand."
            : "Choose how you want to work. Blueprint for boxes and arrows. Whiteboard if you want a freehand sketch first."}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ModeCard
            title="Blueprint mode"
            detail={lld
              ? "Drag classes, interfaces, and services onto a graph. Submit the canvas with your notes."
              : "Drag load balancers, stores, and queues onto a graph. Submit the canvas with back-of-envelope math."}
            cta="Open Blueprint"
            icon={<BlueprintIcon />}
            onClick={() => onPick("blueprint")}
          />
          <ModeCard
            title="Whiteboard mode"
            detail="Freehand canvas for sequence diagrams, capacity math, and talking through trade-offs."
            cta="Open Whiteboard"
            icon={<WhiteboardIcon />}
            onClick={() => onPick("whiteboard")}
          />
        </div>
      </div>
    </div>
  );
}

function ModeCard({ title, detail, cta, icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col rounded-2xl border border-white/10 bg-neutral-900 p-5 text-left text-white hover:border-amber-400/40"
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-neutral-950">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-neutral-400">{detail}</p>
      <span className="mt-5 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold">
        {cta}
        <span aria-hidden="true">→</span>
      </span>
    </button>
  );
}

function BlueprintIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="8.5" y="14" width="7" height="7" rx="1.5" />
      <path d="M6.5 10v2.5H12M17.5 10v2.5H12M12 12.5V14" />
    </svg>
  );
}

function WhiteboardIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="M8 9h4M8 12h7" />
      <path d="M15.2 8.8 19 5l1.4 1.4-3.8 3.8-1.8.4.4-1.8Z" />
    </svg>
  );
}

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const DialogContext = createContext(null);

const TONES = {
  warning: {
    kicker: "Warning",
    kickerClass: "text-brand",
    ring: "border-brand/30 bg-brand/10 text-brand",
  },
  danger: {
    kicker: "Danger",
    kickerClass: "text-hard",
    ring: "border-rose-500/30 bg-rose-500/10 text-hard",
  },
  ok: {
    kicker: "Done",
    kickerClass: "text-brand",
    ring: "border-brand/30 bg-brand/10 text-brand",
  },
};

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const resolveRef = useRef(null);

  const finish = useCallback((value) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setDialog(null);
    resolve?.(value);
  }, []);

  const open = useCallback((next) => {
    if (resolveRef.current) {
      resolveRef.current(next.kind === "confirm" ? false : undefined);
    }
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setDialog(next);
    });
  }, []);

  const alert = useCallback((message, options = {}) => {
    const payload = typeof message === "string" ? { message, ...options } : { ...(message || {}) };
    return open({
      kind: "alert",
      title: payload.title || (payload.tone === "ok" ? "Done" : "Something needs attention"),
      message: payload.message || "",
      tone: payload.tone || "warning",
      confirmLabel: payload.confirmLabel || "OK",
    });
  }, [open]);

  const confirm = useCallback((message, options = {}) => {
    const payload = typeof message === "string" ? { message, ...options } : { ...(message || {}) };
    return open({
      kind: "confirm",
      title: payload.title || "Please confirm",
      message: payload.message || "",
      tone: payload.tone || "danger",
      confirmLabel: payload.confirmLabel || "Continue",
      cancelLabel: payload.cancelLabel || "Cancel",
    });
  }, [open]);

  return (
    <DialogContext.Provider value={{ alert, confirm }}>
      {children}
      {dialog ? <DialogCard dialog={dialog} onClose={finish} /> : null}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error("useDialog must be used inside DialogProvider");
  }
  return ctx;
}

function DialogCard({ dialog, onClose }) {
  const primaryRef = useRef(null);
  const tone = TONES[dialog.tone] || TONES.warning;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    primaryRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onClose(dialog.kind === "confirm" ? false : undefined);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [dialog, onClose]);

  const dismiss = () => onClose(dialog.kind === "confirm" ? false : undefined);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Dismiss" onClick={dismiss} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-line bg-card p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full bg-brand/15 blur-3xl" />
        <div className={`relative inline-flex h-12 w-12 items-center justify-center rounded-2xl border ${tone.ring}`}>
          {dialog.tone === "ok" ? <CheckIcon /> : <WarningIcon />}
        </div>
        <p className={`relative mt-4 text-[11px] font-bold uppercase tracking-[0.16em] ${tone.kickerClass}`}>
          {tone.kicker}
        </p>
        <h2 id="app-dialog-title" className="relative mt-2 text-2xl font-extrabold tracking-tight">
          {dialog.title}
        </h2>
        <p className="relative mt-2 text-sm leading-6 text-mute">{dialog.message}</p>
        <div className="relative mt-6 flex flex-wrap justify-end gap-2">
          {dialog.kind === "confirm" && (
            <button type="button" className="btn-ghost" onClick={() => onClose(false)}>
              {dialog.cancelLabel}
            </button>
          )}
          <button
            ref={primaryRef}
            type="button"
            className={dialog.tone === "danger" ? "btn-ghost !text-hard" : "btn-brand"}
            onClick={() => onClose(dialog.kind === "confirm" ? true : undefined)}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function WarningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 9v4M12 17h.01" />
      <path d="m10.3 4.3-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.7l-8-14a2 2 0 0 0-3.4 0Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

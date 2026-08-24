import { Link } from "react-router-dom";
import { ChevronLeft, Columns2, Play } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { LANGUAGES } from "./languages";

export default function WorkspaceHeader({
  backTo,
  backLabel,
  title,
  language,
  onLanguageChange,
  focus,
  onToggleFocus,
  running,
  onRun,
  hideBack = false,
  hideLanguage = false,
  hideRun = false,
  hideFocus = false,
  extra = null,
  onSubmit,
  submitting = false,
  submitted = false,
  hideSubmit = false,
}) {
  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-1.5 border-b border-white/10 px-2 py-1.5 sm:gap-2 sm:px-4">
      {!hideBack && (
        <Link
          to={backTo}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-mute hover:bg-white/5 hover:text-ink"
          aria-label={backLabel}
        >
          <ChevronLeft size={18} />
        </Link>
      )}
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{title}</h1>
      {extra}
      {!hideLanguage && (
        <select
          className="h-9 max-w-[7.5rem] rounded-xl border-0 bg-white/5 px-2 text-xs font-semibold text-ink outline-none sm:h-10 sm:max-w-none sm:px-3 sm:text-sm"
          value={language}
          onChange={(event) => onLanguageChange(event.target.value)}
          aria-label="Language"
        >
          {LANGUAGES.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      )}
      <ThemeToggle compact />
      {!hideFocus && (
        <button
          type="button"
          onClick={onToggleFocus}
          className={`hidden h-9 w-9 items-center justify-center rounded-full md:inline-flex ${focus ? "bg-white/10 text-ink" : "text-mute hover:bg-white/5 hover:text-ink"}`}
          aria-label={focus ? "Show side panel" : "Focus editor"}
          title={focus ? "Show side panel" : "Focus editor"}
        >
          <Columns2 size={16} />
        </button>
      )}
      {!hideRun && (
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60 sm:h-10 sm:px-4"
        >
          <Play size={15} fill="currentColor" />
          <span className="hidden sm:inline">{running ? "Running…" : "Run code"}</span>
        </button>
      )}
      {!hideSubmit && onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="inline-flex h-9 shrink-0 items-center rounded-xl bg-white/10 px-3 text-sm font-semibold text-ink hover:bg-white/15 disabled:opacity-60 sm:h-10 sm:px-4"
        >
          {submitting ? "Saving…" : submitted ? "Saved" : "Submit"}
        </button>
      )}
    </header>
  );
}

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
  extra = null,
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-4">
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
          className="h-10 rounded-xl border-0 bg-white/5 px-3 text-sm font-semibold text-ink outline-none"
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
      <button
        type="button"
        onClick={onToggleFocus}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${focus ? "bg-white/10 text-ink" : "text-mute hover:bg-white/5 hover:text-ink"}`}
        aria-label={focus ? "Show side panel" : "Focus editor"}
        title={focus ? "Show side panel" : "Focus editor"}
      >
        <Columns2 size={16} />
      </button>
      {!hideRun && (
        <button
          type="button"
          onClick={onRun}
          disabled={running}
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          <Play size={15} fill="currentColor" />
          {running ? "Running…" : "Run code"}
        </button>
      )}
    </header>
  );
}

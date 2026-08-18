import { useMemo } from "react";
import { Terminal } from "lucide-react";
import { formatOutput } from "./formatOutput";

export default function ConsolePanel({ stdin, onStdin, output, running, onClear, stdinLabel = "Stdin" }) {
  const view = useMemo(() => formatOutput(output), [output]);
  return (
    <div className="flex h-full min-h-0 border-t border-white/10 bg-card">
      <label className="flex w-52 shrink-0 flex-col border-r border-white/10">
        <span className="flex h-10 items-center px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
          {stdinLabel}
        </span>
        <textarea
          className="min-h-0 flex-1 resize-none bg-transparent px-3 pb-3 font-mono text-xs leading-5 text-ink outline-none placeholder:text-mute/70"
          placeholder="Optional input passed to the program"
          value={stdin}
          onChange={(event) => onStdin(event.target.value)}
        />
      </label>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center justify-between px-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
            <Terminal size={13} className="text-brand" />
            Console
          </span>
          {onClear && (
            <button type="button" onClick={onClear} className="text-[11px] font-semibold text-mute hover:text-ink">
              Clear
            </button>
          )}
        </div>
        <pre className={`min-h-0 flex-1 overflow-auto px-3 pb-3 font-mono text-xs leading-5 ${view.tone}`}>
          {running ? "Running…" : view.text}
        </pre>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { ChevronDown, Monitor, Smartphone } from "lucide-react";

export default function PreviewPane({ srcDoc, logs, onClear }) {
  const [mode, setMode] = useState("desktop");
  const [openConsole, setOpenConsole] = useState(true);
  const mobile = mode === "mobile";

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 px-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Preview</p>
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setMode("desktop")}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${!mobile ? "bg-white/10 text-ink" : "text-mute hover:text-ink"}`}
              aria-label="Desktop view"
              title="Desktop"
            >
              <Monitor size={15} />
            </button>
            <button
              type="button"
              onClick={() => setMode("mobile")}
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${mobile ? "bg-white/10 text-ink" : "text-mute hover:text-ink"}`}
              aria-label="Mobile view"
              title="Mobile"
            >
              <Smartphone size={15} />
            </button>
          </div>
        </div>
        <div className={`min-h-0 flex-1 overflow-auto ${mobile ? "flex justify-center bg-[#111] p-4" : "bg-white"}`}>
          <iframe
            title="Frontend preview"
            className={mobile ? "h-full w-[320px] rounded-lg border-0 bg-white shadow-xl" : "h-full w-full border-0 bg-white"}
            sandbox="allow-scripts allow-forms allow-modals"
            srcDoc={srcDoc}
          />
        </div>
      </div>
      <ConsoleDock logs={logs} open={openConsole} onToggle={() => setOpenConsole((v) => !v)} onClear={onClear} />
    </div>
  );
}

function ConsoleDock({ logs, open, onToggle, onClear }) {
  return (
    <div className={`flex shrink-0 flex-col border-t border-white/10 ${open ? "h-36" : "h-10"}`}>
      <button type="button" onClick={onToggle} className="flex h-10 shrink-0 items-center justify-between px-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Terminal / Console</span>
        <ChevronDown size={14} className={`text-mute transition ${open ? "" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-2">
          <div className="mb-1 flex justify-end">
            <button type="button" onClick={onClear} className="text-[11px] font-semibold text-mute hover:text-ink">
              Clear
            </button>
          </div>
          <pre className="font-mono text-xs leading-5 text-mute">
            {(logs || []).length
              ? logs.map((line, index) => (
                <span key={`${line.at}-${index}`} className={line.level === "error" ? "block text-rose-400" : line.level === "warn" ? "block text-amber-400" : "block text-ink"}>
                  {line.text}
                </span>
              ))
              : "Ready for output..."}
          </pre>
        </div>
      )}
    </div>
  );
}

export function usePreviewLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    function onMessage(event) {
      if (event.data?.type !== "tyyari-preview") return;
      const text = String(event.data.message || "").trim();
      if (event.data.level === "ok" || !text) return;
      setLogs((prev) => [...prev.slice(-80), { level: event.data.level || "error", text, at: Date.now() }]);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return { logs, clearLogs: () => setLogs([]) };
}

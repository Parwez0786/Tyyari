import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ChevronLeft, FilePlus, Play, X } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import { DifficultyBadge } from "../QuestionMeta";
import FrontendPrompt from "./FrontendPrompt";
import MonacoPane from "./MonacoPane";
import PreviewPane, { usePreviewLogs } from "./PreviewPane";
import { buildPreviewSrcDoc } from "./preview";
import {
  frontendDefaultFiles,
  frontendStarterFor,
  isFile,
  newFileId,
  normalizeFilePath,
} from "./languages";
import { filesFromSubmission, loadSubmission, saveSubmission } from "../../services/submissions";

const DURATION = { EASY: 20, MEDIUM: 30, HARD: 45 };

export default function FrontendWorkspace({ data, backTo = "/practice/FRONTEND", backLabel = "Back to Frontend practice" }) {
  const key = `tyyari.fe.${data.id}`;
  const initial = useMemo(() => loadFrontend(key, data.title), [key, data.title]);
  const [entries, setEntries] = useState(initial.files);
  const [activeId, setActiveId] = useState(initial.activeId);
  const [autoSave, setAutoSave] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [srcDoc, setSrcDoc] = useState("");
  const { logs, clearLogs } = usePreviewLogs();
  const saveTimer = useMemo(() => ({ current: null }), []);

  const files = entries.filter(isFile);
  const active = files.find((file) => file.id === activeId) || files[0];
  const minutes = DURATION[(data.difficulty || "MEDIUM").toUpperCase()] || 30;

  useEffect(() => {
    setSrcDoc(buildPreviewSrcDoc(files));
    // first paint only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!autoSave) return undefined;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify({ files: entries, activeId }));
    }, 250);
    return () => clearTimeout(saveTimer.current);
  }, [autoSave, key, entries, activeId, saveTimer]);

  useEffect(() => {
    let cancelled = false;
    const hadDraft = hasFrontendDraft(key);
    loadSubmission(data.id).then((saved) => {
      if (cancelled || !saved) return;
      setSubmitted(true);
      if (hadDraft) return;
      const next = filesFromSubmission(saved);
      if (!next) return;
      setEntries(next.files);
      setActiveId(next.activeId || next.files[0]?.id);
    });
    return () => {
      cancelled = true;
    };
  }, [data.id, key]);

  function updateActive(content) {
    setEntries((prev) => prev.map((item) => (item.id === active?.id ? { ...item, content } : item)));
  }

  function run() {
    clearLogs();
    setSrcDoc(buildPreviewSrcDoc(files));
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await saveSubmission({
        questionId: data.id,
        questionType: "FRONTEND",
        language: "javascript",
        view: "code",
        activeId,
        files,
      });
      localStorage.setItem(key, JSON.stringify({ files: entries, activeId }));
      setSubmitted(true);
    } catch {
      /* keep local draft */
    } finally {
      setSubmitting(false);
    }
  }

  function addFile(name) {
    const path = uniqueFrontendPath(entries, normalizeFilePath(name, "", "js") || "");
    if (!path) return false;
    const file = { id: newFileId(), type: "file", name: path, content: frontendStarterFor(path, data.title) };
    setEntries((prev) => [...prev, file]);
    setActiveId(file.id);
    setDialog(false);
    return true;
  }

  function removeFile(id) {
    const next = entries.filter((item) => item.id !== id);
    if (!next.some(isFile)) return;
    setEntries(next);
    if (activeId === id) setActiveId(next.find(isFile)?.id);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/10 px-3">
        <Link
          to={backTo}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-mute hover:bg-white/5 hover:text-ink"
          aria-label={backLabel}
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="truncate text-sm font-semibold text-ink">{data.title}</h1>
        <DifficultyBadge difficulty={data.difficulty} />
        <span className="hidden rounded-md border border-white/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-mute sm:inline">
          {minutes} mins
        </span>
        <div className="flex-1" />
        <label className="hidden items-center gap-2 text-xs font-semibold text-mute sm:inline-flex">
          <input type="checkbox" checked={autoSave} onChange={(event) => setAutoSave(event.target.checked)} />
          Auto-Save {autoSave ? "Enabled" : "Off"}
        </label>
        <ThemeToggle compact />
        <button
          type="button"
          onClick={run}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          <Play size={14} fill="currentColor" />
          Run Code
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="inline-flex h-10 items-center rounded-xl bg-white/10 px-4 text-sm font-semibold text-ink hover:bg-white/15 disabled:opacity-60"
        >
          {submitting ? "Saving…" : submitted ? "Submitted" : "Submit"}
        </button>
      </header>

      <PanelGroup direction="horizontal" autoSaveId="tyyari.fe.cols" className="min-h-0 flex-1">
        <Panel defaultSize={24} minSize={16} maxSize={36} className="h-full min-h-0">
          <FrontendPrompt data={data} submitted={submitted} />
        </Panel>
        <PanelResizeHandle className="tyyari-resize" />
        <Panel defaultSize={44} minSize={28} className="h-full min-h-0">
          <div className="flex h-full min-h-0 flex-col border-r border-white/10">
            <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto bg-card px-2">
              {files.map((file) => (
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setActiveId(file.id)}
                  className={`inline-flex h-8 shrink-0 items-center gap-1 rounded-t-lg px-2.5 text-xs font-semibold ${
                    file.id === active?.id ? "bg-canvas text-ink" : "text-mute hover:text-ink"
                  }`}
                >
                  {file.name}
                  {files.length > 1 && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="rounded p-0.5 text-mute hover:bg-white/10 hover:text-ink"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeFile(file.id);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") removeFile(file.id);
                      }}
                    >
                      <X size={11} />
                    </span>
                  )}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDialog(true)}
                className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-brand hover:bg-white/5"
              >
                <FilePlus size={13} />
              </button>
            </div>
            <div className="min-h-0 flex-1 bg-canvas">
              <MonacoPane file={active} onChange={updateActive} onRun={run} />
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className="tyyari-resize" />
        <Panel defaultSize={32} minSize={22} className="h-full min-h-0">
          <PreviewPane srcDoc={srcDoc} logs={logs} onClear={clearLogs} />
        </Panel>
      </PanelGroup>

      {dialog && (
        <AddFrontendFile entries={entries} onClose={() => setDialog(false)} onCreate={addFile} />
      )}
    </div>
  );
}

function AddFrontendFile({ entries, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event.preventDefault();
    const next = normalizeFilePath(name, "", "js");
    if (!next) {
      setError("Enter a file name like TagItem.js or extra.css");
      return;
    }
    if (!/\.(jsx?|tsx?|css|html)$/i.test(next)) {
      setError("Use .js, .jsx, .css, or .html");
      return;
    }
    if (entries.some((item) => item.name.toLowerCase() === next.toLowerCase())) {
      setError("That name already exists.");
      return;
    }
    onCreate(name);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <form className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-5" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">React setup</p>
        <h2 className="mt-1 text-lg font-bold text-ink">Add a file</h2>
        <input autoFocus className="field" placeholder="TagItem.js" value={name} onChange={(event) => setName(event.target.value)} />
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" className="btn-black">Add file</button>
        </div>
      </form>
    </div>
  );
}

function loadFrontend(key, title) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    if (Array.isArray(saved.files) && saved.files.length) {
      const files = saved.files.map((item) => ({ ...item, type: "file" }));
      const activeId = files.some((file) => file.id === saved.activeId) ? saved.activeId : files[0].id;
      return { files, activeId };
    }
  } catch {
    /* ignore */
  }
  const files = frontendDefaultFiles(title);
  return { files, activeId: files[0].id };
}

function hasFrontendDraft(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    return Boolean(saved && Array.isArray(saved.files) && saved.files.length);
  } catch {
    return false;
  }
}

function uniqueFrontendPath(entries, path) {
  if (!path) return "";
  const used = new Set(entries.map((item) => item.name.toLowerCase()));
  if (!used.has(path.toLowerCase())) return path;
  const dot = path.lastIndexOf(".");
  const base = dot === -1 ? path : path.slice(0, dot);
  const ext = dot === -1 ? "" : path.slice(dot);
  let i = 2;
  while (used.has(`${base}${i}${ext}`.toLowerCase())) i += 1;
  return `${base}${i}${ext}`;
}

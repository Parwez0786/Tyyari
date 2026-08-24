import { useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FilePlus,
  FolderPlus,
  Folder,
  PanelLeft,
  PanelLeftClose,
  Trash2,
  X,
} from "lucide-react";
import PromptCard from "../PromptCard";
import WorkspaceTabs from "../WorkspaceTabs";
import ConsolePanel from "./ConsolePanel";
import MonacoPane from "./MonacoPane";
import WorkspaceHeader from "./WorkspaceHeader";
import {
  basename,
  buildTree,
  defaultFiles,
  filesFromStarter,
  dirname,
  isFile,
  isFolder,
  joinPath,
  LANGUAGES,
  languageById,
  languageFromName,
  newFileId,
  normalizeFilePath,
  normalizeFolderPath,
  starterFor,
} from "./languages";
import { runWorkspace } from "./piston";
import { QuestionType, practicePath } from "../../data/enums";
import { useNarrowScreen } from "../../hooks/useNarrowScreen";
import { filesFromSubmission, loadSubmission, saveSubmission } from "../../services/submissions";

export default function CodeWorkspace({ data, backTo = practicePath(QuestionType.LLD), backLabel = "Back to LLD practice" }) {
  const key = `tyyari.lld.${data.id}`;
  const initial = useMemo(() => loadWorkspace(key, data.title, data.starterFiles), [key, data.title, data.starterFiles]);
  const [entries, setEntries] = useState(initial.files);
  const [activeId, setActiveId] = useState(initial.activeId);
  const [stdin, setStdin] = useState(initial.stdin);
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [focus, setFocus] = useState(false);
  const [pane, setPane] = useState("prompt");
  const narrow = useNarrowScreen();
  const [dialog, setDialog] = useState(null);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [explorer, setExplorer] = useState(() => {
    try {
      return localStorage.getItem("tyyari.lld.explorer") !== "0";
    } catch {
      return true;
    }
  });
  const [language, setLanguage] = useState(initial.language);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const saveTimer = useRef(null);
  const runRef = useRef(null);

  const files = entries.filter(isFile);
  const active = files.find((file) => file.id === activeId) || files[0];
  const lang = languageById(language);
  const tree = useMemo(() => buildTree(entries), [entries]);

  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify({ files: entries, stdin, activeId, language }));
    }, 250);
    return () => clearTimeout(saveTimer.current);
  }, [key, entries, stdin, activeId, language]);

  useEffect(() => {
    try {
      localStorage.setItem("tyyari.lld.explorer", explorer ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [explorer]);

  useEffect(() => {
    let cancelled = false;
    const hadDraft = hasLldDraft(key);
    loadSubmission(data.id).then((saved) => {
      if (cancelled || !saved) return;
      setSubmitted(true);
      if (hadDraft) return;
      const next = filesFromSubmission(saved);
      if (!next) return;
      setEntries(next.files);
      setActiveId(next.activeId || next.files.find(isFile)?.id);
      setStdin(next.stdin || "");
      if (next.language) setLanguage(next.language);
    });
    return () => {
      cancelled = true;
    };
  }, [data.id, key]);

  async function run() {
    if (running) return;
    if (narrow) setPane("code");
    setRunning(true);
    setOutput({ status: "running" });
    try {
      const result = await runWorkspace({ files, activeId, stdin, language });
      setOutput({ status: "done", ...result });
    } catch (err) {
      setOutput({ status: "error", message: err?.message || "Run failed" });
    } finally {
      setRunning(false);
    }
  }

  runRef.current = run;

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await saveSubmission({
        questionId: data.id,
        questionType: QuestionType.LLD,
        language,
        view: "code",
        activeId,
        stdin,
        files: entries,
      });
      setSubmitted(true);
    } catch (err) {
      setOutput({ status: "error", message: err?.message || "Could not save submission." });
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        event.preventDefault();
        runRef.current?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function updateActive(content) {
    setEntries((prev) => prev.map((item) => (item.id === active?.id ? { ...item, content } : item)));
  }

  function selectFile(id) {
    setActiveId(id);
    const file = files.find((item) => item.id === id);
    const detected = languageFromName(file?.name);
    if (LANGUAGES.some((item) => item.id === detected.id)) setLanguage(detected.id);
  }

  function switchLanguage(nextId) {
    const next = languageById(nextId);
    if (next.id === language) return;
    setLanguage(next.id);
    const fresh = defaultFiles(data.title, next.id);
    setEntries(fresh);
    setActiveId(fresh[0].id);
    setCollapsed(new Set());
    setOutput(null);
  }

  function openCreate(kind, parent = "") {
    setDialog({ kind, parent });
  }

  function createItem(name, fileLanguage) {
    if (!dialog) return false;
    if (dialog.kind === "folder") {
      const path = uniquePath(entries, normalizeFolderPath(name, dialog.parent));
      if (!path) return false;
      setEntries((prev) => [...prev, { id: newFileId(), type: "folder", name: path }]);
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(path);
        next.delete(dialog.parent);
        return next;
      });
      setDialog(null);
      return true;
    }
    const fallback = languageById(fileLanguage || language).ext;
    const path = uniquePath(entries, normalizeFilePath(name, dialog.parent, fallback));
    if (!path) return false;
    const file = { id: newFileId(), type: "file", name: path, content: starterFor(path, data.title) };
    setEntries((prev) => [...prev, file]);
    setActiveId(file.id);
    const detected = languageFromName(path);
    if (LANGUAGES.some((item) => item.id === detected.id)) setLanguage(detected.id);
    if (dialog.parent) {
      setCollapsed((prev) => {
        const next = new Set(prev);
        next.delete(dialog.parent);
        return next;
      });
    }
    setDialog(null);
    return true;
  }

  function removeEntry(id, folderPath) {
    let next;
    if (folderPath) {
      const prefix = `${folderPath}/`;
      next = entries.filter((item) => item.name !== folderPath && !item.name.startsWith(prefix));
    } else {
      next = entries.filter((item) => item.id !== id);
    }
    if (!next.some(isFile)) return;
    setEntries(next);
    const stillActive = next.some((item) => item.id === activeId && isFile(item));
    if (!stillActive) setActiveId(next.find(isFile)?.id);
  }

  function toggleFolder(path) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <WorkspaceHeader
        backTo={backTo}
        backLabel={backLabel}
        title={data.title}
        language={language}
        onLanguageChange={switchLanguage}
        focus={focus}
        onToggleFocus={() => setFocus((v) => !v)}
        running={running}
        onRun={run}
        onSubmit={submit}
        submitting={submitting}
        submitted={submitted}
      />

      {narrow && (
        <WorkspaceTabs
          tabs={[
            { id: "prompt", label: "Prompt" },
            { id: "code", label: "Code" },
          ]}
          value={pane}
          onChange={setPane}
        />
      )}
      {narrow && pane === "prompt" ? (
        <div className="min-h-0 flex-1">
          <PromptCard data={data} />
        </div>
      ) : (
        <PanelGroup direction="horizontal" autoSaveId="tyyari.lld" className="min-h-0 flex-1">
          {!narrow && !focus && (
            <>
              <Panel defaultSize={22} minSize={16} maxSize={34} className="h-full min-h-0">
                <PromptCard data={data} />
              </Panel>
              <PanelResizeHandle className="tyyari-resize" />
            </>
          )}
          <Panel defaultSize={narrow || focus ? 100 : 78} minSize={40} className="h-full min-h-0">
            <PanelGroup direction="vertical" autoSaveId="tyyari.lld.editor" className="h-full min-h-0">
              <Panel defaultSize={72} minSize={40} className="min-h-0">
                <PanelGroup direction="horizontal" autoSaveId="tyyari.lld.files" className="h-full min-h-0">
                  {explorer && !narrow && (
                    <>
                      <Panel defaultSize={22} minSize={12} maxSize={40} className="min-h-0">
                        <FileSidebar
                          tree={tree}
                          files={files}
                          activeId={active?.id}
                          expanded={collapsed}
                          onToggle={toggleFolder}
                          onSelect={selectFile}
                          onAddFile={(parent) => openCreate("file", parent)}
                          onAddFolder={(parent) => openCreate("folder", parent)}
                          onRemove={removeEntry}
                          onCollapse={() => setExplorer(false)}
                        />
                      </Panel>
                      <PanelResizeHandle className="tyyari-resize" />
                    </>
                  )}
                  <Panel defaultSize={explorer && !narrow ? 78 : 100} minSize={40} className="min-h-0">
                    <div className="flex h-full min-h-0 flex-col">
                      <FileTabs
                        files={files}
                        activeId={active?.id}
                        explorer={narrow || explorer}
                        onSelect={selectFile}
                        onAddFile={() => openCreate("file", dirname(active?.name || ""))}
                        onAddFolder={() => openCreate("folder", dirname(active?.name || ""))}
                        onRemove={removeEntry}
                        onOpenExplorer={() => setExplorer(true)}
                      />
                      <div className="min-h-0 flex-1 bg-canvas">
                        <MonacoPane file={active} onChange={updateActive} onRun={run} />
                      </div>
                    </div>
                  </Panel>
                </PanelGroup>
              </Panel>
              <PanelResizeHandle className="tyyari-resize-y" />
              <Panel defaultSize={28} minSize={16} className="min-h-0">
                <ConsolePanel
                  stdin={stdin}
                  onStdin={setStdin}
                  output={output}
                  running={running}
                  onClear={() => setOutput(null)}
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      )}

      {dialog && (
        <AddItemDialog
          kind={dialog.kind}
          parent={dialog.parent}
          entries={entries}
          fallbackExt={lang.ext}
          language={language}
          onClose={() => setDialog(null)}
          onCreate={createItem}
        />
      )}
    </div>
  );
}

function FileSidebar({ tree, files, activeId, expanded, onToggle, onSelect, onAddFile, onAddFolder, onRemove, onCollapse }) {
  return (
    <aside className="flex h-full min-h-0 flex-col border-r border-white/10 bg-card">
      <div className="flex h-11 items-center justify-between border-b border-white/10 px-2">
        <p className="px-1 text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Explorer</p>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => onAddFile("")}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-mute hover:bg-white/5 hover:text-ink"
            aria-label="Add file"
            title="Add file"
          >
            <FilePlus size={14} />
          </button>
          <button
            type="button"
            onClick={() => onAddFolder("")}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-mute hover:bg-white/5 hover:text-ink"
            aria-label="Add folder"
            title="Add folder"
          >
            <FolderPlus size={14} />
          </button>
          <button
            type="button"
            onClick={onCollapse}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-mute hover:bg-white/5 hover:text-ink"
            aria-label="Hide explorer"
            title="Hide explorer"
          >
            <PanelLeftClose size={14} />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {tree.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            depth={0}
            files={files}
            activeId={activeId}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
            onAddFile={onAddFile}
            onAddFolder={onAddFolder}
            onRemove={onRemove}
          />
        ))}
      </div>
    </aside>
  );
}

function TreeNode({ node, depth, files, activeId, expanded, onToggle, onSelect, onAddFile, onAddFolder, onRemove }) {
  const open = node.type !== "folder" || !expanded.has(node.path);
  const active = node.type === "file" && node.id === activeId;
  const canDelete = node.type === "folder" || files.length > 1;

  return (
    <div>
      <div
        className={`group flex w-full items-center gap-1 rounded-lg py-1.5 pr-1.5 text-left text-xs ${
          active ? "bg-white/10 font-semibold text-ink" : "text-mute hover:bg-white/5 hover:text-ink"
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {node.type === "folder" ? (
          <button type="button" className="flex min-w-0 flex-1 items-center gap-1.5" onClick={() => onToggle(node.path)}>
            {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Folder size={13} className="shrink-0 text-brand" />
            <span className="min-w-0 truncate">{node.name}</span>
          </button>
        ) : (
          <button type="button" className="flex min-w-0 flex-1 items-center gap-1.5" onClick={() => onSelect(node.id)}>
            <span className="w-3" />
            <FileCode2 size={13} className="shrink-0 text-brand" />
            <span className="min-w-0 truncate">{node.name}</span>
          </button>
        )}
        <span className="hidden items-center group-hover:flex">
          {node.type === "folder" && (
            <>
              <IconBtn label={`Add file in ${node.name}`} onClick={() => onAddFile(node.path)}>
                <FilePlus size={12} />
              </IconBtn>
              <IconBtn label={`Add folder in ${node.name}`} onClick={() => onAddFolder(node.path)}>
                <FolderPlus size={12} />
              </IconBtn>
            </>
          )}
          {canDelete && (
            <IconBtn label={`Delete ${node.name}`} danger onClick={() => onRemove(node.id, node.type === "folder" ? node.path : undefined)}>
              <Trash2 size={12} />
            </IconBtn>
          )}
        </span>
      </div>
      {node.type === "folder" && open && node.children.map((child) => (
        <TreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          files={files}
          activeId={activeId}
          expanded={expanded}
          onToggle={onToggle}
          onSelect={onSelect}
          onAddFile={onAddFile}
          onAddFolder={onAddFolder}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

function IconBtn({ label, onClick, danger, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${danger ? "text-mute hover:text-rose-400" : "text-mute hover:text-ink"}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function FileTabs({ files, activeId, explorer, onSelect, onAddFile, onAddFolder, onRemove, onOpenExplorer }) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-white/10 bg-card px-2">
      {!explorer && (
        <button
          type="button"
          onClick={onOpenExplorer}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-mute hover:bg-white/5 hover:text-ink"
          aria-label="Show explorer"
          title="Show explorer"
        >
          <PanelLeft size={15} />
        </button>
      )}
      {files.map((file) => {
        const active = file.id === activeId;
        return (
          <button
            key={file.id}
            type="button"
            onClick={() => onSelect(file.id)}
            className={`group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs ${
              active ? "bg-white/10 font-semibold text-ink" : "text-mute hover:bg-white/5 hover:text-ink"
            }`}
          >
            <FileCode2 size={12} className={active ? "text-brand" : ""} />
            {basename(file.name)}
            {files.length > 1 && (
              <span
                role="button"
                tabIndex={0}
                className="rounded p-0.5 hover:bg-canvas hover:text-rose-400"
                onClick={(event) => {
                  event.stopPropagation();
                  onRemove(file.id);
                }}
                aria-label={`Close ${file.name}`}
              >
                <X size={11} />
              </span>
            )}
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAddFile}
        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-brand hover:bg-white/5"
      >
        <FilePlus size={13} />
        New file
      </button>
      <button
        type="button"
        onClick={onAddFolder}
        className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-brand hover:bg-white/5"
      >
        <FolderPlus size={13} />
        New folder
      </button>
    </div>
  );
}

function AddItemDialog({ kind, parent, entries, fallbackExt, language, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [langId, setLangId] = useState(language || "java");
  const [error, setError] = useState("");
  const folder = kind === "folder";
  const ext = languageById(langId).ext;

  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function submit(event) {
    event.preventDefault();
    const next = folder
      ? normalizeFolderPath(name, parent)
      : normalizeFilePath(name, parent, ext);
    if (!next) {
      setError(folder ? "Enter a folder name." : "Enter a file name.");
      return;
    }
    if (entries.some((item) => item.name.toLowerCase() === next.toLowerCase())) {
      setError("That name already exists.");
      return;
    }
    onCreate(name, folder ? undefined : langId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <form
        className="w-full max-w-md rounded-2xl border border-white/10 bg-card p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{folder ? "New folder" : "New file"}</p>
            <h2 className="mt-1 text-lg font-bold text-ink">{folder ? "Add a folder" : "Add a source file"}</h2>
            {parent ? <p className="mt-1 text-xs text-mute">Inside {parent}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-mute hover:bg-white/5 hover:text-ink" aria-label="Close">
            <X size={16} />
          </button>
        </div>
        {!folder && (
          <label className="mt-4 block text-sm font-medium text-ink">
            Language
            <select
              className="field mt-1.5"
              value={langId}
              onChange={(event) => setLangId(event.target.value)}
            >
              {LANGUAGES.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
        )}
        <label className="mt-4 block text-sm font-medium text-ink">
          {folder ? "Folder name" : "File name"}
          <input
            autoFocus
            className="field mt-1.5"
            placeholder={folder ? "parking" : `ParkingLot.${ext}`}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
          />
        </label>
        <p className="mt-2 text-xs text-mute">
          {folder
            ? "Use nested names like model/spot to create a path."
            : `Creates a ${languageById(langId).label} file (.${ext}). Run uses the selected language in the header.`}
        </p>
        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost !px-4 !py-2">Cancel</button>
          <button type="submit" className="btn-brand !px-4 !py-2">{folder ? "Create folder" : "Create file"}</button>
        </div>
      </form>
    </div>
  );
}

function loadWorkspace(key, title, starterFiles) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    if (Array.isArray(saved.files) && saved.files.length) {
      const files = saved.files.map((item) => (
        item.type === "folder"
          ? { ...item, type: "folder" }
          : { ...item, type: "file", name: item.name || item.path }
      ));
      const fileList = files.filter(isFile);
      const activeId = fileList.some((file) => file.id === saved.activeId)
        ? saved.activeId
        : fileList[0]?.id;
      const detected = languageFromName(fileList.find((file) => file.id === activeId)?.name || fileList[0]?.name);
      const language = LANGUAGES.some((item) => item.id === saved.language)
        ? saved.language
        : (LANGUAGES.some((item) => item.id === detected.id) ? detected.id : "java");
      return { files, activeId, stdin: saved.stdin || "", language };
    }
  } catch {
    /* ignore */
  }
  const files = filesFromStarter(starterFiles, () => defaultFiles(title));
  return { files, activeId: files[0].id, stdin: "", language: "java" };
}

function hasLldDraft(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    return Boolean(saved && Array.isArray(saved.files) && saved.files.length);
  } catch {
    return false;
  }
}

function uniquePath(entries, path) {
  if (!path) return "";
  const used = new Set(entries.map((item) => item.name.toLowerCase()));
  if (!used.has(path.toLowerCase())) return path;
  if (path.includes(".")) {
    const dir = dirname(path);
    const file = basename(path);
    const dot = file.lastIndexOf(".");
    const base = dot === -1 ? file : file.slice(0, dot);
    const ext = dot === -1 ? "" : file.slice(dot);
    let i = 2;
    while (used.has(joinPath(dir, `${base}${i}${ext}`).toLowerCase())) i += 1;
    return joinPath(dir, `${base}${i}${ext}`);
  }
  let i = 2;
  while (used.has(`${path}${i}`.toLowerCase())) i += 1;
  return `${path}${i}`;
}


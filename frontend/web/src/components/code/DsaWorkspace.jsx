import { useEffect, useMemo, useRef, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { CheckCircle2, CirclePlus, Terminal, X } from "lucide-react";
import PromptCard from "../PromptCard";
import MonacoPane from "./MonacoPane";
import WorkspaceHeader from "./WorkspaceHeader";
import { formatOutput } from "./formatOutput";
import { dsaStarterFor, languageById, newFileId } from "./languages";
import { runWorkspace } from "./piston";
import { dsaFiles, dsaFromSubmission, loadSubmission, saveSubmission } from "../../services/submissions";

export default function DsaWorkspace({
  data,
  storageKey,
  backTo = "/practice/DSA",
  backLabel = "Back to DSA practice",
  hideBack = false,
  hideHints = false,
  hideSubmit = false,
  assessmentSetId,
  snapshotRef,
}) {
  const key = storageKey || `tyyari.dsa.${data.id}`;
  const cases = useMemo(() => casesFromQuestion(data), [data]);
  const initial = useMemo(() => loadDsa(key, data.title, cases), [key, data.title, cases]);
  const [language, setLanguage] = useState(initial.language);
  const [codeByLang, setCodeByLang] = useState(initial.codeByLang);
  const [testcases, setTestcases] = useState(initial.testcases);
  const [activeCase, setActiveCase] = useState(initial.activeCase);
  const [tab, setTab] = useState("testcase");
  const [output, setOutput] = useState(null);
  const [running, setRunning] = useState(false);
  const [focus, setFocus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(initial.submittedAt));
  const saveTimer = useRef(null);
  const runRef = useRef(null);

  const lang = languageById(language);
  const current = testcases[activeCase] || testcases[0];
  const file = useMemo(
    () => ({
      id: language,
      name: lang.main,
      content: codeByLang[language] ?? dsaStarterFor(language, data.title),
    }),
    [language, lang.main, codeByLang, data.title],
  );

  function payload() {
    return {
      questionId: data.id,
      questionType: "DSA",
      assessmentSetId,
      language,
      view: "code",
      files: dsaFiles(codeByLang),
    };
  }

  if (snapshotRef) snapshotRef.current = payload;

  useEffect(() => {
    let cancelled = false;
    const hadDraft = hasDsaDraft(key);
    loadSubmission(data.id, assessmentSetId).then((saved) => {
      if (cancelled || !saved) return;
      setSubmitted(true);
      if (hadDraft) return;
      const next = dsaFromSubmission(saved, data.title, cases);
      if (!next) return;
      setLanguage(next.language);
      setCodeByLang(next.codeByLang);
    });
    return () => {
      cancelled = true;
    };
  }, [assessmentSetId, cases, data.id, data.title, key]);

  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify({ language, codeByLang, testcases, activeCase }));
    }, 250);
    return () => clearTimeout(saveTimer.current);
  }, [key, language, codeByLang, testcases, activeCase]);

  async function run() {
    if (running) return;
    setRunning(true);
    setTab("result");
    setOutput({ status: "running" });
    try {
      const result = await runWorkspace({
        files: [file],
        activeId: file.id,
        stdin: current?.input || "",
        language,
      });
      setOutput({ status: "done", expected: current?.expected || "", ...result });
    } catch (err) {
      setOutput({ status: "error", message: err.message || "Run failed" });
    } finally {
      setRunning(false);
    }
  }

  runRef.current = run;

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await saveSubmission(payload());
      setSubmitted(true);
    } catch (err) {
      setOutput({ status: "error", message: err.message || "Could not save submission." });
      setTab("result");
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

  function switchLanguage(nextId) {
    const next = languageById(nextId);
    if (next.id === language) return;
    setLanguage(next.id);
    setCodeByLang((prev) => (
      prev[next.id] ? prev : { ...prev, [next.id]: dsaStarterFor(next.id, data.title) }
    ));
    setOutput(null);
  }

  function updateCode(content) {
    setCodeByLang((prev) => ({ ...prev, [language]: content }));
  }

  function updateCase(patch) {
    setTestcases((prev) => prev.map((item, index) => (index === activeCase ? { ...item, ...patch } : item)));
  }

  function addCase() {
    setTestcases((prev) => [...prev, { id: newFileId(), input: "", expected: "" }]);
    setActiveCase(testcases.length);
    setTab("testcase");
  }

  function removeCase(index) {
    if (testcases.length < 2) return;
    const next = testcases.filter((_, i) => i !== index);
    setTestcases(next);
    setActiveCase(Math.min(activeCase, next.length - 1));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <WorkspaceHeader
        backTo={backTo}
        backLabel={backLabel}
        hideBack={hideBack}
        title={data.title}
        language={language}
        onLanguageChange={switchLanguage}
        focus={focus}
        onToggleFocus={() => setFocus((v) => !v)}
        running={running}
        onRun={run}
        hideSubmit={hideSubmit}
        onSubmit={submit}
        submitting={submitting}
        submitted={submitted}
      />

      <PanelGroup direction="horizontal" autoSaveId="tyyari.dsa" className="min-h-0 flex-1">
        {!focus && (
          <>
            <Panel defaultSize={32} minSize={18} maxSize={46} className="h-full min-h-0">
              <PromptCard data={data} hideHints={hideHints} />
            </Panel>
            <PanelResizeHandle className="tyyari-resize" />
          </>
        )}
        <Panel defaultSize={focus ? 100 : 68} minSize={40} className="h-full min-h-0">
          <PanelGroup direction="vertical" autoSaveId="tyyari.dsa.editor" className="h-full min-h-0">
            <Panel defaultSize={68} minSize={36} className="min-h-0">
              <div className="flex h-full min-h-0 flex-col bg-canvas">
                <div className="flex h-10 shrink-0 items-center border-b border-white/10 bg-card px-3">
                  <span className="rounded-md bg-white/5 px-2 py-1 font-mono text-xs font-semibold text-ink">{lang.main}</span>
                </div>
                <div className="min-h-0 flex-1">
                  <MonacoPane file={file} onChange={updateCode} onRun={run} />
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="tyyari-resize-y" />
            <Panel defaultSize={32} minSize={16} className="min-h-0">
              <TestcasePanel
                tab={tab}
                onTab={setTab}
                cases={testcases}
                active={activeCase}
                onSelect={setActiveCase}
                onAdd={addCase}
                onRemove={removeCase}
                current={current}
                onChange={updateCase}
                output={output}
                running={running}
                onClear={() => setOutput(null)}
              />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  );
}

function TestcasePanel({
  tab,
  onTab,
  cases,
  active,
  onSelect,
  onAdd,
  onRemove,
  current,
  onChange,
  output,
  running,
  onClear,
}) {
  const view = useMemo(() => formatOutput(output), [output]);
  const verdict = useMemo(() => judge(output, current?.expected), [output, current?.expected]);

  return (
    <div className="flex h-full min-h-0 flex-col border-t border-white/10 bg-card">
      <div className="flex h-10 shrink-0 items-center gap-1 border-b border-white/10 px-2">
        <TabButton active={tab === "testcase"} onClick={() => onTab("testcase")}>Testcase</TabButton>
        <TabButton active={tab === "result"} onClick={() => onTab("result")}>Result</TabButton>
        {tab === "result" && onClear && (
          <button type="button" onClick={onClear} className="ml-auto px-2 text-[11px] font-semibold text-mute hover:text-ink">
            Clear
          </button>
        )}
      </div>

      {tab === "testcase" ? (
        <div className="min-h-0 flex-1 overflow-auto p-3">
          <div className="flex flex-wrap items-center gap-2">
            {cases.map((item, index) => (
              <button
                key={item.id || index}
                type="button"
                onClick={() => onSelect(index)}
                className={`inline-flex h-8 items-center rounded-lg px-3 text-xs font-semibold ${
                  index === active ? "bg-white/10 text-ink" : "text-mute hover:bg-white/5 hover:text-ink"
                }`}
              >
                Case {index + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-mute hover:bg-white/5 hover:text-ink"
              aria-label="Add testcase"
            >
              <CirclePlus size={15} />
            </button>
            {cases.length > 1 && (
              <button
                type="button"
                onClick={() => onRemove(active)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-mute hover:bg-white/5 hover:text-ink"
                aria-label="Remove testcase"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <label className="mt-3 block">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Input</span>
            <textarea
              className="mt-1.5 h-24 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs leading-5 text-ink outline-none"
              value={current?.input || ""}
              onChange={(event) => onChange({ input: event.target.value })}
            />
          </label>
          <label className="mt-3 block">
            <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Expected</span>
            <textarea
              className="mt-1.5 h-16 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs leading-5 text-ink outline-none"
              value={current?.expected || ""}
              onChange={(event) => onChange({ expected: event.target.value })}
            />
          </label>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto p-3">
          {verdict && (
            <p className={`mb-3 inline-flex items-center gap-1.5 text-sm font-bold ${verdict.ok ? "text-emerald-400" : "text-rose-400"}`}>
              <CheckCircle2 size={16} />
              {verdict.label}
            </p>
          )}
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-mute">
            <Terminal size={13} className="text-brand" />
            Stdout
          </p>
          <pre className={`mt-2 whitespace-pre-wrap font-mono text-xs leading-5 ${view.tone}`}>
            {running ? "Running…" : view.text}
          </pre>
          {current?.expected ? (
            <>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Expected</p>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-5 text-ink">{current.expected}</pre>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded-lg px-3 text-xs font-semibold ${active ? "bg-white/10 text-ink" : "text-mute hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

function casesFromQuestion(data) {
  const examples = data?.examples || [];
  if (!examples.length) return [{ id: "case-1", input: "", expected: "" }];
  return examples.map((example, index) => ({
    id: `case-${index + 1}`,
    input: example.input || "",
    expected: example.output || "",
  }));
}

function loadDsa(key, title, cases) {
  const fallbackLang = "java";
  const starter = {
    language: fallbackLang,
    codeByLang: { [fallbackLang]: dsaStarterFor(fallbackLang, title) },
    testcases: cases,
    activeCase: 0,
    submittedAt: null,
  };
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "{}");
    if (!raw || typeof raw !== "object") return starter;
    const language = languageById(raw.language).id;
    const codeByLang = raw.codeByLang && typeof raw.codeByLang === "object"
      ? raw.codeByLang
      : { [language]: typeof raw.code === "string" ? raw.code : dsaStarterFor(language, title) };
    if (!codeByLang[language]) codeByLang[language] = dsaStarterFor(language, title);
    const savedCases = Array.isArray(raw.testcases) && raw.testcases.length ? raw.testcases : cases;
    return {
      language,
      codeByLang,
      testcases: savedCases,
      activeCase: Math.min(raw.activeCase || 0, savedCases.length - 1),
      submittedAt: raw.submittedAt || null,
    };
  } catch {
    return starter;
  }
}

function judge(output, expected) {
  if (!output || output.status !== "done" || !expected) return null;
  const compile = output.data?.compile;
  const run = output.data?.run;
  const failed = Boolean(compile?.code) || Boolean(run?.code) || Boolean(run?.signal);
  if (failed) return { ok: false, label: "Wrong Answer" };
  const got = normalizeOut(run?.stdout);
  const want = normalizeOut(expected);
  if (!want) return null;
  return got === want
    ? { ok: true, label: "Accepted" }
    : { ok: false, label: "Wrong Answer" };
}

function normalizeOut(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function hasDsaDraft(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || "null");
    return Boolean(raw && raw.codeByLang && Object.keys(raw.codeByLang).length);
  } catch {
    return false;
  }
}

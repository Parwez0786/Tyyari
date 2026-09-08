import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import PageHero from "../components/PageHero";
import { languageFromName } from "../components/code/languages";
import { runWorkspace } from "../components/code/piston";
import { buildPreviewSrcDoc } from "../components/code/preview";
import { QuestionType } from "../data/enums";
import { typeMeta } from "../data/questionTypes";
import { adminApi } from "../services/api";

export default function QuestionPreview() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["admin-question", id],
    queryFn: () => adminApi.question(id),
    enabled: Boolean(id),
  });
  const q = query.data?.data;
  const meta = typeMeta(q?.type);
  const files = useMemo(
    () => (q?.starterFiles || []).map((file, index) => ({
      id: `${file.name || "file"}-${index}`,
      name: file.name || `file-${index}`,
      content: file.content || "",
    })),
    [q],
  );
  const [log, setLog] = useState("");
  const [running, setRunning] = useState(false);

  if (query.isLoading) return <Loader fill />;
  if (!q) return <p className="text-sm text-hard">Question not found.</p>;

  const type = String(q.type || "").toUpperCase();
  const runnable = type === QuestionType.DSA || type === QuestionType.LLD || type === QuestionType.OA;
  const frontend = type === QuestionType.FRONTEND;
  const srcDoc = frontend ? buildPreviewSrcDoc(files) : "";

  async function runTests() {
    const cases = [...(q.examples || []), ...(q.testcases || [])].filter((item) => item.input != null && String(item.input).length);
    if (!files.length) {
      setLog("Add starter files on the edit form before running.");
      return;
    }
    if (!cases.length) {
      setLog("No examples or testcases to run.");
      return;
    }
    const language = languageFromName(files[0].name).id;
    if (!["java", "python", "cpp"].includes(language)) {
      setLog("Runner supports Java, Python, and C++ starters.");
      return;
    }
    setRunning(true);
    const lines = [];
    try {
      for (let i = 0; i < cases.length; i++) {
        const item = cases[i];
        const hidden = i >= (q.examples || []).length;
        try {
          const result = await runWorkspace({
            files,
            activeId: files[0].id,
            stdin: item.input,
            language,
          });
          const stdout = String(result.data?.run?.stdout || "").trim();
          const stderr = String(result.data?.run?.stderr || result.data?.compile?.stderr || "").trim();
          const expected = String(item.output || "").trim();
          const ok = expected ? stdout === expected : !stderr;
          lines.push(`${hidden ? "Hidden" : "Example"} ${hidden ? i - (q.examples || []).length + 1 : i + 1}: ${ok ? "pass" : "fail"}`);
          if (expected) lines.push(`  expected: ${expected}`);
          if (stdout) lines.push(`  stdout: ${stdout}`);
          if (stderr) lines.push(`  stderr: ${stderr}`);
        } catch (err) {
          lines.push(`${hidden ? "Hidden" : "Example"} ${i + 1}: error — ${err?.message || err}`);
        }
      }
    } finally {
      setRunning(false);
      setLog(lines.join("\n"));
    }
  }

  return (
    <div className="space-y-4">
      <PageHero
        kicker="Preview"
        title={q.title || meta.title}
        detail="Candidate-style workspace. Frontend renders in an iframe. DSA and LLD can run starters against examples and hidden cases."
        action={(
          <div className="flex flex-wrap gap-2">
            <Link to={`/questions/${q.id}`} className="btn-ghost">Edit</Link>
            <Link to="/questions" className="btn-ghost">Back</Link>
          </div>
        )}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">{meta.title}</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">{q.title}</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-mute">{q.description}</p>
          <List title="Constraints" items={q.constraints} />
          <List title="Functional" items={q.functionalRequirements} />
          <List title="Non-functional" items={q.nonFunctionalRequirements} />
          <List title="Hints" items={q.hints} />
          {(q.examples || []).map((example, index) => (
            <section key={index} className="mt-4 rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-mute">Example {index + 1}</p>
              {example.input && <pre className="mt-2 overflow-x-auto font-mono text-xs">In: {example.input}</pre>}
              {example.output && <pre className="mt-1 overflow-x-auto font-mono text-xs">Out: {example.output}</pre>}
            </section>
          ))}
          {(q.quiz || []).map((item, index) => (
            <section key={index} className="mt-4 rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-mute">Quiz {index + 1}</p>
              <p className="mt-2 text-sm font-semibold">{item.prompt}</p>
              <ul className="mt-2 space-y-1 text-sm text-mute">
                {(item.options || []).map((opt, optIndex) => (
                  <li key={optIndex} className={optIndex === item.answerIndex ? "text-brand" : ""}>
                    {opt}{optIndex === item.answerIndex ? " · correct" : ""}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {q.estimates && (
            <pre className="mt-4 overflow-x-auto rounded-2xl border border-line bg-surface p-4 font-mono text-xs">{q.estimates}</pre>
          )}
          {q.editorial && (
            <section className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-mute">Editorial</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{q.editorial}</p>
            </section>
          )}
        </article>

        <article className="rounded-[28px] border border-line bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Workspace</p>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight">
                {frontend ? "Live frontend preview" : runnable ? "Starter + runner" : "Prompt only"}
              </h2>
            </div>
            {runnable && (
              <button type="button" className="btn-brand" disabled={running} onClick={runTests}>
                {running ? "Running…" : "Run testcases"}
              </button>
            )}
          </div>

          {frontend && (
            <iframe
              title="Frontend preview"
              className="mt-5 h-[480px] w-full rounded-2xl border border-line bg-white"
              sandbox="allow-scripts allow-forms allow-modals"
              srcDoc={srcDoc}
            />
          )}

          {runnable && (
            <div className="mt-5 space-y-3">
              {files.map((file) => (
                <section key={file.id} className="rounded-2xl border border-line bg-surface p-4">
                  <p className="font-mono text-xs font-semibold">{file.name}</p>
                  <pre className="mt-2 max-h-56 overflow-auto font-mono text-xs leading-5">{file.content || "// empty"}</pre>
                </section>
              ))}
              {!files.length && (
                <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-mute">
                  No starter files. Add them on the edit form, then run from here.
                </p>
              )}
              <pre className="min-h-[120px] overflow-auto rounded-2xl border border-line bg-surface p-4 font-mono text-xs leading-5">
                {log || "Output appears here after Run testcases."}
              </pre>
            </div>
          )}

          {!frontend && !runnable && (
            <p className="mt-5 text-sm text-mute">
              {type === QuestionType.HLD
                ? "System design uses the canvas on the candidate app. This preview shows the prompt, estimates, and notes."
                : "This track does not use the code runner."}
            </p>
          )}
        </article>
      </div>
    </div>
  );
}

function List({ title, items }) {
  if (!items?.length) return null;
  return (
    <section className="mt-4">
      <p className="text-xs font-bold uppercase tracking-wide text-mute">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-mute">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}

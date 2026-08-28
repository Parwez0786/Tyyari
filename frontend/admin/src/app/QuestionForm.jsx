import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, Navigate, useMatch, useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import PageHero from "../components/PageHero";
import { DIFFICULTY_LIST, Difficulty, QuestionType, Subject } from "../data/enums";
import { difficultyLabel, subjectLabel } from "../data/labels";
import { QUESTION_TYPES, typeMeta } from "../data/questionTypes";
import { adminApi } from "../services/api";

const emptyExample = () => ({ input: "", output: "", explanation: "" });
const emptyQuiz = () => ({ prompt: "", options: ["", "", "", ""], answerIndex: 0 });
const emptyCase = () => ({ input: "", output: "" });
const emptyFile = () => ({ name: "", content: "" });

function blank(type) {
  return {
    type,
    subType: type === QuestionType.CS ? Subject.OS : "",
    title: "",
    description: "",
    difficulty: Difficulty.EASY,
    constraints: "",
    functionalRequirements: "",
    nonFunctionalRequirements: "",
    examples: [emptyExample()],
    quiz: [emptyQuiz()],
    testcases: [],
    starterFiles: [],
    estimates: "",
    canvasNotes: "",
    companies: [],
    topics: [],
    published: false,
    premium: false,
  };
}

export default function QuestionForm() {
  const { id, type: typeParam } = useParams();
  const navigate = useNavigate();
  const readOnly = Boolean(useMatch("/questions/:id/view"));
  const createType = typeParam ? String(typeParam).toUpperCase() : "";
  const knownCreate = Boolean(createType && QUESTION_TYPES.some((item) => item.key === createType));
  const [form, setForm] = useState(() => blank(createType || QuestionType.DSA));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const existing = useQuery({
    queryKey: ["admin-question", id],
    queryFn: () => adminApi.question(id),
    enabled: Boolean(id),
  });
  const companiesQuery = useQuery({ queryKey: ["admin-companies"], queryFn: adminApi.companies });
  const topicsQuery = useQuery({ queryKey: ["admin-topics"], queryFn: adminApi.topics });

  useEffect(() => {
    if (id || !knownCreate) return;
    setForm(blank(createType));
  }, [id, knownCreate, createType]);

  useEffect(() => {
    const q = existing.data?.data;
    if (!q) return;
    setForm({
      type: q.type || QuestionType.DSA,
      subType: q.subType || (q.type === QuestionType.CS ? Subject.OS : ""),
      title: q.title || "",
      description: q.description || "",
      difficulty: q.difficulty || Difficulty.EASY,
      constraints: (q.constraints || []).join("\n"),
      functionalRequirements: (q.functionalRequirements || []).join("\n"),
      nonFunctionalRequirements: (q.nonFunctionalRequirements || []).join("\n"),
      examples: (q.examples || []).length ? q.examples.map((ex) => ({
        input: ex.input || "",
        output: ex.output || "",
        explanation: ex.explanation || "",
      })) : [emptyExample()],
      quiz: (q.quiz || []).length ? q.quiz.map((item) => ({
        prompt: item.prompt || "",
        options: padOptions(item.options),
        answerIndex: Number.isInteger(item.answerIndex) ? item.answerIndex : 0,
      })) : [emptyQuiz()],
      testcases: (q.testcases || []).map((item) => ({ input: item.input || "", output: item.output || "" })),
      starterFiles: (q.starterFiles || []).map((item) => ({ name: item.name || "", content: item.content || "" })),
      estimates: q.estimates || "",
      canvasNotes: q.canvasNotes || "",
      companies: q.companies || [],
      topics: q.topics || [],
      published: q.published,
      premium: Boolean(q.premium),
    });
  }, [existing.data]);

  if (!id && !knownCreate) {
    return <Navigate to="/questions/new" replace />;
  }
  if (id && existing.isLoading) {
    return <Loader fill />;
  }

  const meta = typeMeta(form.type);
  const fields = meta.fields;
  const ph = meta.placeholders;

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function patchList(key, index, patch) {
    setForm((f) => ({
      ...f,
      [key]: f[key].map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
  }

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.description.trim()) return "Description is required.";
    if (fields.constraints && !lines(form.constraints).length) return "Add at least one constraint.";
    if (fields.requirements || fields.features) {
      if (!lines(form.functionalRequirements).length) {
        return fields.features ? "Add at least one feature." : "Add at least one functional requirement.";
      }
    }
    if (fields.requirements && !lines(form.nonFunctionalRequirements).length) {
      return "Add at least one non-functional requirement.";
    }
    if (fields.examples) {
      const ready = form.examples.filter((ex) => ex.input.trim() && ex.output.trim());
      if (!ready.length) return "Add at least one example with both input and output.";
    }
    if (fields.quiz) {
      const ready = form.quiz.filter((item) => item.prompt.trim() && item.options.filter((opt) => opt.trim()).length >= 2);
      if (!ready.length) return "Add at least one quiz item with a prompt and two options.";
    }
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (readOnly) return;
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError("");
    const existingQuestion = existing.data?.data || {};
    const body = {
      type: form.type,
      subType: fields.subType ? form.subType || null : null,
      title: form.title.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      topics: form.topics,
      companies: form.companies,
      tags: existingQuestion.tags || [],
      constraints: fields.constraints ? lines(form.constraints) : (existingQuestion.constraints || []),
      functionalRequirements: (fields.requirements || fields.features)
        ? lines(form.functionalRequirements)
        : (existingQuestion.functionalRequirements || []),
      nonFunctionalRequirements: fields.requirements
        ? lines(form.nonFunctionalRequirements)
        : (existingQuestion.nonFunctionalRequirements || []),
      examples: fields.examples
        ? form.examples.filter((ex) => ex.input.trim() && ex.output.trim())
        : (existingQuestion.examples || []),
      testcases: fields.testcases
        ? form.testcases.filter((item) => item.input.trim() && item.output.trim())
        : (existingQuestion.testcases || []),
      starterFiles: fields.starterFiles
        ? form.starterFiles.filter((item) => item.name.trim()).map((item) => ({
          name: item.name.trim(),
          content: item.content,
        }))
        : (existingQuestion.starterFiles || []),
      estimates: fields.estimates ? form.estimates.trim() : (existingQuestion.estimates || ""),
      canvasNotes: fields.estimates ? form.canvasNotes.trim() : (existingQuestion.canvasNotes || ""),
      quiz: fields.quiz
        ? form.quiz.filter((item) => item.prompt.trim()).map((item) => ({
          prompt: item.prompt.trim(),
          options: item.options.map((opt) => opt.trim()).filter(Boolean),
          answerIndex: item.answerIndex,
        }))
        : (existingQuestion.quiz || []),
      hints: existingQuestion.hints || [],
      published: form.published,
      premium: form.premium,
    };
    try {
      if (id) await adminApi.updateQuestion(id, body);
      else await adminApi.createQuestion(body);
      navigate("/questions");
    } catch (err) {
      setError(err?.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PageHero
        kicker={meta.key}
        title={readOnly ? (form.title || meta.title) : id ? `Edit ${meta.title}` : meta.add}
        detail={readOnly
          ? "Read-only catalog copy of the prompt they submitted against."
          : `${meta.hook} Optional extras sit below — hidden cases, starter files, or labels.`}
        action={readOnly
          ? <button type="button" className="btn-ghost" onClick={() => navigate(-1)}>Back</button>
          : (
            <div className="flex flex-wrap gap-2">
              {id && <Link to={`/questions/${id}/view`} className="btn-ghost">Preview</Link>}
              <Link to={id ? "/questions" : "/questions/new"} className="btn-ghost">Cancel</Link>
            </div>
          )}
      />

      <fieldset disabled={readOnly} className="min-w-0 space-y-4 border-0 p-0">

      <article className={`rounded-[28px] border border-line bg-gradient-to-br p-6 ${meta.accent}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Required</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">{meta.title} fields</h2>
        <p className="mt-1 text-sm text-mute">Everything here is required to publish a usable prompt.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {fields.subType && (
            <label className="block">
              <FieldLabel>Subject</FieldLabel>
              <select className="field" value={form.subType} onChange={(e) => set("subType", e.target.value)} required>
                {(meta.subTypes || []).map((t) => <option key={t} value={t}>{subjectLabel(t)}</option>)}
              </select>
            </label>
          )}
          <label className="block">
            <FieldLabel>Difficulty</FieldLabel>
            <select className="field" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} required>
              {DIFFICULTY_LIST.map((t) => <option key={t} value={t}>{difficultyLabel(t)}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <FieldLabel>Title</FieldLabel>
            <input className="field" placeholder={ph.title} value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </label>
          <label className="block sm:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <textarea
              className="field min-h-[128px] resize-y"
              placeholder={ph.description}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
            />
          </label>
        </div>

        {(fields.requirements || fields.features) && (
          <div className="mt-5 grid gap-4">
            <label className="block">
              <FieldLabel>{fields.features ? "Features" : "Functional requirements"}</FieldLabel>
              <textarea
                className="field min-h-[112px] resize-y"
                placeholder={ph.functional}
                value={form.functionalRequirements}
                onChange={(e) => set("functionalRequirements", e.target.value)}
                required
              />
            </label>
            {fields.requirements && (
              <label className="block">
                <FieldLabel>Non-functional requirements</FieldLabel>
                <textarea
                  className="field min-h-[112px] resize-y"
                  placeholder={ph.nonFunctional}
                  value={form.nonFunctionalRequirements}
                  onChange={(e) => set("nonFunctionalRequirements", e.target.value)}
                  required
                />
              </label>
            )}
          </div>
        )}

        {fields.constraints && (
          <label className="mt-5 block">
            <FieldLabel>Constraints</FieldLabel>
            <textarea
              className="field min-h-[80px] resize-y"
              placeholder={ph.constraints}
              value={form.constraints}
              onChange={(e) => set("constraints", e.target.value)}
              required
            />
          </label>
        )}

        {fields.examples && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <FieldLabel>Examples</FieldLabel>
              <button type="button" className="btn-ghost !px-4 !py-2 text-sm" onClick={() => set("examples", [...form.examples, emptyExample()])}>
                Add example
              </button>
            </div>
            <p className="mt-1 text-sm text-mute">At least one example needs both input and output. These become the visible samples.</p>
            <div className="mt-3 space-y-3">
              {form.examples.map((ex, index) => (
                <div key={index} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-mute">Example {index + 1}</p>
                    {form.examples.length > 1 && (
                      <button type="button" className="text-xs font-semibold text-hard" onClick={() => set("examples", form.examples.filter((_, i) => i !== index))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <FieldLabel>Input</FieldLabel>
                      <textarea className="field min-h-[80px] font-mono text-xs" placeholder="nums = [2,7,11,15], target = 9" value={ex.input} onChange={(e) => patchList("examples", index, { input: e.target.value })} />
                    </label>
                    <label className="block">
                      <FieldLabel>Output</FieldLabel>
                      <textarea className="field min-h-[80px] font-mono text-xs" placeholder="[0,1]" value={ex.output} onChange={(e) => patchList("examples", index, { output: e.target.value })} />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {fields.quiz && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <FieldLabel>Quiz items</FieldLabel>
              <button type="button" className="btn-ghost !px-4 !py-2 text-sm" onClick={() => set("quiz", [...form.quiz, emptyQuiz()])}>
                Add item
              </button>
            </div>
            <p className="mt-1 text-sm text-mute">Each item needs a prompt, two options, and a marked correct answer.</p>
            <div className="mt-3 space-y-3">
              {form.quiz.map((item, index) => (
                <div key={index} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-mute">Question {index + 1}</p>
                    {form.quiz.length > 1 && (
                      <button type="button" className="text-xs font-semibold text-hard" onClick={() => set("quiz", form.quiz.filter((_, i) => i !== index))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <label className="mt-3 block">
                    <FieldLabel>Prompt</FieldLabel>
                    <input className="field" placeholder="Threads in the same process typically share:" value={item.prompt} onChange={(e) => patchList("quiz", index, { prompt: e.target.value })} />
                  </label>
                  <div className="mt-3 grid gap-2">
                    {item.options.map((opt, optIndex) => (
                      <label key={optIndex} className="flex items-center gap-3 rounded-2xl border border-line bg-card px-3 py-2">
                        <input
                          type="radio"
                          name={`quiz-${index}`}
                          checked={item.answerIndex === optIndex}
                          onChange={() => patchList("quiz", index, { answerIndex: optIndex })}
                        />
                        <input
                          className="field mt-0 flex-1"
                          placeholder={`Option ${optIndex + 1}`}
                          value={opt}
                          onChange={(e) => {
                            const options = item.options.slice();
                            options[optIndex] = e.target.value;
                            patchList("quiz", index, { options });
                          }}
                        />
                        {item.answerIndex === optIndex && (
                          <span className="text-[10px] font-bold uppercase tracking-wide text-brand">Correct</span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-brand" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
            Publish now
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-brand" checked={form.premium} onChange={(e) => set("premium", e.target.checked)} />
            Premium lock
          </label>
        </div>

      </article>

      {(fields.testcases || fields.starterFiles || fields.estimates) && (
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Editor extras</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">What the workspace loads</h2>
          <p className="mt-1 text-sm text-mute">Optional. Leave empty and the candidate still gets the generic starter.</p>

          {fields.testcases && (
            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SoftLabel>Hidden testcases</SoftLabel>
                <button type="button" className="btn-ghost !px-4 !py-2 text-sm" onClick={() => set("testcases", [...form.testcases, emptyCase()])}>
                  Add hidden case
                </button>
              </div>
              <p className="mt-1 text-sm text-mute">Examples stay visible on the prompt. These extra cases run in the editor but are marked Hidden.</p>
              <div className="mt-3 space-y-3">
                {form.testcases.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-line bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-mute">Hidden {index + 1}</p>
                      <button type="button" className="text-xs font-semibold text-hard" onClick={() => set("testcases", form.testcases.filter((_, i) => i !== index))}>
                        Remove
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="block">
                        <SoftLabel>Input</SoftLabel>
                        <textarea className="field min-h-[80px] font-mono text-xs" placeholder={ph.testcaseIn} value={item.input} onChange={(e) => patchList("testcases", index, { input: e.target.value })} />
                      </label>
                      <label className="block">
                        <SoftLabel>Output</SoftLabel>
                        <textarea className="field min-h-[80px] font-mono text-xs" placeholder={ph.testcaseOut} value={item.output} onChange={(e) => patchList("testcases", index, { output: e.target.value })} />
                      </label>
                    </div>
                  </div>
                ))}
                {!form.testcases.length && (
                  <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-mute">No hidden cases yet. Examples still work as the visible samples.</p>
                )}
              </div>
            </div>
          )}

          {fields.starterFiles && (
            <div className="mt-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SoftLabel>Starter files</SoftLabel>
                <button type="button" className="btn-ghost !px-4 !py-2 text-sm" onClick={() => set("starterFiles", [...form.starterFiles, emptyFile()])}>
                  Add file
                </button>
              </div>
              <p className="mt-1 text-sm text-mute">Opened in the multi-file editor. Use paths like <span className="font-mono text-xs">model/Spot.java</span> or <span className="font-mono text-xs">App.js</span>.</p>
              <div className="mt-3 space-y-3">
                {form.starterFiles.map((item, index) => (
                  <div key={index} className="rounded-2xl border border-line bg-surface p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-mute">File {index + 1}</p>
                      <button type="button" className="text-xs font-semibold text-hard" onClick={() => set("starterFiles", form.starterFiles.filter((_, i) => i !== index))}>
                        Remove
                      </button>
                    </div>
                    <label className="mt-3 block">
                      <SoftLabel>Path</SoftLabel>
                      <input className="field font-mono text-sm" placeholder={ph.starterName || "Main.java"} value={item.name} onChange={(e) => patchList("starterFiles", index, { name: e.target.value })} />
                    </label>
                    <label className="mt-3 block">
                      <SoftLabel>Contents</SoftLabel>
                      <textarea className="field min-h-[140px] font-mono text-xs" placeholder={ph.starterContent} value={item.content} onChange={(e) => patchList("starterFiles", index, { content: e.target.value })} />
                    </label>
                  </div>
                ))}
                {!form.starterFiles.length && (
                  <p className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-mute">No starter files. Candidates get the generic template for this track.</p>
                )}
              </div>
            </div>
          )}

          {fields.estimates && (
            <div className="mt-5 grid gap-4">
              <label className="block">
                <SoftLabel>Estimate numbers</SoftLabel>
                <textarea
                  className="field min-h-[112px] resize-y font-mono text-sm"
                  placeholder={ph.estimates}
                  value={form.estimates}
                  onChange={(e) => set("estimates", e.target.value)}
                />
                <p className="mt-1 text-xs text-mute">Seeds the back-of-envelope math pane on the canvas.</p>
              </label>
              <label className="block">
                <SoftLabel>Default canvas notes</SoftLabel>
                <textarea
                  className="field min-h-[112px] resize-y"
                  placeholder={ph.canvasNotes}
                  value={form.canvasNotes}
                  onChange={(e) => set("canvasNotes", e.target.value)}
                />
                <p className="mt-1 text-xs text-mute">Seeds the design explanation pane. Candidates can overwrite it.</p>
              </label>
            </div>
          )}
        </article>
      )}

      <article className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Filters</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Companies and topics</h2>
        <p className="mt-1 text-sm text-mute">Attach labels so practice filters and sheets can find this question. Add missing names under Catalog.</p>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <ChipPick
            label="Companies"
            items={(companiesQuery.data?.data ?? []).map((item) => item.name)}
            selected={form.companies}
            onChange={(companies) => set("companies", companies)}
            empty="No companies yet. Add Amazon or Google in Catalog."
          />
          <ChipPick
            label="Topics"
            items={(topicsQuery.data?.data ?? [])
              .filter((item) => !item.category || String(item.category).toUpperCase() === form.type)
              .map((item) => item.name)}
            selected={form.topics}
            onChange={(topics) => set("topics", topics)}
            empty="No topics for this track yet. Add Graphs or CDN in Catalog."
          />
        </div>
      </article>

      {error && <p className="text-sm text-hard">{error}</p>}
      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <button className="btn-brand" disabled={saving}>{saving ? "Saving…" : "Save"}</button>
          <Link to={id ? "/questions" : "/questions/new"} className="btn-ghost">Cancel</Link>
        </div>
      )}
      </fieldset>
    </form>
  );
}

function FieldLabel({ children }) {
  return (
    <span className="text-xs font-semibold uppercase tracking-wide text-mute">
      {children} <span className="text-brand">*</span>
    </span>
  );
}

function SoftLabel({ children }) {
  return <span className="text-xs font-semibold uppercase tracking-wide text-mute">{children}</span>;
}

function ChipPick({ label, items, selected, onChange, empty }) {
  const chosen = new Set(selected);
  function toggle(name) {
    onChange(chosen.has(name) ? selected.filter((item) => item !== name) : [...selected, name]);
  }
  return (
    <div>
      <SoftLabel>{label}</SoftLabel>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => toggle(name)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              chosen.has(name) ? "bg-brand/15 text-brand" : "bg-white/5 text-mute hover:text-ink"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
      {!items.length && <p className="mt-3 text-sm text-mute">{empty}</p>}
    </div>
  );
}

function lines(value) {
  return value.split("\n").map((s) => s.trim()).filter(Boolean);
}

function padOptions(options) {
  const next = [...(options || [])];
  while (next.length < 4) next.push("");
  return next.slice(0, 4);
}

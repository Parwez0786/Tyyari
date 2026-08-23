import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import Loader from "../components/Loader";
import PageHero from "../components/PageHero";
import QuestionOrderPicker from "../components/QuestionOrderPicker";
import { DIFFICULTY_LIST, Difficulty, QuestionType, SHEET_TYPES as SHEET_TYPE_KEYS } from "../data/enums";
import { difficultyLabel } from "../data/labels";
import { QUESTION_TYPES, typeMeta } from "../data/questionTypes";
import { adminApi } from "../services/api";

const SHEET_TYPES = QUESTION_TYPES.filter((type) => SHEET_TYPE_KEYS.includes(type.key));

function blank(type) {
  return {
    title: "",
    slug: "",
    description: "",
    type,
    difficulty: Difficulty.MEDIUM,
    companies: "",
    questionSlugs: [],
    published: false,
  };
}

export default function SheetForm() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const initialType = String(params.get("type") || QuestionType.DSA).toUpperCase();
  const [form, setForm] = useState(() => blank(SHEET_TYPES.some((t) => t.key === initialType) ? initialType : QuestionType.DSA));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const existing = useQuery({
    queryKey: ["admin-sheet", id],
    queryFn: () => adminApi.sheet(id),
    enabled: Boolean(id),
  });

  const poolQuery = useQuery({
    queryKey: ["admin-questions", form.type, 200],
    queryFn: () => adminApi.questions({ type: form.type, limit: 200 }),
  });

  useEffect(() => {
    const sheet = existing.data?.data;
    if (!sheet) return;
    setForm({
      title: sheet.title || "",
      slug: sheet.slug || "",
      description: sheet.description || "",
      type: String(sheet.type || QuestionType.DSA).toUpperCase(),
      difficulty: sheet.difficulty || Difficulty.MEDIUM,
      companies: (sheet.companies || []).join(", "),
      questionSlugs: sheet.questionSlugs || [],
      published: Boolean(sheet.published),
    });
  }, [existing.data]);

  const meta = typeMeta(form.type);
  const pool = useMemo(() => poolQuery.data?.data?.items ?? [], [poolQuery.data]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.description.trim()) return "Description is required.";
    if (!form.questionSlugs.length) return "Add at least one question and set the order.";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setSaving(true);
    setError("");
    const body = {
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      description: form.description.trim(),
      type: form.type,
      difficulty: form.difficulty,
      companies: csv(form.companies),
      questionSlugs: form.questionSlugs,
      published: form.published,
    };
    try {
      if (id) await adminApi.updateSheet(id, body);
      else await adminApi.createSheet(body);
      navigate("/sheets");
    } catch (err) {
      setError(err?.message);
    } finally {
      setSaving(false);
    }
  }

  if (id && existing.isLoading) {
    return <Loader fill />;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PageHero
        kicker={meta.key}
        title={id ? "Edit sheet" : "New sheet"}
        detail="Title, type, companies, then the exact question order candidates grind."
        action={<Link to="/sheets" className="btn-ghost">Cancel</Link>}
      />

      {existing.isError && <p className="text-sm text-hard">{existing.error?.message || "Could not load this sheet."}</p>}

      <article className={`rounded-[28px] border border-line bg-gradient-to-br p-6 ${meta.accent}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Sheet</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">{meta.title} grind list</h2>
        <p className="mt-1 text-sm text-mute">Changing type resets the picker to that track’s questions. Order is stored as slugs.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <FieldLabel>Type</FieldLabel>
            <select
              className="field"
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, questionSlugs: [] }))}
              required
            >
              {SHEET_TYPES.map((type) => (
                <option key={type.key} value={type.key}>{type.title}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <FieldLabel>Difficulty</FieldLabel>
            <select className="field" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} required>
              {DIFFICULTY_LIST.map((t) => <option key={t} value={t}>{difficultyLabel(t)}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <FieldLabel>Title</FieldLabel>
            <input className="field" placeholder="SDE-1 DSA Sheet" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </label>
          <label className="block sm:col-span-2">
            <FieldLabel>Slug <span className="font-normal text-mute">(optional — from title if empty)</span></FieldLabel>
            <input className="field" placeholder="dsa-sde-sheet" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <textarea
              className="field min-h-[96px] resize-y"
              placeholder="A core set covering arrays, hashing, and graphs."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
            />
          </label>
          <label className="block sm:col-span-2">
            <FieldLabel>Companies <span className="font-normal text-mute">(comma-separated)</span></FieldLabel>
            <input className="field" placeholder="Amazon, Google" value={form.companies} onChange={(e) => set("companies", e.target.value)} />
          </label>
        </div>
      </article>

      <article className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Question order</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Pick and arrange</h2>
        <p className="mt-1 text-sm text-mute">Only published questions of this type show for candidates. Drafts can still sit on the list.</p>
        <div className="mt-5">
          <QuestionOrderPicker
            slugs={form.questionSlugs}
            onChange={(questionSlugs) => set("questionSlugs", questionSlugs)}
            pool={pool}
            loading={poolQuery.isLoading}
          />
        </div>
      </article>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
          Publish now
        </label>
        <div className="flex gap-2">
          {error && <p className="self-center text-sm text-hard">{error}</p>}
          <button type="submit" className="btn-brand" disabled={saving}>
            {saving ? "Saving…" : id ? "Save sheet" : "Create sheet"}
          </button>
        </div>
      </div>
    </form>
  );
}

function FieldLabel({ children }) {
  return <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-mute">{children}</span>;
}

function csv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

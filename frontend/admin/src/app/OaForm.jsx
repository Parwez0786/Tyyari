import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHero from "../components/PageHero";
import QuestionOrderPicker from "../components/QuestionOrderPicker";
import { adminApi } from "../services/api";

function blank() {
  return {
    title: "",
    slug: "",
    description: "",
    durationMinutes: 90,
    difficulty: "MEDIUM",
    companies: "",
    questionSlugs: [],
    published: false,
  };
}

export default function OaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const existing = useQuery({
    queryKey: ["admin-oa-set", id],
    queryFn: () => adminApi.assessmentSet(id),
    enabled: Boolean(id),
  });

  const poolQuery = useQuery({
    queryKey: ["admin-questions", "DSA", 200],
    queryFn: () => adminApi.questions({ type: "DSA", limit: 200 }),
  });

  useEffect(() => {
    const set = existing.data?.data;
    if (!set) return;
    setForm({
      title: set.title || "",
      slug: set.slug || "",
      description: set.description || "",
      durationMinutes: set.durationMinutes || 90,
      difficulty: set.difficulty || "MEDIUM",
      companies: (set.companies || []).join(", "),
      questionSlugs: set.questionSlugs || [],
      published: Boolean(set.published),
    });
  }, [existing.data]);

  const pool = useMemo(() => poolQuery.data?.data?.items ?? [], [poolQuery.data]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate() {
    if (!form.title.trim()) return "Title is required.";
    if (!form.description.trim()) return "Description is required.";
    const minutes = Number(form.durationMinutes);
    if (!Number.isFinite(minutes) || minutes < 1) return "Duration must be at least 1 minute.";
    if (!form.questionSlugs.length) return "Add at least one DSA question.";
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
      durationMinutes: Math.max(1, Number(form.durationMinutes) || 90),
      difficulty: form.difficulty,
      companies: csv(form.companies),
      questionSlugs: form.questionSlugs,
      published: form.published,
    };
    try {
      if (id) await adminApi.updateAssessmentSet(id, body);
      else await adminApi.createAssessmentSet(body);
      navigate("/oa");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <PageHero
        kicker="OA"
        title={id ? "Edit OA set" : "New OA set"}
        detail="Title, duration, company, difficulty, and the DSA questions in the timed camera round."
        action={<Link to="/oa" className="btn-ghost">Cancel</Link>}
      />

      {existing.isLoading && id && <p className="text-sm text-mute">Loading OA set…</p>}
      {existing.isError && <p className="text-sm text-hard">{existing.error.message || "Could not load this OA set."}</p>}

      <article className="rounded-[28px] border border-line bg-gradient-to-br from-blue-500/20 to-indigo-500/5 p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Timed round</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">OA details</h2>
        <p className="mt-1 text-sm text-mute">Camera stays on for the full duration on the candidate app.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <FieldLabel>Title</FieldLabel>
            <input className="field" placeholder="Amazon OA" value={form.title} onChange={(e) => set("title", e.target.value)} required />
          </label>
          <label className="block">
            <FieldLabel>Duration (minutes)</FieldLabel>
            <input
              className="field"
              type="number"
              min="1"
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes", e.target.value)}
              required
            />
          </label>
          <label className="block">
            <FieldLabel>Difficulty</FieldLabel>
            <select className="field" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)} required>
              {["EASY", "MEDIUM", "HARD"].map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
            </select>
          </label>
          <label className="block sm:col-span-2">
            <FieldLabel>Slug <span className="font-normal text-mute">(optional — from title if empty)</span></FieldLabel>
            <input className="field" placeholder="amazon-oa" value={form.slug} onChange={(e) => set("slug", e.target.value)} />
          </label>
          <label className="block sm:col-span-2">
            <FieldLabel>Description</FieldLabel>
            <textarea
              className="field min-h-[96px] resize-y"
              placeholder="A 90-minute DSA set covering arrays, intervals, and graphs."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              required
            />
          </label>
          <label className="block sm:col-span-2">
            <FieldLabel>Company <span className="font-normal text-mute">(comma-separated)</span></FieldLabel>
            <input className="field" placeholder="Amazon" value={form.companies} onChange={(e) => set("companies", e.target.value)} />
          </label>
        </div>
      </article>

      <article className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">DSA list</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Questions in this round</h2>
        <p className="mt-1 text-sm text-mute">Only DSA problems. Order is the order they appear after the camera check.</p>
        <div className="mt-5">
          <QuestionOrderPicker
            slugs={form.questionSlugs}
            onChange={(questionSlugs) => set("questionSlugs", questionSlugs)}
            pool={pool}
            loading={poolQuery.isLoading}
            emptyHint="Add DSA problems from the pool. Candidates see this order."
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
            {saving ? "Saving…" : id ? "Save OA set" : "Create OA set"}
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

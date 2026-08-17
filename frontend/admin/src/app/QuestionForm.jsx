import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminApi } from "../services/api";

const empty = {
  type: "DSA",
  title: "",
  description: "",
  difficulty: "EASY",
  topics: "",
  companies: "",
  tags: "",
  constraints: "",
  functionalRequirements: "",
  nonFunctionalRequirements: "",
  hints: "",
  published: false,
};

export default function QuestionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const existing = useQuery({
    queryKey: ["admin-question", id],
    queryFn: () => adminApi.question(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const q = existing.data?.data;
    if (!q) return;
    setForm({
      type: q.type || "DSA",
      subType: q.subType || "",
      title: q.title || "",
      description: q.description || "",
      difficulty: q.difficulty || "EASY",
      topics: (q.topics || []).join(", "),
      companies: (q.companies || []).join(", "),
      tags: (q.tags || []).join(", "),
      constraints: (q.constraints || []).join("\n"),
      functionalRequirements: (q.functionalRequirements || []).join("\n"),
      nonFunctionalRequirements: (q.nonFunctionalRequirements || []).join("\n"),
      hints: (q.hints || []).join("\n"),
      published: q.published,
    });
  }, [existing.data]);

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const body = {
      type: form.type,
      subType: form.subType || null,
      title: form.title,
      description: form.description,
      difficulty: form.difficulty,
      topics: csv(form.topics),
      companies: csv(form.companies),
      tags: csv(form.tags),
      constraints: form.constraints.split("\n").map((s) => s.trim()).filter(Boolean),
      functionalRequirements: form.functionalRequirements.split("\n").map((s) => s.trim()).filter(Boolean),
      nonFunctionalRequirements: form.nonFunctionalRequirements.split("\n").map((s) => s.trim()).filter(Boolean),
      hints: form.hints.split("\n").map((s) => s.trim()).filter(Boolean),
      published: form.published,
    };
    try {
      if (id) await adminApi.updateQuestion(id, body);
      else await adminApi.createQuestion(body);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel max-w-3xl space-y-4">
      <p className="label-caps">Catalog</p>
      <h1 className="text-3xl font-bold tracking-tight">{id ? "Edit question" : "Create question"}</h1>
      <div className="grid grid-cols-2 gap-3">
        <select className="field mt-0" value={form.type} onChange={(e) => set("type", e.target.value)}>
          {["DSA", "HLD", "LLD", "CS", "FRONTEND", "OA"].map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="field mt-0" value={form.difficulty} onChange={(e) => set("difficulty", e.target.value)}>
          {["EASY", "MEDIUM", "HARD"].map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <input className="field mt-0" placeholder="Title" value={form.title} onChange={(e) => set("title", e.target.value)} required />
      <textarea className="field mt-0 h-32" placeholder="Description" value={form.description} onChange={(e) => set("description", e.target.value)} />
      <input className="field mt-0" placeholder="Topics (comma)" value={form.topics} onChange={(e) => set("topics", e.target.value)} />
      <input className="field mt-0" placeholder="Companies (comma)" value={form.companies} onChange={(e) => set("companies", e.target.value)} />
      <input className="field mt-0" placeholder="Tags (comma)" value={form.tags} onChange={(e) => set("tags", e.target.value)} />
      <textarea className="field mt-0 h-20" placeholder="Constraints (one per line)" value={form.constraints} onChange={(e) => set("constraints", e.target.value)} />
      {form.type === "HLD" && (
        <>
          <textarea className="field mt-0 h-28" placeholder="Functional requirements (one per line)" value={form.functionalRequirements} onChange={(e) => set("functionalRequirements", e.target.value)} />
          <textarea className="field mt-0 h-28" placeholder="Non-functional requirements (one per line)" value={form.nonFunctionalRequirements} onChange={(e) => set("nonFunctionalRequirements", e.target.value)} />
        </>
      )}
      <textarea className="field mt-0 h-20" placeholder="Hints (one per line)" value={form.hints} onChange={(e) => set("hints", e.target.value)} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} />
        Publish immediately
      </label>
      {error && <p className="text-sm text-hard">{error}</p>}
      <button className="btn-black">Save</button>
    </form>
  );
}

function csv(value) {
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

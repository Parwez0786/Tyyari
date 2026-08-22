import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import PageHero from "../components/PageHero";
import { adminApi } from "../services/api";

export default function Catalog() {
  const client = useQueryClient();
  const companies = useQuery({ queryKey: ["admin-companies"], queryFn: adminApi.companies });
  const topics = useQuery({ queryKey: ["admin-topics"], queryFn: adminApi.topics });
  const tags = useQuery({ queryKey: ["admin-tags"], queryFn: adminApi.tags });
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState("DSA");
  const [tag, setTag] = useState("");

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Catalog"
        title="Companies, topics, tags"
        detail="These labels power practice filters. Add a company or topic before you attach it to a question."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Companies</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Interview loops</h2>
          <p className="mt-1 text-sm text-mute">Shows on practice cards and company filters.</p>
          <form
            className="mt-5 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!company.trim()) return;
              await adminApi.createCompany({ name: company.trim() });
              setCompany("");
              client.invalidateQueries({ queryKey: ["admin-companies"] });
            }}
          >
            <input className="field mt-0 flex-1" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Google" />
            <button className="btn-brand !px-4">Add</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {(companies.data?.data ?? []).map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5">
                <span className="font-medium">{c.name}</span>
                <button
                  type="button"
                  className="text-xs font-semibold text-hard"
                  onClick={async () => {
                    await adminApi.deleteCompany(c.id);
                    client.invalidateQueries({ queryKey: ["admin-companies"] });
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
            {!companies.data?.data?.length && (
              <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-mute">
                No companies yet. Add Google, Amazon, or any loop you tag.
              </li>
            )}
          </ul>
        </article>

        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Topics</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Track labels</h2>
          <p className="mt-1 text-sm text-mute">Pair a name with DSA, HLD, LLD, CS, or frontend.</p>
          <form
            className="mt-5 space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!topic.trim()) return;
              await adminApi.createTopic({ name: topic.trim(), category });
              setTopic("");
              client.invalidateQueries({ queryKey: ["admin-topics"] });
            }}
          >
            <input className="field mt-0" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Graphs" />
            <select className="field mt-0" value={category} onChange={(e) => setCategory(e.target.value)}>
              {["DSA", "HLD", "LLD", "CS", "FRONTEND", "OA"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn-brand w-full">Add</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {(topics.data?.data ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5">
                <span>
                  <span className="font-medium">{t.name}</span>{" "}
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mute">
                    {t.category}
                  </span>
                </span>
                <button
                  type="button"
                  className="text-xs font-semibold text-hard"
                  onClick={async () => {
                    await adminApi.deleteTopic(t.id);
                    client.invalidateQueries({ queryKey: ["admin-topics"] });
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
            {!topics.data?.data?.length && (
              <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-mute">
                No topics yet. Example: Graphs for DSA, Caching for HLD.
              </li>
            )}
          </ul>
        </article>

        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Tags</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Short labels</h2>
          <p className="mt-1 text-sm text-mute">Free-form chips like two-pointers or LRU.</p>
          <form
            className="mt-5 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!tag.trim()) return;
              await adminApi.createTag({ name: tag.trim() });
              setTag("");
              client.invalidateQueries({ queryKey: ["admin-tags"] });
            }}
          >
            <input className="field mt-0 flex-1" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="two-pointers" />
            <button className="btn-brand !px-4">Add</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {(tags.data?.data ?? []).map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5">
                <span className="font-medium">{t.name}</span>
                <button
                  type="button"
                  className="text-xs font-semibold text-hard"
                  onClick={async () => {
                    await adminApi.deleteTag(t.id);
                    client.invalidateQueries({ queryKey: ["admin-tags"] });
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
            {!tags.data?.data?.length && (
              <li className="rounded-2xl border border-dashed border-line px-4 py-6 text-center text-mute">
                No tags yet. Use short labels like two-pointers.
              </li>
            )}
          </ul>
        </article>
      </div>
    </div>
  );
}

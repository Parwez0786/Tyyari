import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Loader from "../components/Loader";
import PageHero from "../components/PageHero";
import { useDialog } from "../components/Dialog";
import { QUESTION_TYPE_LIST, QuestionType } from "../data/enums";
import { typeLabel } from "../data/labels";
import { adminApi } from "../services/api";

export default function Catalog() {
  const client = useQueryClient();
  const dialog = useDialog();
  const companies = useQuery({ queryKey: ["admin-companies"], queryFn: adminApi.companies });
  const topics = useQuery({ queryKey: ["admin-topics"], queryFn: adminApi.topics });
  const tags = useQuery({ queryKey: ["admin-tags"], queryFn: adminApi.tags });
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("");
  const [category, setCategory] = useState(QuestionType.DSA);
  const [tag, setTag] = useState("");
  const [busy, setBusy] = useState("");

  if (companies.isLoading || topics.isLoading || tags.isLoading) {
    return <Loader fill />;
  }

  async function run(key, work) {
    setBusy(key);
    try {
      await work();
    } catch (err) {
      await dialog.alert(err?.message || "Could not update the catalog.");
    } finally {
      setBusy("");
    }
  }

  async function rename(kind, item) {
    const next = await dialog.prompt(`New name for ${item.name}.`, {
      title: `Rename ${kind}`,
      defaultValue: item.name,
      confirmLabel: "Rename",
    });
    if (next == null || !String(next).trim() || String(next).trim() === item.name) return;
    const name = String(next).trim();
    await run(`rename-${item.id}`, async () => {
      if (kind === "company") await adminApi.updateCompany(item.id, { name });
      else if (kind === "topic") await adminApi.updateTopic(item.id, { name, category: item.category });
      else await adminApi.updateTag(item.id, { name });
      client.invalidateQueries({ queryKey: [`admin-${kind === "company" ? "companies" : kind === "topic" ? "topics" : "tags"}`] });
    });
  }

  async function remove(kind, item) {
    if (!await dialog.confirm(`Delete “${item.name}”? Questions that already use this label keep the old text.`, {
      title: `Delete ${kind}`,
      confirmLabel: "Delete",
    })) return;
    await run(`del-${item.id}`, async () => {
      if (kind === "company") await adminApi.deleteCompany(item.id);
      else if (kind === "topic") await adminApi.deleteTopic(item.id);
      else await adminApi.deleteTag(item.id);
      client.invalidateQueries({ queryKey: [`admin-${kind === "company" ? "companies" : kind === "topic" ? "topics" : "tags"}`] });
    });
  }

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Catalog"
        title="Companies, topics, tags"
        detail="These labels power practice filters. Rename in place, or add a company or topic before you attach it to a question."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Companies</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Interview loops</h2>
          <p className="mt-1 text-sm text-mute">Shows on practice cards and company filters.</p>
          <form
            className="mt-5 flex min-w-0 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!company.trim()) return;
              run("add-company", async () => {
                await adminApi.createCompany({ name: company.trim() });
                setCompany("");
                client.invalidateQueries({ queryKey: ["admin-companies"] });
              });
            }}
          >
            <input className="field mt-0 min-w-0 flex-1" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Google" />
            <button className="btn-brand !px-4" disabled={busy === "add-company"}>Add</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {(companies.data?.data ?? []).map((c) => (
              <CatalogRow
                key={c.id}
                name={c.name}
                busy={busy.startsWith("rename-") || busy.startsWith("del-") ? busy.includes(c.id) : false}
                onRename={() => rename("company", c)}
                onDelete={() => remove("company", c)}
              />
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
            onSubmit={(e) => {
              e.preventDefault();
              if (!topic.trim()) return;
              run("add-topic", async () => {
                await adminApi.createTopic({ name: topic.trim(), category });
                setTopic("");
                client.invalidateQueries({ queryKey: ["admin-topics"] });
              });
            }}
          >
            <input className="field mt-0" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Graphs" />
            <select className="field mt-0" value={category} onChange={(e) => setCategory(e.target.value)}>
              {QUESTION_TYPE_LIST.map((c) => <option key={c} value={c}>{typeLabel(c)}</option>)}
            </select>
            <button className="btn-brand w-full" disabled={busy === "add-topic"}>Add</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {(topics.data?.data ?? []).map((t) => (
              <CatalogRow
                key={t.id}
                name={t.name}
                meta={t.category}
                busy={busy.includes(t.id)}
                onRename={() => rename("topic", t)}
                onDelete={() => remove("topic", t)}
              />
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
            className="mt-5 flex min-w-0 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!tag.trim()) return;
              run("add-tag", async () => {
                await adminApi.createTag({ name: tag.trim() });
                setTag("");
                client.invalidateQueries({ queryKey: ["admin-tags"] });
              });
            }}
          >
            <input className="field mt-0 min-w-0 flex-1" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="two-pointers" />
            <button className="btn-brand !px-4" disabled={busy === "add-tag"}>Add</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {(tags.data?.data ?? []).map((t) => (
              <CatalogRow
                key={t.id}
                name={t.name}
                busy={busy.includes(t.id)}
                onRename={() => rename("tag", t)}
                onDelete={() => remove("tag", t)}
              />
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

function CatalogRow({ name, meta, busy, onRename, onDelete }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-2.5">
      <span className="min-w-0 truncate">
        <span className="font-medium">{name}</span>
        {meta && (
          <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mute">
            {meta}
          </span>
        )}
      </span>
      <span className="flex shrink-0 gap-3">
        <button type="button" className="text-xs font-semibold text-brand disabled:opacity-40" disabled={busy} onClick={onRename}>
          Rename
        </button>
        <button type="button" className="text-xs font-semibold text-hard disabled:opacity-40" disabled={busy} onClick={onDelete}>
          Delete
        </button>
      </span>
    </li>
  );
}

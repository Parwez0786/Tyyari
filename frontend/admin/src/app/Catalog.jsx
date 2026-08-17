import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
    <section className="panel">
      <p className="label-caps">Catalog</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Companies, topics, tags</h1>
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div>
          <p className="label-caps">Companies</p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await adminApi.createCompany({ name: company });
              setCompany("");
              client.invalidateQueries({ queryKey: ["admin-companies"] });
            }}
          >
            <input className="field mt-0 flex-1" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Name" />
            <button className="btn-black !px-4">Add</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {(companies.data?.data ?? []).map((c) => (
              <li key={c.id} className="flex justify-between rounded-card border border-line px-4 py-2">
                {c.name}
                <button className="text-hard" onClick={async () => { await adminApi.deleteCompany(c.id); client.invalidateQueries({ queryKey: ["admin-companies"] }); }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label-caps">Topics</p>
          <form
            className="mt-3 space-y-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await adminApi.createTopic({ name: topic, category });
              setTopic("");
              client.invalidateQueries({ queryKey: ["admin-topics"] });
            }}
          >
            <input className="field mt-0" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Name" />
            <select className="field mt-0" value={category} onChange={(e) => setCategory(e.target.value)}>
              {["DSA", "HLD", "LLD", "CS", "FRONTEND", "OA"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <button className="btn-black">Add</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {(topics.data?.data ?? []).map((t) => (
              <li key={t.id} className="flex justify-between rounded-card border border-line px-4 py-2">
                <span>{t.name} <span className="text-mute">{t.category}</span></span>
                <button className="text-hard" onClick={async () => { await adminApi.deleteTopic(t.id); client.invalidateQueries({ queryKey: ["admin-topics"] }); }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label-caps">Tags</p>
          <form
            className="mt-3 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              await adminApi.createTag({ name: tag });
              setTag("");
              client.invalidateQueries({ queryKey: ["admin-tags"] });
            }}
          >
            <input className="field mt-0 flex-1" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Name" />
            <button className="btn-black !px-4">Add</button>
          </form>
          <ul className="mt-4 space-y-2 text-sm">
            {(tags.data?.data ?? []).map((t) => (
              <li key={t.id} className="flex justify-between rounded-card border border-line px-4 py-2">
                {t.name}
                <button className="text-hard" onClick={async () => { await adminApi.deleteTag(t.id); client.invalidateQueries({ queryKey: ["admin-tags"] }); }}>Delete</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

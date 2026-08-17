import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adminApi } from "../services/api";

export default function Questions() {
  const client = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-questions"], queryFn: adminApi.questions });
  const items = data?.data?.items ?? [];

  return (
    <section className="panel">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-caps">Your workspace</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Questions</h1>
        </div>
        <Link to="/questions/new" className="btn-black">New question</Link>
      </div>
      <div className="mt-8 space-y-3">
        {items.map((q) => (
          <div key={q.id} className="flex flex-col gap-3 rounded-card border border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{q.title}</p>
              <p className="mt-1 text-sm text-mute">{q.type} · {q.difficulty}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/questions/${q.id}`} className="btn-ghost !px-4 !py-2">Edit</Link>
              <button
                className="btn-purple !px-4 !py-2"
                onClick={async () => {
                  await adminApi.publish(q.id, true);
                  client.invalidateQueries({ queryKey: ["admin-questions"] });
                }}
              >
                Publish
              </button>
              <button
                className="btn-ghost !px-4 !py-2 !text-hard"
                onClick={async () => {
                  await adminApi.deleteQuestion(q.id);
                  client.invalidateQueries({ queryKey: ["admin-questions"] });
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!items.length && <p className="text-sm text-mute">No questions yet.</p>}
      </div>
    </section>
  );
}

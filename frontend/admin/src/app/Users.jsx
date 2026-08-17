import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/api";

export default function Users() {
  const client = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.users });
  const users = data?.data ?? [];

  return (
    <section className="panel">
      <p className="label-caps">Security</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Users</h1>
      <div className="mt-8 space-y-3">
        {users.map((u) => (
          <div key={u.id} className="flex flex-col gap-3 rounded-card border border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{u.email}</p>
              <p className="mt-1 text-sm text-mute">{u.role} · {u.status}</p>
            </div>
            <button
              className={u.status === "ACTIVE" ? "btn-ghost !text-hard" : "btn-purple"}
              onClick={async () => {
                const next = u.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
                await adminApi.setUserStatus(u.id, next);
                client.invalidateQueries({ queryKey: ["admin-users"] });
              }}
            >
              {u.status === "ACTIVE" ? "Disable" : "Enable"}
            </button>
          </div>
        ))}
        {!users.length && <p className="text-sm text-mute">No users yet.</p>}
      </div>
    </section>
  );
}

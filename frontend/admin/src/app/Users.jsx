import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import Avatar from "../components/Avatar";
import { roleLabel, statusLabel } from "../data/labels";
import { formatPremiumUntil, formatWhen } from "../data/profile";
import { useAdminUsers } from "../hooks/useAdminUsers";

export default function Users() {
  const {
    usersQuery,
    search,
    setSearch,
    filters,
    setFilters,
    invite,
    setInvite,
    inviteNote,
    busy,
    rows,
    filtered,
    filteredOn,
    toggleStatus,
    setRole,
    submitInvite,
  } = useAdminUsers();

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Access"
        title="Users"
        detail="Search and filter accounts. Invite a candidate or editor, then open a profile for support."
      />

      <article className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Invite</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Create an account</h2>
        <p className="mt-1 text-sm text-mute">
          Sends a set-password link. Editors get catalog access without an admin login. You cannot invite an admin.
        </p>
        <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_8rem_auto]" onSubmit={submitInvite}>
          <input
            className="field mt-0"
            type="email"
            required
            value={invite.email}
            onChange={(e) => setInvite((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="email@company.com"
          />
          <input
            className="field mt-0"
            value={invite.name}
            onChange={(e) => setInvite((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Display name"
          />
          <select
            className="field mt-0"
            value={invite.role}
            onChange={(e) => setInvite((prev) => ({ ...prev, role: e.target.value }))}
          >
            <option value="USER">{roleLabel("USER")}</option>
            <option value="EDITOR">{roleLabel("EDITOR")}</option>
          </select>
          <button className="btn-brand" type="submit" disabled={busy === "invite"}>
            {busy === "invite" ? "Creating…" : "Invite"}
          </button>
        </form>
        {inviteNote && (
          <div className="mt-4 rounded-2xl border border-line bg-surface px-4 py-3.5">
            <p className="text-sm font-semibold">{inviteNote.message}</p>
            {inviteNote.actionUrl && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-xl bg-field px-3 py-2 text-xs">{inviteNote.actionUrl}</code>
                <button
                  type="button"
                  className="btn-ghost !px-3 !py-1.5 text-xs"
                  onClick={() => navigator.clipboard.writeText(inviteNote.actionUrl)}
                >
                  Copy link
                </button>
              </div>
            )}
          </div>
        )}
      </article>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-mute">{filtered.length} of {rows.length} accounts</p>
          <div className="flex flex-wrap items-center gap-2">
            {filteredOn && (
              <button
                type="button"
                className="btn-ghost !px-3 !py-1.5 text-xs"
                onClick={() => { setSearch(""); setFilters(EMPTY_FILTERS); }}
              >
                Clear
              </button>
            )}
            <input
              className="field mt-0 w-full max-w-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, role"
            />
          </div>
        </div>
        <FilterRow
          label="Role"
          value={filters.role}
          onChange={(role) => setFilters((prev) => ({ ...prev, role }))}
          options={[
            { key: "", label: `All · ${rows.length}` },
            { key: "USER", label: roleLabel("USER") },
            { key: "EDITOR", label: roleLabel("EDITOR") },
            { key: "ADMIN", label: roleLabel("ADMIN") },
          ]}
        />
        <FilterRow
          label="Status"
          value={filters.status}
          onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
          options={[
            { key: "", label: "All" },
            { key: "ACTIVE", label: statusLabel("ACTIVE") },
            { key: "DISABLED", label: statusLabel("DISABLED") },
            { key: "DELETING", label: statusLabel("DELETING") },
          ]}
        />
        <FilterRow
          label="Access"
          value={filters.access}
          onChange={(access) => setFilters((prev) => ({ ...prev, access }))}
          options={[
            { key: "", label: "All" },
            { key: "premium", label: "Premium" },
            { key: "free", label: "Free" },
          ]}
        />
        <FilterRow
          label="Verified"
          value={filters.verified}
          onChange={(verified) => setFilters((prev) => ({ ...prev, verified }))}
          options={[
            { key: "", label: "All" },
            { key: "yes", label: "Verified" },
            { key: "no", label: "Unverified" },
          ]}
        />
        <FilterRow
          label="Sign-in"
          value={filters.provider}
          onChange={(provider) => setFilters((prev) => ({ ...prev, provider }))}
          options={[
            { key: "", label: "All" },
            { key: "LOCAL", label: "Password" },
            { key: "GOOGLE", label: "Google" },
            { key: "GITHUB", label: "GitHub" },
          ]}
        />
        <FilterRow
          label="Onboarded"
          value={filters.onboarded}
          onChange={(onboarded) => setFilters((prev) => ({ ...prev, onboarded }))}
          options={[
            { key: "", label: "All" },
            { key: "yes", label: "Done" },
            { key: "no", label: "Not yet" },
          ]}
        />
      </div>

      {usersQuery.isLoading && <p className="text-sm text-mute">Loading accounts…</p>}
      {usersQuery.isError && <p className="text-sm text-hard">{usersQuery.error.message || "Could not load users."}</p>}

      <div className="space-y-3">
        {filtered.map((u) => (
          <article
            key={u.id}
            className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={u.name} email={u.email} />
              <div className="min-w-0">
                <Link to={`/users/${u.id}`} className="truncate font-semibold hover:text-brand">{u.name}</Link>
                <p className="truncate text-sm text-mute">{u.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-mute">
                    {roleLabel(u.role)}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
                    u.status === "ACTIVE"
                      ? "bg-brand/15 text-brand"
                      : u.status === "DELETING"
                        ? "bg-amber-400/15 text-amber-400"
                        : "bg-rose-500/15 text-hard"
                  }`}>
                    {statusLabel(u.status)}
                  </span>
                  {u.premium && (
                    <span className="rounded-full bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-premium">
                      Premium
                    </span>
                  )}
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    u.emailVerified ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-400/15 text-amber-400"
                  }`}>
                    {u.emailVerified ? "Verified" : "Unverified"}
                  </span>
                  <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-mute">
                    {u.providerLabel}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    u.onboarded ? "bg-brand/15 text-brand" : "bg-white/5 text-mute"
                  }`}>
                    {u.onboarded ? "Onboarded" : "Not onboarded"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-mute">
                  Last submit {formatWhen(u.lastSubmittedAt)}
                  {u.role !== "ADMIN" && ` · Premium ${formatPremiumUntil(u.premium, u.premiumUntil)}`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {u.role !== "ADMIN" && u.status !== "DELETING" && (
                <select
                  className="field mt-0 !w-auto !py-1.5 text-sm"
                  value={u.role}
                  disabled={busy === `role-${u.id}`}
                  onChange={(e) => setRole(u, e.target.value)}
                >
                  <option value="USER">{roleLabel("USER")}</option>
                  <option value="EDITOR">{roleLabel("EDITOR")}</option>
                </select>
              )}
              <Link to={`/users/${u.id}`} className="btn-ghost !px-4 !py-1.5 text-sm">View profile</Link>
              {u.role !== "ADMIN" && (
                <Link to={`/billing?user=${u.id}`} className="btn-ghost !px-4 !py-1.5 text-sm">Billing</Link>
              )}
              {u.role !== "ADMIN" && u.status !== "DELETING" && (
                <button
                  type="button"
                  className={u.status === "ACTIVE" ? "btn-ghost !px-4 !py-1.5 !text-hard text-sm" : "btn-brand !px-4 !py-1.5 text-sm"}
                  disabled={busy === `status-${u.id}`}
                  onClick={() => toggleStatus(u)}
                >
                  {u.status === "ACTIVE" ? "Disable" : "Enable"}
                </button>
              )}
            </div>
          </article>
        ))}
        {!usersQuery.isLoading && !filtered.length && (
          <div className="rounded-2xl border border-line bg-surface px-5 py-8 text-center">
            <p className="font-semibold">{rows.length ? "No accounts match" : "No accounts yet"}</p>
            <p className="mt-1 text-sm text-mute">
              {rows.length ? "Clear filters or try another search." : "Invite someone or wait for a candidate to register."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterRow({ label, value, onChange, options }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 text-[11px] font-bold uppercase tracking-[0.14em] text-mute">{label}</span>
      {options.map((option) => (
        <button
          key={option.key || "all"}
          type="button"
          onClick={() => onChange(value === option.key ? "" : option.key)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            value === option.key ? "bg-brand/15 text-brand" : "bg-white/5 text-mute hover:text-ink"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}


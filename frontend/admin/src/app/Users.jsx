import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import PageHero from "../components/PageHero";
import Avatar from "../components/Avatar";
import { AccountRole, AccountStatus } from "../data/enums";
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
    clearFilters,
    toggleStatus,
    setRole,
    submitInvite,
  } = useAdminUsers();

  if (usersQuery.isLoading) return <Loader fill />;

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Access"
        title="Users"
        detail="Search and filter accounts. Invite a candidate or editor, then open a profile for support."
      />

      <article className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-gradient-to-br from-brand/15 via-card to-card p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Invite</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Create an account</h2>
        <p className="mt-1 text-sm text-mute">
          Sends a set-password link. Editors get catalog access without an admin login. You cannot invite an admin.
        </p>
        <form className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_8rem_auto]" onSubmit={submitInvite}>
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
            <option value={AccountRole.USER}>{roleLabel(AccountRole.USER)}</option>
            <option value={AccountRole.EDITOR}>{roleLabel(AccountRole.EDITOR)}</option>
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
        </div>
      </article>

      <article className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-gradient-to-br from-blue-500/15 via-card to-card p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Directory</p>
            <p className="mt-2 text-sm text-mute">{filtered.length} of {rows.length} accounts</p>
          </div>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            {filteredOn && (
              <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={clearFilters}>
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
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <FilterSelect
            label="Role"
            value={filters.role}
            onChange={(role) => setFilters((prev) => ({ ...prev, role }))}
            options={[
              { key: "", label: "All roles" },
              { key: AccountRole.USER, label: roleLabel(AccountRole.USER) },
              { key: AccountRole.EDITOR, label: roleLabel(AccountRole.EDITOR) },
              { key: AccountRole.ADMIN, label: roleLabel(AccountRole.ADMIN) },
            ]}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(status) => setFilters((prev) => ({ ...prev, status }))}
            options={[
              { key: "", label: "All statuses" },
              { key: AccountStatus.ACTIVE, label: statusLabel(AccountStatus.ACTIVE) },
              { key: AccountStatus.DISABLED, label: statusLabel(AccountStatus.DISABLED) },
              { key: AccountStatus.DELETING, label: statusLabel(AccountStatus.DELETING) },
            ]}
          />
          <FilterSelect
            label="Access"
            value={filters.access}
            onChange={(access) => setFilters((prev) => ({ ...prev, access }))}
            options={[
              { key: "", label: "All access" },
              { key: "premium", label: "Premium" },
              { key: "free", label: "Free" },
            ]}
          />
          <FilterSelect
            label="Verified"
            value={filters.verified}
            onChange={(verified) => setFilters((prev) => ({ ...prev, verified }))}
            options={[
              { key: "", label: "All inboxes" },
              { key: "yes", label: "Verified" },
              { key: "no", label: "Unverified" },
            ]}
          />
          <FilterSelect
            label="Sign-in"
            value={filters.provider}
            onChange={(provider) => setFilters((prev) => ({ ...prev, provider }))}
            options={[
              { key: "", label: "All sign-in" },
              { key: "LOCAL", label: "Password" },
              { key: "GOOGLE", label: "Google" },
              { key: "GITHUB", label: "GitHub" },
            ]}
          />
          <FilterSelect
            label="Onboarded"
            value={filters.onboarded}
            onChange={(onboarded) => setFilters((prev) => ({ ...prev, onboarded }))}
            options={[
              { key: "", label: "All onboarding" },
              { key: "yes", label: "Done" },
              { key: "no", label: "Not yet" },
            ]}
          />
        </div>
        </div>
      </article>

      {usersQuery.isError && <p className="text-sm text-hard">{usersQuery.error?.message || "Could not load users."}</p>}

      <section className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-gradient-to-br from-brand/15 via-card to-card p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative space-y-3">
        {filtered.map((u) => (
          <article
            key={u.id}
            className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/90 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
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
                    u.status === AccountStatus.ACTIVE
                      ? "bg-brand/15 text-brand"
                      : u.status === AccountStatus.DELETING
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
                  {u.role !== AccountRole.ADMIN && ` · Premium ${formatPremiumUntil(u.premium, u.premiumUntil)}`}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {u.role !== AccountRole.ADMIN && u.status !== AccountStatus.DELETING && (
                <select
                  className="field mt-0 !w-auto !py-1.5 text-sm"
                  value={u.role}
                  disabled={busy === `role-${u.id}`}
                  onChange={(e) => setRole(u, e.target.value)}
                >
                  <option value={AccountRole.USER}>{roleLabel(AccountRole.USER)}</option>
                  <option value={AccountRole.EDITOR}>{roleLabel(AccountRole.EDITOR)}</option>
                </select>
              )}
              <Link to={`/users/${u.id}`} className="btn-ghost !px-4 !py-1.5 text-sm">View profile</Link>
              {u.role !== AccountRole.ADMIN && (
                <Link to={`/billing?user=${u.id}`} className="btn-ghost !px-4 !py-1.5 text-sm">Billing</Link>
              )}
              {u.role !== AccountRole.ADMIN && u.status !== AccountStatus.DELETING && (
                <button
                  type="button"
                  className={u.status === AccountStatus.ACTIVE ? "btn-ghost !px-4 !py-1.5 !text-hard text-sm" : "btn-brand !px-4 !py-1.5 text-sm"}
                  disabled={busy === `status-${u.id}`}
                  onClick={() => toggleStatus(u)}
                >
                  {u.status === AccountStatus.ACTIVE ? "Disable" : "Enable"}
                </button>
              )}
            </div>
          </article>
        ))}
        {!usersQuery.isLoading && !filtered.length && (
          <div className="rounded-2xl border border-dashed border-line bg-surface/70 px-5 py-8 text-center">
            <p className="font-semibold">{rows.length ? "No accounts match" : "No accounts yet"}</p>
            <p className="mt-1 text-sm text-mute">
              {rows.length ? "Clear filters or try another search." : "Invite someone or wait for a candidate to register."}
            </p>
          </div>
        )}
        </div>
      </section>
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">{label}</span>
      <select className="field mt-2" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.key || "all"} value={option.key}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}


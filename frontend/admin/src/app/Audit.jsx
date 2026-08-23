import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import { formatWhen } from "../data/profile";
import { adminApi } from "../services/api";

const ACTIONS = {
  QUESTION_CREATE: {
    title: "Created question",
    detail: "A new prompt was added to the catalog.",
    pill: "bg-brand/15 text-brand",
    href: () => "/questions",
  },
  QUESTION_UPDATE: {
    title: "Updated question",
    detail: "Prompt, requirements, or visibility changed.",
    pill: "bg-sky-500/15 text-sky-400",
    href: (id) => (looksLikeId(id) ? `/questions/${id}` : "/questions"),
  },
  QUESTION_DELETE: {
    title: "Deleted question",
    detail: "Removed from the candidate library.",
    pill: "bg-rose-500/15 text-hard",
    href: () => "/questions",
  },
  QUESTION_PUBLISH: {
    title: "Publish toggle",
    detail: "Published or unpublished a problem.",
    pill: "bg-emerald-500/15 text-emerald-400",
    href: (id) => (looksLikeId(id) ? `/questions/${id}` : "/questions"),
  },
  COMPANY_CREATE: {
    title: "Added company",
    detail: "A company label was added for filters.",
    pill: "bg-amber-400/15 text-amber-400",
    href: () => "/catalog",
  },
  SHEET_CREATE: {
    title: "Created sheet",
    detail: "A grind list was added to the catalog.",
    pill: "bg-orange-500/15 text-orange-400",
    href: () => "/sheets",
  },
  SHEET_UPDATE: {
    title: "Updated sheet",
    detail: "Title, order, or companies changed.",
    pill: "bg-sky-500/15 text-sky-400",
    href: (id) => (looksLikeId(id) ? `/sheets/${id}` : "/sheets"),
  },
  SHEET_DELETE: {
    title: "Deleted sheet",
    detail: "Removed a candidate grind list.",
    pill: "bg-rose-500/15 text-hard",
    href: () => "/sheets",
  },
  SHEET_PUBLISH: {
    title: "Sheet publish",
    detail: "Published or unpublished a sheet.",
    pill: "bg-emerald-500/15 text-emerald-400",
    href: (id) => (looksLikeId(id) ? `/sheets/${id}` : "/sheets"),
  },
  OA_CREATE: {
    title: "Created OA set",
    detail: "A timed camera round was added.",
    pill: "bg-blue-500/15 text-premium",
    href: () => "/oa",
  },
  OA_UPDATE: {
    title: "Updated OA set",
    detail: "Duration, company, or DSA list changed.",
    pill: "bg-sky-500/15 text-sky-400",
    href: (id) => (looksLikeId(id) ? `/oa/${id}` : "/oa"),
  },
  OA_DELETE: {
    title: "Deleted OA set",
    detail: "Removed a timed camera round.",
    pill: "bg-rose-500/15 text-hard",
    href: () => "/oa",
  },
  OA_PUBLISH: {
    title: "OA publish",
    detail: "Published or unpublished an OA set.",
    pill: "bg-emerald-500/15 text-emerald-400",
    href: (id) => (looksLikeId(id) ? `/oa/${id}` : "/oa"),
  },
  PREMIUM_GRANT: {
    title: "Granted Premium",
    detail: "An account was given Premium access.",
    pill: "bg-blue-500/15 text-premium",
    href: (id) => (looksLikeId(id) ? `/users/${id}` : "/billing"),
  },
  PREMIUM_REVOKE: {
    title: "Revoked Premium",
    detail: "Premium was removed from an account.",
    pill: "bg-rose-500/15 text-hard",
    href: (id) => (looksLikeId(id) ? `/users/${id}` : "/billing"),
  },
  PAYMENT_REFUND: {
    title: "Refunded payment",
    detail: "A checkout or grant was refunded.",
    pill: "bg-amber-400/15 text-amber-400",
    href: () => "/billing",
  },
  USER_STATUS: {
    title: "User status",
    detail: "Enabled or disabled a candidate account.",
    pill: "bg-blue-500/15 text-premium",
    href: (id) => (looksLikeId(id) ? `/users/${id}` : "/users"),
  },
  USER_RESET_PASSWORD: {
    title: "Reset password",
    detail: "Sent a password reset from support.",
    pill: "bg-amber-400/15 text-amber-400",
    href: (id) => (looksLikeId(id) ? `/users/${id}` : "/users"),
  },
  USER_RESEND_VERIFY: {
    title: "Resent verification",
    detail: "Sent another verify-email link.",
    pill: "bg-sky-500/15 text-sky-400",
    href: (id) => (looksLikeId(id) ? `/users/${id}` : "/users"),
  },
  USER_FORCE_VERIFY: {
    title: "Marked email verified",
    detail: "Admin verified this inbox without the email link.",
    pill: "bg-emerald-500/15 text-emerald-400",
    href: (id) => (looksLikeId(id) ? `/users/${id}` : "/users"),
  },
  USER_REVOKE_SESSIONS: {
    title: "Signed out everywhere",
    detail: "Refresh tokens were revoked. They must sign in again.",
    pill: "bg-rose-500/15 text-hard",
    href: (id) => (looksLikeId(id) ? `/users/${id}` : "/users"),
  },
};

export default function Audit() {
  const auditQuery = useQuery({ queryKey: ["admin-audit"], queryFn: adminApi.audit });
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.users });
  const items = useMemo(
    () => [...(auditQuery.data?.data ?? [])].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [auditQuery.data],
  );
  const emails = useMemo(() => {
    const map = {};
    for (const user of usersQuery.data?.data ?? []) {
      map[user.id] = user.email;
    }
    return map;
  }, [usersQuery.data]);

  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const filters = [...new Set(items.map((item) => item.action).filter(Boolean))];

  const filtered = items.filter((item) => {
    if (action && item.action !== action) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const actor = (emails[item.actorId] || item.actorId || "").toLowerCase();
    const meta = ACTIONS[item.action] || {};
    return [item.action, item.detail, actor, meta.title].join(" ").toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Access"
        title="Audit log"
        detail="Who published, deleted, or disabled what. Newest first."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterChip active={!action} onClick={() => setAction("")} label={`All · ${items.length}`} />
          {filters.map((key) => (
            <FilterChip
              key={key}
              active={action === key}
              onClick={() => setAction(key === action ? "" : key)}
              label={`${(ACTIONS[key] || {}).title || key} · ${items.filter((item) => item.action === key).length}`}
            />
          ))}
        </div>
        <input
          className="field mt-0 w-full max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search actor, action, id"
        />
      </div>

      {auditQuery.isLoading && <p className="text-sm text-mute">Loading the log…</p>}
      {auditQuery.isError && <p className="text-sm text-hard">{auditQuery.error.message || "Could not load audit events."}</p>}

      <div className="space-y-3">
        {filtered.map((item) => {
          const meta = ACTIONS[item.action] || {
            title: item.action || "Event",
            detail: "Recorded admin action.",
            pill: "bg-white/5 text-mute",
            href: () => "/audit",
          };
          const target = item.detail || "";
          const href = meta.href(target);
          const actor = emails[item.actorId] || item.actorId || "Unknown admin";
          return (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${meta.pill}`}>
                    {meta.title}
                  </span>
                  <span className="text-xs text-mute">{formatWhen(item.createdAt)}</span>
                </div>
                <p className="mt-2 font-semibold">{meta.detail}</p>
                <p className="mt-1 truncate text-sm text-mute">
                  {actor}
                  {looksLikeId(target) ? ` · ${target}` : target && target !== "create question" && target !== "company" ? ` · ${target}` : ""}
                </p>
              </div>
              <Link to={href} className="btn-ghost !px-4 !py-1.5 text-sm">
                Open
              </Link>
            </article>
          );
        })}
        {!auditQuery.isLoading && !filtered.length && (
          <div className="rounded-2xl border border-line bg-surface px-5 py-8 text-center">
            <p className="font-semibold">No events match</p>
            <p className="mt-1 text-sm text-mute">
              {items.length ? "Try another filter." : "Publish, delete, or disable something and it will show up here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-brand/15 text-brand" : "bg-white/5 text-mute hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function looksLikeId(value) {
  return Boolean(value && /^[a-f0-9]{16,}$/i.test(String(value).trim()));
}

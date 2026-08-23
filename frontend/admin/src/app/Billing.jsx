import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import PageHero from "../components/PageHero";
import { paymentLabel, providerLabel } from "../data/labels";
import { formatWhen } from "../data/profile";
import { useAdminBilling } from "../hooks/useAdminBilling";

const STATUS_PILL = {
  paid: "bg-emerald-500/15 text-emerald-400",
  granted: "bg-blue-500/15 text-premium",
  open: "bg-amber-400/15 text-amber-400",
  expired: "bg-white/5 text-mute",
  refunded: "bg-rose-500/15 text-hard",
};

export default function Billing() {
  const {
    userId,
    setParams,
    paymentsQuery,
    items,
    filtered,
    status,
    setStatus,
    search,
    setSearch,
    sessionId,
    setSessionId,
    lookup,
    lookupError,
    busy,
    premiumUsers,
    counts,
    lookupSession,
    refresh,
    refund,
  } = useAdminBilling();

  if (paymentsQuery.isLoading) return <Loader fill />;

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Access"
        title="Billing"
        detail="Payments, Stripe session status, refunds, and who still has Premium."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Premium accounts" value={premiumUsers} hint="Excludes admins" />
        <Stat label="Paid" value={counts.paid} hint="Checkout completed" />
        <Stat label="Open sessions" value={counts.open} hint="Started, not paid" />
        <Stat label="Granted" value={counts.granted} hint="Admin grant" />
        <Stat label="Refunded" value={counts.refunded} hint="Premium revoked" />
      </div>

      <article className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Stripe</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Session status</h2>
        <p className="mt-1 text-sm text-mute">Paste a Checkout session id (cs_…) to see open, complete, or expired.</p>
        <form className="mt-5 flex flex-wrap gap-2" onSubmit={lookupSession}>
          <input
            className="field mt-0 min-w-[16rem] flex-1"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="cs_test_…"
          />
          <button className="btn-brand" type="submit">Look up</button>
        </form>
        {lookupError && <p className="mt-3 text-sm text-hard">{lookupError}</p>}
        {lookup && <PaymentRow item={lookup} />}
      </article>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["", "paid", "open", "granted", "refunded"].map((key) => (
            <button
              key={key || "all"}
              type="button"
              onClick={() => setStatus(key === status ? "" : key)}
              className={`tab-chip ${status === key ? "tab-chip-on" : ""}`}
            >
              {key ? paymentLabel(key) : `All · ${items.length}`}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {userId && (
            <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setParams({})}>
              Clear user filter
            </button>
          )}
          <input
            className="field mt-0 w-full max-w-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, session, status"
          />
        </div>
      </div>

      {paymentsQuery.isError && <p className="text-sm text-hard">{paymentsQuery.error?.message || "Could not load payments."}</p>}

      <div className="space-y-3">
        {filtered.map((item) => (
          <PaymentRow
            key={item.id || item.providerRef}
            item={item}
            busy={busy === item.id}
            onRefresh={item.id && item.provider === "stripe" ? () => refresh(item) : undefined}
            onRefund={item.id && (item.status === "paid" || item.status === "granted") ? () => refund(item) : undefined}
          />
        ))}
        {!paymentsQuery.isLoading && !filtered.length && (
          <div className="rounded-2xl border border-line bg-surface px-5 py-8 text-center">
            <p className="font-semibold">No payments match</p>
            <p className="mt-1 text-sm text-mute">
              {items.length ? "Try another filter." : "Checkout or grant Premium and the row will show here."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentRow({ item, busy, onRefresh, onRefund }) {
  const status = String(item.status || "open").toLowerCase();
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${STATUS_PILL[status] || STATUS_PILL.open}`}>
            {paymentLabel(status)}
          </span>
          {item.stripeStatus && (
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-mute">
              Stripe {paymentLabel(item.stripeStatus)}
            </span>
          )}
          <span className="text-xs text-mute">{formatWhen(item.createdAt)}</span>
        </div>
        <p className="mt-2 font-semibold">{item.email || item.userId || "Unknown user"}</p>
        <p className="mt-1 truncate text-sm text-mute">
          {item.displayAmount || "—"} · {providerLabel(item.provider)}
          {item.providerRef ? ` · ${item.providerRef}` : ""}
        </p>
        {item.refundId && <p className="mt-1 truncate text-xs text-mute">Refund {item.refundId}</p>}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {item.userId && (
          <Link to={`/users/${item.userId}`} className="btn-ghost !px-4 !py-1.5 text-sm">Profile</Link>
        )}
        {onRefresh && (
          <button type="button" className="btn-ghost !px-4 !py-1.5 text-sm" disabled={busy} onClick={onRefresh}>
            {busy ? "…" : "Refresh"}
          </button>
        )}
        {onRefund && (
          <button type="button" className="btn-ghost !px-4 !py-1.5 !text-hard text-sm" disabled={busy} onClick={onRefund}>
            Refund
          </button>
        )}
      </div>
    </article>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-mute">{hint}</p>}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Loader from "../components/Loader";
import PageHero from "../components/PageHero";
import { formatWhen } from "../data/profile";
import { mailpit } from "../services/api";

const INBOX = import.meta.env.VITE_MAILPIT_URL || "http://localhost:8026";

export default function Mail() {
  const [openId, setOpenId] = useState("");
  const listQuery = useQuery({
    queryKey: ["admin-mail"],
    queryFn: () => mailpit("/messages"),
    refetchInterval: 15000,
  });
  const detailQuery = useQuery({
    queryKey: ["admin-mail", openId],
    queryFn: () => mailpit(`/message/${openId}`),
    enabled: Boolean(openId),
  });

  const messages = listQuery.data?.messages ?? [];
  const total = listQuery.data?.total ?? messages.length;
  const unread = listQuery.data?.unread ?? 0;
  const selected = detailQuery.data;

  if (listQuery.isLoading) return <Loader fill />;

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Access"
        title="Mail log"
        detail="Outbound mail captured by Mailpit (local SMTP). Invite, verify, and reset emails land here when Gmail SMTP is empty."
        action={(
          <a href={INBOX} target="_blank" rel="noreferrer" className="btn-brand">
            Open Mailpit
          </a>
        )}
      />

      {listQuery.isError && (
        <p className="text-sm text-hard">{listQuery.error?.message || "Could not reach Mailpit. Is the mailpit container up?"}</p>
      )}

      <p className="text-sm text-mute">{total} messages · {unread} unread</p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-2">
          {messages.map((item) => {
            const id = item.ID || item.id;
            const from = item.From?.Address || item.From?.Name || "unknown";
            const to = (item.To || []).map((row) => row.Address || row.Name).filter(Boolean).join(", ");
            return (
              <button
                key={id}
                type="button"
                onClick={() => setOpenId(id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left ${
                  openId === id ? "border-brand/40 bg-brand/10" : "border-line bg-surface hover:border-brand/25"
                }`}
              >
                <p className="truncate text-sm font-semibold">{item.Subject || "(no subject)"}</p>
                <p className="mt-1 truncate text-xs text-mute">{from} → {to || "—"}</p>
                <p className="mt-1 text-xs text-mute">{formatWhen(item.Created || item.Date)}</p>
              </button>
            );
          })}
          {!messages.length && !listQuery.isError && (
            <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-mute">
              No mail yet. Invite a user or resend verification and the message shows up here.
            </div>
          )}
        </div>
        <article className="rounded-[28px] border border-line bg-card p-5 sm:p-6">
          {!openId && <p className="text-sm text-mute">Pick a message to read the body.</p>}
          {openId && detailQuery.isLoading && <Loader compact />}
          {selected && (
            <div className="min-w-0 space-y-3">
              <p className="text-lg font-extrabold tracking-tight">{selected.Subject || "(no subject)"}</p>
              <p className="text-sm text-mute">
                {(selected.From?.Address || selected.From?.Name) || "unknown"}
                {" · "}
                {formatWhen(selected.Date || selected.Created)}
              </p>
              <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl bg-field p-4 text-sm leading-6">
                {selected.Text || stripHtml(selected.HTML) || "Empty body."}
              </pre>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}

function stripHtml(html) {
  if (!html) return "";
  return String(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

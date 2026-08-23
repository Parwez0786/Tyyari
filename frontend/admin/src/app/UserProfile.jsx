import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import { HBarList } from "../components/Charts";
import { DAILY, EXPERIENCES, ROLES, formatWhen, roleMeta } from "../data/profile";
import { adminApi } from "../services/api";

const TYPE_COLORS = {
  DSA: "#34d399",
  HLD: "#f97316",
  LLD: "#38bdf8",
  FRONTEND: "#e879f9",
  CS: "#a3e635",
  OA: "#60a5fa",
};

export default function UserProfile() {
  const { id } = useParams();
  const client = useQueryClient();
  const accountQuery = useQuery({ queryKey: ["admin-user", id], queryFn: () => adminApi.user(id) });
  const profileQuery = useQuery({ queryKey: ["admin-user-profile", id], queryFn: () => adminApi.userProfile(id) });
  const paymentsQuery = useQuery({ queryKey: ["admin-payments", id], queryFn: () => adminApi.payments({ userId: id }) });
  const submissionsQuery = useQuery({ queryKey: ["admin-submissions", id], queryFn: () => adminApi.userSubmissions(id) });
  const [until, setUntil] = useState("");
  const [busy, setBusy] = useState("");
  const [supportNote, setSupportNote] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [fileIndex, setFileIndex] = useState(0);

  const account = accountQuery.data?.data;
  const bundle = profileQuery.data?.data;
  const profile = bundle?.profile || {};
  const goals = bundle?.goals || {};
  const prefs = bundle?.preferences || {};
  const progress = bundle?.progress || {};
  const loading = accountQuery.isLoading || profileQuery.isLoading;
  const error = accountQuery.error || profileQuery.error;

  const name = profile.name || account?.email || "Candidate";
  const firstName = String(name).split(" ")[0];
  const targetRole = profile.targetRole || goals.targetRole || "";
  const experience = profile.experience || "";
  const companies = goals.targetCompanies || [];
  const daily = goals.dailyGoalMinutes;
  const role = roleMeta(targetRole);
  const byType = (progress.byType || []).map((row) => ({
    label: row.type,
    value: row.completed,
    color: TYPE_COLORS[row.type],
  }));

  const rows = submissionsQuery.data?.data ?? [];
  const activeId = selectedId || rows[0]?.id || "";
  const detailQuery = useQuery({
    queryKey: ["admin-submission", id, activeId],
    queryFn: () => adminApi.userSubmission(id, activeId),
    enabled: Boolean(activeId),
  });
  const submission = detailQuery.data?.data;

  useEffect(() => {
    setUntil(toLocalInput(account?.premiumUntil));
  }, [account?.premiumUntil]);

  useEffect(() => {
    setFileIndex(0);
  }, [activeId]);

  async function setRole(role) {
    if (!account || account.role === "ADMIN" || account.role === role) return;
    setBusy("role");
    try {
      await adminApi.setUserRole(account.id, role);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-user", id] }),
        client.invalidateQueries({ queryKey: ["admin-users"] }),
      ]);
    } catch (err) {
      window.alert(err.message || "Could not update role.");
    } finally {
      setBusy("");
    }
  }

  async function toggleStatus() {
    if (!account || account.role === "ADMIN") return;
    const next = account.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    await adminApi.setUserStatus(account.id, next);
    await Promise.all([
      client.invalidateQueries({ queryKey: ["admin-user", id] }),
      client.invalidateQueries({ queryKey: ["admin-users"] }),
    ]);
  }

  async function refreshPayments() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["admin-user", id] }),
      client.invalidateQueries({ queryKey: ["admin-users"] }),
      client.invalidateQueries({ queryKey: ["admin-payments"] }),
    ]);
  }

  async function support(kind) {
    if (!account || account.role === "ADMIN") return;
    setBusy(kind);
    setSupportNote(null);
    try {
      const json = kind === "reset"
        ? await adminApi.resetPassword(account.id)
        : await adminApi.resendVerification(account.id);
      setSupportNote(json.data);
      await client.invalidateQueries({ queryKey: ["admin-user", id] });
    } catch (err) {
      window.alert(err.message || "Could not send the email.");
    } finally {
      setBusy("");
    }
  }

  async function forceVerify() {
    if (!account || account.role === "ADMIN" || account.emailVerified) return;
    if (!window.confirm("Mark this email verified? They can sign in without clicking the mail link.")) return;
    setBusy("force-verify");
    setSupportNote(null);
    try {
      await adminApi.forceVerify(account.id);
      setSupportNote({ message: "Email marked verified. They can sign in now." });
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-user", id] }),
        client.invalidateQueries({ queryKey: ["admin-users"] }),
      ]);
    } catch (err) {
      window.alert(err.message || "Could not verify this inbox.");
    } finally {
      setBusy("");
    }
  }

  async function setPremium(premium) {
    if (!account || account.role === "ADMIN") return;
    setBusy(premium ? "grant" : "revoke");
    try {
      await adminApi.setPremium(account.id, {
        premium,
        premiumUntil: premium && until ? new Date(until).toISOString() : null,
      });
      await refreshPayments();
    } catch (err) {
      window.alert(err.message || "Could not update Premium.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-4">
      {loading && <p className="text-sm text-mute">Loading this profile…</p>}
      {error && <p className="text-sm text-hard">{error.message || "Could not load this profile."}</p>}

      <section className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 flex-wrap items-start gap-5">
            <Avatar name={name} email={account?.email} size="lg" square />
            <div className="min-w-0">
              <p className="font-hand text-2xl text-brand">{profile.onboarded ? "Candidate profile" : "Not onboarded yet"}</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{firstName}</h1>
              <p className="mt-2 text-sm text-mute">{account?.email}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {role && (
                  <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                    {role.title} path
                  </span>
                )}
                {experience && (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-ink">{experience} exp</span>
                )}
                {companies.slice(0, 3).map((item) => (
                  <span key={item} className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-mute">{item}</span>
                ))}
                {account?.premium && (
                  <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-premium">Premium</span>
                )}
                {account?.status && (
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                    account.status === "ACTIVE" ? "bg-brand/15 text-brand" : "bg-rose-500/15 text-hard"
                  }`}>
                    {account.status}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/users" className="btn-ghost">Back to users</Link>
            {account && account.role !== "ADMIN" && (
              <>
                <button
                  type="button"
                  className={account.premium ? "btn-ghost !text-hard" : "btn-brand"}
                  disabled={Boolean(busy)}
                  onClick={() => setPremium(!account.premium)}
                >
                  {busy ? "…" : account.premium ? "Revoke Premium" : "Grant Premium"}
                </button>
                <button
                  type="button"
                  className={account.status === "ACTIVE" ? "btn-ghost !text-hard" : "btn-brand"}
                  onClick={toggleStatus}
                >
                  {account.status === "ACTIVE" ? "Disable" : "Enable"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {account && account.role !== "ADMIN" && (
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Support</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Help this inbox</h2>
          <p className="mt-1 text-sm text-mute">
            Send a reset or verification email, or mark the inbox verified when mail cannot reach them.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button type="button" className="btn-brand" disabled={Boolean(busy)} onClick={() => support("reset")}>
              {busy === "reset" ? "Sending…" : "Reset password"}
            </button>
            <button
              type="button"
              className="btn-ghost"
              disabled={Boolean(busy) || account.emailVerified}
              onClick={() => support("verify")}
            >
              {busy === "verify" ? "Sending…" : account.emailVerified ? "Email already verified" : "Resend verification"}
            </button>
            {!account.emailVerified && (
              <button type="button" className="btn-ghost" disabled={Boolean(busy)} onClick={forceVerify}>
                {busy === "force-verify" ? "Saving…" : "Mark email verified"}
              </button>
            )}
          </div>
          {supportNote && (
            <div className="mt-4 rounded-2xl border border-line bg-surface px-4 py-3.5">
              <p className="text-sm font-semibold">{supportNote.message}</p>
              {supportNote.actionUrl && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-xl bg-field px-3 py-2 text-xs">{supportNote.actionUrl}</code>
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                    onClick={() => navigator.clipboard.writeText(supportNote.actionUrl)}
                  >
                    Copy link
                  </button>
                </div>
              )}
            </div>
          )}
        </article>
      )}

      <article className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Last submission</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Read-only workspace</h2>
        <p className="mt-1 text-sm text-mute">
          Impersonate-read of what they last saved — code, canvas notes, or quiz answers. Counts stay in Practice below.
        </p>
        {submissionsQuery.isLoading && <p className="mt-4 text-sm text-mute">Loading submissions…</p>}
        {submissionsQuery.isError && <p className="mt-4 text-sm text-hard">{submissionsQuery.error.message}</p>}
        {!submissionsQuery.isLoading && !rows.length && (
          <p className="mt-4 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-mute">
            No submissions yet. They appear after the candidate hits Submit.
          </p>
        )}
        {rows.length > 0 && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1fr]">
            <ul className="space-y-2">
              {rows.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-2xl border px-3 py-2.5 text-left ${
                      item.id === activeId ? "border-brand/40 bg-brand/10" : "border-line bg-surface hover:border-brand/25"
                    }`}
                  >
                    <p className="text-sm font-semibold">{item.questionType || "Practice"} · {item.scope}</p>
                    <p className="mt-0.5 text-xs text-mute">{formatWhen(item.submittedAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
            <SubmissionRead submission={submission} loading={detailQuery.isLoading} fileIndex={fileIndex} onFile={setFileIndex} />
          </div>
        )}
      </article>

      {account && account.role !== "ADMIN" && (
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Billing</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Premium access</h2>
          <p className="mt-1 text-sm text-mute">
            Leave the date empty for lifetime. A dated grant expires automatically after that time.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Status" value={account.premium ? "Premium" : "Free"} />
            <Field label="Premium until" value={account.premium ? (account.premiumUntil ? formatWhen(account.premiumUntil) : "Lifetime") : "—"} />
            <label className="block sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-mute">Grant until</p>
              <input
                className="field mt-2"
                type="datetime-local"
                value={until}
                onChange={(e) => setUntil(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-brand" disabled={Boolean(busy)} onClick={() => setPremium(true)}>
              {busy === "grant" ? "Saving…" : account.premium ? "Update Premium" : "Grant Premium"}
            </button>
            {account.premium && (
              <button type="button" className="btn-ghost !text-hard" disabled={Boolean(busy)} onClick={() => setPremium(false)}>
                {busy === "revoke" ? "Saving…" : "Revoke Premium"}
              </button>
            )}
            <Link to={`/billing?user=${account.id}`} className="btn-ghost">All payments</Link>
          </div>
          <div className="mt-5 space-y-2">
            {(paymentsQuery.data?.data ?? []).slice(0, 5).map((item) => (
              <div key={item.id || item.providerRef} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface px-4 py-2.5 text-sm">
                <span className="font-semibold capitalize">{item.status}</span>
                <span className="text-mute">{item.displayAmount} · {item.provider}</span>
                <span className="text-xs text-mute">{formatWhen(item.createdAt)}</span>
              </div>
            ))}
            {!paymentsQuery.data?.data?.length && (
              <p className="text-sm text-mute">No checkout or grant rows yet.</p>
            )}
          </div>
        </article>
      )}

      <article className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Identity</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">How they show up</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Display name" value={profile.name || "—"} />
          <Field label="Current role" value={profile.currentRole || "—"} />
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-mute">Bio</p>
            <p className="mt-2 rounded-2xl bg-field px-4 py-3.5 text-sm leading-6">{profile.bio || "No bio yet."}</p>
          </div>
        </div>
      </article>

      <article className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Target role</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">What they are preparing for</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {ROLES.map((item) => {
            const active = targetRole === item.key;
            return (
              <div
                key={item.key}
                className={`rounded-[24px] border bg-gradient-to-br p-5 ${item.accent} ${
                  active ? "border-brand/40" : "border-line opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-bold">{item.title}</h3>
                  {active && (
                    <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                      Selected
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-mute">{item.hook}</p>
              </div>
            );
          })}
        </div>
      </article>

      <article className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Target companies</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Company drill list</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {companies.length ? companies.map((item) => (
            <span key={item} className="inline-flex items-center gap-2 rounded-2xl border border-brand/40 bg-brand/10 px-3.5 py-2 text-sm font-semibold">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-white/10 text-[10px]">{item.charAt(0)}</span>
              {item}
            </span>
          )) : (
            <p className="text-sm text-mute">No target companies saved.</p>
          )}
        </div>
      </article>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Experience</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Where they are now</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {EXPERIENCES.map((item) => {
              const active = experience === item.key;
              return (
                <div
                  key={item.key}
                  className={`rounded-2xl border px-4 py-3 ${
                    active ? "border-brand/40 bg-brand/10" : "border-line bg-white/5 opacity-60"
                  }`}
                >
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-0.5 text-xs text-mute">{item.hint}</p>
                </div>
              );
            })}
          </div>
        </article>
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Daily goal</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">How long they sit</h2>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {DAILY.map((item) => {
              const active = daily === item.minutes;
              return (
                <div
                  key={item.minutes}
                  className={`rounded-2xl border px-4 py-3 ${
                    active ? "border-brand/40 bg-brand/10" : "border-line bg-white/5 opacity-60"
                  }`}
                >
                  <p className="text-sm font-bold">{item.label}</p>
                  <p className="mt-0.5 text-xs text-mute">{item.hint}</p>
                </div>
              );
            })}
          </div>
        </article>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Practice</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Progress</h2>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <MiniStat label="Completed" value={progress.completed ?? 0} />
            <MiniStat label="Streak" value={`${progress.streakDays ?? 0}d`} />
            <MiniStat label="Today" value={progress.todayCompleted ?? 0} />
            <MiniStat label="This week" value={progress.weekCompleted ?? 0} />
          </div>
          <div className="mt-4 flex gap-1">
            {(progress.weekActive || [false, false, false, false, false, false, false]).map((on, index) => (
              <span
                key={index}
                className={`h-8 flex-1 rounded-lg ${on ? "bg-brand" : "bg-white/10"}`}
                title={on ? "Active" : "Missed"}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-mute">Last submit {formatWhen(progress.lastSubmittedAt)} · {progress.lastQuestionType || "none"}</p>
          <div className="mt-5">
            <HBarList series={byType} />
          </div>
        </article>

        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Account</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Access and prefs</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {account && account.role !== "ADMIN" ? (
              <label>
                <p className="text-xs font-semibold uppercase tracking-wide text-mute">Role</p>
                <select
                  className="field mt-2"
                  value={account.role}
                  disabled={busy === "role"}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="USER">USER</option>
                  <option value="EDITOR">EDITOR</option>
                </select>
              </label>
            ) : (
              <Field label="Role" value={account?.role || "—"} />
            )}
            <Field label="Provider" value={account?.provider || "password"} />
            <Field label="Email verified" value={account?.emailVerified ? "Yes" : "No"} />
            <Field label="Premium until" value={account?.premium ? (account.premiumUntil ? formatWhen(account.premiumUntil) : "Lifetime") : "—"} />
            <Field label="Joined" value={formatWhen(account?.createdAt)} />
            <Field label="Updated" value={formatWhen(account?.updatedAt)} />
            <Field label="Editor language" value={prefs.preferredLanguage || "—"} />
            <Field label="Difficulty pref" value={prefs.difficultyPreference || "—"} />
            <Field label="Theme" value={prefs.theme || "—"} />
            <Field label="Email notices" value={prefs.emailNotifications ? "On" : "Off"} />
          </div>
        </article>
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</p>
      <p className="mt-2 rounded-2xl bg-field px-4 py-3.5 text-sm">{value}</p>
    </div>
  );
}

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function SubmissionRead({ submission, loading, fileIndex, onFile }) {
  if (loading) return <p className="text-sm text-mute">Opening the snapshot…</p>;
  if (!submission) return <p className="text-sm text-mute">Pick a submission.</p>;
  const files = (submission.files || []).filter((file) => file && file.type !== "folder");
  const file = files[fileIndex] || files[0];
  const quiz = submission.quizAnswers || [];
  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-bold uppercase tracking-wide text-mute">{submission.questionType || "—"}</span>
        {submission.language && <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-semibold text-mute">{submission.language}</span>}
        {submission.view && <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-semibold text-mute">{submission.view}</span>}
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-mute">{formatWhen(submission.submittedAt)}</span>
      </div>
      <p className="truncate text-xs text-mute">Question {submission.questionId}</p>

      {files.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-mute">Code</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {files.map((item, index) => (
              <button
                key={item.id || item.name || index}
                type="button"
                onClick={() => onFile(index)}
                className={`rounded-lg px-2.5 py-1 font-mono text-xs ${
                  (file && (file.id || file.name)) === (item.id || item.name) ? "bg-brand/15 text-brand" : "bg-white/5 text-mute"
                }`}
              >
                {item.name || `file-${index + 1}`}
              </button>
            ))}
          </div>
          {file && (
            <pre className="mt-2 max-h-80 overflow-auto rounded-2xl bg-field p-4 font-mono text-xs leading-5">{file.content || "// empty"}</pre>
          )}
        </div>
      )}

      {(submission.math || submission.explanation || submission.canvas) && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mute">Canvas math</p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl bg-field p-4 text-sm leading-6">{submission.math || "—"}</pre>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-mute">Canvas notes</p>
            <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-2xl bg-field p-4 text-sm leading-6">{submission.explanation || "—"}</pre>
          </div>
          {submission.canvas && (
            <p className="sm:col-span-2 text-xs text-mute">{canvasSummary(submission.canvas)}</p>
          )}
        </div>
      )}

      {(submission.quizTotal != null || quiz.length > 0) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-mute">
            Quiz {submission.quizScore != null ? `${submission.quizScore}/${submission.quizTotal ?? quiz.length}` : ""}
          </p>
          <ol className="mt-2 space-y-1.5">
            {quiz.map((answer, index) => (
              <li key={index} className="rounded-xl bg-field px-3 py-2 text-sm">
                Q{index + 1}: option {answer < 0 ? "skipped" : answer + 1}
              </li>
            ))}
          </ol>
        </div>
      )}

      {!files.length && !submission.math && !submission.explanation && !quiz.length && (
        <p className="text-sm text-mute">This snapshot has no code, notes, or quiz answers.</p>
      )}
    </div>
  );
}

function canvasSummary(canvas) {
  if (!canvas || typeof canvas !== "object") return "";
  if (Array.isArray(canvas.nodes)) return `Blueprint with ${canvas.nodes.length} nodes.`;
  if (Array.isArray(canvas.elements)) return `Whiteboard with ${canvas.elements.length} strokes.`;
  return "Canvas snapshot is saved (graph JSON is not replayed here).";
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

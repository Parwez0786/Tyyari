import { Link, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import AvatarPicker from "../components/AvatarPicker";
import Loader from "../components/Loader";
import { HBarList } from "../components/Charts";
import {
  difficultyLabel,
  languageLabel,
  paymentLabel,
  providerLabel,
  roleLabel,
  scopeLabel,
  statusLabel,
  themeLabel,
  typeLabel,
  viewLabel,
} from "../data/labels";
import { AccountRole, AccountStatus } from "../data/enums";
import ThemeCard from "../components/ThemeCard";
import { DAILY, EXPERIENCES, ROLES, formatWhen } from "../data/profile";
import { useAdminUserProfile } from "../hooks/useAdminUserProfile";

export default function UserProfile() {
  const { id } = useParams();
  const {
    account,
    profile,
    prefs,
    progress,
    name,
    firstName,
    targetRole,
    experience,
    companies,
    daily,
    role,
    byType,
    payments,
    rows,
    activeId,
    submission,
    detailLoading,
    submissionsQuery,
    loading,
    error,
    until,
    setUntil,
    busy,
    supportNote,
    deleteEmail,
    setDeleteEmail,
    newEmail,
    setNewEmail,
    changeEmail,
    fileIndex,
    setFileIndex,
    setSelectedId,
    setRole,
    toggleStatus,
    support,
    revokeSessions,
    forceVerify,
    deleteAccount,
    setPremium,
    uploadAvatar,
    removeAvatar,
    onPhotoError,
  } = useAdminUserProfile(id);

  if (loading) return <Loader fill />;

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-hard">{error?.message || "Could not load this profile."}</p>}

      <section className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-gradient-to-br from-brand/15 via-card to-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 flex-wrap items-start gap-5">
            {account && account.role !== AccountRole.ADMIN && account.status !== AccountStatus.DELETING ? (
              <AvatarPicker
                name={name}
                email={account?.email}
                src={profile.avatar}
                size="lg"
                square
                busy={busy === "photo"}
                onChange={uploadAvatar}
                onRemove={removeAvatar}
                onError={onPhotoError}
              />
            ) : (
              <Avatar name={name} email={account?.email} src={profile.avatar} size="lg" square />
            )}
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
                  <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                    account.status === AccountStatus.ACTIVE
                      ? "bg-brand/15 text-brand"
                      : account.status === AccountStatus.DELETING
                        ? "bg-amber-400/15 text-amber-400"
                        : "bg-rose-500/15 text-hard"
                  }`}>
                    {statusLabel(account.status)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/users" className="btn-ghost">Back to users</Link>
            {account?.id && (
              <Link to={`/audit?user=${account.id}`} className="btn-ghost">Audit</Link>
            )}
            {account && account.role !== AccountRole.ADMIN && account.status !== AccountStatus.DELETING && (
              <>
                {account.premium && (
                  <button
                    type="button"
                    className="btn-ghost !text-hard"
                    disabled={Boolean(busy)}
                    onClick={() => setPremium(false)}
                  >
                    {busy === "revoke" ? "…" : "Revoke Premium"}
                  </button>
                )}
                <button
                  type="button"
                  className={account.status === AccountStatus.ACTIVE ? "btn-ghost !text-hard" : "btn-brand"}
                  onClick={toggleStatus}
                >
                  {account.status === AccountStatus.ACTIVE ? "Disable" : "Enable"}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {account && account.role !== AccountRole.ADMIN && (
        <ThemeCard>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Support</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Help this inbox</h2>
          <p className="mt-1 text-sm text-mute">
            Fix a signup typo, send a reset or verification email, mark the inbox verified, or kick every device.
          </p>
          {account.provider && account.provider !== "LOCAL" ? (
            <p className="mt-5 text-sm text-mute">
              This account signs in with {providerLabel(account.provider)}. Change the email on that provider.
            </p>
          ) : (
            <>
              <label className="mt-5 block max-w-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-mute">New login email</p>
                <input
                  className="field mt-2"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder={account.email}
                  autoComplete="off"
                  disabled={Boolean(busy) || account.status === AccountStatus.DELETING}
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-ghost"
                  disabled={Boolean(busy) || account.status === AccountStatus.DELETING || !newEmail.trim()}
                  onClick={changeEmail}
                >
                  {busy === "email" ? "Saving…" : "Change email"}
                </button>
              </div>
            </>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {(!account.provider || account.provider === "LOCAL") && (
              <button type="button" className="btn-brand" disabled={Boolean(busy) || account.status === AccountStatus.DELETING} onClick={() => support("reset")}>
                {busy === "reset" ? "Sending…" : "Reset password"}
              </button>
            )}
            <button
              type="button"
              className="btn-ghost"
              disabled={Boolean(busy) || account.emailVerified || account.status === AccountStatus.DELETING}
              onClick={() => support("verify")}
            >
              {busy === "verify" ? "Sending…" : account.emailVerified ? "Email already verified" : "Resend verification"}
            </button>
            {!account.emailVerified && (
              <button type="button" className="btn-ghost" disabled={Boolean(busy) || account.status === AccountStatus.DELETING} onClick={forceVerify}>
                {busy === "force-verify" ? "Saving…" : "Mark email verified"}
              </button>
            )}
            <button type="button" className="btn-ghost !text-hard" disabled={Boolean(busy) || account.status === AccountStatus.DELETING} onClick={revokeSessions}>
              {busy === "revoke" ? "Signing out…" : "Sign out everywhere"}
            </button>
          </div>
          {account.status === AccountStatus.DELETING && (
            <p className="mt-4 text-sm text-amber-400">Wipe is queued. Support actions are locked until the account is gone.</p>
          )}
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
        </ThemeCard>
      )}

      {account && account.role !== AccountRole.ADMIN && (
        <ThemeCard tone="danger">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-hard">Danger</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Delete account</h2>
          <p className="mt-1 text-sm text-mute">
            Signs them out now, then wipes login, profile, goals, prefs, submissions, and payment rows in the background.
            If a service is down, the wipe retries automatically. Cannot undo.
          </p>
          <label className="mt-5 block">
            <p className="text-xs font-semibold uppercase tracking-wide text-mute">Type {account.email} to confirm</p>
            <input
              className="field mt-2"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              placeholder={account.email}
              autoComplete="off"
            />
          </label>
          <div className="mt-4">
            <button
              type="button"
              className="btn-ghost !text-hard"
              disabled={Boolean(busy) || deleteEmail.trim().toLowerCase() !== String(account.email || "").toLowerCase()}
              onClick={deleteAccount}
            >
              {busy === "delete"
                ? "Queueing…"
                : account.status === AccountStatus.DELETING
                  ? "Retry wipe"
                  : "Delete account"}
            </button>
          </div>
        </ThemeCard>
      )}

      <ThemeCard>
        {submissionsQuery.isLoading ? (
          <Loader compact />
        ) : (
        <>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Last submission</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Read-only workspace</h2>
        <p className="mt-1 text-sm text-mute">
          Impersonate-read of what they last saved — code, canvas notes, or quiz answers. Counts stay in Practice below.
        </p>
        {submissionsQuery.isError && <p className="mt-4 text-sm text-hard">{submissionsQuery.error?.message}</p>}
        {!rows.length && (
          <p className="mt-4 rounded-2xl border border-dashed border-line px-4 py-6 text-center text-sm text-mute">
            No submissions yet. They appear after the candidate hits Submit.
          </p>
        )}
        {rows.length > 0 && (
          <div className="mt-5 grid gap-4 lg:grid-cols-[260px_1fr]">
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
                    <p className="truncate text-sm font-semibold">
                      {item.questionTitle || (item.questionType ? typeLabel(item.questionType) : "Practice")}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-mute">
                      {item.assessmentSetTitle || scopeLabel(item.scope)}
                      {" · "}
                      {formatWhen(item.submittedAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
            <SubmissionRead submission={submission} loading={detailLoading} fileIndex={fileIndex} onFile={setFileIndex} />
          </div>
        )}
        </>
        )}
      </ThemeCard>

      {account && account.role !== AccountRole.ADMIN && (
        <ThemeCard tone="blue">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Billing</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Premium access</h2>
          <p className="mt-1 text-sm text-mute">
            Leave the date empty for lifetime. Grant only from this card so a date is intentional.
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
            <button type="button" className="btn-brand" disabled={Boolean(busy) || account.status === AccountStatus.DELETING} onClick={() => setPremium(true)}>
              {busy === "grant" ? "Saving…" : account.premium ? "Update Premium" : "Grant Premium"}
            </button>
            {account.premium && (
              <button type="button" className="btn-ghost !text-hard" disabled={Boolean(busy) || account.status === AccountStatus.DELETING} onClick={() => setPremium(false)}>
                {busy === "revoke" ? "Saving…" : "Revoke Premium"}
              </button>
            )}
            <Link to={`/billing?user=${account.id}`} className="btn-ghost">All payments</Link>
          </div>
          <div className="mt-5 space-y-2">
            {payments.slice(0, 5).map((item) => (
              <div key={item.id || item.providerRef} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-surface/90 px-4 py-2.5 text-sm">
                <span className="font-semibold">{paymentLabel(item.status)}</span>
                <span className="text-mute">{item.displayAmount} · {providerLabel(item.provider)}</span>
                <span className="text-xs text-mute">{formatWhen(item.createdAt)}</span>
              </div>
            ))}
            {!payments.length && (
              <p className="text-sm text-mute">No checkout or grant rows yet.</p>
            )}
          </div>
        </ThemeCard>
      )}

      <ThemeCard>
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Identity</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">How they show up</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Display name" value={profile.name || "—"} />
          <Field label="Current role" value={profile.currentRole || "—"} />
          <LinkField label="GitHub" href={profile.githubUrl} empty="Not added" />
          <LinkField label="LinkedIn" href={profile.linkedinUrl} empty="Not added" />
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-mute">Bio</p>
            <p className="mt-2 rounded-2xl bg-field px-4 py-3.5 text-sm leading-6">{profile.bio || "No bio yet."}</p>
          </div>
        </div>
      </ThemeCard>

      <ThemeCard>
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
      </ThemeCard>

      <ThemeCard tone="blue">
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
      </ThemeCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ThemeCard>
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
        </ThemeCard>
        <ThemeCard tone="blue">
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
        </ThemeCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ThemeCard>
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
          <p className="mt-3 text-xs text-mute">Last submit {formatWhen(progress.lastSubmittedAt)} · {progress.lastQuestionType ? typeLabel(progress.lastQuestionType) : "none"}</p>
          <div className="mt-5">
            <HBarList series={byType} />
          </div>
        </ThemeCard>

        <ThemeCard tone="blue">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Account</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Access and prefs</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {account && account.role !== AccountRole.ADMIN ? (
              <label>
                <p className="text-xs font-semibold uppercase tracking-wide text-mute">Role</p>
                <select
                  className="field mt-2"
                  value={account.role}
                  disabled={busy === "role" || account.status === AccountStatus.DELETING}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value={AccountRole.USER}>{roleLabel(AccountRole.USER)}</option>
                  <option value={AccountRole.EDITOR}>{roleLabel(AccountRole.EDITOR)}</option>
                </select>
              </label>
            ) : (
              <Field label="Role" value={roleLabel(account?.role)} />
            )}
            <Field label="Sign-in" value={providerLabel(account?.provider)} />
            <Field label="Email verified" value={account?.emailVerified ? "Yes" : "No"} />
            <Field label="Premium until" value={account?.premium ? (account.premiumUntil ? formatWhen(account.premiumUntil) : "Lifetime") : "—"} />
            <Field label="Joined" value={formatWhen(account?.createdAt)} />
            <Field label="Updated" value={formatWhen(account?.updatedAt)} />
            <Field label="Editor language" value={languageLabel(prefs.preferredLanguage)} />
            <Field label="Difficulty pref" value={difficultyLabel(prefs.difficultyPreference)} />
            <Field label="Theme" value={themeLabel(prefs.theme)} />
            <Field label="Email notices" value={prefs.emailNotifications ? "On" : "Off"} />
          </div>
        </ThemeCard>
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

function LinkField({ label, href, empty }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-mute">{label}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="mt-2 block truncate rounded-2xl bg-field px-4 py-3.5 text-sm font-semibold text-brand hover:underline"
        >
          {href}
        </a>
      ) : (
        <p className="mt-2 rounded-2xl bg-field px-4 py-3.5 text-sm text-mute">{empty}</p>
      )}
    </div>
  );
}

function SubmissionRead({ submission, loading, fileIndex, onFile }) {
  if (loading) return <Loader compact />;
  if (!submission) return <p className="text-sm text-mute">Pick a submission.</p>;
  const files = (submission.files || []).filter((file) => file && file.type !== "folder");
  const file = files[fileIndex] || files[0];
  const quiz = submission.quizAnswers || [];
  return (
    <div className="min-w-0 space-y-4">
      <div>
        <p className="font-semibold">{submission.questionTitle || typeLabel(submission.questionType) || "Submission"}</p>
        {submission.assessmentSetTitle && (
          <p className="mt-0.5 text-sm text-mute">{submission.assessmentSetTitle}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-bold tracking-wide text-mute">{typeLabel(submission.questionType)}</span>
        {submission.language && <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-semibold text-mute">{languageLabel(submission.language)}</span>}
        {submission.view && <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-semibold text-mute">{viewLabel(submission.view)}</span>}
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-mute">{scopeLabel(submission.scope)}</span>
        <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-mute">{formatWhen(submission.submittedAt)}</span>
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        {submission.questionId && (
          <Link to={`/questions/${submission.questionId}/view`} className="font-semibold text-brand">
            View question
          </Link>
        )}
        {submission.assessmentSetId && (
          <Link to={`/oa/${submission.assessmentSetId}/view`} className="font-semibold text-brand">
            View OA set
          </Link>
        )}
      </div>

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
    <div className="rounded-2xl border border-line bg-surface/90 px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

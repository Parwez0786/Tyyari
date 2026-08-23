import { Link } from "react-router-dom";
import {
  Briefcase,
  Building2,
  Clock,
  Target,
  User,
} from "lucide-react";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import Avatar from "../components/Avatar";
import { companyIconUrl } from "../utils/companyIcons";
import { useOnboarding } from "../hooks/useOnboarding";

export default function Onboarding() {
  const o = useOnboarding();

  if (o.isLoading) {
    return (
      <Layout>
        <Loader fill />
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-5">
          <Avatar name={o.name || o.profile?.name} email={o.email} size="lg" square />
          <div className="min-w-0 flex-1">
            <p className="font-hand text-2xl text-brand">{o.onboarded ? "Edit profile" : "Set your path"}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{o.firstName}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-mute">
              {o.onboarded
                ? "Same cards as the dashboard. Change role, companies, or daily goal and the rest of the app follows."
                : "We’ll tailor the practice list, roadmap, and company drill. You can change this later."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {o.roleMeta && (
                <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                  {o.roleMeta.title} path
                </span>
              )}
              {o.experience && (
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-ink">{o.experience} exp</span>
              )}
              {o.selected.slice(0, 3).map((item) => (
                <span key={item} className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-mute">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={o.onSubmit} className="mt-6 grid gap-4">
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            <User size={12} />
            Identity
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">How you show up</h2>
          <p className="mt-1 text-sm text-mute">This name is what the dashboard greeting uses.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-mute">Display name</span>
              <input
                className="field"
                value={o.name}
                onChange={(e) => o.setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-mute">Bio</span>
              <textarea
                className="field min-h-[96px] resize-y"
                value={o.bio}
                onChange={(e) => o.setBio(e.target.value)}
                placeholder="One line about the loop you are chasing…"
              />
            </label>
          </div>
        </article>

        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            <Target size={12} />
            Target role
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">What are you preparing for?</h2>
          <p className="mt-1 text-sm text-mute">Picks the SDE-1 or SDE-2 roadmap and the default quest mix.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {o.roles.map((role) => {
              const Icon = role.Icon;
              const active = o.targetRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => o.setTargetRole(role.key)}
                  className={`group flex flex-col rounded-[24px] border bg-gradient-to-br p-5 text-left transition hover:-translate-y-0.5 ${
                    role.accent
                  } ${active ? "border-brand/40" : "border-line hover:border-brand/40"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-black/20 text-ink">
                      <Icon size={18} />
                    </span>
                    {active && (
                      <span className="rounded-full bg-brand/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand">
                        Selected
                      </span>
                    )}
                  </div>
                  <h3 className="mt-4 text-lg font-bold">{role.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-mute">{role.hook}</p>
                </button>
              );
            })}
          </div>
        </article>

        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
            <Building2 size={12} />
            Target companies
          </p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Company drill list</h2>
          <p className="mt-1 text-sm text-mute">The dashboard company tile uses the first name on this list.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {o.companies.map((company) => {
              const active = o.selected.includes(company.name);
              const icon = companyIconUrl(company.name);
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => o.toggleCompany(company.name)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-brand/40 bg-brand/10 text-ink"
                      : "border-line bg-white/5 text-mute hover:border-brand/40 hover:text-ink"
                  }`}
                >
                  {icon ? (
                    <img src={icon} alt="" className="h-4 w-4 rounded-sm" />
                  ) : (
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-sm bg-white/10 text-[10px]">
                      {company.name.charAt(0)}
                    </span>
                  )}
                  {company.name}
                </button>
              );
            })}
          </div>
        </article>

        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-[28px] border border-line bg-card p-6">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              <Briefcase size={12} />
              Experience
            </p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight">Where you are now</h2>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {o.experiences.map((item) => {
                const active = o.experience === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => o.setExperience(item.key)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      active ? "border-brand/40 bg-brand/10" : "border-line bg-white/5 hover:border-brand/40"
                    }`}
                  >
                    <p className="text-sm font-bold">{item.title}</p>
                    <p className="mt-0.5 text-xs text-mute">{item.hint}</p>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="rounded-[28px] border border-line bg-card p-6">
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
              <Clock size={12} />
              Daily goal
            </p>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight">How long you sit</h2>
            <p className="mt-1 text-sm text-mute">Saved with your goals. The weekly quest stays five submits.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              {o.daily.map((item) => {
                const active = o.dailyGoal === item.minutes;
                return (
                  <button
                    key={item.minutes}
                    type="button"
                    onClick={() => o.setDailyGoal(item.minutes)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      active ? "border-brand/40 bg-brand/10" : "border-line bg-white/5 hover:border-brand/40"
                    }`}
                  >
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="mt-0.5 text-xs text-mute">{item.hint}</p>
                  </button>
                );
              })}
            </div>
          </article>
        </div>

        {o.error && (
          <p className="rounded-2xl border border-hard/30 bg-hard/10 px-4 py-3 text-sm text-hard">{o.error}</p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-brand !px-5 !py-2.5" disabled={o.saving}>
            {o.saving ? "Saving…" : o.onboarded ? "Save profile" : "Continue to dashboard"}
          </button>
          {o.onboarded && (
            <Link to="/dashboard" className="btn-ghost !px-5 !py-2.5">
              Back to dashboard
            </Link>
          )}
        </div>
      </form>
    </Layout>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Briefcase,
  Building2,
  Clock,
  Code2,
  LayoutTemplate,
  Network,
  Puzzle,
  Target,
  User,
} from "lucide-react";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import { authApi, contentApi, userApi } from "../services/api";
import { companyIconUrl } from "../utils/companyIcons";

const ROLES = [
  {
    key: "SDE1",
    title: "SDE-1",
    hook: "DSA, LLD, and CS fundamentals.",
    Icon: Code2,
    accent: "from-emerald-500/20 to-teal-500/5",
  },
  {
    key: "SDE2",
    title: "SDE-2",
    hook: "System design plus deeper LLD.",
    Icon: Network,
    accent: "from-orange-500/20 to-amber-500/5",
  },
  {
    key: "Frontend",
    title: "Frontend",
    hook: "UI machine-coding and React rounds.",
    Icon: LayoutTemplate,
    accent: "from-fuchsia-500/20 to-pink-500/5",
  },
  {
    key: "Backend",
    title: "Backend",
    hook: "APIs, data, and service design.",
    Icon: Puzzle,
    accent: "from-sky-500/20 to-cyan-500/5",
  },
];

const EXPERIENCES = [
  { key: "Fresher", title: "Fresher", hint: "Campus or first loop" },
  { key: "1-2", title: "1–2 years", hint: "Early SDE" },
  { key: "2-4", title: "2–4 years", hint: "Mid-level" },
  { key: "4+", title: "4+ years", hint: "Senior track" },
];

const DAILY = [
  { minutes: 45, label: "45 min", hint: "Light day" },
  { minutes: 90, label: "90 min", hint: "Steady" },
  { minutes: 120, label: "2 hours", hint: "Default" },
  { minutes: 180, label: "3 hours", hint: "Push week" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: userApi.profile });
  const goalsQuery = useQuery({ queryKey: ["goals"], queryFn: userApi.goals });
  const meQuery = useQuery({ queryKey: ["me"], queryFn: authApi.me });
  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: contentApi.companies });

  const profile = profileQuery.data?.data;
  const email = meQuery.data?.data?.email || "";
  const companies = companiesQuery.data?.data ?? [];
  const onboarded = Boolean(profile?.onboarded);

  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [targetRole, setTargetRole] = useState("SDE1");
  const [experience, setExperience] = useState("1-2");
  const [selected, setSelected] = useState(["Amazon", "Google", "Microsoft"]);
  const [dailyGoal, setDailyGoal] = useState(120);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (hydrated || !profileQuery.isSuccess || !goalsQuery.isSuccess) return;
    const nextProfile = profileQuery.data?.data;
    const nextGoals = goalsQuery.data?.data;
    if (nextProfile?.name) setName(nextProfile.name);
    if (nextProfile?.bio != null) setBio(nextProfile.bio);
    if (nextProfile?.targetRole) setTargetRole(nextProfile.targetRole);
    if (nextProfile?.experience) setExperience(nextProfile.experience);
    if (nextGoals?.targetRole) setTargetRole(nextGoals.targetRole);
    if (nextGoals?.targetCompanies?.length) setSelected(nextGoals.targetCompanies);
    if (nextGoals?.dailyGoalMinutes) setDailyGoal(nextGoals.dailyGoalMinutes);
    setHydrated(true);
  }, [hydrated, profileQuery.isSuccess, goalsQuery.isSuccess, profileQuery.data, goalsQuery.data]);

  function toggle(companyName) {
    setSelected((cur) => (cur.includes(companyName) ? cur.filter((item) => item !== companyName) : [...cur, companyName]));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await userApi.updateProfile({
        name: name.trim() || undefined,
        bio,
        targetRole,
        experience,
        onboarded: true,
      });
      await userApi.saveGoals({
        targetRole,
        targetCompanies: selected,
        dailyGoalMinutes: dailyGoal,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["profile"] }),
        queryClient.invalidateQueries({ queryKey: ["goals"] }),
      ]);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const firstName = (name || profile?.name || "there").split(" ")[0];
  const roleMeta = ROLES.find((item) => item.key === targetRole);

  return (
    <Layout>
      <section className="relative overflow-hidden rounded-[28px] border border-brand/25 bg-card p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-brand/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start gap-5">
          <Avatar name={name || profile?.name} email={email} size="lg" square />
          <div className="min-w-0 flex-1">
            <p className="font-hand text-2xl text-brand">{onboarded ? "Edit profile" : "Set your path"}</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{firstName}</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-mute">
              {onboarded
                ? "Same cards as the dashboard. Change role, companies, or daily goal and the rest of the app follows."
                : "We’ll tailor the practice list, roadmap, and company drill. You can change this later."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {roleMeta && (
                <span className="rounded-full bg-brand/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand">
                  {roleMeta.title} path
                </span>
              )}
              {experience && (
                <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-ink">{experience} exp</span>
              )}
              {selected.slice(0, 3).map((item) => (
                <span key={item} className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-mute">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <form onSubmit={onSubmit} className="mt-6 grid gap-4">
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-mute">Bio</span>
              <textarea
                className="field min-h-[96px] resize-y"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
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
            {ROLES.map((role) => {
              const Icon = role.Icon;
              const active = targetRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setTargetRole(role.key)}
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
            {companies.map((company) => {
              const active = selected.includes(company.name);
              const icon = companyIconUrl(company.name);
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => toggle(company.name)}
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
              {EXPERIENCES.map((item) => {
                const active = experience === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setExperience(item.key)}
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
              {DAILY.map((item) => {
                const active = dailyGoal === item.minutes;
                return (
                  <button
                    key={item.minutes}
                    type="button"
                    onClick={() => setDailyGoal(item.minutes)}
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

        {error && (
          <p className="rounded-2xl border border-hard/30 bg-hard/10 px-4 py-3 text-sm text-hard">{error}</p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-brand !px-5 !py-2.5" disabled={saving}>
            {saving ? "Saving…" : onboarded ? "Save profile" : "Continue to dashboard"}
          </button>
          {onboarded && (
            <Link to="/dashboard" className="btn-ghost !px-5 !py-2.5">
              Back to dashboard
            </Link>
          )}
        </div>
      </form>
    </Layout>
  );
}

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { BarChart, Donut, HBarList, countByDay, lastDays } from "../components/Charts";
import PageHero from "../components/PageHero";
import { adminApi } from "../services/api";

const TYPE_COLORS = {
  DSA: "#34d399",
  HLD: "#f97316",
  LLD: "#38bdf8",
  FRONTEND: "#e879f9",
  CS: "#a3e635",
  OA: "#60a5fa",
};

export default function Dashboard() {
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.users });
  const statsQuery = useQuery({ queryKey: ["admin-stats"], queryFn: adminApi.stats });
  const metricsQuery = useQuery({ queryKey: ["admin-metrics"], queryFn: adminApi.metrics });

  const users = usersQuery.data?.data ?? [];
  const stats = statsQuery.data?.data ?? {};
  const metrics = metricsQuery.data?.data ?? {};
  const days = useMemo(() => lastDays(14), []);

  const candidates = users.filter((u) => u.role !== "ADMIN");
  const premium = candidates.filter((u) => u.premium).length;
  const active = candidates.filter((u) => u.status === "ACTIVE").length;
  const disabled = candidates.filter((u) => u.status === "DISABLED").length;
  const premiumActive = candidates.filter((u) => u.premium && u.status === "ACTIVE").length;
  const freeActive = candidates.filter((u) => !u.premium && u.status === "ACTIVE").length;
  const verified = candidates.filter((u) => u.emailVerified).length;
  const signups = countByDay(candidates, (u) => (u.createdAt || "").slice(0, 10), days);
  const providers = tally(candidates.map((u) => u.provider || "password"));
  const submissionsByDay = (metrics.submissionsByDay || []).map((row) => ({
    label: String(row.date || "").slice(5),
    value: row.count || 0,
  }));
  const byType = Object.entries(metrics.byType || {}).map(([label, value]) => ({
    label,
    value,
    color: TYPE_COLORS[label] || "#94a3b8",
  }));
  const catalog = Object.entries(stats.byType || {}).map(([label, value]) => ({ label, value }));
  const roles = Object.entries(metrics.byTargetRole || {}).map(([label, value]) => ({ label, value }));
  const experience = Object.entries(metrics.byExperience || {}).map(([label, value]) => ({ label, value }));
  const published = stats.publishedQuestions || 0;
  const onboarded = metrics.onboarded || 0;
  const profiles = metrics.profiles || 0;

  const loading = usersQuery.isLoading || statsQuery.isLoading || metricsQuery.isLoading;
  const error = usersQuery.error || statsQuery.error || metricsQuery.error;

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Dashboard"
        title="How the product is used"
        detail="Accounts, Premium, and practice submits. Charts use the last 14 days in UTC."
        action={<Link to="/users" className="btn-ghost">Open users</Link>}
      />

      {loading && <p className="text-sm text-mute">Loading metrics…</p>}
      {error && <p className="text-sm text-hard">{error.message || "Could not load metrics."}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Candidates" value={candidates.length} hint={`${active} active · ${disabled} disabled`} />
        <Stat label="Premium" value={premium} hint={candidates.length ? `${Math.round((100 * premium) / candidates.length)}% of accounts` : "From checkout"} />
        <Stat label="Practice submits" value={metrics.practiceSubmissions ?? 0} hint={`${metrics.oaSubmissions ?? 0} OA · ${metrics.uniqueSolvers ?? 0} solvers`} />
        <Stat label="Active in 7 days" value={metrics.activeLast7Days ?? 0} hint="Users who submitted once" />
        <Stat label="Verified email" value={verified} hint={`${candidates.length - verified} still pending`} />
        <Stat label="Onboarded" value={onboarded} hint={`${profiles} profiles created`} />
        <Stat label="Published questions" value={published} hint="Live on the candidate library" />
        <Stat
          label="CS quiz average"
          value={metrics.quizAvgPercent == null ? "—" : `${Math.round(metrics.quizAvgPercent)}%`}
          hint="Across submitted quizzes"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard kicker="Accounts" title="New signups" detail="Candidates created in the last 14 days.">
          <BarChart series={signups} />
        </ChartCard>
        <ChartCard kicker="Practice" title="Submits" detail="Last answer saved per problem, last 14 days.">
          <BarChart series={submissionsByDay.length ? submissionsByDay : days.map((d) => ({ label: d.slice(5), value: 0 }))} color="#2563eb" />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard kicker="Mix" title="Account status" detail="Who can still sign in, and who paid.">
          <Donut
            center={candidates.length}
            sub="users"
            segments={[
              { label: "Active free", value: freeActive, color: "#f97316" },
              { label: "Premium", value: premiumActive, color: "#2563eb" },
              { label: "Disabled", value: disabled, color: "#f43f5e" },
            ]}
          />
        </ChartCard>
        <ChartCard kicker="Practice" title="Submits by track" detail="Which editors candidates actually finish.">
          {byType.some((row) => row.value) ? (
            <Donut
              center={metrics.submissions ?? 0}
              sub="submits"
              segments={byType.filter((row) => row.label !== "UNKNOWN")}
            />
          ) : (
            <p className="text-sm text-mute">No submissions yet. They appear after a candidate hits Submit.</p>
          )}
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartCard kicker="Catalog" title="Published library" detail="Questions live per track.">
          <HBarList series={catalog} />
        </ChartCard>
        <ChartCard kicker="Profiles" title="Target role" detail="What they picked in onboarding.">
          <HBarList series={roles} color="#38bdf8" />
        </ChartCard>
        <ChartCard kicker="Profiles" title="Experience" detail="Fresher through senior tracks.">
          <HBarList series={experience} color="#a3e635" />
        </ChartCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard kicker="Auth" title="Sign-in provider" detail="Password vs Google vs GitHub.">
          <HBarList series={providers} color="#e879f9" />
        </ChartCard>
        <article className="rounded-[28px] border border-line bg-card p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Jump in</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-tight">Act on the numbers</h2>
          <p className="mt-1 text-sm text-mute">Disable a stale account, or publish the track that is empty.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/users" className="btn-brand">Manage users</Link>
            <Link to="/billing" className="btn-ghost">Billing</Link>
            <Link to="/questions" className="btn-ghost">Edit catalog</Link>
            <Link to="/sheets" className="btn-ghost">Sheets</Link>
            <Link to="/oa" className="btn-ghost">OA sets</Link>
            <Link to="/audit" className="btn-ghost">Audit log</Link>
          </div>
        </article>
      </div>
    </div>
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

function ChartCard({ kicker, title, detail, children }) {
  return (
    <article className="rounded-[28px] border border-line bg-card p-6">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">{kicker}</p>
      <h2 className="mt-2 text-xl font-extrabold tracking-tight">{title}</h2>
      {detail && <p className="mt-1 text-sm text-mute">{detail}</p>}
      <div className="mt-5">{children}</div>
    </article>
  );
}

function tally(values) {
  const map = {};
  for (const value of values) {
    const key = value || "unknown";
    map[key] = (map[key] || 0) + 1;
  }
  return Object.entries(map).map(([label, value]) => ({ label, value }));
}

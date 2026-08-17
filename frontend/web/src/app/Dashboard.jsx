import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import QuestionCard from "../components/QuestionCard";
import { contentApi, userApi, authApi } from "../services/api";

export default function Dashboard() {
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: userApi.profile });
  const questionsQuery = useQuery({
    queryKey: ["continue"],
    queryFn: () => contentApi.questions({ type: "HLD", limit: 4, page: 1 }),
  });
  const meQuery = useQuery({ queryKey: ["me"], queryFn: authApi.me });
  const profile = profileQuery.data?.data;
  const email = meQuery.data?.data?.email;
  const items = questionsQuery.data?.data?.items ?? [];
  const daily = items[1] || items[0];
  const unfinished = items[0];
  const name = profile?.name || "Candidate";

  return (
    <Layout>
      <section className="mb-6 flex flex-wrap items-center gap-4">
        <Avatar name={name} email={email} size="lg" square />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{name}</h1>
          <p className="mt-1 truncate text-sm text-mute">{email || "Add your email"}</p>
        </div>
        <Link
          to="/onboarding"
          className="btn-premium"
        >
          <CrownIcon />
          Upgrade to Premium
        </Link>
      </section>

      <section className="panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="label-caps">Your workspace</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">Continue preparing</h2>
          </div>
          <Link to="/practice/HLD" className="btn-black">Start Interview</Link>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Info label="Experience" value={profile?.experience || "Not set"} />
          <Info label="Target Role" value={profile?.targetRole || "Not set"} />
          <Info label="Email" value={email || "—"} verified={Boolean(email)} />
        </div>

        {daily && (
          <div className="mt-10">
            <p className="label-caps">Daily challenge</p>
            <div className="mt-3 flex flex-col gap-3 rounded-card border border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{daily.title}</p>
                <p className="mt-1 text-sm text-mute">{daily.type}</p>
              </div>
              <Link to={`/questions/${daily.id}`} className="btn-ghost">See result</Link>
            </div>
          </div>
        )}

        {unfinished && (
          <div className="mt-8">
            <p className="label-caps">Unfinished</p>
            <div className="mt-3 flex flex-col gap-3 rounded-card border border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{unfinished.type} interview</p>
                <p className="mt-1 text-sm text-mute">Question 1 of 5 · {unfinished.title}</p>
              </div>
              <Link to={`/questions/${unfinished.id}`} className="btn-black">Resume</Link>
            </div>
          </div>
        )}

        <div className="mt-8">
          <p className="label-caps">Practice</p>
          <div className="mt-3 space-y-3">
            {items.map((q, i) => (
              <QuestionCard key={q.id} question={q} actionLabel="Open" index={i + 1} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}

function Info({ label, value, verified }) {
  return (
    <div className="rounded-card border border-line px-5 py-4">
      <p className="text-sm text-mute">{label}</p>
      <p className="mt-2 font-semibold">{value}</p>
      {verified && (
        <span className="mt-2 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-easy dark:bg-green-950/50">Verified</span>
      )}
    </div>
  );
}

function CrownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 18h18v2H3v-2Zm1.5-4 3.2-7.2L12 10l4.3-3.2L19.5 14h-15Z" />
    </svg>
  );
}

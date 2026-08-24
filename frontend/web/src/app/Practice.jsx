import { Link } from "react-router-dom";
import { Camera, Clock } from "lucide-react";
import FilterSelect from "../components/FilterSelect";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import ModeOverlay from "../components/ModeOverlay";
import ProblemCard from "../components/ProblemCard";
import ThemeCard from "../components/ThemeCard";
import { CompanyTags, DifficultyBadge } from "../components/QuestionMeta";
import { formatClock, isActive, loadSession, remainingMs } from "../components/oa/session";
import { typeLabel } from "../data/labels";
import { QuestionType, practicePath } from "../data/enums";
import { DIFFS, useOaLobby, usePracticeRoute, usePracticeTrack } from "../hooks/usePractice";

export default function Practice() {
  const { type, selected, isOa, comingSoon, tracks, page } = usePracticeRoute();

  if (!selected) {
    return (
      <Layout>
        <ThemeCard className="sm:p-8">
          <p className="label-caps">Library</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Practice</h1>
          <p className="mt-3 max-w-xl text-mute">The question library. Pick a track and open any problem.</p>
          <p className="mt-2 text-sm text-mute">
            Want a curated set instead?{" "}
            <Link to="/sheets/hld-core-sheet" className="font-semibold text-brand">Open sheets</Link>
          </p>
        </ThemeCard>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {tracks.map((item) => {
            const Icon = item.Icon;
            return (
              <Link
                key={item.key}
                to={`/practice/${item.key}`}
                className={`group rounded-[24px] border border-line bg-gradient-to-br p-6 text-left transition hover:-translate-y-0.5 hover:border-brand/40 ${item.accent}`}
              >
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${item.chip}`}>
                  <Icon size={18} />
                </span>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-brand">{typeLabel(item.key)}</p>
                <p className="mt-2 text-lg font-bold">{item.title}</p>
                <p className="mt-1 text-sm text-mute">{item.detail}</p>
              </Link>
            );
          })}
        </div>
      </Layout>
    );
  }

  if (comingSoon) {
    return (
      <Layout>
        <ThemeCard className="mx-auto max-w-lg text-center sm:p-8">
          <p className="label-caps">Coming soon</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{page?.title}</h1>
          <p className="mt-3 text-sm text-mute">This track is not open yet. HLD, LLD, DSA, Frontend, CS, and OA are available now.</p>
          <Link to={practicePath(QuestionType.HLD)} className="btn-brand mt-8 inline-flex">Open HLD practice</Link>
        </ThemeCard>
      </Layout>
    );
  }

  return isOa ? <OaSheet /> : <TypeSheet type={type} />;
}

function TypeSheet({ type }) {
  const p = usePracticeTrack(type);
  const Icon = p.track?.Icon;

  if (p.isLoading) {
    return (
      <Layout>
        <Loader fill />
      </Layout>
    );
  }

  return (
    <Layout>
      <ThemeCard tone={p.track?.hero || "brand"} className="sm:p-8">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-brand">
          {Icon && <Icon size={12} />}
          {typeLabel(type)}
        </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">{p.meta?.title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-mute">{p.meta?.subtitle}</p>
        {p.sheetSlug && (
          <p className="mt-2 text-sm text-mute">
            Looking for a curated set?{" "}
            <Link to={`/sheets/${p.sheetSlug}`} className="font-semibold text-brand">Open {typeLabel(type)} sheet</Link>
          </p>
        )}
      </ThemeCard>

      <ThemeCard tone={p.track?.hero || "quiet"} compact className="relative z-30 mt-6 !overflow-visible">
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative block min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-4 z-10 flex items-center text-mute">
              <SearchIcon />
            </span>
            <input
              className="field search-field mt-0 border border-line"
              placeholder="Search by title, like two sum or YouTube"
              value={p.search}
              onChange={(e) => p.setSearch(e.target.value)}
            />
          </label>
          <FilterSelect
            className="sm:w-40"
            value={p.difficulty}
            onChange={p.setDifficulty}
            placeholder="Difficulty"
            options={DIFFS.map((diff) => ({ value: diff, label: diff.charAt(0) + diff.slice(1).toLowerCase() }))}
          />
          <FilterSelect
            className="sm:w-44"
            value={p.company}
            onChange={p.setCompany}
            placeholder="All Companies"
            options={p.companyOptions}
          />
          {p.hasTopics && (
            <FilterSelect
              className="sm:w-48"
              value={p.topic}
              onChange={p.setTopic}
              placeholder="All topics"
              options={p.topicOptions}
            />
          )}
        </div>
      </ThemeCard>

      {p.isError && (
        <p className="mt-10 text-center text-sm text-hard">Could not load this track. Refresh, or try another filter.</p>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {p.items.map((q) => (
          <ProblemCard key={q.id} question={q} onStart={() => p.startQuestion(q)} />
        ))}
      </div>
      {!p.isError && !p.items.length && (
        <p className="mt-10 text-center text-sm text-mute">
          No problems match these filters. Clear search or company, or open the{" "}
          {p.sheetSlug ? (
            <Link to={`/sheets/${p.sheetSlug}`} className="font-semibold text-brand">{typeLabel(type)} sheet</Link>
          ) : (
            "full library"
          )}
          .
        </p>
      )}
      {p.picked && (
        <ModeOverlay
          question={p.picked}
          onPick={p.pickMode}
          onClose={p.closePicked}
        />
      )}
    </Layout>
  );
}

function OaSheet() {
  const lobby = useOaLobby();

  if (lobby.isLoading) {
    return (
      <Layout>
        <Loader fill />
      </Layout>
    );
  }

  return (
    <Layout>
      <ThemeCard tone="blue" className="sm:p-8">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-premium">
          <Camera size={12} />
          Online Assessment
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-5xl">{lobby.meta?.title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] text-mute">{lobby.meta?.subtitle}</p>
      </ThemeCard>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {lobby.sets.map((set) => (
          <AssessmentCard key={set.id} set={set} onStart={() => lobby.startSet(set.id)} />
        ))}
      </div>
      {lobby.isError && (
        <p className="mt-10 text-center text-sm text-hard">Could not load OA sets. Refresh and try again.</p>
      )}
      {!lobby.isError && !lobby.sets.length && (
        <p className="mt-10 text-center text-sm text-mute">No assessments are published yet. Practice DSA while you wait.</p>
      )}
    </Layout>
  );
}

function AssessmentCard({ set, onStart }) {
  const session = loadSession(set?.id);
  const active = isActive(session);
  const submitted = Boolean(session?.submittedAt);
  const cta = submitted ? "View result" : active ? `Resume · ${formatClock(remainingMs(session))}` : "Start Assessment";

  return (
    <article className="flex flex-col rounded-[24px] border border-brand/25 bg-gradient-to-br from-blue-500/15 via-card to-card p-5">
      <div className="flex items-start justify-between gap-3">
        <DifficultyBadge difficulty={set?.difficulty} />
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-mute">
          <Camera size={13} className="text-premium" />
          Camera
        </span>
      </div>
      <h3 className="mt-4 text-lg font-bold leading-snug">{set?.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-mute">{set?.description}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-ink">
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} className="text-brand" />
          {set?.durationMinutes} min
        </span>
        <span>{set?.questionCount} DSA problems</span>
      </div>
      <div className="mt-4">
        <CompanyTags companies={set?.companies} />
      </div>
      <div className="mt-auto pt-5">
        <button
          type="button"
          onClick={onStart}
          className="flex w-full items-center justify-between rounded-xl border border-line bg-field px-4 py-3 text-sm font-semibold hover:border-brand/40"
        >
          {cta}
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </article>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3-3" />
    </svg>
  );
}

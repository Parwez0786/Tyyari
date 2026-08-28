import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";
import { QUESTION_TYPES } from "../data/questionTypes";

export default function NewQuestion() {
  return (
    <div className="space-y-6">
      <PageHero
        kicker="Catalog"
        title="Add a question"
        detail="Pick the track first. Timed camera OAs are sets of DSA questions, not a sixth prompt type."
        action={<Link to="/questions" className="btn-ghost">Back to catalog</Link>}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {QUESTION_TYPES.map((item) => (
          <Link
            key={item.key}
            to={item.createTo || `/questions/new/${item.key}`}
            className={`group flex flex-col rounded-[24px] border border-line bg-gradient-to-br p-6 text-left transition hover:-translate-y-0.5 hover:border-brand/40 ${item.accent}`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">{item.title}</p>
            <h2 className="mt-3 text-xl font-extrabold tracking-tight">{item.title}</h2>
            <p className="mt-1 text-sm leading-6 text-mute">{item.hook}</p>
            <span className="mt-5 text-sm font-semibold text-brand">{item.add} →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

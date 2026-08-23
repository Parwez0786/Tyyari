import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import ModeOverlay from "../components/ModeOverlay";
import ProblemCard from "../components/ProblemCard";
import ThemeCard from "../components/ThemeCard";
import { Donut } from "../components/ProgressCharts";
import { QuestionType, practicePath } from "../data/enums";
import { typeLabel } from "../data/labels";
import { useSheetDetail } from "../hooks/useSheetDetail";

export default function SheetDetail() {
  const s = useSheetDetail();

  if (s.isLoading) {
    return (
      <Layout>
        <Loader fill />
      </Layout>
    );
  }

  return (
    <Layout>
      <Link to={s.backTo} className="text-sm font-medium text-brand">{s.backLabel}</Link>
      {s.isError && (
        <ThemeCard className="mx-auto mt-8 max-w-lg text-center sm:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Sheet not found</h1>
          <p className="mt-3 text-sm text-mute">This set is unpublished or the link is wrong.</p>
          <Link to={practicePath(QuestionType.HLD)} className="btn-brand mt-8 inline-flex">Open practice</Link>
        </ThemeCard>
      )}
      {s.sheet && (
        <>
          <ThemeCard tone={s.hero} className="mt-4 sm:p-8" innerClassName="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <p className="tab-chip tab-chip-on !inline-flex !px-2.5 !py-0.5 !text-[10px] !font-bold uppercase tracking-wide">
                {typeLabel(s.sheet.type)}
              </p>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{s.sheet.title}</h1>
              <p className="mt-3 max-w-xl text-[15px] text-mute">{s.sheet.description}</p>
              <p className="mt-3 text-sm text-mute">Same question list for every user on Tyyari.</p>
            </div>
            <Donut
              value={s.completed}
              total={s.questions.length}
              label={`${s.completed} of ${s.questions.length} completed`}
              className="shrink-0 justify-center lg:w-40 lg:flex-col lg:text-center"
            />
          </ThemeCard>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {s.questions.map((question) => (
              <ProblemCard
                key={question.id}
                question={question}
                completed={s.done.has(question.id)}
                onStart={() => s.startQuestion(question)}
              />
            ))}
          </div>
          {!s.questions.length && (
            <p className="mt-10 text-center text-sm text-mute">
              This sheet has no published questions yet. Try the{" "}
              <Link to={s.backTo} className="font-semibold text-brand">{typeLabel(s.sheet.type)} practice library</Link>.
            </p>
          )}
        </>
      )}
      {s.picked && (
        <ModeOverlay
          question={s.picked}
          onPick={s.pickMode}
          onClose={s.closePicked}
        />
      )}
    </Layout>
  );
}

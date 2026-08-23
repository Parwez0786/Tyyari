import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import ModeOverlay from "../components/ModeOverlay";
import ProblemCard from "../components/ProblemCard";
import { completedSet, countCompleted, Donut } from "../components/ProgressCharts";
import { CompanyTags, DifficultyBadge } from "../components/QuestionMeta";
import { typeLabel } from "../data/labels";
import { contentApi, userApi } from "../services/api";

export default function SheetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [picked, setPicked] = useState(null);
  const query = useQuery({ queryKey: ["sheet", id], queryFn: () => contentApi.sheet(id) });
  const progressQuery = useQuery({
    queryKey: ["practice-progress"],
    queryFn: userApi.practiceProgress,
  });
  const sheet = query.data?.data;
  const questions = sheet?.questions ?? [];
  const sheetKey = sheet?.slug || sheet?.id || id;
  const done = completedSet(progressQuery.data?.data);
  const completed = countCompleted(questions.map((item) => item.id), done);

  function startQuestion(question) {
    if (question.type === "HLD") {
      setPicked(question);
      return;
    }
    if (question.type === "LLD" || question.type === "DSA" || question.type === "FRONTEND") {
      navigate(`/questions/${question.id}?view=code&sheet=${sheetKey}`);
      return;
    }
    navigate(`/questions/${question.id}?sheet=${sheetKey}`);
  }

  function pickMode(view) {
    if (!picked) return;
    navigate(`/questions/${picked.id}?view=${view}&sheet=${sheetKey}`);
  }

  const backTo = `/practice/${sheet?.type || "HLD"}`;
  const backLabel = `← ${sheet?.type || "HLD"} practice`;

  return (
    <Layout>
      <Link to={backTo} className="text-sm font-medium text-brand">{backLabel}</Link>
      {query.isLoading && <p className="mt-8 text-sm text-mute">Loading sheet…</p>}
      {query.isError && (
        <section className="mx-auto mt-16 max-w-lg text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Sheet not found</h1>
          <p className="mt-3 text-sm text-mute">This set is unpublished or the link is wrong.</p>
          <Link to="/practice/HLD" className="btn-black mt-8">Open practice</Link>
        </section>
      )}
      {sheet && (
        <>
          <section className="mx-auto mt-6 max-w-3xl text-center">
            <div className="flex items-center justify-center gap-2">
              <DifficultyBadge difficulty={sheet.difficulty} />
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-mute">
                {typeLabel(sheet.type)}
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">{sheet.title}</h1>
            <p className="mt-3 text-[15px] text-mute">{sheet.description}</p>
            <p className="mt-3 text-sm text-mute">Same question list for every user on Tyyari.</p>
            <div className="mt-4 flex justify-center">
              <CompanyTags companies={sheet.companies} />
            </div>
          </section>
          <section className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-card p-5">
            <Donut
              value={completed}
              total={questions.length}
              label={`You have completed ${completed} of ${questions.length} questions on this sheet.`}
            />
          </section>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {questions.map((question) => (
              <ProblemCard
                key={question.id}
                question={question}
                completed={done.has(question.id)}
                onStart={() => startQuestion(question)}
              />
            ))}
          </div>
          {!questions.length && (
            <p className="mt-10 text-center text-sm text-mute">
              This sheet has no published questions yet. Try the{" "}
              <Link to={backTo} className="font-semibold text-brand">{typeLabel(sheet.type)} practice library</Link>.
            </p>
          )}
        </>
      )}
      {picked && (
        <ModeOverlay
          question={picked}
          onPick={pickMode}
          onClose={() => setPicked(null)}
        />
      )}
    </Layout>
  );
}

import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ChevronLeft, Columns2, Download } from "lucide-react";
import Layout from "../components/Layout";
import Loader from "../components/Loader";
import ModeOverlay from "../components/ModeOverlay";
import NotesPanel from "../components/NotesPanel";
import Palette from "../components/blueprint/Palette";
import PromptCard, { RequirementsBlock } from "../components/PromptCard";
import { QuestionMeta } from "../components/QuestionMeta";
import ThemeToggle from "../components/ThemeToggle";
import WorkspaceTabs from "../components/WorkspaceTabs";
import { PremiumGate } from "./Premium";
import { QuestionType, ViewMode, practicePath } from "../data/enums";
import { typeLabel } from "../data/labels";
import { useDesignWorkspace } from "../hooks/useDesignWorkspace";
import { useNarrowScreen } from "../hooks/useNarrowScreen";
import { useQuestion } from "../hooks/useQuestion";

const BlueprintBoard = lazy(() => import("../components/BlueprintBoard"));
const CodeWorkspace = lazy(() => import("../components/code/CodeWorkspace"));
const DsaWorkspace = lazy(() => import("../components/code/DsaWorkspace"));
const FrontendWorkspace = lazy(() => import("../components/code/FrontendWorkspace"));
const CsQuizWorkspace = lazy(() => import("../components/cs/CsQuizWorkspace"));
const WhiteboardBoard = lazy(() => import("../components/WhiteboardBoard"));

function WorkspaceFallback() {
  return <Loader fill />;
}

export default function Question() {
  const q = useQuestion();

  if (q.isLoading) {
    return (
      <Layout>
        <Loader fill />
      </Layout>
    );
  }

  return (
    <Layout wide={q.workspace} fill={q.workspace} hideNav={q.workspace}>
      {q.isError && (
        <section className="mx-auto max-w-lg py-16 text-center">
          <p className="label-caps">Problem unavailable</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">We could not open this question</h1>
          <p className="mt-3 text-sm text-mute">It may be unpublished, or the link is wrong. Go back to practice and pick another one.</p>
          <Link to={q.backTo} className="btn-black mt-8">{q.backLabel}</Link>
        </section>
      )}
      {q.data?.locked && <PremiumGate question={q.data} backTo={q.backTo} />}
      {q.unknownType && (
        <section className="mx-auto max-w-lg py-16 text-center">
          <p className="label-caps">Coming soon</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{q.data?.title}</h1>
          <p className="mt-3 text-sm text-mute">HLD, LLD, DSA, OA, Frontend, and CS quizzes are open right now.</p>
          <Link to={q.backTo} className="btn-black mt-8">{q.sheet ? "Back to sheet" : "Open HLD practice"}</Link>
        </section>
      )}
      {q.data && !q.data.locked && q.hld && q.needPick && <ProblemPreview data={q.data} backTo={q.backTo} sheet={q.sheet} />}
      <Suspense fallback={<WorkspaceFallback />}>
        {q.data && !q.data.locked && q.hld && q.view === ViewMode.BLUEPRINT && <BlueprintMode data={q.data} backTo={q.backTo} backLabel={q.backLabel} />}
        {q.data && !q.data.locked && q.hld && q.view === ViewMode.WHITEBOARD && <WhiteboardMode data={q.data} backTo={q.backTo} backLabel={q.backLabel} />}
        {q.data && !q.data.locked && q.lldCode && <CodeWorkspace key={q.data.id} data={q.data} backTo={q.backTo} backLabel={q.backLabel} />}
        {q.data && !q.data.locked && q.dsaCode && <DsaWorkspace key={q.data.id} data={q.data} backTo={q.backTo} backLabel={q.backLabel} />}
        {q.data && !q.data.locked && q.feCode && <FrontendWorkspace key={q.data.id} data={q.data} backTo={q.backTo} backLabel={q.backLabel} />}
        {q.data && !q.data.locked && q.cs && <CsQuizWorkspace key={q.data.id} data={q.data} backTo={q.backTo} backLabel={q.backLabel} />}
      </Suspense>
      {q.data && !q.data.locked && q.hld && q.needPick && (
        <ModeOverlay
          question={q.data}
          onPick={q.setView}
          onClose={q.closeOverlay}
        />
      )}
    </Layout>
  );
}

function ProblemPreview({ data, backTo, sheet }) {
  return (
    <div>
      <Link to={backTo} className="text-sm font-medium text-brand">← {sheet ? "Sheet" : `${typeLabel(data.type)} practice`}</Link>
      <section className="mx-auto mt-8 max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{data.title}</h1>
        <div className="mt-4">
          <QuestionMeta data={data} center />
        </div>
        <p className="mt-3 text-[15px] text-mute">{data.description}</p>
      </section>
      {data.type === QuestionType.HLD && <RequirementsBlock data={data} />}
    </div>
  );
}

function BlueprintMode({ data, backTo, backLabel }) {
  const w = useDesignWorkspace(data, ViewMode.BLUEPRINT);
  if (!w.ready) {
    return <Loader fill />;
  }

  return (
    <DesignWorkspace
      data={data}
      backTo={backTo}
      backLabel={backLabel}
      onDownload={w.download}
      onSubmit={w.submit}
      submitting={w.submitting}
      submitted={w.submitted}
      notesRef={w.notesRef}
    >
      <BlueprintBoard
        storageKey={w.key}
        lld={false}
        palette={(
          <Palette
            lld={false}
            onAddCustom={() => w.apiRef.current?.addNode("custom", "Custom")}
          />
        )}
        onApi={(api) => {
          w.apiRef.current = api;
        }}
      />
    </DesignWorkspace>
  );
}

function WhiteboardMode({ data, backTo, backLabel }) {
  const w = useDesignWorkspace(data, ViewMode.WHITEBOARD);
  if (!w.ready) {
    return <Loader fill />;
  }

  return (
    <DesignWorkspace
      data={data}
      backTo={backTo}
      backLabel={backLabel}
      onDownload={w.download}
      onSubmit={w.submit}
      submitting={w.submitting}
      submitted={w.submitted}
      notesRef={w.notesRef}
    >
      <WhiteboardBoard
        storageKey={w.key}
        onApi={(api) => {
          w.apiRef.current = api;
        }}
      />
    </DesignWorkspace>
  );
}

function DesignWorkspace({ data, backTo = practicePath(QuestionType.HLD), backLabel = "Back to HLD practice", onDownload, onSubmit, submitting = false, submitted = false, notesRef, children }) {
  const [focus, setFocus] = useState(false);
  const [pane, setPane] = useState("canvas");
  const narrow = useNarrowScreen();

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <header className="flex min-h-14 shrink-0 flex-wrap items-center gap-1.5 border-b border-line px-2 py-1.5 sm:gap-2 sm:px-3">
        <Link
          to={backTo}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-mute hover:bg-field hover:text-ink"
          aria-label={backLabel}
        >
          <ChevronLeft size={18} />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{data.title}</h1>
        <ThemeToggle compact />
        <button
          type="button"
          onClick={() => setFocus((v) => !v)}
          className={`hidden h-8 w-8 items-center justify-center rounded-lg md:inline-flex ${focus ? "bg-field text-ink" : "text-mute hover:bg-field hover:text-ink"}`}
          aria-label={focus ? "Show side panels" : "Focus canvas"}
          title={focus ? "Show side panels" : "Focus canvas"}
        >
          <Columns2 size={16} />
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Download</span>
        </button>
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex h-9 shrink-0 items-center rounded-lg bg-white/10 px-3 text-sm font-semibold text-ink hover:bg-white/15 disabled:opacity-60"
          >
            {submitting ? "Saving…" : submitted ? "Saved" : "Submit"}
          </button>
        )}
      </header>

      {narrow && (
        <WorkspaceTabs
          tabs={[
            { id: "prompt", label: "Prompt" },
            { id: "canvas", label: "Canvas" },
            { id: "notes", label: "Notes" },
          ]}
          value={pane}
          onChange={setPane}
        />
      )}
      {narrow ? (
        <div className="relative min-h-0 flex-1">
          <div className={`h-full min-h-0 ${pane === "prompt" ? "" : "hidden"}`}>
            <PromptCard data={data} />
          </div>
          <div className={`h-full min-h-0 ${pane === "canvas" ? "" : "hidden"}`}>
            {children}
          </div>
          <div className={`h-full min-h-0 ${pane === "notes" ? "" : "hidden"}`}>
            <NotesPanel
              questionId={data.id}
              defaults={{ math: data.estimates || "", explanation: data.canvasNotes || "" }}
              onApi={(api) => {
                if (notesRef) notesRef.current = api;
              }}
            />
          </div>
        </div>
      ) : (
        <PanelGroup direction="horizontal" autoSaveId="tyyari.design" className="min-h-0 flex-1">
          {!focus && (
            <>
              <Panel defaultSize={22} minSize={16} maxSize={34} className="h-full min-h-0">
                <PromptCard data={data} />
              </Panel>
              <PanelResizeHandle className="tyyari-resize" />
            </>
          )}
          <Panel defaultSize={focus ? 100 : 50} minSize={30} className="h-full min-h-0">
            {children}
          </Panel>
          {!focus && (
            <>
              <PanelResizeHandle className="tyyari-resize" />
              <Panel defaultSize={28} minSize={18} maxSize={40} className="h-full min-h-0">
                <NotesPanel
                  questionId={data.id}
                  defaults={{ math: data.estimates || "", explanation: data.canvasNotes || "" }}
                  onCollapse={() => setFocus(true)}
                  onApi={(api) => {
                    if (notesRef) notesRef.current = api;
                  }}
                />
              </Panel>
            </>
          )}
        </PanelGroup>
      )}
    </div>
  );
}

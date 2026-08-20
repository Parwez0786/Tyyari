import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ChevronLeft, Columns2, Download } from "lucide-react";
import BlueprintBoard from "../components/BlueprintBoard";
import CodeWorkspace from "../components/code/CodeWorkspace";
import DsaWorkspace from "../components/code/DsaWorkspace";
import FrontendWorkspace from "../components/code/FrontendWorkspace";
import CsQuizWorkspace from "../components/cs/CsQuizWorkspace";
import Layout from "../components/Layout";
import ModeOverlay from "../components/ModeOverlay";
import NotesPanel from "../components/NotesPanel";
import Palette from "../components/blueprint/Palette";
import PromptCard, { RequirementsBlock } from "../components/PromptCard";
import { QuestionMeta } from "../components/QuestionMeta";
import ThemeToggle from "../components/ThemeToggle";
import WhiteboardBoard from "../components/WhiteboardBoard";
import { contentApi } from "../services/api";
import { loadSubmission, saveSubmission } from "../services/submissions";

export default function Question() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = useQuery({ queryKey: ["question", id], queryFn: () => contentApi.question(id) });
  const data = q.data?.data;
  const view = params.get("view");
  const sheet = params.get("sheet");
  const hld = data?.type === "HLD";
  const lld = data?.type === "LLD";
  const dsa = data?.type === "DSA";
  const frontend = data?.type === "FRONTEND";
  const cs = data?.type === "CS";
  const canvas = view === "blueprint" || view === "whiteboard";
  const lldCode = lld && (view === "code" || !view);
  const dsaCode = dsa && (view === "code" || !view);
  const feCode = frontend && (view === "code" || !view);
  const needPick = hld && !canvas;
  const workspace = (hld && canvas) || lldCode || dsaCode || feCode || cs;
  const backTo = sheet ? `/sheets/${sheet}` : `/practice/${data?.type || "DSA"}`;
  const backLabel = sheet ? "Back to sheet" : `Back to ${data?.type || "practice"}`;

  function setView(next) {
    const nextParams = new URLSearchParams(params);
    nextParams.set("view", next);
    setParams(nextParams, { replace: true });
  }

  return (
    <Layout wide={workspace} fill={workspace} hideNav={workspace}>
      {q.isLoading && <p className="p-6 text-sm text-mute">Loading…</p>}
      {data && !hld && !lld && !dsa && !frontend && !cs && (
        <section className="mx-auto max-w-lg py-16 text-center">
          <p className="label-caps">Coming soon</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{data.title}</h1>
          <p className="mt-3 text-sm text-mute">HLD, LLD, DSA, OA, Frontend, and CS quizzes are open right now.</p>
          <Link to={backTo} className="btn-black mt-8">{sheet ? "Back to sheet" : "Open HLD practice"}</Link>
        </section>
      )}
      {data && hld && needPick && <ProblemPreview data={data} backTo={backTo} sheet={sheet} />}
      {data && hld && view === "blueprint" && <BlueprintMode data={data} backTo={backTo} backLabel={backLabel} />}
      {data && hld && view === "whiteboard" && <WhiteboardMode data={data} backTo={backTo} backLabel={backLabel} />}
      {data && lldCode && <CodeWorkspace key={data.id} data={data} backTo={backTo} backLabel={backLabel} />}
      {data && dsaCode && <DsaWorkspace key={data.id} data={data} backTo={backTo} backLabel={backLabel} />}
      {data && feCode && <FrontendWorkspace key={data.id} data={data} backTo={backTo} backLabel={backLabel} />}
      {data && cs && <CsQuizWorkspace key={data.id} data={data} backTo={backTo} backLabel={backLabel} />}
      {data && hld && needPick && (
        <ModeOverlay
          question={data}
          onPick={setView}
          onClose={() => navigate(backTo)}
        />
      )}
    </Layout>
  );
}

function ProblemPreview({ data, backTo, sheet }) {
  return (
    <div>
      <Link to={backTo} className="text-sm font-medium text-brand">← {sheet ? "Sheet" : `${data.type} practice`}</Link>
      <section className="mx-auto mt-8 max-w-3xl text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{data.title}</h1>
        <div className="mt-4">
          <QuestionMeta data={data} center />
        </div>
        <p className="mt-3 text-[15px] text-mute">{data.description}</p>
      </section>
      {data.type === "HLD" && <RequirementsBlock data={data} />}
    </div>
  );
}

function BlueprintMode({ data, backTo, backLabel }) {
  const apiRef = useRef(null);
  const notesRef = useRef(null);
  const key = `tyyari.blueprint.${data.id}`;
  const [ready, setReady] = useState(() => Boolean(localStorage.getItem(key)));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSubmission(data.id).then((saved) => {
      if (cancelled) return;
      if (saved) setSubmitted(true);
      if (!localStorage.getItem(key) && saved?.canvas) {
        localStorage.setItem(key, JSON.stringify(saved.canvas));
      }
      hydrateNotes(data.id, saved);
      setReady(true);
    }).catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, [data.id, key]);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      let canvas = apiRef.current?.getState?.();
      if (!canvas) {
        try {
          canvas = JSON.parse(localStorage.getItem(key) || "{}");
        } catch {
          canvas = {};
        }
      }
      const notes = readNotes(notesRef.current, data.id);
      await saveSubmission({
        questionId: data.id,
        questionType: "HLD",
        view: "blueprint",
        canvas,
        math: notes.math,
        explanation: notes.explanation,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <p className="p-6 text-sm text-mute">Loading workspace…</p>;
  }

  return (
    <DesignWorkspace
      data={data}
      backTo={backTo}
      backLabel={backLabel}
      onDownload={() => apiRef.current?.download()}
      onSubmit={submit}
      submitting={submitting}
      submitted={submitted}
      notesRef={notesRef}
    >
      <BlueprintBoard
        storageKey={key}
        lld={false}
        palette={(
          <Palette
            lld={false}
            onAddCustom={() => apiRef.current?.addNode("custom", "Custom")}
          />
        )}
        onApi={(api) => {
          apiRef.current = api;
        }}
      />
    </DesignWorkspace>
  );
}

function WhiteboardMode({ data, backTo, backLabel }) {
  const apiRef = useRef(null);
  const notesRef = useRef(null);
  const key = `tyyari.whiteboard.${data.id}`;
  const [ready, setReady] = useState(() => Boolean(localStorage.getItem(key)));
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadSubmission(data.id).then((saved) => {
      if (cancelled) return;
      if (saved) setSubmitted(true);
      if (!localStorage.getItem(key) && saved?.canvas) {
        localStorage.setItem(key, JSON.stringify(saved.canvas));
      }
      hydrateNotes(data.id, saved);
      setReady(true);
    }).catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, [data.id, key]);

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      let canvas = apiRef.current?.getState?.();
      if (!canvas) {
        try {
          canvas = JSON.parse(localStorage.getItem(key) || "{}");
        } catch {
          canvas = {};
        }
      }
      const notes = readNotes(notesRef.current, data.id);
      await saveSubmission({
        questionId: data.id,
        questionType: "HLD",
        view: "whiteboard",
        canvas,
        math: notes.math,
        explanation: notes.explanation,
      });
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <p className="p-6 text-sm text-mute">Loading workspace…</p>;
  }

  return (
    <DesignWorkspace
      data={data}
      backTo={backTo}
      backLabel={backLabel}
      onDownload={() => apiRef.current?.download()}
      onSubmit={submit}
      submitting={submitting}
      submitted={submitted}
      notesRef={notesRef}
    >
      <WhiteboardBoard
        storageKey={key}
        onApi={(api) => {
          apiRef.current = api;
        }}
      />
    </DesignWorkspace>
  );
}

function notesKey(questionId) {
  return `tyyari.notes.${questionId}`;
}

function readNotes(api, questionId) {
  const live = api?.getState?.();
  if (live) {
    return { math: live.math || "", explanation: live.explanation || "" };
  }
  try {
    const saved = JSON.parse(localStorage.getItem(notesKey(questionId)) || "{}");
    return { math: saved.math || "", explanation: saved.explanation || "" };
  } catch {
    return { math: "", explanation: "" };
  }
}

function hydrateNotes(questionId, saved) {
  const math = saved?.math || "";
  const explanation = saved?.explanation || "";
  if (!math && !explanation) return;
  try {
    const current = JSON.parse(localStorage.getItem(notesKey(questionId)) || "{}");
    if (current.math || current.explanation) return;
  } catch {
    // seed from the saved submission
  }
  localStorage.setItem(notesKey(questionId), JSON.stringify({ math, explanation }));
}

function DesignWorkspace({ data, backTo = "/practice/HLD", backLabel = "Back to HLD practice", onDownload, onSubmit, submitting = false, submitted = false, notesRef, children }) {
  const [focus, setFocus] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3">
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
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${focus ? "bg-field text-ink" : "text-mute hover:bg-field hover:text-ink"}`}
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
          Download
        </button>
        {onSubmit && (
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="inline-flex h-9 shrink-0 items-center rounded-lg bg-white/10 px-3 text-sm font-semibold text-ink hover:bg-white/15 disabled:opacity-60"
          >
            {submitting ? "Saving…" : submitted ? "Submitted" : "Submit"}
          </button>
        )}
      </header>

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
                onCollapse={() => setFocus(true)}
                onApi={(api) => {
                  if (notesRef) notesRef.current = api;
                }}
              />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}

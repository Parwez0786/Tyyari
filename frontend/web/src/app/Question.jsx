import { useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { ChevronLeft, Columns2, Download } from "lucide-react";
import BlueprintBoard from "../components/BlueprintBoard";
import CodeWorkspace from "../components/code/CodeWorkspace";
import DsaWorkspace from "../components/code/DsaWorkspace";
import FrontendWorkspace from "../components/code/FrontendWorkspace";
import Layout from "../components/Layout";
import ModeOverlay from "../components/ModeOverlay";
import NotesPanel from "../components/NotesPanel";
import Palette from "../components/blueprint/Palette";
import PromptCard, { RequirementsBlock } from "../components/PromptCard";
import { QuestionMeta } from "../components/QuestionMeta";
import ThemeToggle from "../components/ThemeToggle";
import WhiteboardBoard from "../components/WhiteboardBoard";
import { contentApi } from "../services/api";

export default function Question() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const q = useQuery({ queryKey: ["question", id], queryFn: () => contentApi.question(id) });
  const data = q.data?.data;
  const view = params.get("view");
  const hld = data?.type === "HLD";
  const lld = data?.type === "LLD";
  const dsa = data?.type === "DSA";
  const frontend = data?.type === "FRONTEND";
  const canvas = view === "blueprint" || view === "whiteboard";
  const lldCode = lld && (view === "code" || !view);
  const dsaCode = dsa && (view === "code" || !view);
  const feCode = frontend && (view === "code" || !view);
  const needPick = hld && !canvas;
  const workspace = (hld && canvas) || lldCode || dsaCode || feCode;

  function setView(next) {
    setParams({ view: next }, { replace: true });
  }

  return (
    <Layout wide={workspace} fill={workspace} hideNav={workspace}>
      {q.isLoading && <p className="p-6 text-sm text-mute">Loading…</p>}
      {data && !hld && !lld && !dsa && !frontend && (
        <section className="mx-auto max-w-lg py-16 text-center">
          <p className="label-caps">Coming soon</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{data.title}</h1>
          <p className="mt-3 text-sm text-mute">HLD, LLD, DSA, OA, and Frontend are open right now. Other tracks are still coming soon.</p>
          <Link to="/practice/HLD" className="btn-black mt-8">Open HLD sheet</Link>
        </section>
      )}
      {data && hld && needPick && <ProblemPreview data={data} />}
      {data && hld && view === "blueprint" && <BlueprintMode data={data} />}
      {data && hld && view === "whiteboard" && <WhiteboardMode data={data} />}
      {data && lldCode && <CodeWorkspace key={data.id} data={data} />}
      {data && dsaCode && <DsaWorkspace key={data.id} data={data} />}
      {data && feCode && <FrontendWorkspace key={data.id} data={data} />}
      {data && hld && needPick && (
        <ModeOverlay
          question={data}
          onPick={setView}
          onClose={() => navigate("/practice/HLD")}
        />
      )}
    </Layout>
  );
}

function ProblemPreview({ data }) {
  return (
    <div>
      <Link to={`/practice/${data.type}`} className="text-sm font-medium text-brand">← {data.type} sheet</Link>
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

function BlueprintMode({ data }) {
  const apiRef = useRef(null);
  const key = `tyyari.blueprint.${data.id}`;
  return (
    <DesignWorkspace
      data={data}
      onDownload={() => apiRef.current?.download()}
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

function WhiteboardMode({ data }) {
  const apiRef = useRef(null);
  const key = `tyyari.whiteboard.${data.id}`;
  return (
    <DesignWorkspace
      data={data}
      onDownload={() => apiRef.current?.download()}
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

function DesignWorkspace({ data, onDownload, children }) {
  const [focus, setFocus] = useState(false);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-canvas">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3">
        <Link
          to="/practice/HLD"
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-mute hover:bg-field hover:text-ink"
          aria-label="Back to HLD sheet"
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
              <NotesPanel questionId={data.id} onCollapse={() => setFocus(true)} />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}

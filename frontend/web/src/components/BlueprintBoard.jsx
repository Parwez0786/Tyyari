import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Background,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import ArchNode from "./blueprint/ArchNode";
import { catalogFor } from "./blueprint/catalog";
import { useThemeStore } from "../stores/themeStore";

const nodeTypes = Object.fromEntries(
  [...catalogFor(false), ...catalogFor(true), { type: "custom" }].map((item) => [item.type, ArchNode]),
);

function loadGraph(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    if (Array.isArray(saved.nodes) && saved.nodes.some((node) => node.type && node.type !== "default")) {
      return { nodes: saved.nodes, edges: saved.edges || [] };
    }
  } catch {
    /* ignore */
  }
  return { nodes: [], edges: [] };
}

function BlueprintCanvas({ storageKey, lld, onApi, palette }) {
  const theme = useThemeStore((s) => s.theme);
  const { screenToFlowPosition } = useReactFlow();
  const seed = useMemo(() => loadGraph(storageKey), [storageKey]);
  const [nodes, setNodes, onNodesChange] = useNodesState(seed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seed.edges);
  const saveTimer = useRef(null);

  useEffect(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(storageKey, JSON.stringify({ nodes, edges }));
    }, 250);
    return () => clearTimeout(saveTimer.current);
  }, [storageKey, nodes, edges]);

  const onConnect = useCallback(
    (connection) =>
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18, color: "#64748b" },
            style: { strokeWidth: 2, stroke: "#64748b" },
          },
          current,
        ),
      ),
    [setEdges],
  );

  const addNode = useCallback(
    (type, label, position) => {
      setNodes((current) => [
        ...current,
        {
          id: `${type}-${Date.now()}`,
          type,
          position: position || { x: 80 + (current.length % 4) * 40, y: 80 + (current.length % 3) * 40 },
          data: { label, lld },
        },
      ]);
    },
    [lld, setNodes],
  );

  const download = useCallback(async () => {
    const el = document.querySelector(".tyyari-flow .react-flow");
    if (!el) return;
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(el, {
      backgroundColor: theme === "dark" ? "#000000" : "#ffffff",
      cacheBust: true,
    });
    const link = document.createElement("a");
    link.download = "blueprint.png";
    link.href = dataUrl;
    link.click();
  }, [theme]);

  const getGraph = useCallback(() => ({ nodes, edges }), [nodes, edges]);

  useEffect(() => {
    onApi?.({ addNode, download, getState: getGraph });
  }, [addNode, download, getGraph, onApi]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      const label = event.dataTransfer.getData("application/label");
      if (!type) return;
      addNode(type, label, screenToFlowPosition({ x: event.clientX, y: event.clientY }));
    },
    [addNode, screenToFlowPosition],
  );

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas">
      {palette && (
        <div className="flex h-14 w-full shrink-0 items-center border-b border-line px-1">
          {palette}
        </div>
      )}
      <div className="tyyari-flow min-h-0 w-full flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          colorMode={theme}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            color={theme === "dark" ? "#3f3f46" : "#cbd5e1"}
            gap={18}
            size={1.4}
          />
          <Controls position="bottom-left" showFitView={false} />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            className="!bg-card !border-line"
          />
        </ReactFlow>
      </div>
    </section>
  );
}

export default function BlueprintBoard({ storageKey, lld, onApi, palette }) {
  return (
    <div className="h-full min-h-0">
      <ReactFlowProvider>
        <BlueprintCanvas storageKey={storageKey} lld={lld} onApi={onApi} palette={palette} />
      </ReactFlowProvider>
    </div>
  );
}

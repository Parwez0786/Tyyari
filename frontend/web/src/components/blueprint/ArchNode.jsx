import { Handle, Position, useReactFlow } from "@xyflow/react";
import { componentByType } from "./catalog";

const HANDLE = "!h-3 !w-3 !bg-slate-400 hover:!bg-blue-500";

export default function ArchNode({ id, data, type }) {
  const { updateNodeData } = useReactFlow();
  const meta = componentByType(type, data.lld);
  const Icon = meta.icon;

  return (
    <div className={`min-w-[150px] rounded-lg border-2 bg-white px-4 py-3 shadow-lg dark:bg-zinc-800 ${meta.color}`}>
      <Handle type="target" position={Position.Top} id="top-target" className={HANDLE} />
      <Handle type="source" position={Position.Top} id="top-source" className={HANDLE} />
      <Handle type="target" position={Position.Left} id="left-target" className={HANDLE} />
      <Handle type="source" position={Position.Left} id="left-source" className={HANDLE} />

      <div className="flex items-center gap-3">
        <div className="rounded-md bg-slate-100 p-2 text-slate-700 dark:bg-zinc-700 dark:text-slate-200">
          <Icon size={20} />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {meta.label}
          </span>
          <input
            className="nodrag w-full border-0 bg-transparent p-0 text-sm font-medium text-slate-900 outline-none dark:text-white"
            value={data.label || ""}
            onChange={(e) => updateNodeData(id, { label: e.target.value })}
          />
        </div>
      </div>

      <Handle type="target" position={Position.Right} id="right-target" className={HANDLE} />
      <Handle type="source" position={Position.Right} id="right-source" className={HANDLE} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className={HANDLE} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className={HANDLE} />
    </div>
  );
}

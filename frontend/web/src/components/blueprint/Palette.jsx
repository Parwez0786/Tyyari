import { Plus } from "lucide-react";
import { catalogFor } from "./catalog";

export default function Palette({ lld, onAddCustom }) {
  function startDrag(event, item) {
    event.dataTransfer.setData("application/reactflow", item.type);
    event.dataTransfer.setData("application/label", item.label);
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <div className="flex h-full min-w-0 w-full items-center">
      <div className="flex h-full min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto">
        {catalogFor(lld).map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.type}
              draggable
              title={item.label}
              onDragStart={(event) => startDrag(event, item)}
              className="group flex min-w-[4.5rem] flex-1 cursor-grab select-none flex-col items-center justify-center rounded-lg px-1 hover:bg-field active:cursor-grabbing"
            >
              <Icon size={16} className="mb-0.5 text-mute group-hover:text-brand" />
              <span className="max-w-full truncate px-0.5 text-center text-[10px] font-medium leading-none text-mute group-hover:text-ink">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        title="Add custom component"
        onClick={onAddCustom}
        className="ml-1 flex h-11 w-[4.5rem] shrink-0 flex-col items-center justify-center rounded-lg border border-dashed border-line hover:border-brand"
      >
        <Plus size={16} className="mb-0.5 text-mute" />
        <span className="text-[10px] font-medium text-mute">Custom</span>
      </button>
    </div>
  );
}

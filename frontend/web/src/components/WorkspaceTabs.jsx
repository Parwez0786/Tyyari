export default function WorkspaceTabs({ tabs, value, onChange }) {
  return (
    <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 bg-card px-2 py-1.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`h-8 shrink-0 rounded-lg px-3 text-xs font-semibold ${
            value === tab.id ? "bg-white/10 text-ink" : "text-mute hover:text-ink"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

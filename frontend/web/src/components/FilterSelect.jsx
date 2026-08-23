import { useEffect, useRef, useState } from "react";

export default function FilterSelect({ value, onChange, options, placeholder, className = "" }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const selected = options.find((item) => item.value === value);
  const label = selected?.label || placeholder;

  useEffect(() => {
    function onDoc(event) {
      if (!root.current?.contains(event.target)) setOpen(false);
    }
    function onKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-3.5 text-left text-sm ${
          open || value ? "border-brand/40 bg-card text-ink" : "border-line bg-field text-mute"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 text-mute transition ${open ? "rotate-180 text-brand" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          className="absolute z-[70] mt-2 max-h-64 w-full overflow-auto rounded-2xl border border-brand/25 bg-card py-1 shadow-[0_16px_40px_rgba(15,23,42,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.45)]"
          role="listbox"
        >
          <OptionRow
            active={!value}
            label={placeholder}
            onPick={() => {
              onChange("");
              setOpen(false);
            }}
          />
          {options.map((item) => (
            <OptionRow
              key={item.value}
              active={value === item.value}
              label={item.label}
              onPick={() => {
                onChange(item.value);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionRow({ active, label, onPick }) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onPick}
      className={`block w-full px-4 py-2.5 text-left text-sm ${
        active ? "bg-brand/15 font-semibold text-brand" : "text-ink hover:bg-brand/10"
      }`}
    >
      {label}
    </button>
  );
}

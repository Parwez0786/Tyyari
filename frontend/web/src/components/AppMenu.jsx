import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";

const groups = [
  {
    label: "Practice",
    items: [
      { to: "/practice/HLD", title: "System Design (HLD)", detail: "High-level design" },
      { to: "/practice/LLD", title: "Low Level Design", detail: "OOP & machine coding" },
      { to: "/practice/DSA", title: "DSA", detail: "Data structures & algorithms" },
      { title: "Frontend Coding", detail: "UI challenges", soon: true },
      { title: "Online Assessment", detail: "Timed questions", soon: true },
      { title: "CS Fundamentals", detail: "Quiz & theory", soon: true },
    ],
  },
  {
    label: "Learn",
    items: [
      { title: "High Level Design", detail: "System architecture", soon: true },
      { title: "Low Level Design", detail: "OOP & design patterns", soon: true },
      { title: "Roadmap", detail: "Set your target role", soon: true },
    ],
  },
  {
    label: "Sheets",
    items: [
      { to: "/practice/HLD", title: "HLD — System Design", detail: "Design question sheet" },
      { to: "/practice/LLD", title: "LLD — Low Level Design", detail: "LLD question sheet" },
      { to: "/practice/DSA", title: "DSA — Algorithms", detail: "LeetCode-style problem sheet" },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Mock Interview", detail: "Guided practice rounds", soon: true },
      { title: "Upgrade to Premium", detail: "Unlock all features", gold: true, soon: true },
    ],
  },
];

export default function AppMenu({ open, onClose, authed, name, email, onLogout }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-canvas">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div onClick={onClose}>
            <Logo to={authed ? "/dashboard" : "/"} />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            {authed && <Avatar name={name} email={email} />}
            <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink" aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {authed ? (
            groups.map((group) => (
              <section key={group.label} className="rounded-2xl border border-line bg-surface p-2">
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">{group.label}</p>
                {group.items.map((item) => (
                  <MenuItem key={item.title} item={item} onClose={onClose} />
                ))}
              </section>
            ))
          ) : (
            <section className="rounded-2xl border border-line bg-surface p-4">
              <Link to="/login" onClick={onClose} className="block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-field">Sign in</Link>
              <Link to="/register" onClick={onClose} className="mt-1 block rounded-xl px-3 py-3 text-sm font-semibold hover:bg-field">Get started</Link>
            </section>
          )}
        </div>

        {authed && (
          <div className="border-t border-line p-4">
            <button
              type="button"
              className="w-full rounded-xl bg-red-800 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
              onClick={async () => {
                onClose();
                await onLogout();
                navigate("/");
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

function MenuItem({ item, onClose }) {
  const body = (
    <>
      <span className="mt-0.5 text-mute">
        <DotIcon />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={`block text-sm font-semibold ${item.gold ? "text-amber-400" : ""} ${item.soon ? "text-mute" : ""}`}>
            {item.title}
          </span>
          {item.soon && (
            <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-mute">
              Coming soon
            </span>
          )}
        </span>
        <span className="block text-xs text-mute">{item.detail}</span>
      </span>
    </>
  );

  if (item.soon) {
    return (
      <div className="flex cursor-not-allowed items-start gap-3 rounded-xl px-3 py-2.5 opacity-70">
        {body}
      </div>
    );
  }

  return (
    <Link to={item.to} onClick={onClose} className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-field">
      {body}
    </Link>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="4" width="16" height="16" rx="4" />
    </svg>
  );
}

import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import {
  BookOpen,
  Camera,
  Code2,
  Crown,
  LayoutTemplate,
  ListChecks,
  Map,
  Mic,
  Network,
  Puzzle,
} from "lucide-react";
import { QuestionType, practicePath } from "../data/enums";
import { typeLabel } from "../data/labels";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";

const groups = [
  {
    label: "Practice",
    items: [
      { to: practicePath(QuestionType.HLD), title: "System Design (HLD)", detail: "Full HLD question library", Icon: Network },
      { to: practicePath(QuestionType.LLD), title: typeLabel(QuestionType.LLD), detail: "Full LLD question library", Icon: Puzzle },
      { to: practicePath(QuestionType.DSA), title: typeLabel(QuestionType.DSA), detail: "Full DSA question library", Icon: Code2 },
      { to: practicePath(QuestionType.FRONTEND), title: "Frontend Coding", detail: "Full frontend question library", Icon: LayoutTemplate },
      { to: practicePath(QuestionType.CS), title: typeLabel(QuestionType.CS), detail: "OS, DBMS, OOP, networks", Icon: BookOpen },
      { to: practicePath(QuestionType.OA), title: typeLabel(QuestionType.OA), detail: "Timed DSA sets + camera", Icon: Camera },
    ],
  },
  {
    label: "Learn",
    items: [
      { to: "/learn", title: "Roadmap", detail: "Week-by-week SDE-1 and SDE-2", Icon: Map },
    ],
  },
  {
    label: "Sheets",
    items: [
      { to: "/sheets/hld-core-sheet", title: "HLD sheets", detail: "System design sets", Icon: Network },
      { to: "/sheets/lld-machine-coding", title: "LLD sheets", detail: "Machine-coding sets", Icon: Puzzle },
      { to: "/sheets/dsa-sde-sheet", title: "DSA sheets", detail: "Ordered problem sets", Icon: ListChecks },
      { to: "/sheets/frontend-ui-sheet", title: "Frontend sheets", detail: "UI challenge sets", Icon: LayoutTemplate },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Mock Interview", detail: "Guided practice rounds", soon: true, Icon: Mic },
      { to: "/premium", title: "Upgrade to Premium", detail: "Unlock locked problems", gold: true, Icon: Crown },
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
  const Icon = item.Icon;
  const body = (
    <>
      {Icon && (
        <Icon
          size={16}
          strokeWidth={1.8}
          className={`mt-0.5 shrink-0 ${item.gold ? "text-amber-400" : "text-mute"}`}
        />
      )}
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

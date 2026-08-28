import { Link } from "react-router-dom";
import { useEffect } from "react";
import {
  BookOpen,
  Camera,
  CirclePlus,
  Code2,
  CreditCard,
  Inbox,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  ListChecks,
  Network,
  Puzzle,
  ScrollText,
  Tags,
  CircleUserRound,
  Users,
} from "lucide-react";
import { QUESTION_TYPES } from "../data/questionTypes";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";

const TYPE_ICONS = {
  DSA: Code2,
  HLD: Network,
  LLD: Puzzle,
  FRONTEND: LayoutTemplate,
  CS: BookOpen,
  OA: Camera,
};

const groups = [
  {
    label: "Catalog",
    items: [
      { to: "/", title: "Dashboard", detail: "Signups, Premium, and practice charts", Icon: LayoutDashboard },
      { to: "/questions", title: "Questions", detail: "Publish, lock Premium, and edit prompts", Icon: Library },
      { to: "/questions/new", title: "New question", detail: "Pick a track, then fill its fields", Icon: CirclePlus },
      { to: "/catalog", title: "Companies, topics, tags", detail: "Labels used by candidate filters", Icon: Tags },
      { to: "/sheets", title: "Sheets", detail: "Create grind lists and pick question order", Icon: ListChecks },
      { to: "/oa", title: "OA sets", detail: "Timed camera rounds: title, duration, DSA list", Icon: Camera },
    ],
  },
  {
    label: "Add a question",
    items: QUESTION_TYPES.map((type) => ({
      to: type.createTo || `/questions/new/${type.key}`,
      title: type.add,
      detail: type.hook,
      Icon: TYPE_ICONS[type.key] || CirclePlus,
    })),
  },
  {
    label: "Access",
    items: [
      { to: "/account", title: "Your account", detail: "Photo, name, and profile links", Icon: CircleUserRound },
      { to: "/users", title: "Users", detail: "Profiles, Premium, and disable accounts", Icon: Users },
      { to: "/billing", title: "Billing", detail: "Payments, Stripe status, refunds, grant Premium", Icon: CreditCard },
      { to: "/mail", title: "Mail log", detail: "Invite, verify, and reset emails from Mailpit", Icon: Inbox },
      { to: "/audit", title: "Audit log", detail: "Who published, deleted, or disabled what", Icon: ScrollText },
    ],
  },
];

export default function AppMenu({ open, onClose, name, email, avatar, onLogout }) {
  useEffect(() => {
    if (!open) return undefined;
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
            <Logo to="/" />
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <Avatar name={name} email={email} src={avatar} />
            <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink" aria-label="Close">
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {groups.map((group) => (
            <section key={group.label} className="rounded-2xl border border-line bg-surface p-2">
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-mute">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.Icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-field"
                  >
                    {Icon && <Icon size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-mute" />}
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">{item.title}</span>
                      <span className="block text-xs text-mute">{item.detail}</span>
                    </span>
                  </Link>
                );
              })}
            </section>
          ))}
        </div>
        <div className="border-t border-line p-4">
          <button
            type="button"
            className="w-full rounded-xl bg-red-800 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
            onClick={() => {
              onClose();
              onLogout();
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

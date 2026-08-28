import { useQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { adminApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { queryClient } from "../queryClient";
import AppMenu from "./AppMenu";
import Avatar from "./Avatar";
import Loader, { FooterLockProvider, useFooterLocked } from "./Loader";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function Shell() {
  return (
    <FooterLockProvider>
      <ShellFrame />
    </FooterLockProvider>
  );
}

function ShellFrame() {
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);
  const [menuOpen, setMenuOpen] = useState(false);
  const meQuery = useQuery({ queryKey: ["me"], queryFn: adminApi.me });
  const profileQuery = useQuery({ queryKey: ["admin-self-profile"], queryFn: adminApi.profile });
  const email = meQuery.data?.data?.email || "";
  const name = profileQuery.data?.data?.name || "";
  const avatar = profileQuery.data?.data?.avatar || "";

  const footerLocked = useFooterLocked();

  function logout() {
    clear();
    queryClient.clear();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 bg-surface">
        <div className="flex w-full min-w-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo to="/" />
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle compact />
            <Link to="/account" aria-label="Your account">
              <Avatar name={name} email={email} src={avatar} />
            </Link>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-field"
              aria-label="Open menu"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </header>
      <AppMenu open={menuOpen} onClose={() => setMenuOpen(false)} name={name} email={email} avatar={avatar} onLogout={logout} />
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <Suspense fallback={<Loader fill />}>
          <Outlet />
        </Suspense>
      </main>
      {!footerLocked && (
      <footer className="mt-10 border-t border-line bg-card">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div>
            <Logo to="/" />
            <p className="mt-3 max-w-xs text-sm leading-6 text-mute">
              Admin for the same catalog the candidate app reads. Publish a problem and it shows up on practice.
            </p>
            <p className="mt-4 font-hand text-xl text-brand">Publish carefully.</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Catalog</p>
            <ul className="mt-3 grid gap-2 text-sm">
              <li><Link to="/" className="text-ink hover:text-brand">Dashboard</Link></li>
              <li><Link to="/questions" className="text-ink hover:text-brand">Questions</Link></li>
              <li><Link to="/questions/new" className="text-ink hover:text-brand">New question</Link></li>
              <li><Link to="/questions/new/DSA" className="text-ink hover:text-brand">Add DSA</Link></li>
              <li><Link to="/questions/new/HLD" className="text-ink hover:text-brand">Add HLD</Link></li>
              <li><Link to="/catalog" className="text-ink hover:text-brand">Companies, topics, tags</Link></li>
              <li><Link to="/sheets" className="text-ink hover:text-brand">Sheets</Link></li>
              <li><Link to="/oa" className="text-ink hover:text-brand">OA sets</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Access</p>
            <ul className="mt-3 grid gap-2 text-sm">
              <li><Link to="/account" className="text-ink hover:text-brand">Your account</Link></li>
              <li><Link to="/users" className="text-ink hover:text-brand">Users</Link></li>
              <li><Link to="/billing" className="text-ink hover:text-brand">Billing</Link></li>
              <li><Link to="/mail" className="text-ink hover:text-brand">Mail log</Link></li>
              <li><Link to="/audit" className="text-ink hover:text-brand">Audit log</Link></li>
              <li><button type="button" className="text-ink hover:text-brand" onClick={logout}>Sign out</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <p className="text-xs text-mute">© {new Date().getFullYear()} Tyyari. Admin console.</p>
            <p className="text-xs text-mute">Same library. Same orange.</p>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

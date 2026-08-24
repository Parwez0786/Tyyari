import { Link, useLocation } from "react-router-dom";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function AuthShell({ children, title, subtitle, aside }) {
  const { pathname } = useLocation();
  const onLogin = pathname === "/login";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 bg-surface">
        <div className="flex w-full min-w-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <div className="flex shrink-0 items-center gap-2">
            {!onLogin && (
              <Link to="/login" className="hidden text-sm font-medium sm:inline">Sign in</Link>
            )}
            <ThemeToggle compact />
            <Link to="/register" className="btn-black !h-9 shrink-0 !px-3 !py-0 text-sm">
              Get started
            </Link>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-start justify-center gap-10 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="panel-auth w-full max-w-[440px]">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-2 text-[15px] text-mute">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
        {aside && (
          <aside className="hidden max-w-sm flex-1 pt-6 lg:block">
            {aside}
          </aside>
        )}
      </div>
    </div>
  );
}

import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function AuthLayout({ children, aside }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 bg-surface">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo to="/login" />
          <ThemeToggle compact />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-start justify-center gap-10 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <div className="panel-auth w-full max-w-[440px]">{children}</div>
        {aside && <aside className="hidden max-w-sm flex-1 pt-6 lg:block">{aside}</aside>}
      </div>
    </div>
  );
}

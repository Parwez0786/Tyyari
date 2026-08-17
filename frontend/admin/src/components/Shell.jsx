import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const nav = [
  { to: "/", label: "Questions", end: true },
  { to: "/questions/new", label: "New" },
  { to: "/catalog", label: "Catalog" },
  { to: "/users", label: "Users" },
];

export default function Shell() {
  const navigate = useNavigate();
  const clear = useAuthStore((s) => s.clear);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
          <Logo />
          <nav className="hidden flex-1 items-center justify-center gap-6 text-sm font-medium md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? "text-brand" : "text-ink hover:text-brand")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden rounded-full border border-line px-3 py-1.5 text-xs text-mute lg:inline">MODEL · Admin</span>
            <ThemeToggle />
            <button
              onClick={() => {
                clear();
                navigate("/login");
              }}
              className="btn-black !px-4 !py-1.5"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

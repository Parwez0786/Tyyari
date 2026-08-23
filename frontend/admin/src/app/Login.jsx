import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";
import { adminApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";

export default function Login() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [email, setEmail] = useState("admin@tyyari.dev");
  const [password, setPassword] = useState("Admin@12345");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await adminApi.login({ email, password });
      setTokens(res.data.accessToken, res.data.refreshToken);
      const me = await adminApi.me();
      if (me.data.role !== "ADMIN") {
        useAuthStore.getState().clear();
        setError("This console is for admin accounts only.");
        return;
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 bg-surface">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Logo to="/login" />
          <ThemeToggle compact />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-6xl flex-1 items-start justify-center gap-10 px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
        <form onSubmit={onSubmit} className="panel-auth w-full max-w-[440px]">
          <p className="font-hand text-2xl text-brand">Admin console</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-[32px]">Welcome back</h1>
          <p className="mt-2 text-[15px] text-mute">Sign in to publish questions, lock Premium, and manage users.</p>
          <label className="mt-8 block text-sm font-medium">
            Email
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tyyari.dev"
              autoComplete="username"
            />
          </label>
          <label className="mt-4 block text-sm font-medium">
            Password
            <span className="relative mt-1.5 block">
              <input
                className="field mt-0 pr-14"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-brand"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </span>
          </label>
          {error && <p className="mt-3 text-sm text-hard">{error}</p>}
          <button className="btn-black mt-6 w-full !py-3.5 text-[15px] font-semibold">Login</button>
        </form>
        <aside className="hidden max-w-sm flex-1 pt-6 lg:block">
          <blockquote className="font-hand text-3xl leading-snug text-ink">
            “Same library the candidate app reads. Publish a problem and it shows up on practice.”
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">A</span>
            <div>
              <p className="font-semibold">Admin console</p>
              <p className="text-sm text-mute">Publish · Premium · Users</p>
            </div>
          </div>
          <p className="mt-10 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-mute">
            Seeded login is <span className="font-semibold text-ink">admin@tyyari.dev</span>
          </p>
        </aside>
      </div>
    </div>
  );
}

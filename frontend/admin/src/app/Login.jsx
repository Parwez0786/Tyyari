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
        setError("Admin role required");
        return;
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Logo to="/login" />
          <ThemeToggle />
        </div>
      </header>
      <div className="flex flex-1 items-start justify-center px-6 pb-16 pt-4">
        <form onSubmit={onSubmit} className="panel w-full max-w-md">
          <p className="label-caps">Admin</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-mute">Sign in to manage questions, catalog, and users.</p>
          <label className="mt-8 block text-sm font-medium">
            Email
            <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="mt-3 block text-sm font-medium">
            Password
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <p className="mt-3 text-sm text-hard">{error}</p>}
          <button className="btn-black mt-6 w-full">Log in</button>
        </form>
      </div>
    </div>
  );
}

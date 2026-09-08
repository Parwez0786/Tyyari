import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AuthLayout from "../components/AuthLayout";
import { Mark } from "../components/Logo";
import SocialAuth from "../components/SocialAuth";
import { isStaffRole } from "../data/enums";
import { adminApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";

export default function Login() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [email, setEmail] = useState("admin@tyyari.dev");
  const [password, setPassword] = useState("Admin@12345");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState("");
  const [code, setCode] = useState("");

  async function enterConsole(data) {
    if (data?.requiresTotp && data?.totpChallenge) {
      setChallenge(data.totpChallenge);
      setCode("");
      setError("");
      return;
    }
    setTokens(data?.accessToken, data?.refreshToken);
    const me = await adminApi.me();
    queryClient.setQueryData(["me"], me);
    if (!isStaffRole(me?.data?.role)) {
      queryClient.clear();
      useAuthStore.getState().clear();
      setChallenge("");
      setError("This console is for admin and editor accounts.");
      return;
    }
    navigate("/");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      if (challenge) {
        const res = await adminApi.verifyTotp({ challenge, code });
        await enterConsole(res?.data);
        return;
      }
      const res = await adminApi.login({ email, password, staffConsole: true });
      await enterConsole(res?.data);
    } catch (err) {
      setError(err?.message);
    }
  }

  async function onGoogle(idToken) {
    setError("");
    try {
      const res = await adminApi.google({ idToken, staffConsole: true });
      await enterConsole(res?.data);
    } catch (err) {
      setError(err?.message);
    }
  }

  return (
    <AuthLayout
      aside={(
        <>
          <blockquote className="font-hand text-3xl leading-snug text-ink">
            “Same library the candidate app reads. Publish a problem and it shows up on practice.”
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <Mark className="h-11 w-11" />
            <div>
              <p className="font-semibold">Admin console</p>
              <p className="text-sm text-mute">Publish · Premium · Users</p>
            </div>
          </div>
          <p className="mt-10 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-mute">
            Seeded login is <span className="font-semibold text-ink">admin@tyyari.dev</span>
          </p>
        </>
      )}
    >
      <p className="font-hand text-2xl text-brand">Admin console</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-[32px]">Welcome back</h1>
      <p className="mt-2 text-[15px] text-mute">
        {challenge
          ? "Enter the 6-digit code from your authenticator app."
          : "Sign in to publish questions, lock Premium, and manage users."}
      </p>
      {challenge ? (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium">
            Authenticator code
            <input
              className="field tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              required
            />
          </label>
          {error && <p className="text-sm text-hard">{error}</p>}
          <button className="btn-black w-full !py-3.5 text-[15px] font-semibold">Verify</button>
          <button type="button" className="w-full text-sm font-medium text-brand" onClick={() => { setChallenge(""); setCode(""); setError(""); }}>
            Back to sign in
          </button>
        </form>
      ) : (
        <>
          <div className="mt-8">
            <SocialAuth onGoogle={onGoogle} />
          </div>
          <div className="my-6 flex items-center gap-3 text-xs text-mute">
            <span className="h-px flex-1 bg-line" /> or continue with email <span className="h-px flex-1 bg-line" />
          </div>
          <form onSubmit={onSubmit}>
            <label className="block text-sm font-medium">
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
            <div className="mt-3 text-right text-sm">
              <Link to="/forgot-password" className="font-medium text-brand">Forgot password?</Link>
            </div>
            {error && <p className="mt-3 text-sm text-hard">{error}</p>}
            <button className="btn-black mt-6 w-full !py-3.5 text-[15px] font-semibold">Login</button>
          </form>
        </>
      )}
    </AuthLayout>
  );
}

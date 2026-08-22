import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import SocialAuth from "../components/SocialAuth";
import { authApi, userApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { isValidEmail } from "../utils/email";

export default function Login() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [email, setEmail] = useState("demo@tyyari.dev");
  const [password, setPassword] = useState("Demo@12345");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function finish(tokens) {
    setTokens(tokens.accessToken, tokens.refreshToken, remember);
    const profile = await userApi.profile();
    navigate(profile.data?.onboarded ? "/dashboard" : "/onboarding");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setNotice("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    try {
      const res = await authApi.login({ email, password });
      await finish(res.data);
    } catch (err) {
      setError(err.message);
      if (err.code === "AUTH_EMAIL_UNVERIFIED") {
        setNotice("Need a new link? Use Resend verification below.");
      }
    }
  }

  const onGoogle = useCallback(async (idToken) => {
    setError("");
    try {
      const res = await authApi.google({ idToken });
      await finish(res.data);
    } catch (err) {
      setError(err.message);
    }
  }, [remember]);

  async function emailLink() {
    setError("");
    setNotice("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    try {
      await authApi.forgotPassword({ email });
      setNotice("If that email exists, we sent a link to continue.");
    } catch (err) {
      setError(err.message);
    }
  }

  async function resendVerification() {
    setError("");
    setNotice("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    try {
      await authApi.resendVerification({ email });
      setNotice("If that email exists, we sent a verification message.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to Tyyari."
      aside={<LoginAside />}
    >
      <SocialAuth onGoogle={onGoogle} />
      <div className="my-6 flex items-center gap-3 text-xs text-mute">
        <span className="h-px flex-1 bg-line" /> or continue with email <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm font-medium">
          Email
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@company.com" />
        </label>
        <label className="block text-sm font-medium">
          Password
          <span className="relative mt-1.5 block">
            <input
              className="field mt-0 pr-14"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-mute">
            <input type="checkbox" className="h-4 w-4 accent-brand" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-brand">Forgot password?</Link>
        </div>
        {error && <p className="text-sm text-hard">{error}</p>}
        {notice && <p className="text-sm text-easy">{notice}</p>}
        <button className="btn-black mt-2 w-full !py-3.5 text-[15px] font-semibold">Login</button>
      </form>
      <button type="button" onClick={emailLink} className="mt-4 w-full text-center text-sm font-medium text-brand">
        Email me a sign-in link
      </button>
      <p className="mt-8 text-center text-sm text-mute">
        Need a verification email?{" "}
        <button type="button" onClick={resendVerification} className="font-medium text-brand">Resend verification</button>
      </p>
      <p className="mt-3 text-center text-sm text-mute">
        Don&apos;t have an account? <Link to="/register" className="font-medium text-brand">Register</Link>
      </p>
      <p className="mt-6 text-center text-xs text-mute">
        By signing in you agree to our{" "}
        <Link to="/terms" className="font-medium text-ink hover:text-brand">Terms</Link>
        {" "}and{" "}
        <Link to="/privacy" className="font-medium text-ink hover:text-brand">Privacy</Link>.
      </p>
    </AuthShell>
  );
}

function LoginAside() {
  return (
    <div>
      <blockquote className="font-hand text-3xl leading-snug text-ink">
        “The HLD sheet plus a timed OA was the closest I’ve felt to the real SDE loop.”
      </blockquote>
      <div className="mt-6 flex items-center gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">A</span>
        <div>
          <p className="font-semibold">Aisha Khan</p>
          <p className="text-sm text-mute">SDE II · preparing with Tyyari</p>
        </div>
      </div>
      <p className="mt-10 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-mute">
        <span className="font-semibold text-ink">Rohan Mehta</span> opened the LLD sheet · 2 mins ago
      </p>
    </div>
  );
}

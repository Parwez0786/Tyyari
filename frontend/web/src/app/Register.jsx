import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import SocialAuth from "../components/SocialAuth";
import { authApi, userApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { isValidEmail } from "../utils/email";

export default function Register() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  async function finish(tokens) {
    setTokens(tokens.accessToken, tokens.refreshToken, true);
    await userApi.profile().catch(() => null);
    navigate("/onboarding");
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setError("Enter a valid email address, like name@gmail.com");
      return;
    }
    try {
      await authApi.register({ name, email: trimmedEmail, password });
      navigate(`/check-email?email=${encodeURIComponent(trimmedEmail)}`);
    } catch (err) {
      setError(err.message);
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
  }, []);

  return (
    <AuthShell title="Create your account" subtitle="Start practicing interviews in a few seconds.">
      <SocialAuth onGoogle={onGoogle} />
      <div className="my-6 flex items-center gap-3 text-xs text-mute">
        <span className="h-px flex-1 bg-line" /> or continue with email <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm font-medium">
          Name
          <input className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="How the dashboard should greet you" required />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={254} placeholder="you@company.com" required />
        </label>
        <label className="block text-sm font-medium">
          Password
          <span className="relative mt-1.5 block">
            <input
              className="field mt-0 pr-14"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
              required
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-brand" onClick={() => setShowPassword((v) => !v)}>
              {showPassword ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        {error && <p className="text-sm text-hard">{error}</p>}
        <button className="btn-black mt-2 w-full !py-3.5 text-[15px] font-semibold">Get started</button>
      </form>
      <p className="mt-6 text-center text-xs leading-5 text-mute">
        Creating an account means you accept the{" "}
        <Link to="/terms" className="font-medium text-ink hover:text-brand">Terms</Link>
        {" "}and{" "}
        <Link to="/privacy" className="font-medium text-ink hover:text-brand">Privacy</Link>
        {" "}notice. We will email a verification link before you can sign in.
      </p>
      <p className="mt-6 text-center text-sm text-mute">
        Already have an account? <Link to="/login" className="font-medium text-brand">Sign in</Link>
      </p>
    </AuthShell>
  );
}

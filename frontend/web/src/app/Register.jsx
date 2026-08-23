import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import SocialAuth from "../components/SocialAuth";
import { useRegister } from "../hooks/useRegister";

export default function Register() {
  const r = useRegister();

  return (
    <AuthShell title="Create your account" subtitle="Start practicing interviews in a few seconds.">
      <SocialAuth onGoogle={r.onGoogle} />
      <div className="my-6 flex items-center gap-3 text-xs text-mute">
        <span className="h-px flex-1 bg-line" /> or continue with email <span className="h-px flex-1 bg-line" />
      </div>
      <form onSubmit={r.onSubmit} className="space-y-4">
        <label className="block text-sm font-medium">
          Name
          <input className="field" value={r.name} onChange={(e) => r.setName(e.target.value)} placeholder="How the dashboard should greet you" required />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input className="field" type="email" value={r.email} onChange={(e) => r.setEmail(e.target.value)} autoComplete="email" maxLength={254} placeholder="you@company.com" required />
        </label>
        <label className="block text-sm font-medium">
          Password
          <span className="relative mt-1.5 block">
            <input
              className="field mt-0 pr-14"
              type={r.showPassword ? "text" : "password"}
              value={r.password}
              onChange={(e) => r.setPassword(e.target.value)}
              placeholder="8+ characters"
              required
            />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-brand" onClick={() => r.setShowPassword((v) => !v)}>
              {r.showPassword ? "Hide" : "Show"}
            </button>
          </span>
        </label>
        {r.error && <p className="text-sm text-hard">{r.error}</p>}
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

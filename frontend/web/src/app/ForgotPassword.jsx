import { useState } from "react";
import { Link } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { authApi } from "../services/api";
import { isValidEmail } from "../utils/email";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthShell title="Forgot password" subtitle="We’ll email you a link to choose a new one.">
      {sent ? (
        <div className="rounded-card border border-line p-5 text-sm">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-2 text-mute">
            If an account exists for that address, we sent a reset link to your inbox. Check spam if you don’t see it.
          </p>
          <Link to="/login" className="mt-4 inline-block text-brand">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-medium">
            Email
            <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="The email on your Tyyari account" required />
            <span className="mt-1.5 block text-xs font-normal text-mute">We only send a link if that inbox is registered.</span>
          </label>
          {error && <p className="text-sm text-hard">{error}</p>}
          <button className="btn-purple w-full">Send reset link</button>
        </form>
      )}
    </AuthShell>
  );
}

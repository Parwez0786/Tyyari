import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { adminApi } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    try {
      await adminApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err?.message);
    }
  }

  return (
    <AuthLayout>
      <p className="font-hand text-2xl text-brand">Account</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Forgot password</h1>
      <p className="mt-2 text-[15px] text-mute">We’ll email a link to choose a new password for this console.</p>
      {sent ? (
        <div className="mt-8 rounded-2xl border border-line bg-surface p-5 text-sm">
          <p className="font-medium">Check your inbox</p>
          <p className="mt-2 text-mute">
            If an account exists for that address, we sent a reset link. Check spam if you don’t see it.
          </p>
          <Link to="/login" className="mt-4 inline-block font-medium text-brand">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              className="field"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tyyari.dev"
              autoComplete="username"
              required
            />
          </label>
          {error && <p className="text-sm text-hard">{error}</p>}
          <button className="btn-black w-full !py-3.5 text-[15px] font-semibold">Send reset link</button>
        </form>
      )}
      <p className="mt-6 text-center text-sm text-mute">
        <Link to="/login" className="font-medium text-brand">Back to login</Link>
      </p>
    </AuthLayout>
  );
}

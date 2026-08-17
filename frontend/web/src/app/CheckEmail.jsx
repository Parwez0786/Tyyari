import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { authApi } from "../services/api";
import { isValidEmail } from "../utils/email";

export default function CheckEmail() {
  const [params] = useSearchParams();
  const email = (params.get("email") || "").trim();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function resend() {
    setError("");
    setNotice("");
    if (!isValidEmail(email)) {
      setError("That email address is not valid.");
      return;
    }
    setSending(true);
    try {
      await authApi.resendVerification({ email });
      setNotice("If that inbox exists, we sent another verification link.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthShell title="Check your email" subtitle="Confirm your address to finish creating your account.">
      <div className="rounded-card border border-line p-5 text-sm">
        <p className="font-medium">We sent a verification link{email ? ` to ${email}` : ""}.</p>
        <p className="mt-2 text-mute">Open the email and tap Verify my email. Check spam if you do not see it.</p>
        {error && <p className="mt-3 text-hard">{error}</p>}
        {notice && <p className="mt-3 text-easy">{notice}</p>}
        <button type="button" className="btn-ghost mt-4 w-full" onClick={resend} disabled={sending}>
          {sending ? "Sending…" : "Resend verification email"}
        </button>
        <Link to="/login" className="mt-4 inline-block font-medium text-brand">Back to login</Link>
      </div>
    </AuthShell>
  );
}

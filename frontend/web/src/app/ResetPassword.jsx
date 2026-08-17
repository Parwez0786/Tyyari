import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { authApi } from "../services/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    try {
      await authApi.resetPassword({ token, password });
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 8 characters.">
      {!token ? (
        <p className="text-sm text-hard">This reset link is missing a token. Request a new one from <Link to="/forgot-password" className="text-brand">forgot password</Link>.</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-sm font-medium">
            New password
            <input className="field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
          </label>
          <label className="block text-sm font-medium">
            Confirm password
            <input className="field" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} required />
          </label>
          {error && <p className="text-sm text-hard">{error}</p>}
          <button className="btn-black w-full">Update password</button>
        </form>
      )}
    </AuthShell>
  );
}

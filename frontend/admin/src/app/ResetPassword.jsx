import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { adminApi } from "../services/api";

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
      await adminApi.resetPassword({ token, password });
      navigate("/login");
    } catch (err) {
      setError(err?.message);
    }
  }

  return (
    <AuthLayout>
      <p className="font-hand text-2xl text-brand">Account</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Choose a new password</h1>
      <p className="mt-2 text-[15px] text-mute">Use at least 8 characters, then sign in to the console.</p>
      {!token ? (
        <p className="mt-8 text-sm text-hard">
          This reset link is missing a token. Request a new one from{" "}
          <Link to="/forgot-password" className="text-brand">forgot password</Link>.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium">
            New password
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              placeholder="At least 8 characters"
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Confirm password
            <input
              className="field"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              minLength={8}
              placeholder="Type it again"
              required
            />
          </label>
          {error && <p className="text-sm text-hard">{error}</p>}
          <button className="btn-black w-full !py-3.5 text-[15px] font-semibold">Update password</button>
        </form>
      )}
    </AuthLayout>
  );
}

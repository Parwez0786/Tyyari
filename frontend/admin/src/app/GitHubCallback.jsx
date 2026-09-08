import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import AuthLayout from "../components/AuthLayout";
import Loader from "../components/Loader";
import { isStaffRole } from "../data/enums";
import { adminApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";

let githubLogin;

export default function GitHubCallback() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const code = params.get("code");
  const oauthError = params.get("error");

  async function enterConsole(data) {
    if (data?.requiresTotp && data?.totpChallenge) {
      setChallenge(data.totpChallenge);
      return;
    }
    setTokens(data?.accessToken, data?.refreshToken);
    const me = await adminApi.me();
    queryClient.setQueryData(["me"], me);
    if (!isStaffRole(me?.data?.role)) {
      queryClient.clear();
      useAuthStore.getState().clear();
      throw new Error("This console is for admin and editor accounts.");
    }
    navigate("/");
  }

  useEffect(() => {
    if (oauthError) {
      setError("GitHub sign-in was cancelled.");
      return;
    }
    if (!code) {
      setError("Missing GitHub authorization code.");
      return;
    }
    if (!githubLogin) {
      githubLogin = adminApi.github({
        code,
        redirectUri: `${window.location.origin}/auth/github`,
        staffConsole: true,
      });
    }
    let alive = true;
    githubLogin
      .then(async (res) => {
        if (!alive) return;
        await enterConsole(res?.data);
      })
      .catch((err) => {
        githubLogin = null;
        if (alive) setError(err?.message);
      });
    return () => {
      alive = false;
    };
  }, [code, oauthError, navigate, setTokens, queryClient]);

  async function verifyTotp(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await adminApi.verifyTotp({ challenge, code: codeInput });
      await enterConsole(res?.data);
    } catch (err) {
      setError(err?.message);
    }
  }

  if (challenge) {
    return (
      <AuthLayout>
        <p className="font-hand text-2xl text-brand">Admin console</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Authenticator code</h1>
        <p className="mt-2 text-[15px] text-mute">Enter the 6-digit code from your authenticator app.</p>
        <form onSubmit={verifyTotp} className="mt-8 space-y-4">
          <input
            className="field tracking-[0.3em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            required
          />
          {error && <p className="text-sm text-hard">{error}</p>}
          <button className="btn-black w-full !py-3.5 text-[15px] font-semibold">Verify</button>
        </form>
      </AuthLayout>
    );
  }

  if (!error) return <Loader screen />;

  return (
    <AuthLayout>
      <p className="font-hand text-2xl text-brand">Admin console</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Signing you in</h1>
      <p className="mt-2 text-sm text-hard">{error}</p>
      <Link to="/login" className="mt-4 inline-block text-sm font-medium text-brand">Back to login</Link>
    </AuthLayout>
  );
}

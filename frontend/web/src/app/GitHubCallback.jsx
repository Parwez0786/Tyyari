import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Loader from "../components/Loader";
import { authApi, userApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { queryClient } from "../queryClient";

let githubLogin;

export default function GitHubCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [error, setError] = useState("");
  const [challenge, setChallenge] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const code = params.get("code");
  const oauthError = params.get("error");

  async function finishLogin(data) {
    if (data?.requiresTotp && data?.totpChallenge) {
      setChallenge(data.totpChallenge);
      return;
    }
    setTokens(data?.accessToken, data?.refreshToken);
    const profile = await userApi.profile().catch(() => null);
    if (profile) queryClient.setQueryData(["profile"], profile);
    navigate(profile?.data?.onboarded ? "/dashboard" : "/onboarding");
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
      githubLogin = authApi.github({ code, redirectUri: `${window.location.origin}/auth/github` });
    }
    let alive = true;
    githubLogin
      .then(async (res) => {
        if (!alive) return;
        await finishLogin(res?.data);
      })
      .catch((err) => {
        githubLogin = null;
        if (alive) setError(err?.message);
      });
    return () => {
      alive = false;
    };
  }, [code, oauthError, navigate, setTokens]);

  async function verifyTotp(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await authApi.verifyTotp({ challenge, code: totpCode });
      await finishLogin(res?.data);
    } catch (err) {
      setError(err?.message);
    }
  }

  if (challenge) {
    return (
      <AuthShell title="Authenticator code" subtitle="Enter the 6-digit code from your authenticator app.">
        <form onSubmit={verifyTotp} className="space-y-3">
          <input
            className="field tracking-[0.3em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            required
          />
          {error && <p className="text-sm text-hard">{error}</p>}
          <button className="btn-black w-full">Verify</button>
        </form>
      </AuthShell>
    );
  }

  if (!error) return <Loader screen />;

  return (
    <AuthShell title="Signing you in" subtitle="GitHub sign-in did not finish.">
      <p className="text-sm text-hard">{error}</p>
      <Link to="/login" className="mt-4 inline-block text-sm font-medium text-brand">Back to login</Link>
    </AuthShell>
  );
}

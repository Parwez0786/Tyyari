import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import { authApi, userApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";

let githubLogin;

export default function GitHubCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const setTokens = useAuthStore((s) => s.setTokens);
  const [error, setError] = useState("");
  const code = params.get("code");
  const oauthError = params.get("error");

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
        setTokens(res.data.accessToken, res.data.refreshToken);
        const profile = await userApi.profile().catch(() => null);
        if (!alive) return;
        navigate(profile?.data?.onboarded ? "/dashboard" : "/onboarding");
      })
      .catch((err) => {
        githubLogin = null;
        if (alive) setError(err.message);
      });
    return () => {
      alive = false;
    };
  }, [code, oauthError, navigate, setTokens]);

  return (
    <AuthShell title="Signing you in" subtitle="Finishing GitHub sign-in…">
      {error ? (
        <div>
          <p className="text-sm text-hard">{error}</p>
          <Link to="/login" className="mt-4 inline-block text-sm font-medium text-brand">Back to login</Link>
        </div>
      ) : (
        <p className="text-sm text-mute">Please wait a moment.</p>
      )}
    </AuthShell>
  );
}

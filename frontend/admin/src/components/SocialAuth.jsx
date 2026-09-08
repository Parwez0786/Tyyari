import { useAuthPublicConfig } from "../hooks/useAuthPublicConfig";
import GoogleButton from "./GoogleButton";

export default function SocialAuth({ onGoogle }) {
  const configQuery = useAuthPublicConfig();
  const config = configQuery.data?.data;

  function startGitHub() {
    if (!config?.githubClientId) return;
    const params = new URLSearchParams({
      client_id: config.githubClientId,
      redirect_uri: `${window.location.origin}/auth/github`,
      scope: "read:user user:email",
    });
    window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  return (
    <div className="space-y-3">
      <GoogleButton onCredential={onGoogle} />
      {config?.githubEnabled && (
        <button type="button" onClick={startGitHub} className="btn-social">
          <GitHubMark />
          Continue with GitHub
        </button>
      )}
    </div>
  );
}

function GitHubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6a4.6 4.6 0 0 1 1.2-3.2 4.3 4.3 0 0 1 .1-3.1s1-.3 3.3 1.2a11.3 11.3 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.1a4.6 4.6 0 0 1 1.2 3.2c0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z"
      />
    </svg>
  );
}

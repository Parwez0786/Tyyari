import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Loader from "../components/Loader";
import { authApi } from "../services/api";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState(token ? "pending" : "missing");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    authApi.verifyEmail({ token })
      .then(() => {
        if (!cancelled) setStatus("ok");
      })
      .catch((err) => {
        if (!cancelled) {
          setStatus("error");
          setError(err?.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (status === "pending") return <Loader screen />;

  return (
    <AuthShell
      title={status === "ok" ? "Email verified" : "Verify your email"}
      subtitle={status === "ok" ? "Your inbox is confirmed. You can sign in now." : "Confirming the link from your inbox."}
    >
      {status === "missing" && (
        <p className="text-sm text-hard">
          This link is missing a token. Request a new one from <Link to="/login" className="text-brand">login</Link>.
        </p>
      )}
      {status === "error" && <p className="text-sm text-hard">{error || "This verification link is invalid or expired."}</p>}
      {status === "ok" && (
        <Link to="/login" className="btn-black mt-2 inline-flex w-full">Continue to login</Link>
      )}
      {status !== "ok" && status !== "pending" && (
        <Link to="/login" className="mt-4 inline-block text-sm font-medium text-brand">Back to login</Link>
      )}
    </AuthShell>
  );
}

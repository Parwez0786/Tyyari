import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { useAuthStore } from "../stores/authStore";
import { queryClient } from "../queryClient";

export default function Forbidden() {
  const token = useAuthStore((s) => s.accessToken);

  function signOut() {
    useAuthStore.getState().clear();
    queryClient.clear();
  }

  return (
    <AuthLayout>
      <p className="font-hand text-2xl text-brand">No access</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight">You don’t have access</h1>
      <p className="mt-2 text-[15px] text-mute">
        This page is limited to admin accounts. Editors can work on the catalog, but not users, billing, mail, or audit.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {token ? (
          <>
            <Link to="/" className="btn-brand">Back to dashboard</Link>
            <button type="button" className="btn-ghost" onClick={signOut}>Sign out</button>
          </>
        ) : (
          <Link to="/login" className="btn-brand">Sign in</Link>
        )}
      </div>
    </AuthLayout>
  );
}

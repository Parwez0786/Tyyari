import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import AvatarPicker from "../components/AvatarPicker";
import Loader from "../components/Loader";
import PageHero from "../components/PageHero";
import { adminApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";

export default function Account() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: adminApi.me });
  const profileQuery = useQuery({ queryKey: ["admin-self-profile"], queryFn: adminApi.profile });
  const me = meQuery.data?.data;
  const profile = profileQuery.data?.data;
  const [name, setName] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [totpSetup, setTotpSetup] = useState(null);
  const [totpCode, setTotpCode] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");

  useEffect(() => {
    if (hydrated || !profileQuery.isSuccess) return;
    setName(profileQuery.data?.data?.name || "");
    setGithubUrl(profileQuery.data?.data?.githubUrl || "");
    setLinkedinUrl(profileQuery.data?.data?.linkedinUrl || "");
    setHydrated(true);
  }, [hydrated, profileQuery.isSuccess, profileQuery.data]);

  if (meQuery.isLoading || profileQuery.isLoading) return <Loader fill />;

  async function saveName(e) {
    e.preventDefault();
    setBusy("name");
    setError("");
    setNote("");
    try {
      await adminApi.updateProfile({
        name: name.trim() || undefined,
        githubUrl: githubUrl.trim(),
        linkedinUrl: linkedinUrl.trim(),
      });
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-self-profile"] }),
        client.invalidateQueries({ queryKey: ["admin-directory"] }),
      ]);
      setNote("Display name saved.");
    } catch (err) {
      setError(err?.message || "Could not save your name.");
    } finally {
      setBusy("");
    }
  }

  async function uploadPhoto(file) {
    setBusy("photo");
    setError("");
    setNote("");
    try {
      await adminApi.uploadAvatar(file);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-self-profile"] }),
        client.invalidateQueries({ queryKey: ["admin-directory"] }),
      ]);
      setNote("Photo saved.");
    } catch (err) {
      setError(err?.message || "Could not save that photo.");
    } finally {
      setBusy("");
    }
  }

  async function removePhoto() {
    setBusy("photo");
    setError("");
    setNote("");
    try {
      await adminApi.deleteAvatar();
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-self-profile"] }),
        client.invalidateQueries({ queryKey: ["admin-directory"] }),
      ]);
      setNote("Photo removed.");
    } catch (err) {
      setError(err?.message || "Could not remove that photo.");
    } finally {
      setBusy("");
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setBusy("password");
    setError("");
    setNote("");
    try {
      await adminApi.changePassword({ currentPassword, newPassword });
      useAuthStore.getState().clear();
      client.clear();
      navigate("/login");
    } catch (err) {
      setError(err?.message || "Could not change password.");
    } finally {
      setBusy("");
    }
  }

  async function startTotp() {
    setBusy("totp");
    setError("");
    setNote("");
    try {
      const json = await adminApi.setupTotp();
      setTotpSetup(json?.data);
      setTotpCode("");
    } catch (err) {
      setError(err?.message || "Could not start two-factor setup.");
    } finally {
      setBusy("");
    }
  }

  async function enableTotp(e) {
    e.preventDefault();
    setBusy("totp");
    setError("");
    setNote("");
    try {
      await adminApi.enableTotp({ code: totpCode });
      await client.invalidateQueries({ queryKey: ["me"] });
      setTotpSetup(null);
      setTotpCode("");
      setNote("Two-factor authentication is on. You will need a code at the next sign-in.");
    } catch (err) {
      setError(err?.message || "Could not enable two-factor.");
    } finally {
      setBusy("");
    }
  }

  async function disableTotp(e) {
    e.preventDefault();
    setBusy("totp");
    setError("");
    setNote("");
    try {
      await adminApi.disableTotp({ password: disablePassword, code: disableCode });
      await client.invalidateQueries({ queryKey: ["me"] });
      setDisablePassword("");
      setDisableCode("");
      setNote("Two-factor authentication is off.");
    } catch (err) {
      setError(err?.message || "Could not disable two-factor.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Access"
        title="Your account"
        detail="Photo, display name, password, and two-factor for this console."
      />
      {error && <p className="text-sm text-hard">{error}</p>}
      {note && <p className="text-sm text-brand">{note}</p>}

      <article className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Photo</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">How you show up</h2>
        <p className="mt-1 text-sm text-mute">{me?.email}</p>
        <div className="mt-5">
          <AvatarPicker
            name={name || profile?.name}
            email={me?.email}
            src={profile?.avatar}
            size="lg"
            square
            busy={busy === "photo"}
            onChange={uploadPhoto}
            onRemove={removePhoto}
            onError={(err) => setError(err?.message || "Could not read that photo.")}
          />
        </div>
      </article>

      <form onSubmit={saveName} className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Identity</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Display name and links</h2>
        <label className="mt-5 block max-w-md">
          <span className="text-xs font-semibold uppercase tracking-wide text-mute">Name</span>
          <input
            className="field mt-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tyyari Admin"
            autoComplete="name"
          />
        </label>
        <div className="mt-4 grid max-w-2xl gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-mute">GitHub</span>
            <input
              className="field mt-2"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/you"
              autoComplete="url"
              inputMode="url"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-mute">LinkedIn</span>
            <input
              className="field mt-2"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://www.linkedin.com/in/you"
              autoComplete="url"
              inputMode="url"
            />
          </label>
        </div>
        {error && <p className="mt-4 text-sm text-hard">{error}</p>}
        {note && <p className="mt-4 text-sm text-brand">{note}</p>}
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-brand" disabled={Boolean(busy)}>
            {busy === "name" ? "Saving…" : "Save"}
          </button>
          <Link to="/" className="btn-ghost">Back to dashboard</Link>
        </div>
      </form>

      <form onSubmit={changePassword} className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Password</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Change password</h2>
        <p className="mt-1 text-sm text-mute">
          If you only signed in with Google or GitHub, leave the current password empty to set one. Changing it signs you out everywhere.
        </p>
        <label className="mt-5 block max-w-md">
          <span className="text-xs font-semibold uppercase tracking-wide text-mute">Current password</span>
          <input
            className="field mt-2"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
          />
        </label>
        <div className="mt-4 grid max-w-2xl gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-mute">New password</span>
            <input
              className="field mt-2"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wide text-mute">Confirm</span>
            <input
              className="field mt-2"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
          </label>
        </div>
        <button className="btn-brand mt-5" disabled={Boolean(busy)}>
          {busy === "password" ? "Updating…" : "Update password"}
        </button>
      </form>

      <article className="rounded-[28px] border border-line bg-card p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand">Two-factor</p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight">Authenticator app</h2>
        <p className="mt-1 text-sm text-mute">
          {me?.totpEnabled
            ? "Login asks for a 6-digit code after your password or Google / GitHub."
            : "Optional. Scan the QR code in Google Authenticator, 1Password, or Authy."}
        </p>
        {me?.totpEnabled ? (
          <form onSubmit={disableTotp} className="mt-5 max-w-md space-y-3">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-mute">Password</span>
              <input
                className="field mt-2"
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
                autoComplete="current-password"
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wide text-mute">Or authenticator code</span>
              <input
                className="field mt-2 tracking-[0.3em]"
                inputMode="numeric"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
              />
            </label>
            <button className="btn-ghost !text-hard" disabled={Boolean(busy)}>
              {busy === "totp" ? "Turning off…" : "Turn off 2FA"}
            </button>
          </form>
        ) : totpSetup ? (
          <form onSubmit={enableTotp} className="mt-5 space-y-4">
            {totpSetup.otpauthUrl && (
              <img
                alt="Authenticator QR code"
                className="h-44 w-44 rounded-2xl border border-line bg-white p-2"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpSetup.otpauthUrl)}`}
              />
            )}
            <p className="text-xs text-mute">
              Secret: <code className="rounded-lg bg-field px-2 py-1">{totpSetup.secret}</code>
            </p>
            <label className="block max-w-xs">
              <span className="text-xs font-semibold uppercase tracking-wide text-mute">Code from the app</span>
              <input
                className="field mt-2 tracking-[0.3em]"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                required
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button className="btn-brand" disabled={Boolean(busy)}>
                {busy === "totp" ? "Enabling…" : "Enable 2FA"}
              </button>
              <button type="button" className="btn-ghost" onClick={() => setTotpSetup(null)}>Cancel</button>
            </div>
          </form>
        ) : (
          <button type="button" className="btn-brand mt-5" disabled={Boolean(busy)} onClick={startTotp}>
            {busy === "totp" ? "Starting…" : "Set up 2FA"}
          </button>
        )}
      </article>
    </div>
  );
}

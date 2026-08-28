import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import AvatarPicker from "../components/AvatarPicker";
import Loader from "../components/Loader";
import PageHero from "../components/PageHero";
import { adminApi } from "../services/api";

export default function Account() {
  const client = useQueryClient();
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

  return (
    <div className="space-y-6">
      <PageHero
        kicker="Access"
        title="Your account"
        detail="Photo, display name, and optional GitHub or LinkedIn. Candidates set theirs on Edit profile."
      />

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
    </div>
  );
}

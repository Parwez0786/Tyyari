import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useDialog } from "../components/Dialog";
import { typeLabel } from "../data/labels";
import { roleMeta } from "../data/profile";
import { adminApi } from "../services/api";

const TYPE_COLORS = {
  DSA: "#34d399",
  HLD: "#f97316",
  LLD: "#38bdf8",
  FRONTEND: "#e879f9",
  CS: "#a3e635",
  OA: "#60a5fa",
};

export function useAdminUserProfile(id) {
  const navigate = useNavigate();
  const client = useQueryClient();
  const dialog = useDialog();
  const accountQuery = useQuery({ queryKey: ["admin-user", id], queryFn: () => adminApi.user(id) });
  const profileQuery = useQuery({ queryKey: ["admin-user-profile", id], queryFn: () => adminApi.userProfile(id) });
  const paymentsQuery = useQuery({ queryKey: ["admin-payments", id], queryFn: () => adminApi.payments({ userId: id }) });
  const submissionsQuery = useQuery({ queryKey: ["admin-submissions", id], queryFn: () => adminApi.userSubmissions(id) });
  const [until, setUntil] = useState("");
  const [busy, setBusy] = useState("");
  const [supportNote, setSupportNote] = useState(null);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [fileIndex, setFileIndex] = useState(0);

  const account = accountQuery.data?.data;
  const bundle = profileQuery.data?.data;
  const profile = bundle?.profile || {};
  const goals = bundle?.goals || {};
  const prefs = bundle?.preferences || {};
  const progress = bundle?.progress || {};
  const name = profile.name || account?.email || "Candidate";
  const rows = submissionsQuery.data?.data ?? [];
  const activeId = selectedId || rows[0]?.id || "";
  const detailQuery = useQuery({
    queryKey: ["admin-submission", id, activeId],
    queryFn: () => adminApi.userSubmission(id, activeId),
    enabled: Boolean(activeId),
  });

  useEffect(() => {
    setUntil(toLocalInput(account?.premiumUntil));
  }, [account?.premiumUntil]);

  useEffect(() => {
    setFileIndex(0);
  }, [activeId]);

  function locked() {
    return !account || account.role === "ADMIN" || account.status === "DELETING";
  }

  async function refreshAccount() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["admin-user", id] }),
      client.invalidateQueries({ queryKey: ["admin-users"] }),
    ]);
  }

  async function setRole(role) {
    if (locked() || account.role === role) return;
    setBusy("role");
    try {
      await adminApi.setUserRole(account.id, role);
      await refreshAccount();
    } catch (err) {
      await dialog.alert(err.message || "Could not update role.");
    } finally {
      setBusy("");
    }
  }

  async function toggleStatus() {
    if (locked()) return;
    const next = account.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    await adminApi.setUserStatus(account.id, next);
    await refreshAccount();
  }

  async function support(kind) {
    if (locked()) return;
    setBusy(kind);
    setSupportNote(null);
    try {
      const json = kind === "reset"
        ? await adminApi.resetPassword(account.id)
        : await adminApi.resendVerification(account.id);
      setSupportNote(json.data);
      await client.invalidateQueries({ queryKey: ["admin-user", id] });
    } catch (err) {
      await dialog.alert(err.message || "Could not send the email.");
    } finally {
      setBusy("");
    }
  }

  async function revokeSessions() {
    if (locked()) return;
    if (!await dialog.confirm("Sign this person out on every device? They will need to log in again.", {
      title: "Sign out everywhere",
      confirmLabel: "Sign out",
    })) return;
    setBusy("revoke");
    setSupportNote(null);
    try {
      await adminApi.revokeSessions(account.id);
      setSupportNote({ message: "All refresh tokens were revoked. They must sign in again." });
    } catch (err) {
      await dialog.alert(err.message || "Could not revoke sessions.");
    } finally {
      setBusy("");
    }
  }

  async function forceVerify() {
    if (locked() || account.emailVerified) return;
    if (!await dialog.confirm("Mark this email verified? They can sign in without clicking the mail link.", {
      title: "Mark email verified",
      confirmLabel: "Verify",
      tone: "warning",
    })) return;
    setBusy("force-verify");
    setSupportNote(null);
    try {
      await adminApi.forceVerify(account.id);
      setSupportNote({ message: "Email marked verified. They can sign in now." });
      await refreshAccount();
    } catch (err) {
      await dialog.alert(err.message || "Could not verify this inbox.");
    } finally {
      setBusy("");
    }
  }

  async function deleteAccount() {
    if (!account || account.role === "ADMIN") return;
    if (deleteEmail.trim().toLowerCase() !== String(account.email || "").toLowerCase()) {
      await dialog.alert("Type the account email to confirm delete.", { title: "Confirm the email" });
      return;
    }
    if (!await dialog.confirm("Queue a wipe of this login, profile, submissions, and payment rows? This cannot be undone.", {
      title: "Delete account",
      confirmLabel: "Delete",
    })) return;
    setBusy("delete");
    setSupportNote(null);
    try {
      const json = await adminApi.deleteAccount(account.id);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-users"] }),
        client.invalidateQueries({ queryKey: ["admin-audit"] }),
      ]);
      await dialog.alert(json.message || "Deletion queued. They are signed out.", {
        title: "Deletion queued",
        tone: "ok",
      });
      navigate("/users");
    } catch (err) {
      await dialog.alert(err.message || "Could not queue the wipe.");
    } finally {
      setBusy("");
    }
  }

  async function setPremium(premium) {
    if (locked()) return;
    setBusy(premium ? "grant" : "revoke");
    try {
      await adminApi.setPremium(account.id, {
        premium,
        premiumUntil: premium && until ? new Date(until).toISOString() : null,
      });
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-user", id] }),
        client.invalidateQueries({ queryKey: ["admin-users"] }),
        client.invalidateQueries({ queryKey: ["admin-payments"] }),
      ]);
    } catch (err) {
      await dialog.alert(err.message || "Could not update Premium.");
    } finally {
      setBusy("");
    }
  }

  return {
    account,
    profile,
    goals,
    prefs,
    progress,
    name,
    firstName: String(name).split(" ")[0],
    targetRole: profile.targetRole || goals.targetRole || "",
    experience: profile.experience || "",
    companies: goals.targetCompanies || [],
    daily: goals.dailyGoalMinutes,
    role: roleMeta(profile.targetRole || goals.targetRole || ""),
    byType: (progress.byType || []).map((row) => ({
      label: typeLabel(row.type),
      value: row.completed,
      color: TYPE_COLORS[row.type],
    })),
    payments: paymentsQuery.data?.data ?? [],
    rows,
    activeId,
    submission: detailQuery.data?.data,
    detailLoading: detailQuery.isLoading,
    submissionsQuery,
    loading: accountQuery.isLoading || profileQuery.isLoading,
    error: accountQuery.error || profileQuery.error,
    until,
    setUntil,
    busy,
    supportNote,
    deleteEmail,
    setDeleteEmail,
    fileIndex,
    setFileIndex,
    setSelectedId,
    setRole,
    toggleStatus,
    support,
    revokeSessions,
    forceVerify,
    deleteAccount,
    setPremium,
  };
}

function toLocalInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDialog } from "../components/Dialog";
import { AccountRole, AccountStatus } from "../data/enums";
import { providerLabel } from "../data/labels";
import { adminApi } from "../services/api";

const EMPTY_FILTERS = {
  role: "",
  status: "",
  access: "",
  verified: "",
  provider: "",
  onboarded: "",
};

const EMPTY_INVITE = { email: "", name: "", role: AccountRole.USER };

export function useAdminUsers() {
  const client = useQueryClient();
  const dialog = useDialog();
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.users });
  const directoryQuery = useQuery({ queryKey: ["admin-directory"], queryFn: adminApi.userDirectory });
  const accounts = usersQuery.data?.data ?? [];
  const directory = useMemo(() => {
    const map = {};
    for (const row of directoryQuery.data?.data ?? []) {
      if (row?.userId) map[row.userId] = row;
    }
    return map;
  }, [directoryQuery.data]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [invite, setInvite] = useState(EMPTY_INVITE);
  const [inviteNote, setInviteNote] = useState(null);
  const [busy, setBusy] = useState("");

  const rows = useMemo(
    () => accounts.map((account) => enrich(account, directory[account.id])),
    [accounts, directory],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((user) => {
      if (filters.role && user.role !== filters.role) return false;
      if (filters.status && user.status !== filters.status) return false;
      if (filters.access === "premium" && !user.premium) return false;
      if (filters.access === "free" && user.premium) return false;
      if (filters.verified === "yes" && !user.emailVerified) return false;
      if (filters.verified === "no" && user.emailVerified) return false;
      if (filters.provider && user.providerKey !== filters.provider) return false;
      if (filters.onboarded === "yes" && !user.onboarded) return false;
      if (filters.onboarded === "no" && user.onboarded) return false;
      if (!q) return true;
      return [user.name, user.email, user.id, user.role, user.status, user.providerLabel, user.premium ? "premium" : ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [rows, search, filters]);

  async function toggleStatus(user) {
    if (user.status === AccountStatus.DELETING) return;
    const next = user.status === AccountStatus.ACTIVE ? AccountStatus.DISABLED : AccountStatus.ACTIVE;
    setBusy(`status-${user.id}`);
    try {
      await adminApi.setUserStatus(user.id, next);
      await client.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (err) {
      await dialog.alert(err?.message || "Could not update status.");
    } finally {
      setBusy("");
    }
  }

  async function setRole(user, role) {
    if (user.role === role || user.status === AccountStatus.DELETING) return;
    setBusy(`role-${user.id}`);
    try {
      await adminApi.setUserRole(user.id, role);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-users"] }),
        client.invalidateQueries({ queryKey: ["admin-user", user.id] }),
      ]);
    } catch (err) {
      await dialog.alert(err?.message || "Could not update role.");
    } finally {
      setBusy("");
    }
  }

  async function submitInvite(event) {
    event.preventDefault();
    setBusy("invite");
    setInviteNote(null);
    try {
      const json = await adminApi.inviteUser(invite);
      setInviteNote(json?.data);
      setInvite(EMPTY_INVITE);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-users"] }),
        client.invalidateQueries({ queryKey: ["admin-directory"] }),
      ]);
    } catch (err) {
      await dialog.alert(err?.message || "Could not create this account.");
    } finally {
      setBusy("");
    }
  }

  return {
    usersQuery,
    search,
    setSearch,
    filters,
    setFilters,
    invite,
    setInvite,
    inviteNote,
    busy,
    rows,
    filtered,
    filteredOn: Object.values(filters).some(Boolean) || Boolean(search.trim()),
    clearFilters() {
      setSearch("");
      setFilters(EMPTY_FILTERS);
    },
    toggleStatus,
    setRole,
    submitInvite,
  };
}

function enrich(account, extra) {
  const provider = String(account.provider || "LOCAL").toUpperCase();
  return {
    ...account,
    name: extra?.name || account.email,
    onboarded: Boolean(extra?.onboarded),
    lastSubmittedAt: extra?.lastSubmittedAt || null,
    providerKey: provider === "GOOGLE" || provider === "GITHUB" ? provider : "LOCAL",
    providerLabel: providerLabel(account.provider),
  };
}

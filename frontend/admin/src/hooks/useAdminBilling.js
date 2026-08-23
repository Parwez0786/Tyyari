import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useDialog } from "../components/Dialog";
import { AccountRole } from "../data/enums";
import { adminApi } from "../services/api";

export function useAdminBilling() {
  const client = useQueryClient();
  const dialog = useDialog();
  const [params, setParams] = useSearchParams();
  const userId = params.get("user") || "";
  const paymentsQuery = useQuery({
    queryKey: ["admin-payments", userId],
    queryFn: () => adminApi.payments(userId ? { userId } : {}),
  });
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: adminApi.users });
  const items = paymentsQuery.data?.data ?? [];
  const users = usersQuery.data?.data ?? [];
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [lookup, setLookup] = useState(null);
  const [lookupError, setLookupError] = useState("");
  const [busy, setBusy] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (status && String(item.status || "").toLowerCase() !== status) return false;
      if (!q) return true;
      return [item.email, item.userId, item.provider, item.providerRef, item.status, item.stripeStatus]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [items, search, status]);

  async function lookupSession(event) {
    event.preventDefault();
    const id = sessionId.trim();
    if (!id) return;
    setLookupError("");
    setLookup(null);
    try {
      const json = await adminApi.billingSession(id);
      setLookup(json?.data);
    } catch (err) {
      setLookupError(err?.message || "Session not found.");
    }
  }

  async function refresh(item) {
    setBusy(item.id);
    try {
      await adminApi.refreshPayment(item.id);
      await client.invalidateQueries({ queryKey: ["admin-payments"] });
    } catch (err) {
      await dialog.alert(err?.message || "Could not refresh Stripe status.");
    } finally {
      setBusy("");
    }
  }

  async function refund(item) {
    if (!await dialog.confirm(`Refund ${item.displayAmount || "this payment"} for ${item.email || "this user"}? This also revokes Premium.`, {
      title: "Refund payment",
      confirmLabel: "Refund",
    })) return;
    setBusy(item.id);
    try {
      await adminApi.refundPayment(item.id);
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin-payments"] }),
        client.invalidateQueries({ queryKey: ["admin-users"] }),
        client.invalidateQueries({ queryKey: ["admin-user"] }),
      ]);
    } catch (err) {
      await dialog.alert(err?.message || "Could not refund this payment.");
    } finally {
      setBusy("");
    }
  }

  return {
    userId,
    setParams,
    paymentsQuery,
    items,
    filtered,
    status,
    setStatus,
    search,
    setSearch,
    sessionId,
    setSessionId,
    lookup,
    lookupError,
    busy,
    premiumUsers: users.filter((user) => user.premium && user.role !== AccountRole.ADMIN).length,
    counts: {
      paid: items.filter((item) => item.status === "paid").length,
      open: items.filter((item) => item.status === "open").length,
      refunded: items.filter((item) => item.status === "refunded").length,
      granted: items.filter((item) => item.status === "granted").length,
    },
    lookupSession,
    refresh,
    refund,
  };
}

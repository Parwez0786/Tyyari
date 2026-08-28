import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AccountRole } from "../data/enums";
import { authApi, billingApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";

export function useEntitled() {
  const token = useAuthStore((s) => s.accessToken);
  const me = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    enabled: Boolean(token),
  });
  const role = me.data?.data?.role;
  return Boolean(me.data?.data?.premium) || role === AccountRole.ADMIN || role === AccountRole.EDITOR;
}

export function isPremiumLocked(question, entitled) {
  if (entitled) return false;
  return Boolean(question?.premium || question?.locked);
}

const confirmedSessions = new Set();

export function usePremiumPage() {
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const token = useAuthStore((s) => s.accessToken);
  const entitled = useEntitled();
  const configQuery = useQuery({ queryKey: ["billing-config"], queryFn: billingApi.publicConfig });
  const config = configQuery.data?.data;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const status = params.get("status");
  const sessionId = params.get("session_id");

  useEffect(() => {
    if (!token || !sessionId || status !== "success") return undefined;
    if (confirmedSessions.has(sessionId)) return undefined;
    confirmedSessions.add(sessionId);
    let cancelled = false;
    setBusy(true);
    billingApi.confirm(sessionId)
      .then(async (json) => {
        if (cancelled) return;
        applyTokens(json?.data);
        await refreshEntitlement(queryClient);
        setNote("Premium is on. Locked problems will open.");
      })
      .catch((err) => {
        confirmedSessions.delete(sessionId);
        if (!cancelled) setError(err?.message);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, sessionId, status, queryClient]);

  async function checkout() {
    setError("");
    setBusy(true);
    try {
      const json = await billingApi.checkout();
      const url = json?.data?.checkoutUrl;
      if (url) window.location.assign(url);
    } catch (err) {
      setError(err?.message);
      setBusy(false);
    }
  }

  async function activateDev() {
    setError("");
    setBusy(true);
    try {
      const json = await billingApi.activateDev();
      applyTokens(json?.data);
      await refreshEntitlement(queryClient);
      setNote("Premium is on. Locked problems will open.");
    } catch (err) {
      setError(err?.message);
    } finally {
      setBusy(false);
    }
  }

  return {
    token,
    entitled,
    price: config?.displayPrice || "₹499",
    provider: config?.provider || "dev",
    busy,
    isLoading: configQuery.isLoading,
    error,
    note,
    status,
    checkout,
    activateDev,
  };
}

function applyTokens(data) {
  if (!data?.accessToken) return;
  useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
}

function refreshEntitlement(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["me"] }),
    queryClient.invalidateQueries({ queryKey: ["question"] }),
    queryClient.invalidateQueries({ queryKey: ["questions"] }),
    queryClient.invalidateQueries({ queryKey: ["sheets"] }),
  ]);
}

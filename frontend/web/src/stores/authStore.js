import { create } from "zustand";

function readStore(storage) {
  try {
    return JSON.parse(storage.getItem("tyyari.auth") || "null");
  } catch {
    return null;
  }
}

const stored = () => readStore(localStorage) || readStore(sessionStorage);

export const useAuthStore = create((set, get) => ({
  accessToken: stored()?.accessToken ?? null,
  refreshToken: stored()?.refreshToken ?? null,
  persist: Boolean(readStore(localStorage)),
  setTokens: (accessToken, refreshToken, persist = get().persist ?? true) => {
    const next = {
      accessToken,
      refreshToken: refreshToken ?? get().refreshToken,
      persist,
    };
    localStorage.removeItem("tyyari.auth");
    sessionStorage.removeItem("tyyari.auth");
    const storage = persist ? localStorage : sessionStorage;
    storage.setItem("tyyari.auth", JSON.stringify({ accessToken: next.accessToken, refreshToken: next.refreshToken }));
    set(next);
  },
  clear: () => {
    localStorage.removeItem("tyyari.auth");
    sessionStorage.removeItem("tyyari.auth");
    set({ accessToken: null, refreshToken: null, persist: true });
  },
}));

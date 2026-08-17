import { create } from "zustand";

const stored = () => {
  try {
    return JSON.parse(localStorage.getItem("tyyari.admin.auth") || "null");
  } catch {
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  accessToken: stored()?.accessToken ?? null,
  refreshToken: stored()?.refreshToken ?? null,
  setTokens: (accessToken, refreshToken) => {
    const next = { accessToken, refreshToken: refreshToken ?? get().refreshToken };
    localStorage.setItem("tyyari.admin.auth", JSON.stringify(next));
    set(next);
  },
  clear: () => {
    localStorage.removeItem("tyyari.admin.auth");
    set({ accessToken: null, refreshToken: null });
  },
}));

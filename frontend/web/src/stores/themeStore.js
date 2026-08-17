import { create } from "zustand";

const KEY = "tyyari.theme";

export function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme) {
  const next = theme || getPreferredTheme();
  document.documentElement.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* ignore */
  }
  return next;
}

export const useThemeStore = create((set, get) => ({
  theme: typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark" : "light",
  setTheme: (theme) => set({ theme: applyTheme(theme) }),
  toggle: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));

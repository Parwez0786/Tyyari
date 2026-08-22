export const ROLES = [
  { key: "SDE1", title: "SDE-1", hook: "DSA, LLD, and CS fundamentals.", accent: "from-emerald-500/20 to-teal-500/5" },
  { key: "SDE2", title: "SDE-2", hook: "System design plus deeper LLD.", accent: "from-orange-500/20 to-amber-500/5" },
  { key: "Frontend", title: "Frontend", hook: "UI machine-coding and React rounds.", accent: "from-fuchsia-500/20 to-pink-500/5" },
  { key: "Backend", title: "Backend", hook: "APIs, data, and service design.", accent: "from-sky-500/20 to-cyan-500/5" },
];

export const EXPERIENCES = [
  { key: "Fresher", title: "Fresher", hint: "Campus or first loop" },
  { key: "1-2", title: "1–2 years", hint: "Early SDE" },
  { key: "2-4", title: "2–4 years", hint: "Mid-level" },
  { key: "4+", title: "4+ years", hint: "Senior track" },
];

export const DAILY = [
  { minutes: 45, label: "45 min", hint: "Light day" },
  { minutes: 90, label: "90 min", hint: "Steady" },
  { minutes: 120, label: "2 hours", hint: "Default" },
  { minutes: 180, label: "3 hours", hint: "Push week" },
];

export function roleMeta(key) {
  return ROLES.find((item) => item.key === key);
}

export function formatWhen(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function formatPremiumUntil(premium, until) {
  if (!premium) return "—";
  return until ? formatWhen(until) : "Lifetime";
}

export function providerLabel(provider) {
  const value = String(provider || "LOCAL").toUpperCase();
  if (value === "GOOGLE") return "Google";
  if (value === "GITHUB") return "GitHub";
  return "Password";
}

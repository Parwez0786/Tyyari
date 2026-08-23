const ROLE = {
  USER: "Candidate",
  EDITOR: "Editor",
  ADMIN: "Admin",
};

const STATUS = {
  ACTIVE: "Active",
  DISABLED: "Disabled",
  DELETING: "Deleting",
};

const TYPE = {
  DSA: "DSA",
  HLD: "System Design",
  LLD: "Low Level Design",
  FRONTEND: "Frontend",
  CS: "CS Fundamentals",
  OA: "Online Assessment",
};

const DIFFICULTY = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

const LANGUAGE = {
  JAVA: "Java",
  PYTHON: "Python",
  JAVASCRIPT: "JavaScript",
  TYPESCRIPT: "TypeScript",
  CPP: "C++",
  C: "C",
  GO: "Go",
  KOTLIN: "Kotlin",
  java: "Java",
  python: "Python",
  javascript: "JavaScript",
  typescript: "TypeScript",
  cpp: "C++",
};

const THEME = {
  light: "Light",
  dark: "Dark",
};

const PROVIDER = {
  LOCAL: "Password",
  GOOGLE: "Google",
  GITHUB: "GitHub",
};

const PAYMENT = {
  paid: "Paid",
  granted: "Granted",
  open: "Open",
  expired: "Expired",
  refunded: "Refunded",
};

const SCOPE = {
  PRACTICE: "Practice",
  OA: "Online Assessment",
  SHEET: "Sheet",
};

const VIEW = {
  code: "Code",
  canvas: "Canvas",
  quiz: "Quiz",
  design: "Design",
};

const TARGET_ROLE = {
  SDE1: "SDE-1",
  SDE2: "SDE-2",
  "SDE-1": "SDE-1",
  "SDE-2": "SDE-2",
  Frontend: "Frontend",
  Backend: "Backend",
};

const SUBJECT = {
  OS: "Operating Systems",
  DBMS: "Databases",
  OOP: "OOP",
  Networks: "Networks",
};

function pick(map, value, fallback = "—") {
  if (value == null || value === "") return fallback;
  const key = String(value);
  return map[key] ?? map[key.toUpperCase()] ?? map[key.toLowerCase()] ?? humanize(key);
}

function humanize(value) {
  return String(value)
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function roleLabel(value) {
  return pick(ROLE, value);
}

export function statusLabel(value) {
  return pick(STATUS, value);
}

export function typeLabel(value) {
  return pick(TYPE, value);
}

export function difficultyLabel(value) {
  return pick(DIFFICULTY, value);
}

export function languageLabel(value) {
  return pick(LANGUAGE, value);
}

export function themeLabel(value) {
  return pick(THEME, value);
}

export function providerLabel(value) {
  return pick(PROVIDER, value || "LOCAL");
}

export function paymentLabel(value) {
  return pick(PAYMENT, value);
}

export function scopeLabel(value) {
  return pick(SCOPE, value, "Practice");
}

export function viewLabel(value) {
  return pick(VIEW, value);
}

export function subjectLabel(value) {
  return pick(SUBJECT, value);
}

export function targetRoleLabel(value) {
  return pick(TARGET_ROLE, value);
}

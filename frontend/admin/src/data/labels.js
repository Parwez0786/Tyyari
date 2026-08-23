import {
  AccountRole,
  AccountStatus,
  AuthProvider,
  Difficulty,
  PaymentStatus,
  QuestionType,
  Scope,
  Subject,
  TargetRole,
  ThemeMode,
  ViewMode,
} from "./enums";

const ROLE = {
  [AccountRole.USER]: "Candidate",
  [AccountRole.EDITOR]: "Editor",
  [AccountRole.ADMIN]: "Admin",
};

const STATUS = {
  [AccountStatus.ACTIVE]: "Active",
  [AccountStatus.DISABLED]: "Disabled",
  [AccountStatus.DELETING]: "Deleting",
};

const TYPE = {
  [QuestionType.DSA]: "DSA",
  [QuestionType.HLD]: "System Design",
  [QuestionType.LLD]: "Low Level Design",
  [QuestionType.FRONTEND]: "Frontend",
  [QuestionType.CS]: "CS Fundamentals",
  [QuestionType.OA]: "Online Assessment",
};

const DIFFICULTY = {
  [Difficulty.EASY]: "Easy",
  [Difficulty.MEDIUM]: "Medium",
  [Difficulty.HARD]: "Hard",
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
  [ThemeMode.LIGHT]: "Light",
  [ThemeMode.DARK]: "Dark",
};

const PROVIDER = {
  [AuthProvider.LOCAL]: "Password",
  [AuthProvider.GOOGLE]: "Google",
  [AuthProvider.GITHUB]: "GitHub",
};

const PAYMENT = {
  [PaymentStatus.PAID]: "Paid",
  [PaymentStatus.GRANTED]: "Granted",
  [PaymentStatus.OPEN]: "Open",
  [PaymentStatus.EXPIRED]: "Expired",
  [PaymentStatus.REFUNDED]: "Refunded",
};

const SCOPE = {
  [Scope.PRACTICE]: "Practice",
  [Scope.OA]: "Online Assessment",
  [Scope.SHEET]: "Sheet",
};

const VIEW = {
  [ViewMode.CODE]: "Code",
  [ViewMode.CANVAS]: "Canvas",
  [ViewMode.QUIZ]: "Quiz",
  [ViewMode.DESIGN]: "Design",
  [ViewMode.BLUEPRINT]: "Blueprint",
  [ViewMode.WHITEBOARD]: "Whiteboard",
};

const TARGET_ROLE = {
  [TargetRole.SDE1]: "SDE-1",
  [TargetRole.SDE2]: "SDE-2",
  [TargetRole.SDE_1]: "SDE-1",
  [TargetRole.SDE_2]: "SDE-2",
  [TargetRole.FRONTEND]: "Frontend",
  [TargetRole.BACKEND]: "Backend",
};

const SUBJECT = {
  [Subject.OS]: "Operating Systems",
  [Subject.DBMS]: "Databases",
  [Subject.OOP]: "OOP",
  [Subject.NETWORKS]: "Networks",
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
  return pick(PROVIDER, value || AuthProvider.LOCAL);
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

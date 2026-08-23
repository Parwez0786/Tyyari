export const QuestionType = Object.freeze({
  HLD: "HLD",
  LLD: "LLD",
  DSA: "DSA",
  FRONTEND: "FRONTEND",
  CS: "CS",
  OA: "OA",
});

export const QUESTION_TYPE_LIST = Object.values(QuestionType);
export const SHEET_TYPES = [
  QuestionType.DSA,
  QuestionType.HLD,
  QuestionType.LLD,
  QuestionType.FRONTEND,
];

export const Difficulty = Object.freeze({
  EASY: "EASY",
  MEDIUM: "MEDIUM",
  HARD: "HARD",
});

export const DIFFICULTY_LIST = Object.values(Difficulty);

export const ViewMode = Object.freeze({
  CODE: "code",
  BLUEPRINT: "blueprint",
  WHITEBOARD: "whiteboard",
  CANVAS: "canvas",
  QUIZ: "quiz",
  DESIGN: "design",
});

export const AccountRole = Object.freeze({
  USER: "USER",
  EDITOR: "EDITOR",
  ADMIN: "ADMIN",
});

export const ACCOUNT_ROLE_LIST = Object.values(AccountRole);

export const AccountStatus = Object.freeze({
  ACTIVE: "ACTIVE",
  DISABLED: "DISABLED",
  DELETING: "DELETING",
});

export const ACCOUNT_STATUS_LIST = Object.values(AccountStatus);

export const PaymentStatus = Object.freeze({
  PAID: "paid",
  GRANTED: "granted",
  OPEN: "open",
  EXPIRED: "expired",
  REFUNDED: "refunded",
});

export const AuthProvider = Object.freeze({
  LOCAL: "LOCAL",
  GOOGLE: "GOOGLE",
  GITHUB: "GITHUB",
});

export const TargetRole = Object.freeze({
  SDE1: "SDE1",
  SDE2: "SDE2",
  SDE_1: "SDE-1",
  SDE_2: "SDE-2",
  FRONTEND: "Frontend",
  BACKEND: "Backend",
});

export const Subject = Object.freeze({
  OS: "OS",
  DBMS: "DBMS",
  OOP: "OOP",
  NETWORKS: "Networks",
});

export const Scope = Object.freeze({
  PRACTICE: "PRACTICE",
  OA: "OA",
  SHEET: "SHEET",
});

export const ThemeMode = Object.freeze({
  LIGHT: "light",
  DARK: "dark",
});

export function isType(value, type) {
  return String(value || "").toUpperCase() === type;
}

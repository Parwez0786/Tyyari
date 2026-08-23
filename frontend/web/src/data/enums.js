export const QuestionType = Object.freeze({
  HLD: "HLD",
  LLD: "LLD",
  DSA: "DSA",
  FRONTEND: "FRONTEND",
  CS: "CS",
  OA: "OA",
});

export const QUESTION_TYPE_LIST = Object.values(QuestionType);
export const LIBRARY_TYPES = [
  QuestionType.HLD,
  QuestionType.LLD,
  QuestionType.DSA,
  QuestionType.FRONTEND,
  QuestionType.CS,
];
export const SHEET_TYPES = [
  QuestionType.HLD,
  QuestionType.LLD,
  QuestionType.DSA,
  QuestionType.FRONTEND,
];
export const TOPIC_TYPES = [QuestionType.CS, QuestionType.DSA];

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

export const ThemeTone = Object.freeze({
  BRAND: "brand",
  BLUE: "blue",
  VIOLET: "violet",
  MINT: "mint",
  LIME: "lime",
  QUIET: "quiet",
  DANGER: "danger",
});

export const RoadmapItemKind = Object.freeze({
  QUESTION: "question",
  SHEET: "sheet",
  PRACTICE: "practice",
  OA: "oa",
});

export function isType(value, type) {
  return String(value || "").toUpperCase() === type;
}

export function practicePath(type = QuestionType.DSA) {
  return `/practice/${type}`;
}

export function learnPath(role) {
  return role ? `/learn?role=${role}` : "/learn";
}

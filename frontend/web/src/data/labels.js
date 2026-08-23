import {
  AccountRole,
  Difficulty,
  QuestionType,
  Subject,
  TargetRole,
  ViewMode,
} from "./enums";

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

const VIEW = {
  [ViewMode.CODE]: "Code",
  [ViewMode.CANVAS]: "Canvas",
  [ViewMode.QUIZ]: "Quiz",
  [ViewMode.DESIGN]: "Design",
  [ViewMode.BLUEPRINT]: "Blueprint",
  [ViewMode.WHITEBOARD]: "Whiteboard",
};

const SUBJECT = {
  [Subject.OS]: "Operating Systems",
  [Subject.DBMS]: "Databases",
  [Subject.OOP]: "OOP",
  [Subject.NETWORKS]: "Networks",
};

const ROLE = {
  [TargetRole.SDE1]: "SDE-1",
  [TargetRole.SDE2]: "SDE-2",
  [TargetRole.SDE_1]: "SDE-1",
  [TargetRole.SDE_2]: "SDE-2",
  [TargetRole.FRONTEND]: "Frontend",
  [TargetRole.BACKEND]: "Backend",
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

export function typeLabel(value) {
  return pick(TYPE, value);
}

export function difficultyLabel(value) {
  return pick(DIFFICULTY, value);
}

export function viewLabel(value) {
  return pick(VIEW, value);
}

export function targetRoleLabel(value) {
  return pick(ROLE, value);
}

export function subjectLabel(value) {
  return pick(SUBJECT, value);
}

export { AccountRole };

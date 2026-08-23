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

const VIEW = {
  code: "Code",
  canvas: "Canvas",
  quiz: "Quiz",
  design: "Design",
};

const SUBJECT = {
  OS: "Operating Systems",
  DBMS: "Databases",
  OOP: "OOP",
  Networks: "Networks",
};

const ROLE = {
  SDE1: "SDE-1",
  SDE2: "SDE-2",
  "SDE-1": "SDE-1",
  "SDE-2": "SDE-2",
  Frontend: "Frontend",
  Backend: "Backend",
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

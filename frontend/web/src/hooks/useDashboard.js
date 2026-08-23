import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Camera,
  Code2,
  LayoutTemplate,
  Network,
  Puzzle,
} from "lucide-react";
import { completedSet, countCompleted } from "../components/ProgressCharts";
import { LIBRARY_TYPES, QuestionType, TargetRole, practicePath } from "../data/enums";
import { ROADMAPS, roleFromProfile } from "../data/roadmaps";
import { isPremiumLocked, useEntitled } from "./usePremium";
import { authApi, contentApi, userApi } from "../services/api";
import { questionHref } from "../utils/questionHref";

export const TRACKS = [
  {
    type: QuestionType.HLD,
    title: "System Design",
    hook: "Design systems interviewers actually ask.",
    practice: practicePath(QuestionType.HLD),
    sheet: "/sheets/hld-core-sheet",
    Icon: Network,
    accent: "from-orange-500/20 to-amber-500/5",
    chip: "bg-brand/15 text-brand",
  },
  {
    type: QuestionType.LLD,
    title: "Low Level Design",
    hook: "Ship OOP and machine-coding in a real editor.",
    practice: practicePath(QuestionType.LLD),
    sheet: "/sheets/lld-machine-coding",
    Icon: Puzzle,
    accent: "from-sky-500/20 to-cyan-500/5",
    chip: "bg-sky-500/15 text-sky-400",
  },
  {
    type: QuestionType.DSA,
    title: "DSA",
    hook: "Run testcases. Chase the next Accepted.",
    practice: practicePath(QuestionType.DSA),
    sheet: "/sheets/dsa-sde-sheet",
    Icon: Code2,
    accent: "from-emerald-500/20 to-teal-500/5",
    chip: "bg-emerald-500/15 text-emerald-400",
  },
  {
    type: QuestionType.FRONTEND,
    title: "Frontend",
    hook: "Build UI with live desktop and mobile preview.",
    practice: practicePath(QuestionType.FRONTEND),
    sheet: "/sheets/frontend-ui-sheet",
    Icon: LayoutTemplate,
    accent: "from-fuchsia-500/20 to-pink-500/5",
    chip: "bg-fuchsia-500/15 text-fuchsia-400",
  },
  {
    type: QuestionType.CS,
    title: "CS Fundamentals",
    hook: "Short OS, DBMS, OOP, and networks quizzes.",
    practice: practicePath(QuestionType.CS),
    Icon: BookOpen,
    accent: "from-lime-500/20 to-emerald-500/5",
    chip: "bg-lime-500/15 text-lime-400",
  },
  {
    type: QuestionType.OA,
    title: "Online Assessment",
    hook: "Timed, camera-gated DSA — like the real OA.",
    practice: practicePath(QuestionType.OA),
    Icon: Camera,
    accent: "from-blue-500/20 to-indigo-500/5",
    chip: "bg-blue-500/15 text-premium",
  },
];

export const DAY_LABELS = ["6d", "5d", "4d", "3d", "2d", "Y", "T"];
export const WEEK_GOAL = 5;

const RANKS = [
  { name: "Day one", xp: 0 },
  { name: "Building", xp: 1 },
  { name: "On a roll", xp: 8 },
  { name: "Interview ready", xp: 20 },
];

const TIPS = [
  "Talk out loud. Interviewers grade the path, not only the final answer.",
  "For HLD, lock users, QPS, and storage before you draw a single box.",
  "Write brute force first. Then name the bottleneck in one sentence.",
  "In LLD, list classes and ownership before you open the editor.",
  "Dry-run one example on paper. Most bugs show up there.",
  "Frontend rounds: make the empty, loading, and error states obvious.",
  "CS quizzes: commit to an answer before you peek. Phone screens love OS and DBMS.",
  "OA timing: skip a stuck problem after 12 minutes. Come back later.",
  "End every design with trade-offs. That is the senior signal.",
];

export function useDashboard() {
  const [shuffle, setShuffle] = useState(0);
  const potdKey = dayKey();
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: userApi.profile });
  const meQuery = useQuery({ queryKey: ["me"], queryFn: authApi.me });
  const goalsQuery = useQuery({ queryKey: ["goals"], queryFn: userApi.goals });
  const progressQuery = useQuery({ queryKey: ["practice-progress"], queryFn: userApi.practiceProgress });
  const sheetsQuery = useQuery({ queryKey: ["sheets"], queryFn: () => contentApi.sheets() });
  const oaQuery = useQuery({ queryKey: ["assessment-sets"], queryFn: contentApi.assessmentSets });
  const potdQuery = useQuery({
    queryKey: ["problem-of-the-day", potdKey],
    queryFn: () => contentApi.questions({ type: QuestionType.DSA, limit: 60, page: 1 }),
  });
  const continueQuery = useQuery({
    queryKey: ["continue"],
    queryFn: () => contentApi.questions({ type: QuestionType.DSA, limit: 8, page: 1 }),
  });
  const libraryQuery = useQuery({
    queryKey: ["library-totals"],
    queryFn: async () => {
      const types = LIBRARY_TYPES;
      const pages = await Promise.all(types.map((type) => contentApi.questions({ type, page: 1, limit: 1 })));
      return Object.fromEntries(types.map((type, index) => [type, pages[index]?.data?.total || 0]));
    },
  });
  const goals = goalsQuery.data?.data;
  const progress = progressQuery.data?.data;
  const company = (goals?.targetCompanies || [])[0];
  const companyQuery = useQuery({
    queryKey: ["company-drill", company],
    queryFn: () => contentApi.questions({ company, limit: 5, page: 1 }),
    enabled: Boolean(company),
  });
  const lastQuery = useQuery({
    queryKey: ["question", progress?.lastQuestionId],
    queryFn: () => contentApi.question(progress?.lastQuestionId),
    enabled: Boolean(progress?.lastQuestionId),
  });

  const profile = profileQuery.data?.data;
  const email = meQuery.data?.data?.email;
  const done = useMemo(() => completedSet(progress), [progress]);
  const sheets = sheetsQuery.data?.data ?? [];
  const assessments = oaQuery.data?.data ?? [];
  const dsaPool = potdQuery.data?.data?.items ?? [];
  const items = continueQuery.data?.data?.items ?? [];
  const library = libraryQuery.data || {};
  const companies = useMemo(() => (goals?.targetCompanies || []).slice(0, 3), [goals?.targetCompanies]);
  const firstName = (profile?.name || "there").split(" ")[0];
  const byType = useMemo(
    () => Object.fromEntries((progress?.byType || []).map((item) => [item.type, item.completed])),
    [progress?.byType],
  );
  const libraryTotal = useMemo(
    () => LIBRARY_TYPES.reduce((sum, type) => sum + (library[type] || 0), 0),
    [library],
  );
  const completed = progress?.completed || 0;
  const sheetIds = useMemo(
    () => [...new Set(sheets.flatMap((sheet) => sheet.questionIds || []))],
    [sheets],
  );
  const sheetDone = useMemo(() => countCompleted(sheetIds, done), [sheetIds, done]);
  const oaTotal = useMemo(
    () => assessments.reduce((sum, set) => sum + (set.questionCount || 0), 0),
    [assessments],
  );
  const potd = useMemo(() => pickDaily(dsaPool, potdKey), [dsaPool, potdKey]);
  const queue = useMemo(() => items.filter((item) => !done.has(item.id)).slice(0, 4), [items, done]);
  const companyItems = useMemo(
    () => (companyQuery.data?.data?.items ?? []).filter((item) => !done.has(item.id)).slice(0, 3),
    [companyQuery.data, done],
  );
  const lastQuestion = lastQuery.data?.data;
  const streak = progress?.streakDays || 0;
  const todayDone = progress?.todayCompleted || 0;
  const weekDone = progress?.weekCompleted || 0;
  const week = useMemo(
    () => (progress?.weekActive?.length === 7 ? progress.weekActive : Array(7).fill(false)),
    [progress?.weekActive],
  );
  const xp = useMemo(() => rankProgress(completed), [completed]);
  const nudge = streakNudge(streak, todayDone);
  const gap = useMemo(() => weakestTrack(byType, library), [byType, library]);
  const nextBadge = useMemo(
    () => nextBadgeFor({ completed, streak, hld: byType.HLD || 0, sheetDone }),
    [completed, streak, byType.HLD, sheetDone],
  );
  const tip = TIPS[new Date().getDate() % TIPS.length];
  const surprisePool = useMemo(
    () => [...dsaPool, ...items].filter((item, index, list) => !done.has(item.id) && list.findIndex((row) => row.id === item.id) === index),
    [dsaPool, items, done],
  );
  const surprise = surprisePool.length ? surprisePool[(daySeed() + shuffle) % surprisePool.length] : null;
  const oaSet = assessments[0];
  const pathRole = roleFromProfile(profile?.targetRole);
  const path = ROADMAPS[pathRole] || ROADMAPS[TargetRole.SDE_1];
  const entitled = useEntitled();
  const playbooks = useMemo(
    () => TRACKS.map((track) => {
      const value = track.type === QuestionType.OA ? (progress?.oaCompleted || 0) : (byType[track.type] || 0);
      const total = track.type === QuestionType.OA ? oaTotal : (library[track.type] || 0);
      return { ...track, value, total, pct: total ? Math.round((100 * value) / total) : 0 };
    }),
    [progress?.oaCompleted, byType, oaTotal, library],
  );
  const badges = useMemo(() => [
    { earned: completed >= 1, title: "First submit", detail: "Log any practice answer" },
    { earned: streak >= 3, title: "On a streak", detail: "Show up 3 days in a row" },
    { earned: completed >= 5, title: "Warm-up complete", detail: "Submit 5 unique questions" },
    { earned: (byType.HLD || 0) >= 1, title: "System designer", detail: "Submit one HLD design" },
    { earned: sheetDone >= 3, title: "Sheet hunter", detail: "Finish 3 sheet problems" },
  ], [completed, streak, byType.HLD, sheetDone]);

  return {
    profile,
    email,
    firstName,
    greeting: greeting(),
    nudge,
    profileError: profileQuery.isError,
    companies,
    entitled,
    xp,
    streak,
    todayDone,
    week,
    weekDone,
    potd,
    potdLocked: potd ? isPremiumLocked(potd, entitled) : false,
    potdDone: potd ? done.has(potd.id) : false,
    lastQuestion,
    lastView: progress?.lastView,
    pathRole,
    path,
    gap,
    surprise,
    shuffle: () => setShuffle((n) => n + 1),
    tip,
    completed,
    libraryTotal,
    sheetDone,
    sheetTotal: sheetIds.length || 0,
    oaCompleted: progress?.oaCompleted || 0,
    oaTotal,
    nextBadge,
    badges,
    company,
    companyItems,
    oaSet,
    playbooks,
    queue,
    hrefFor: questionHref,
    done,
    isLoading:
      profileQuery.isLoading
      || progressQuery.isLoading
      || potdQuery.isLoading
      || sheetsQuery.isLoading,
  };
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning session";
  if (hour < 17) return "Afternoon grind";
  return "Night round";
}

function rankProgress(completed) {
  let current = RANKS[0];
  let next = RANKS[1];
  for (let i = 0; i < RANKS.length; i += 1) {
    if (completed >= RANKS[i].xp) {
      current = RANKS[i];
      next = RANKS[i + 1] || null;
    }
  }
  if (!next) {
    return { name: current.name, value: 1, total: 1, next: "", toNext: 0 };
  }
  return {
    name: current.name,
    value: completed - current.xp,
    total: next.xp - current.xp,
    next: next.name,
    toNext: Math.max(next.xp - completed, 0),
  };
}

function weakestTrack(byType, library) {
  return TRACKS.filter((track) => track.type !== QuestionType.OA)
    .map((track) => {
      const total = library[track.type] || 0;
      const done = byType[track.type] || 0;
      return { ...track, total, done, pct: total ? done / total : 1 };
    })
    .sort((a, b) => a.pct - b.pct || a.total - b.total)[0];
}

function nextBadgeFor({ completed, streak, hld, sheetDone }) {
  const badges = [
    { title: "First submit", value: completed, total: 1, hint: "Submit 1 question" },
    { title: "On a streak", value: streak, total: 3, hint: "3 days in a row" },
    { title: "Warm-up complete", value: completed, total: 5, hint: "5 unique submits" },
    { title: "System designer", value: hld, total: 1, hint: "Submit 1 HLD" },
    { title: "Sheet hunter", value: sheetDone, total: 3, hint: "3 sheet problems" },
  ];
  return badges.find((badge) => badge.value < badge.total) || null;
}

function streakNudge(streak, todayDone) {
  if (todayDone > 0 && streak > 1) {
    return `Streak is safe. ${streak} days live — one more problem makes tomorrow easier.`;
  }
  if (todayDone > 0) {
    return "Logged for today. Come back tomorrow and start a real streak.";
  }
  if (streak > 0) {
    return `You have a ${streak}-day streak. Submit once today so it does not reset.`;
  }
  return "Submit one problem today. Streaks, badges, and your report all start from that.";
}

function dayKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function daySeed() {
  const now = new Date();
  return now.getFullYear() * 1000 + now.getMonth() * 40 + now.getDate();
}

function pickDaily(items, key) {
  if (!items.length) return null;
  const pool = [...items].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return pool[Math.abs(hash) % pool.length];
}

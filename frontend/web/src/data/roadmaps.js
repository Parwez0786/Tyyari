import { QuestionType, RoadmapItemKind, TargetRole, ViewMode } from "./enums";

export const ROLES = [
  {
    id: TargetRole.SDE_1,
    title: "SDE-1",
    weeks: 8,
    blurb: "DSA first, then enough LLD, HLD, CS, and a warmup OA to clear a new-grad / SDE-1 loop.",
  },
  {
    id: TargetRole.SDE_2,
    title: "SDE-2",
    weeks: 8,
    blurb: "Deeper HLD and LLD, harder DSA, CS isolation/networking, and full-length camera OAs.",
  },
];

export const ROADMAPS = {
  [TargetRole.SDE_1]: [
    {
      week: 1,
      title: "Arrays and hashing",
      focus: "Warm up the editor. Hash maps and binary search show up in every OA.",
      items: [
        q("two-sum", QuestionType.DSA, "Two Sum"),
        q("binary-search", QuestionType.DSA, "Binary Search"),
        sheet("dsa-sde-sheet", "Open the SDE-1 DSA sheet"),
      ],
    },
    {
      week: 2,
      title: "Strings and OOP theory",
      focus: "Sliding windows plus the OOP quiz most phone screens still run.",
      items: [
        q("longest-substring", QuestionType.DSA, "Longest Substring Without Repeating Characters"),
        q("oop-fundamentals-quiz", QuestionType.CS, "Classes, Inheritance & Polymorphism"),
        practice(QuestionType.DSA, "Browse more DSA"),
      ],
    },
    {
      week: 3,
      title: "Graphs and backtracking",
      focus: "Islands and word search are the standard graph/backtracking pair.",
      items: [
        q("number-of-islands", QuestionType.DSA, "Number of Islands"),
        q("word-search", QuestionType.DSA, "Word Search"),
      ],
    },
    {
      week: 4,
      title: "Intervals and a hard DSA",
      focus: "Merge intervals, then trapping rain water if you want a stretch problem.",
      items: [
        q("merge-intervals", QuestionType.DSA, "Merge Intervals"),
        q("trapping-rain-water", QuestionType.DSA, "Trapping Rain Water"),
        sheet("dsa-sde-sheet", "Finish remaining DSA sheet items"),
      ],
    },
    {
      week: 5,
      title: "LLD objects",
      focus: "Model classes before you type. Parking lot and snake are the usual starters.",
      items: [
        q("design-parking-lot", QuestionType.LLD, "Design Parking Lot"),
        q("design-snake-game", QuestionType.LLD, "Design Snake Game"),
        q("design-lru-cache-lld", QuestionType.LLD, "Design an LRU Cache"),
        sheet("lld-machine-coding", "Open the LLD sheet"),
      ],
    },
    {
      week: 6,
      title: "First HLD systems",
      focus: "URL shortener, TinyURL, and a rate limiter. Lock users, QPS, and storage first.",
      items: [
        q("design-url-shortener", QuestionType.HLD, "Design URL Shortener"),
        q("design-tinyurl", QuestionType.HLD, "Design a URL Shortener (TinyURL)"),
        q("design-rate-limiter", QuestionType.HLD, "Design a Rate Limiter"),
        sheet("hld-core-sheet", "Open the HLD core sheet"),
      ],
    },
    {
      week: 7,
      title: "CS phone screen",
      focus: "OS, DBMS, and networks quizzes. Submit a score the same way as practice.",
      items: [
        q("what-is-virtual-memory", QuestionType.CS, "Virtual Memory & Paging"),
        q("what-is-database-indexing", QuestionType.CS, "Indexing & B-Trees"),
        q("tcp-vs-udp", QuestionType.CS, "TCP vs UDP"),
        practice(QuestionType.CS, "More CS quizzes"),
      ],
    },
    {
      week: 8,
      title: "Pressure and a UI round",
      focus: "A short camera OA, then a frontend challenge so the loop is complete.",
      items: [
        oa("warmup-oa", "Warmup OA"),
        q("build-todo-app", QuestionType.FRONTEND, "Build a Todo App"),
        sheet("frontend-ui-sheet", "Open the Frontend UI sheet"),
      ],
    },
  ],
  [TargetRole.SDE_2]: [
    {
      week: 1,
      title: "LLD internals",
      focus: "Caches, loggers, and dispatchers. Ownership and complexity matter at SDE-2.",
      items: [
        q("design-lru-cache-lld", QuestionType.LLD, "Design an LRU Cache"),
        q("design-logger", QuestionType.LLD, "Design a Logging Framework"),
        q("design-elevator", QuestionType.LLD, "Design an Elevator System"),
      ],
    },
    {
      week: 2,
      title: "Product LLD",
      focus: "Booking and split-wise style systems. Concurrent writes, not just class diagrams.",
      items: [
        q("design-bookmyshow", QuestionType.LLD, "Design BookMyShow"),
        q("design-splitwise", QuestionType.LLD, "Design Splitwise"),
        sheet("lld-machine-coding", "Clear the LLD sheet"),
      ],
    },
    {
      week: 3,
      title: "HLD primitives",
      focus: "Rate limits, fan-out notifications, and a polite crawler.",
      items: [
        q("design-rate-limiter", QuestionType.HLD, "Design a Rate Limiter"),
        q("design-notification-system", QuestionType.HLD, "Design a Notification System"),
        q("design-web-crawler", QuestionType.HLD, "Design a Web Crawler"),
      ],
    },
    {
      week: 4,
      title: "Social scale",
      focus: "Feeds, timelines, and chat. Trade-offs are the senior signal.",
      items: [
        q("design-instagram", QuestionType.HLD, "Design Instagram"),
        q("design-twitter", QuestionType.HLD, "Design Twitter"),
        q("design-chat-system", QuestionType.HLD, "Design a Chat System (WhatsApp)"),
        sheet("hld-core-sheet", "Work the HLD core sheet"),
      ],
    },
    {
      week: 5,
      title: "Streaming and storage",
      focus: "CDN, transcoding, and sync. These are the hard HLD prompts.",
      items: [
        q("design-youtube", QuestionType.HLD, "Design YouTube (Video Streaming)"),
        q("design-netflix", QuestionType.HLD, "Design Netflix (Video Streaming)"),
        q("design-google-drive", QuestionType.HLD, "Design Google Drive"),
      ],
    },
    {
      week: 6,
      title: "Hard DSA still counts",
      focus: "SDE-2 loops still open with a coding round. Do not skip this week.",
      items: [
        q("trapping-rain-water", QuestionType.DSA, "Trapping Rain Water"),
        q("word-search", QuestionType.DSA, "Word Search"),
        q("number-of-islands", QuestionType.DSA, "Number of Islands"),
        sheet("dsa-sde-sheet", "Sweep the DSA sheet"),
      ],
    },
    {
      week: 7,
      title: "CS depth",
      focus: "Deadlock, isolation, and TLS — the follow-ups after a design round.",
      items: [
        q("os-processes-threads", QuestionType.CS, "Processes, Threads & Deadlock"),
        q("dbms-transactions-isolation", QuestionType.CS, "Transactions & Isolation"),
        q("networks-http-dns-tls", QuestionType.CS, "HTTP, DNS & TLS"),
        practice(QuestionType.CS, "More CS quizzes"),
      ],
    },
    {
      week: 8,
      title: "Full-length OA",
      focus: "Amazon and Google timed sets, plus a frontend feed if the loop includes UI.",
      items: [
        oa("amazon-oa", "Amazon OA"),
        oa("google-oa", "Google OA"),
        q("infinite-scroll-feed", QuestionType.FRONTEND, "Infinite Scroll Feed"),
      ],
    },
  ],
};

function q(slug, type, title) {
  return { kind: RoadmapItemKind.QUESTION, slug, type, title };
}

function sheet(slug, title) {
  return { kind: RoadmapItemKind.SHEET, slug, title };
}

function oa(slug, title) {
  return { kind: RoadmapItemKind.OA, slug, title };
}

function practice(slug, title) {
  return { kind: RoadmapItemKind.PRACTICE, slug, title };
}

export function roleFromProfile(targetRole) {
  const value = String(targetRole || "").toUpperCase().replace(/[\s_-]/g, "");
  if (value === "SDE2") return TargetRole.SDE_2;
  return TargetRole.SDE_1;
}

export function itemHref(item) {
  if (item.kind === RoadmapItemKind.SHEET) return `/sheets/${item.slug}`;
  if (item.kind === RoadmapItemKind.OA) return `/oa/${item.slug}/precheck`;
  if (item.kind === RoadmapItemKind.PRACTICE) return `/practice/${item.slug}`;
  if (item.type === QuestionType.HLD || item.type === QuestionType.CS) return `/questions/${item.slug}`;
  return `/questions/${item.slug}?view=${ViewMode.CODE}`;
}

export function itemTrack(item) {
  if (item.kind === RoadmapItemKind.SHEET) return "SHEET";
  if (item.kind === RoadmapItemKind.OA) return QuestionType.OA;
  if (item.kind === RoadmapItemKind.PRACTICE) return item.slug;
  return item.type;
}

export function flattenQuestions(weeks) {
  return weeks.flatMap((week) => week.items.filter((item) => item.kind === RoadmapItemKind.QUESTION));
}

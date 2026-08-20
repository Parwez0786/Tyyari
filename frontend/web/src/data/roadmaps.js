export const ROLES = [
  {
    id: "SDE-1",
    title: "SDE-1",
    weeks: 8,
    blurb: "DSA first, then enough LLD, HLD, CS, and a warmup OA to clear a new-grad / SDE-1 loop.",
  },
  {
    id: "SDE-2",
    title: "SDE-2",
    weeks: 8,
    blurb: "Deeper HLD and LLD, harder DSA, CS isolation/networking, and full-length camera OAs.",
  },
];

export const ROADMAPS = {
  "SDE-1": [
    {
      week: 1,
      title: "Arrays and hashing",
      focus: "Warm up the editor. Hash maps and binary search show up in every OA.",
      items: [
        q("two-sum", "DSA", "Two Sum"),
        q("binary-search", "DSA", "Binary Search"),
        sheet("dsa-sde-sheet", "Open the SDE-1 DSA sheet"),
      ],
    },
    {
      week: 2,
      title: "Strings and OOP theory",
      focus: "Sliding windows plus the OOP quiz most phone screens still run.",
      items: [
        q("longest-substring", "DSA", "Longest Substring Without Repeating Characters"),
        q("oop-fundamentals-quiz", "CS", "Classes, Inheritance & Polymorphism"),
        practice("DSA", "Browse more DSA"),
      ],
    },
    {
      week: 3,
      title: "Graphs and backtracking",
      focus: "Islands and word search are the standard graph/backtracking pair.",
      items: [
        q("number-of-islands", "DSA", "Number of Islands"),
        q("word-search", "DSA", "Word Search"),
      ],
    },
    {
      week: 4,
      title: "Intervals and a hard DSA",
      focus: "Merge intervals, then trapping rain water if you want a stretch problem.",
      items: [
        q("merge-intervals", "DSA", "Merge Intervals"),
        q("trapping-rain-water", "DSA", "Trapping Rain Water"),
        sheet("dsa-sde-sheet", "Finish remaining DSA sheet items"),
      ],
    },
    {
      week: 5,
      title: "LLD objects",
      focus: "Model classes before you type. Parking lot and snake are the usual starters.",
      items: [
        q("design-parking-lot", "LLD", "Design Parking Lot"),
        q("design-snake-game", "LLD", "Design Snake Game"),
        q("design-lru-cache-lld", "LLD", "Design an LRU Cache"),
        sheet("lld-machine-coding", "Open the LLD sheet"),
      ],
    },
    {
      week: 6,
      title: "First HLD systems",
      focus: "URL shortener, TinyURL, and a rate limiter. Lock users, QPS, and storage first.",
      items: [
        q("design-url-shortener", "HLD", "Design URL Shortener"),
        q("design-tinyurl", "HLD", "Design a URL Shortener (TinyURL)"),
        q("design-rate-limiter", "HLD", "Design a Rate Limiter"),
        sheet("hld-core-sheet", "Open the HLD core sheet"),
      ],
    },
    {
      week: 7,
      title: "CS phone screen",
      focus: "OS, DBMS, and networks quizzes. Submit a score the same way as practice.",
      items: [
        q("what-is-virtual-memory", "CS", "Virtual Memory & Paging"),
        q("what-is-database-indexing", "CS", "Indexing & B-Trees"),
        q("tcp-vs-udp", "CS", "TCP vs UDP"),
        practice("CS", "More CS quizzes"),
      ],
    },
    {
      week: 8,
      title: "Pressure and a UI round",
      focus: "A short camera OA, then a frontend challenge so the loop is complete.",
      items: [
        oa("warmup-oa", "Warmup OA"),
        q("build-todo-app", "FRONTEND", "Build a Todo App"),
        sheet("frontend-ui-sheet", "Open the Frontend UI sheet"),
      ],
    },
  ],
  "SDE-2": [
    {
      week: 1,
      title: "LLD internals",
      focus: "Caches, loggers, and dispatchers. Ownership and complexity matter at SDE-2.",
      items: [
        q("design-lru-cache-lld", "LLD", "Design an LRU Cache"),
        q("design-logger", "LLD", "Design a Logging Framework"),
        q("design-elevator", "LLD", "Design an Elevator System"),
      ],
    },
    {
      week: 2,
      title: "Product LLD",
      focus: "Booking and split-wise style systems. Concurrent writes, not just class diagrams.",
      items: [
        q("design-bookmyshow", "LLD", "Design BookMyShow"),
        q("design-splitwise", "LLD", "Design Splitwise"),
        sheet("lld-machine-coding", "Clear the LLD sheet"),
      ],
    },
    {
      week: 3,
      title: "HLD primitives",
      focus: "Rate limits, fan-out notifications, and a polite crawler.",
      items: [
        q("design-rate-limiter", "HLD", "Design a Rate Limiter"),
        q("design-notification-system", "HLD", "Design a Notification System"),
        q("design-web-crawler", "HLD", "Design a Web Crawler"),
      ],
    },
    {
      week: 4,
      title: "Social scale",
      focus: "Feeds, timelines, and chat. Trade-offs are the senior signal.",
      items: [
        q("design-instagram", "HLD", "Design Instagram"),
        q("design-twitter", "HLD", "Design Twitter"),
        q("design-chat-system", "HLD", "Design a Chat System (WhatsApp)"),
        sheet("hld-core-sheet", "Work the HLD core sheet"),
      ],
    },
    {
      week: 5,
      title: "Streaming and storage",
      focus: "CDN, transcoding, and sync. These are the hard HLD prompts.",
      items: [
        q("design-youtube", "HLD", "Design YouTube (Video Streaming)"),
        q("design-netflix", "HLD", "Design Netflix (Video Streaming)"),
        q("design-google-drive", "HLD", "Design Google Drive"),
      ],
    },
    {
      week: 6,
      title: "Hard DSA still counts",
      focus: "SDE-2 loops still open with a coding round. Do not skip this week.",
      items: [
        q("trapping-rain-water", "DSA", "Trapping Rain Water"),
        q("word-search", "DSA", "Word Search"),
        q("number-of-islands", "DSA", "Number of Islands"),
        sheet("dsa-sde-sheet", "Sweep the DSA sheet"),
      ],
    },
    {
      week: 7,
      title: "CS depth",
      focus: "Deadlock, isolation, and TLS — the follow-ups after a design round.",
      items: [
        q("os-processes-threads", "CS", "Processes, Threads & Deadlock"),
        q("dbms-transactions-isolation", "CS", "Transactions & Isolation"),
        q("networks-http-dns-tls", "CS", "HTTP, DNS & TLS"),
        practice("CS", "More CS quizzes"),
      ],
    },
    {
      week: 8,
      title: "Full-length OA",
      focus: "Amazon and Google timed sets, plus a frontend feed if the loop includes UI.",
      items: [
        oa("amazon-oa", "Amazon OA"),
        oa("google-oa", "Google OA"),
        q("infinite-scroll-feed", "FRONTEND", "Infinite Scroll Feed"),
      ],
    },
  ],
};

function q(slug, type, title) {
  return { kind: "question", slug, type, title };
}

function sheet(slug, title) {
  return { kind: "sheet", slug, title };
}

function oa(slug, title) {
  return { kind: "oa", slug, title };
}

function practice(slug, title) {
  return { kind: "practice", slug, title };
}

export function roleFromProfile(targetRole) {
  const value = String(targetRole || "").toUpperCase().replace(/[\s_-]/g, "");
  if (value === "SDE2") return "SDE-2";
  return "SDE-1";
}

export function itemHref(item) {
  if (item.kind === "sheet") return `/sheets/${item.slug}`;
  if (item.kind === "oa") return `/oa/${item.slug}/precheck`;
  if (item.kind === "practice") return `/practice/${item.slug}`;
  if (item.type === "HLD" || item.type === "CS") return `/questions/${item.slug}`;
  return `/questions/${item.slug}?view=code`;
}

export function itemTrack(item) {
  if (item.kind === "sheet") return "SHEET";
  if (item.kind === "oa") return "OA";
  if (item.kind === "practice") return item.slug;
  return item.type;
}

export function flattenQuestions(weeks) {
  return weeks.flatMap((week) => week.items.filter((item) => item.kind === "question"));
}

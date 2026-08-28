import { QuestionType, Subject } from "./enums";

export const QUESTION_TYPES = [
  {
    key: QuestionType.DSA,
    title: "DSA",
    hook: "Title, prompt, constraints, and at least one input/output example.",
    add: "Add DSA",
    accent: "from-emerald-500/20 to-teal-500/5",
    fields: { constraints: true, examples: true, testcases: true },
    placeholders: {
      title: "Two Sum",
      description: "Return the indices of the two numbers that add up to target.",
      constraints: "2 ≤ n ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9",
      testcaseIn: "4\n2 7 11 15\n9",
      testcaseOut: "0 1",
    },
  },
  {
    key: QuestionType.HLD,
    title: "System Design",
    hook: "Title, prompt, functional requirements, and NFRs.",
    add: "Add HLD",
    accent: "from-orange-500/20 to-amber-500/5",
    fields: { requirements: true, estimates: true },
    placeholders: {
      title: "Design YouTube",
      description: "Design a video platform that can upload, stream, and recommend.",
      functional: "Users can upload videos\nUsers can watch with adaptive bitrate",
      nonFunctional: "99.9% availability\nP95 start playback under 2s",
      estimates: "DAU: 50M\nPeak QPS: 200k reads, 5k writes\nAvg video: 50MB → 2.5PB/day at 1% upload",
      canvasNotes: "Start with upload → object store → CDN. Call out hot vs cold metadata and how comments fan out.",
    },
  },
  {
    key: QuestionType.LLD,
    title: "Low Level Design",
    hook: "Title, prompt, and the objects or APIs the candidate must model.",
    add: "Add LLD",
    accent: "from-sky-500/20 to-cyan-500/5",
    fields: { requirements: true, starterFiles: true },
    placeholders: {
      title: "Design a parking lot",
      description: "Model spots, tickets, and fee calculation in an OOP editor.",
      functional: "Park cars, bikes, and trucks across floors\nIssue a ticket on entry",
      nonFunctional: "Do not double-book a spot\nFee calculation is deterministic",
      starterName: "ParkingLot.java",
      starterContent: "public class ParkingLot {\n    // floors, spots, park(), leave()\n}\n",
    },
  },
  {
    key: QuestionType.FRONTEND,
    title: "Frontend",
    hook: "Title, prompt, features to build, and UI constraints.",
    add: "Add frontend",
    accent: "from-fuchsia-500/20 to-pink-500/5",
    fields: { features: true, constraints: true, starterFiles: true },
    placeholders: {
      title: "Build a todo app",
      description: "Add, complete, and filter todos in a live desktop and mobile preview.",
      functional: "Add a todo from an input\nMark complete and incomplete\nFilter All / Active / Completed",
      constraints: "Usable at 375px mobile preview\nIgnore empty todos",
      starterName: "App.js",
      starterContent: "export default function App() {\n  return <div className=\"app\">Todo</div>;\n}\n",
    },
  },
  {
    key: QuestionType.CS,
    title: "CS Fundamentals",
    hook: "Title, subject, and at least one multiple-choice item.",
    add: "Add quiz",
    accent: "from-lime-500/20 to-emerald-500/5",
    fields: { quiz: true, subType: true },
    subTypes: [Subject.OS, Subject.DBMS, Subject.OOP, Subject.NETWORKS],
    placeholders: {
      title: "Processes vs threads",
      description: "Five questions on address spaces, context switches, and deadlock.",
    },
  },
  {
    key: QuestionType.OA,
    title: "Online Assessment",
    hook: "Timed camera rounds. Build an OA set from DSA questions — the lobby does not use a separate OA question type.",
    add: "New OA set",
    createTo: "/oa/new",
    accent: "from-blue-500/20 to-indigo-500/5",
    fields: { constraints: true, examples: true, testcases: true },
    placeholders: {
      title: "OA: Maximum subarray",
      description: "Find the contiguous subarray with the largest sum. Timed like a real OA.",
      constraints: "1 ≤ n ≤ 10^5",
      testcaseIn: "9\n-2 1 -3 4 -1 2 1 -5 4",
      testcaseOut: "6",
    },
  },
];

export function typeMeta(key) {
  const upper = String(key || "").toUpperCase();
  return QUESTION_TYPES.find((item) => item.key === upper) || QUESTION_TYPES[0];
}

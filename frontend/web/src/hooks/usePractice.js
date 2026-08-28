import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookOpen, Camera, Code2, LayoutTemplate, Network, Puzzle } from "lucide-react";
import { DIFFICULTY_LIST, QUESTION_TYPE_LIST, QuestionType, TOPIC_TYPES, ThemeTone } from "../data/enums";
import { contentApi } from "../services/api";
import { questionHref } from "../utils/questionHref";

export const PRACTICE_TRACKS = [
  { key: QuestionType.HLD, title: "System Design (HLD)", detail: "High-level architecture problems", Icon: Network, accent: "from-orange-500/20 to-amber-500/5", chip: "bg-brand/15 text-brand", hero: ThemeTone.BRAND },
  { key: QuestionType.LLD, title: "Low Level Design", detail: "OOP and machine coding", Icon: Puzzle, accent: "from-sky-500/20 to-cyan-500/5", chip: "bg-sky-500/15 text-sky-400", hero: ThemeTone.BLUE },
  { key: QuestionType.DSA, title: "DSA", detail: "Data structures and algorithms", Icon: Code2, accent: "from-emerald-500/20 to-teal-500/5", chip: "bg-emerald-500/15 text-emerald-400", hero: ThemeTone.MINT },
  { key: QuestionType.FRONTEND, title: "Frontend Coding", detail: "UI machine-coding rounds", Icon: LayoutTemplate, accent: "from-fuchsia-500/20 to-pink-500/5", chip: "bg-fuchsia-500/15 text-fuchsia-400", hero: ThemeTone.VIOLET },
  { key: QuestionType.CS, title: "CS Fundamentals", detail: "OS, DBMS, OOP, networks", Icon: BookOpen, accent: "from-lime-500/20 to-emerald-500/5", chip: "bg-lime-500/15 text-lime-400", hero: ThemeTone.LIME },
  { key: QuestionType.OA, title: "Online Assessment", detail: "Timed DSA sets with camera check", Icon: Camera, accent: "from-blue-500/20 to-indigo-500/5", chip: "bg-blue-500/15 text-premium", hero: ThemeTone.BLUE },
];

const PAGE = {
  [QuestionType.HLD]: {
    title: "System Design Problems",
    subtitle: "The full HLD library. Filter by company and difficulty, then open any problem.",
  },
  [QuestionType.LLD]: {
    title: "Low Level Design Problems",
    subtitle: "The full LLD library. Practice OOP and machine-coding rounds in a multi-file editor.",
  },
  [QuestionType.DSA]: {
    title: "DSA Problems",
    subtitle: "The full DSA library. Filter by topic, company, and difficulty, then open any problem.",
  },
  [QuestionType.FRONTEND]: {
    title: "Frontend Problems",
    subtitle: "The full frontend library. Build React UI challenges with desktop and mobile preview.",
  },
  [QuestionType.CS]: {
    title: "CS Fundamentals",
    subtitle: "Drill OS, DBMS, OOP, and networks before a phone screen.",
  },
  [QuestionType.OA]: {
    title: "Online Assessments",
    subtitle: "Timed DSA sets with a camera check before you enter — closer to a real online assessment.",
  },
};

const SHEET_BY_TYPE = {
  [QuestionType.HLD]: "hld-core-sheet",
  [QuestionType.LLD]: "lld-machine-coding",
  [QuestionType.DSA]: "dsa-sde-sheet",
  [QuestionType.FRONTEND]: "frontend-ui-sheet",
};

const OPEN = new Set(QUESTION_TYPE_LIST);
export const DIFFS = DIFFICULTY_LIST;

export function usePracticeRoute() {
  const { type: typeParam } = useParams();
  const type = (typeParam || "").toUpperCase();
  const selected = Boolean(PAGE[type]);
  return {
    type,
    selected,
    isOa: type === QuestionType.OA,
    comingSoon: selected && !OPEN.has(type),
    tracks: PRACTICE_TRACKS,
    page: PAGE[type],
  };
}

export function usePracticeTrack(type) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [company, setCompany] = useState("");
  const [topic, setTopic] = useState("");
  const [picked, setPicked] = useState(null);
  const hasTopics = TOPIC_TYPES.includes(type);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const companiesQuery = useQuery({ queryKey: ["companies"], queryFn: contentApi.companies });
  const topicsQuery = useQuery({
    queryKey: ["topics", type],
    queryFn: () => contentApi.topics(type),
    enabled: hasTopics,
  });
  const questionsQuery = useQuery({
    queryKey: ["questions", type, difficulty, company, topic, debouncedSearch],
    queryFn: () => contentApi.questions({ type, difficulty, company, topic, search: debouncedSearch, page: 1, limit: 60 }),
  });

  const track = PRACTICE_TRACKS.find((item) => item.key === type);
  const items = questionsQuery.data?.data?.items ?? [];
  const companyOptions = useMemo(
    () => (companiesQuery.data?.data ?? []).map((item) => ({ value: item?.name, label: item?.name })),
    [companiesQuery.data],
  );
  const topicOptions = useMemo(
    () => (topicsQuery.data?.data ?? []).map((item) => ({ value: item?.name, label: item?.name })),
    [topicsQuery.data],
  );

  const startQuestion = useCallback((question) => {
    if (type === QuestionType.HLD) {
      setPicked(question);
      return;
    }
    navigate(questionHref(question.id, question.type));
  }, [type, navigate]);

  const pickMode = useCallback((view) => {
    if (!picked) return;
    navigate(questionHref(picked.id, picked.type, view));
  }, [picked, navigate]);

  const closePicked = useCallback(() => setPicked(null), []);

  return {
    type,
    track,
    meta: PAGE[type],
    sheetSlug: SHEET_BY_TYPE[type],
    search,
    setSearch,
    difficulty,
    setDifficulty,
    company,
    setCompany,
    topic,
    setTopic,
    hasTopics,
    companyOptions,
    topicOptions,
    items,
    isLoading: questionsQuery.isLoading,
    isError: questionsQuery.isError,
    picked,
    closePicked,
    startQuestion,
    pickMode,
  };
}

export function useOaLobby() {
  const navigate = useNavigate();
  const setsQuery = useQuery({ queryKey: ["assessment-sets"], queryFn: contentApi.assessmentSets });
  return {
    meta: PAGE[QuestionType.OA],
    sets: setsQuery.data?.data ?? [],
    isLoading: setsQuery.isLoading,
    isError: setsQuery.isError,
    startSet: (id) => navigate(`/oa/${id}/precheck`),
  };
}

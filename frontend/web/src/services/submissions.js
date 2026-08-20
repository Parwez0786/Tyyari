import { languageById, languageFromName } from "../components/code/languages";
import { queryClient } from "../queryClient";
import { userApi } from "./api";

export async function saveSubmission(payload) {
  const body = {
    questionId: payload.questionId,
    questionType: payload.questionType,
    language: payload.language || "",
    view: payload.view || "code",
    activeId: payload.activeId || "",
    stdin: payload.stdin || "",
    files: (payload.files || []).map((file) => ({
      id: file.id || "",
      type: file.type || "file",
      name: file.name,
      content: file.content || "",
    })),
    canvas: payload.canvas || null,
    math: payload.math || "",
    explanation: payload.explanation || "",
  };
  if (payload.assessmentSetId) body.assessmentSetId = payload.assessmentSetId;
  if (typeof payload.quizScore === "number") body.quizScore = payload.quizScore;
  if (typeof payload.quizTotal === "number") body.quizTotal = payload.quizTotal;
  if (Array.isArray(payload.quizAnswers)) body.quizAnswers = payload.quizAnswers;
  const res = await userApi.saveSubmission(body);
  queryClient.invalidateQueries({ queryKey: ["practice-progress"] });
  return res?.data || null;
}

export async function loadSubmission(questionId, assessmentSetId) {
  try {
    const res = await userApi.getSubmission(questionId, assessmentSetId);
    return res?.data || null;
  } catch {
    return null;
  }
}

export function dsaFromSubmission(saved, title, cases) {
  if (!saved) return null;
  const files = saved.files || [];
  const codeByLang = {};
  files.forEach((file) => {
    const lang = languageFromName(file.name);
    if (lang.id && lang.id !== "plaintext") codeByLang[lang.id] = file.content || "";
  });
  const language = languageById(saved.language).id;
  if (!codeByLang[language] && files[0]) codeByLang[language] = files[0].content || "";
  if (!Object.keys(codeByLang).length) return null;
  return {
    language,
    codeByLang,
    testcases: cases,
    activeCase: 0,
    submittedAt: saved.submittedAt,
  };
}

export function filesFromSubmission(saved) {
  if (!saved || !Array.isArray(saved.files) || !saved.files.length) return null;
  return {
    files: saved.files.map((item) => ({
      ...item,
      type: item.type || "file",
      content: item.content || "",
    })),
    activeId: saved.activeId,
    stdin: saved.stdin || "",
    language: saved.language,
    submittedAt: saved.submittedAt,
  };
}

export function dsaFiles(codeByLang) {
  return Object.entries(codeByLang || {}).map(([id, content]) => ({
    id,
    type: "file",
    name: languageById(id).main,
    content: content || "",
  }));
}

export function oaDraftFromStorage(setId, questionId) {
  try {
    const raw = JSON.parse(localStorage.getItem(`tyyari.oa.${setId}.${questionId}`) || "null");
    if (!raw || typeof raw !== "object") return null;
    return raw;
  } catch {
    return null;
  }
}

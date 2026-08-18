import { filesForLanguage, languageById, languageFromName } from "./languages";

const LOCAL = "/api/piston";
const REMOTE = "http://localhost:2000/api/v2";

const FALLBACK = {
  java: "21.0.0",
  python: "3.12.0",
  cpp: "13.0.0",
};

let runtimeCache = null;

async function pistonFetch(path, options) {
  try {
    const res = await fetch(`${LOCAL}${path}`, options);
    const type = res.headers.get("content-type") || "";
    if (res.ok || type.includes("json")) return res;
  } catch {
    /* fall through to local runner */
  }
  return fetch(`${REMOTE}${path}`, options);
}

export async function pistonRuntimes() {
  if (runtimeCache) return runtimeCache;
  try {
    const res = await pistonFetch("/runtimes");
    if (res.ok) runtimeCache = await res.json();
  } catch {
    runtimeCache = [];
  }
  return runtimeCache || [];
}

export async function pistonVersion(language) {
  const runtimes = await pistonRuntimes();
  const match = (runtimes || []).filter(
    (item) => item.language === language || (item.aliases || []).includes(language),
  );
  return match[match.length - 1]?.version || FALLBACK[language] || "*";
}

export function entryFile(files, activeId, languageId) {
  const list = filesForLanguage(files, languageId);
  if (!list.length) return null;
  if (languageId === "java") {
    return list.find((file) => /public\s+static\s+void\s+main\s*\(/.test(file.content || ""))
      || list.find((file) => /(^|\/)Main\.java$/i.test(file.name))
      || list.find((file) => file.id === activeId)
      || list[0];
  }
  if (languageId === "python") {
    return list.find((file) => /(^|\/)main\.py$/i.test(file.name))
      || list.find((file) => /if\s+__name__\s*==/.test(file.content || ""))
      || list.find((file) => file.id === activeId)
      || list[0];
  }
  return list.find((file) => /int\s+main\s*\(/.test(file.content || ""))
    || list.find((file) => /(^|\/)main\.(cpp|cc|cxx)$/i.test(file.name))
    || list.find((file) => file.id === activeId)
    || list[0];
}

export async function runWorkspace({ files, activeId, stdin, language }) {
  const lang = languageById(language) || languageFromName(entryFile(files, activeId, "java")?.name);
  if (!["java", "python", "cpp"].includes(lang.id)) {
    throw new Error("Choose Java, Python, or C++.");
  }
  const source = filesForLanguage(files, lang.id);
  const entry = entryFile(source, activeId, lang.id);
  if (!entry) throw new Error(`Add a ${lang.label} file before running.`);
  const ordered = [entry, ...source.filter((file) => file.id !== entry.id)];
  const version = await pistonVersion(lang.piston);
  const res = await pistonFetch("/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      language: lang.piston,
      version,
      files: ordered.map((file) => ({ name: file.name, content: file.content || "" })),
      stdin: stdin || "",
    }),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.message || `Runner returned ${res.status}. Is the code runner running?`);
  }
  const data = await res.json();
  return { data, language: lang, entry };
}

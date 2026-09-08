export const LANGUAGES = [
  { id: "java", label: "Java", ext: "java", monaco: "java", piston: "java", tabSize: 4, main: "Main.java" },
  { id: "python", label: "Python", ext: "py", monaco: "python", piston: "python", tabSize: 4, main: "main.py" },
  { id: "cpp", label: "C++", ext: "cpp", monaco: "cpp", piston: "cpp", tabSize: 4, main: "main.cpp" },
];

const FRONTEND_EXT = {
  jsx: { id: "javascript", label: "JavaScript", ext: "jsx", monaco: "javascript", piston: "", tabSize: 2, main: "App.jsx" },
  js: { id: "javascript", label: "JavaScript", ext: "js", monaco: "javascript", piston: "", tabSize: 2, main: "App.jsx" },
  tsx: { id: "typescript", label: "TypeScript", ext: "tsx", monaco: "typescript", piston: "", tabSize: 2, main: "App.tsx" },
  ts: { id: "typescript", label: "TypeScript", ext: "ts", monaco: "typescript", piston: "", tabSize: 2, main: "App.tsx" },
  css: { id: "css", label: "CSS", ext: "css", monaco: "css", piston: "", tabSize: 2, main: "styles.css" },
  html: { id: "html", label: "HTML", ext: "html", monaco: "html", piston: "", tabSize: 2, main: "index.html" },
};

const EXT = {
  java: "java",
  py: "python",
  python: "python",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
};

export function languageById(id) {
  return LANGUAGES.find((item) => item.id === id) || LANGUAGES[0];
}

export function languageFromName(name = "") {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const frontend = FRONTEND_EXT[ext];
  if (frontend) return frontend;
  return LANGUAGES.find((item) => item.id === EXT[ext]) || {
    id: "plaintext",
    label: "Text",
    ext,
    monaco: "plaintext",
    piston: "",
    tabSize: 2,
    main: name,
  };
}

export function filesForLanguage(files, languageId) {
  return (files || []).filter((file) => languageFromName(file.name).id === languageId);
}

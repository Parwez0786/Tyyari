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
  json: { id: "json", label: "JSON", ext: "json", monaco: "json", piston: "", tabSize: 2, main: "data.json" },
};

const EXT = {
  java: "java",
  py: "python",
  python: "python",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  h: "cpp",
  hpp: "cpp",
  hh: "cpp",
};

export function languageById(id) {
  return LANGUAGES.find((item) => item.id === id) || LANGUAGES[0];
}

export function languageFromName(name = "") {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  const frontend = FRONTEND_EXT[ext];
  if (frontend) return frontend;
  const found = LANGUAGES.find((item) => item.id === EXT[ext]);
  if (found) return found;
  return {
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

export function classNameFromFile(name) {
  const base = basename(name).replace(/\.[^.]+$/, "");
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(base) ? base : "Main";
}

export function starterFor(name, title = "") {
  const lang = languageFromName(name);
  const note = title ? ` // ${title}` : "";
  if (lang.id === "java") {
    const cls = classNameFromFile(name);
    if (cls === "Main") {
      return `import java.util.*;

public class Main {${note}
    public static void main(String[] args) {
        System.out.println("Ready");
    }
}
`;
    }
    return `public class ${cls} {
    
}
`;
  }
  if (lang.id === "python") {
    const module = classNameFromFile(name).toLowerCase();
    if (module === "main") {
      return `def main():
    print("Ready")


if __name__ == "__main__":
    main()
`;
    }
    return `class ${classNameFromFile(name)}:
    pass
`;
  }
  if (lang.id === "cpp") {
    const cls = classNameFromFile(name);
    const header = /\.(h|hpp|hh)$/i.test(name);
    if (cls.toLowerCase() === "main" && !header) {
      return `#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    cout << "Ready" << endl;
    return 0;
}
`;
    }
    if (header) {
      return `#pragma once

class ${cls} {
public:
    ${cls}() = default;
};
`;
    }
    return `class ${cls} {
public:
    ${cls}() = default;
};
`;
  }
  return "";
}

export function dsaStarterFor(languageId, title = "") {
  const note = title ? ` ${title}` : "";
  if (languageId === "python") {
    return `import sys

def solve():
    data = sys.stdin.read().split()
    #${note}
    # Read input from the testcase, then print the answer.


if __name__ == "__main__":
    solve()
`;
  }
  if (languageId === "cpp") {
    return `#include <iostream>
#include <string>
#include <vector>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    //${note}
    // Read input from the testcase, then print the answer.
    return 0;
}
`;
  }
  return `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner in = new Scanner(System.in);
        //${note}
        // Read input from the testcase, then print the answer.
    }
}
`;
}

export function frontendStarterFor(name, title = "") {
  const note = title ? ` // ${title}` : "";
  if (/\.css$/i.test(name)) {
    return `* { box-sizing: border-box; }
html, body, #root { margin: 0; min-height: 100%; }
body {
  font-family: Inter, system-ui, sans-serif;
  background: #f8fafc;
  color: #0f172a;
}
.app {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
}
`;
  }
  if (/(^|\/)App\.(jsx?|tsx?)$/i.test(name)) {
    return `export default function App() {${note}
  return (
    <div className="app">
      <h1>Frontend round</h1>
      <p>Edit App.js and styles.css, then click Run Code to refresh the preview.</p>
    </div>
  );
}
`;
  }
  const cls = classNameFromFile(name);
  return `export default function ${cls}() {
  return <div>${cls}</div>;
}
`;
}

export function frontendDefaultFiles(title = "") {
  return [
    { id: newFileId(), type: "file", name: "App.js", content: frontendStarterFor("App.js", title) },
    { id: newFileId(), type: "file", name: "styles.css", content: frontendStarterFor("styles.css", title) },
  ];
}

export function defaultFiles(title, languageId = "java") {
  const lang = languageById(languageId);
  return [
    {
      id: newFileId(),
      type: "file",
      name: lang.main,
      content: starterFor(lang.main, title),
    },
  ];
}

export function newFileId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `file-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function basename(path = "") {
  return String(path).replace(/\\/g, "/").split("/").filter(Boolean).pop() || "";
}

export function dirname(path = "") {
  const parts = String(path).replace(/\\/g, "/").split("/").filter(Boolean);
  parts.pop();
  return parts.join("/");
}

export function joinPath(...parts) {
  return parts
    .flatMap((part) => String(part || "").replace(/\\/g, "/").split("/"))
    .filter((part) => part && part !== ".")
    .join("/");
}

export function isFolder(entry) {
  return entry?.type === "folder";
}

export function isFile(entry) {
  return !isFolder(entry);
}

export function normalizeFolderPath(raw, parent = "") {
  const segs = String(raw || "")
    .trim()
    .replace(/\\/g, "/")
    .split("/")
    .map((part) => part.replace(/[^\w.\-]/g, ""))
    .filter((part) => part && part !== "." && part !== "..");
  if (!segs.length) return "";
  return joinPath(parent, ...segs);
}

export function normalizeFilePath(raw, parent = "", fallbackExt = "java") {
  const segs = String(raw || "")
    .trim()
    .replace(/\\/g, "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..");
  if (!segs.length) return "";
  let last = segs.pop().replace(/[^\w.\-]/g, "").replace(/\s+/g, "");
  if (!last) return "";
  if (!last.includes(".")) last = `${last}.${fallbackExt}`;
  const dirs = segs.map((part) => part.replace(/[^\w.\-]/g, "")).filter(Boolean);
  return joinPath(parent, ...dirs, last);
}

export function normalizeFilename(raw, fallbackExt = "java") {
  return basename(normalizeFilePath(raw, "", fallbackExt));
}

export function buildTree(entries) {
  const root = { name: "", path: "", type: "folder", children: [], id: "root" };
  const folders = new Map([["", root]]);

  function ensureFolder(path) {
    if (folders.has(path)) return folders.get(path);
    const parent = ensureFolder(dirname(path));
    const node = {
      name: basename(path),
      path,
      type: "folder",
      children: [],
      id: `folder:${path}`,
    };
    parent.children.push(node);
    folders.set(path, node);
    return node;
  }

  for (const entry of entries || []) {
    const path = entry.name || "";
    if (isFolder(entry)) {
      const node = ensureFolder(path);
      node.id = entry.id;
      node.entry = entry;
      continue;
    }
    const parent = ensureFolder(dirname(path));
    parent.children.push({
      name: basename(path),
      path,
      type: "file",
      id: entry.id,
      entry,
      children: [],
    });
  }

  function sortNode(node) {
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sortNode);
  }
  sortNode(root);
  return root.children;
}

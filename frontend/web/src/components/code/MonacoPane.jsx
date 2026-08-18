import { useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import { useThemeStore } from "../../stores/themeStore";
import { languageFromName } from "./languages";

loader.config({
  paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs" },
});

function defineThemes(monaco) {
  monaco.editor.defineTheme("tyyari-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#000000",
      "editor.foreground": "#e5e7eb",
      "editor.lineHighlightBackground": "#181818",
      "editor.selectionBackground": "#f9731633",
      "editor.inactiveSelectionBackground": "#f973161a",
      "editorCursor.foreground": "#f97316",
      "editorLineNumber.foreground": "#6b7280",
      "editorLineNumber.activeForeground": "#f97316",
      "editorGutter.background": "#000000",
      "editorWidget.background": "#181818",
      "editorWidget.border": "#262626",
      "editorSuggestWidget.background": "#181818",
      "editorSuggestWidget.border": "#262626",
      "editorSuggestWidget.selectedBackground": "#262626",
      "input.background": "#181818",
      "dropdown.background": "#181818",
      "minimap.background": "#000000",
    },
  });
  monaco.editor.defineTheme("tyyari-light", {
    base: "vs",
    inherit: true,
    rules: [],
    colors: {
      "editor.background": "#ffffff",
      "editor.foreground": "#0f172a",
      "editor.lineHighlightBackground": "#f8fafc",
      "editor.selectionBackground": "#f9731630",
      "editorCursor.foreground": "#ea580c",
      "editorLineNumber.foreground": "#94a3b8",
      "editorLineNumber.activeForeground": "#ea580c",
      "editorGutter.background": "#ffffff",
    },
  });
}

export default function MonacoPane({ file, onChange, onRun }) {
  const theme = useThemeStore((s) => s.theme);
  const lang = languageFromName(file?.name);
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;

  function handleMount(editor, monaco) {
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => onRunRef.current?.());
  }

  if (!file) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-mute">
        Add a file to start coding.
      </div>
    );
  }

  return (
    <div className="tyyari-monaco h-full min-h-0">
      <Editor
        height="100%"
        path={file.name}
        language={lang.monaco}
        value={file.content}
        onChange={(value) => onChange(value ?? "")}
        theme={theme === "dark" ? "tyyari-dark" : "tyyari-light"}
        beforeMount={defineThemes}
        onMount={handleMount}
        loading={<p className="p-4 text-sm text-mute">Loading editor…</p>}
        options={{
          fontSize: 14,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
          tabSize: lang.tabSize,
          minimap: { enabled: false },
          automaticLayout: true,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          padding: { top: 12, bottom: 12 },
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          matchBrackets: "always",
          formatOnPaste: true,
          suggest: { preview: true },
          quickSuggestions: true,
          folding: true,
          glyphMargin: false,
          overviewRulerLanes: 0,
        }}
      />
    </div>
  );
}

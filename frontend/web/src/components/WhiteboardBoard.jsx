import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useThemeStore } from "../stores/themeStore";

const Excalidraw = lazy(async () => {
  if (typeof window !== "undefined" && !window.EXCALIDRAW_ASSET_PATH) {
    window.EXCALIDRAW_ASSET_PATH = "https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw-assets/";
  }
  const mod = await import("@excalidraw/excalidraw");
  const Board = mod.Excalidraw || mod.default?.Excalidraw || mod.default;
  return { default: Board };
});

function themeAppState(theme) {
  const dark = theme === "dark";
  return {
    theme,
    viewBackgroundColor: dark ? "#000000" : "#ffffff",
    currentItemStrokeColor: dark ? "#ffffff" : "#1e1e1e",
    currentItemBackgroundColor: "transparent",
  };
}

function loadScene(key, theme) {
  const themed = themeAppState(theme);
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "{}");
    if (Array.isArray(saved.elements)) {
      return {
        elements: saved.elements,
        appState: {
          ...(saved.appState || {}),
          ...themed,
        },
        files: saved.files || {},
      };
    }
  } catch {
    /* ignore */
  }
  return { appState: themed };
}

export default function WhiteboardBoard({ storageKey, onApi }) {
  const theme = useThemeStore((s) => s.theme);
  const themeRef = useRef(theme);
  const [ready, setReady] = useState(false);
  const apiRef = useRef(null);
  const saveTimer = useRef(null);
  const initialData = useMemo(() => loadScene(storageKey, theme), [storageKey, theme]);

  themeRef.current = theme;

  useEffect(() => {
    setReady(true);
  }, []);

  const applyTheme = useCallback((api, nextTheme) => {
    api?.updateScene?.({ appState: themeAppState(nextTheme) });
  }, []);

  useEffect(() => {
    applyTheme(apiRef.current, theme);
  }, [applyTheme, theme]);

  const download = useCallback(async () => {
    const api = apiRef.current;
    if (!api) return;
    const mod = await import("@excalidraw/excalidraw");
    const exportToBlob = mod.exportToBlob;
    if (!exportToBlob) return;
    const blob = await exportToBlob({
      elements: api.getSceneElements(),
      appState: { ...api.getAppState(), exportWithDarkMode: theme === "dark" },
      files: api.getFiles(),
      mimeType: "image/png",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "whiteboard.png";
    link.click();
    URL.revokeObjectURL(url);
  }, [theme]);

  const getState = useCallback(() => {
    const api = apiRef.current;
    if (!api) {
      try {
        return JSON.parse(localStorage.getItem(storageKey) || "{}");
      } catch {
        return {};
      }
    }
    const appState = api.getAppState?.() || {};
    return {
      elements: api.getSceneElements?.() || [],
      files: api.getFiles?.() || {},
      appState: {
        currentItemStrokeColor: appState.currentItemStrokeColor,
        currentItemBackgroundColor: appState.currentItemBackgroundColor,
        zoom: appState.zoom,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
      },
    };
  }, [storageKey]);

  useEffect(() => {
    onApi?.({ download, getState });
  }, [download, getState, onApi]);

  const onChange = useCallback(
    (elements, appState, files) => {
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            elements,
            files,
            appState: {
              currentItemStrokeColor: appState.currentItemStrokeColor,
              currentItemBackgroundColor: appState.currentItemBackgroundColor,
              zoom: appState.zoom,
              scrollX: appState.scrollX,
              scrollY: appState.scrollY,
            },
          }),
        );
      }, 400);
    },
    [storageKey],
  );

  return (
    <section className="h-full min-h-0 overflow-hidden bg-canvas">
      <div className="tyyari-board h-full min-h-0 w-full">
        {ready ? (
          <Suspense fallback={<p className="p-6 text-sm text-mute">Loading whiteboard…</p>}>
            <Excalidraw
              key={`${storageKey}-${theme}`}
              theme={theme}
              initialData={initialData}
              onChange={onChange}
              excalidrawAPI={(api) => {
                apiRef.current = api;
                applyTheme(api, themeRef.current);
              }}
              UIOptions={{
                canvasActions: {
                  toggleTheme: false,
                  changeViewBackgroundColor: false,
                  loadScene: true,
                  saveAsImage: true,
                },
              }}
            />
          </Suspense>
        ) : (
          <p className="p-6 text-sm text-mute">Loading whiteboard…</p>
        )}
      </div>
    </section>
  );
}

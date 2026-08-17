import { useEffect, useRef, useState } from "react";
import { authApi } from "../services/api";

let gisPromise;

function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load Google"));
    document.head.appendChild(script);
  });
  return gisPromise;
}

export default function GoogleButton({ onCredential }) {
  const slot = useRef(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    authApi.publicConfig().then((res) => setConfig(res.data)).catch(() => setConfig({ googleEnabled: false }));
  }, []);

  useEffect(() => {
    if (!config?.googleEnabled || !config.googleClientId || !slot.current) return;
    let cancelled = false;
    loadGis()
      .then(() => {
        if (cancelled || !slot.current) return;
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: (response) => onCredential(response.credential),
          ux_mode: "popup",
        });
        slot.current.innerHTML = "";
        window.google.accounts.id.renderButton(slot.current, {
          theme: "outline",
          size: "large",
          width: 380,
          text: "continue_with",
          shape: "rectangular",
        });
      })
      .catch((err) => setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [config, onCredential]);

  if (!config) return null;
  if (!config.googleEnabled) return null;

  return (
    <div className="relative">
      <button type="button" className="btn-social" onClick={() => slot.current?.querySelector("div[role=button], iframe")?.click()}>
        <GoogleMark />
        Continue with Google
      </button>
      <div ref={slot} className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" />
      {error && <p className="mt-2 text-xs text-hard">{error}</p>}
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5Z" />
      <path fill="#FF3D00" d="M6.3 14.7 12.9 19.6C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.9 26.8 37 24 37c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.8-6.5 7.4l6.2 5.2C38.9 37.1 44 31.4 44 24c0-1.2-.1-2.3-.4-3.5Z" />
    </svg>
  );
}

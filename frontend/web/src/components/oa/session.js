const key = (id) => `tyyari.oa.session.${id}`;

export function loadSession(id) {
  try {
    const raw = JSON.parse(localStorage.getItem(key(id)) || "null");
    if (!raw || typeof raw !== "object") return null;
    return raw;
  } catch {
    return null;
  }
}

export function saveSession(id, session) {
  localStorage.setItem(key(id), JSON.stringify(session));
}

export function startSession(id, durationMinutes) {
  const session = {
    startedAt: Date.now(),
    durationMs: Math.max(1, durationMinutes) * 60 * 1000,
    index: 0,
    submittedAt: null,
  };
  saveSession(id, session);
  return session;
}

export function remainingMs(session) {
  if (!session || session.submittedAt) return 0;
  return Math.max(0, session.startedAt + session.durationMs - Date.now());
}

export function isExpired(session) {
  return Boolean(session) && !session.submittedAt && remainingMs(session) <= 0;
}

export function isActive(session) {
  return Boolean(session) && !session.submittedAt && remainingMs(session) > 0;
}

export function submitSession(id) {
  const session = loadSession(id);
  if (!session) return null;
  if (!session.submittedAt) {
    session.submittedAt = Date.now();
    saveSession(id, session);
  }
  return session;
}

export function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

export async function enterFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
    }
  } catch {
    /* ignore */
  }
}

export async function exitFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen?.();
    }
  } catch {
    /* ignore */
  }
}


import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Mark } from "./Logo";

const FooterLock = createContext({ acquire: () => () => {}, locked: false });

export function FooterLockProvider({ children }) {
  const [locks, setLocks] = useState(0);
  const acquire = useCallback(() => {
    setLocks((n) => n + 1);
    return () => setLocks((n) => Math.max(0, n - 1));
  }, []);
  const value = useMemo(() => ({ acquire, locked: locks > 0 }), [acquire, locks]);
  return <FooterLock.Provider value={value}>{children}</FooterLock.Provider>;
}

export function useFooterLocked() {
  return useContext(FooterLock).locked;
}

export default function Loader({
  fill = false,
  screen = false,
  compact = false,
  label,
  className = "",
}) {
  const { acquire } = useContext(FooterLock);
  useEffect(() => acquire(), [acquire]);

  const wrap = screen
    ? "flex min-h-screen w-full items-center justify-center"
    : fill
      ? "flex min-h-[min(32rem,calc(100vh-8rem))] w-full flex-1 items-center justify-center"
      : compact
        ? "flex w-full items-center justify-center py-10"
        : "flex min-h-[18rem] w-full items-center justify-center";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label || "Loading"}
      className={`${wrap} ${className}`}
    >
      <div className="flex flex-col items-center gap-3">
        <div className={`relative flex items-center justify-center ${compact ? "h-10 w-10" : "h-12 w-12"}`}>
          <span className={`tyyari-loader ${compact ? "tyyari-loader-sm" : ""}`} />
          <Mark className={compact ? "h-7 w-7" : "h-8 w-8"} />
        </div>
        {label ? <p className="text-sm text-mute">{label}</p> : null}
      </div>
    </div>
  );
}

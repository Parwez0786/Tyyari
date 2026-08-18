import { useEffect, useRef, useState } from "react";
import { formatClock, remainingMs } from "./session";

export default function ExamTimer({ session, onExpire }) {
  const [left, setLeft] = useState(() => remainingMs(session));
  const fired = useRef(false);

  useEffect(() => {
    fired.current = false;
    setLeft(remainingMs(session));
    const id = setInterval(() => setLeft(remainingMs(session)), 250);
    return () => clearInterval(id);
  }, [session?.startedAt, session?.durationMs, session?.submittedAt]);

  useEffect(() => {
    if (left > 0 || fired.current || !session || session.submittedAt) return;
    fired.current = true;
    onExpire?.();
  }, [left, session, onExpire]);

  const urgent = left > 0 && left <= 5 * 60 * 1000;
  return (
    <p className={`font-mono text-sm font-bold tabular-nums ${urgent ? "text-rose-400" : "text-ink"}`}>
      {formatClock(left)}
    </p>
  );
}

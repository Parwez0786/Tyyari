import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8080";

export function avatarSrc(avatar) {
  if (!avatar) return "";
  if (/^(https?:|data:|blob:)/i.test(avatar)) return avatar;
  return `${API}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
}

export default function Avatar({ name = "", email = "", src = "", size = "sm", square = false }) {
  const href = avatarSrc(src);
  const [broken, setBroken] = useState(false);
  useEffect(() => {
    setBroken(false);
  }, [href]);

  const source = (name || email || "T").trim();
  const initial = source.charAt(0).toUpperCase();
  const dim = size === "lg" ? "h-14 w-14 text-xl" : "h-9 w-9 text-sm";
  const radius = square ? "rounded-2xl" : "rounded-full";

  if (href && !broken) {
    return (
      <img
        src={href}
        alt=""
        className={`inline-block shrink-0 object-cover ${dim} ${radius} bg-orange-500`}
        onError={() => setBroken(true)}
      />
    );
  }

  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${dim} ${radius} bg-orange-500 font-bold text-white`}>
      {initial}
    </span>
  );
}

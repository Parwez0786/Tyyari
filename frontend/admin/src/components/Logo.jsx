import { Link } from "react-router-dom";

export default function Logo({ to = "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <svg className="h-8 w-8 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#f97316" />
        <path d="M8 9.75h16M16 9.75v13.5" stroke="#fff" strokeWidth="2.75" strokeLinecap="round" />
        <circle cx="23.25" cy="22.5" r="5.35" fill="#fff" />
        <path d="M20.95 22.55 22.5 24.1l3.15-3.25" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[17px] font-bold tracking-tight">Tyyari</span>
    </Link>
  );
}

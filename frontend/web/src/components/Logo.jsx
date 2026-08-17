import { Link } from "react-router-dom";

export default function Logo({ to = "/" }) {
  return (
    <Link to={to} className="flex shrink-0 items-center gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-sm font-extrabold text-white shadow-sm shadow-orange-500/30">
        T
      </span>
      <span className="text-[17px] font-extrabold tracking-tight">Tyyari</span>
    </Link>
  );
}

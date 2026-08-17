import { Link } from "react-router-dom";

export default function Logo({ to = "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-extrabold text-white">T</span>
      <span className="text-[17px] font-bold tracking-tight">Tyyari</span>
    </Link>
  );
}

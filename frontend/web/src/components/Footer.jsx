import { Link } from "react-router-dom";
import Logo from "./Logo";

const PRACTICE = [
  { to: "/practice/HLD", label: "System Design" },
  { to: "/practice/LLD", label: "Low Level Design" },
  { to: "/practice/DSA", label: "DSA" },
  { to: "/practice/FRONTEND", label: "Frontend" },
  { to: "/practice/CS", label: "CS Fundamentals" },
  { to: "/practice/OA", label: "Online Assessment" },
];

const SHEETS = [
  { to: "/sheets/hld-core-sheet", label: "HLD Core" },
  { to: "/sheets/lld-machine-coding", label: "LLD Machine Coding" },
  { to: "/sheets/dsa-sde-sheet", label: "SDE-1 DSA" },
  { to: "/sheets/frontend-ui-sheet", label: "Frontend UI" },
];

export default function Footer({ signedIn = false }) {
  const home = signedIn ? "/dashboard" : "/";

  return (
    <footer className="mt-10 border-t border-line bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.9fr_0.9fr_0.8fr]">
        <div>
          <Logo to={home} />
          <p className="mt-3 max-w-xs text-sm leading-6 text-mute">
            SDE interview prep: DSA, system design, frontend, CS quizzes, and camera-gated OAs.
          </p>
          <p className="mt-4 font-hand text-xl text-brand">Come back tomorrow.</p>
        </div>
        <FooterCol title="Practice" links={PRACTICE} />
        <FooterCol title="Sheets" links={SHEETS} />
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">Account</p>
          <ul className="mt-3 grid gap-2 text-sm">
            {signedIn ? (
              <>
                <li><Link to="/dashboard" className="text-ink hover:text-brand">Dashboard</Link></li>
                <li><Link to="/learn" className="text-ink hover:text-brand">Roadmap</Link></li>
                <li><Link to="/practice" className="text-ink hover:text-brand">Practice library</Link></li>
                <li><Link to="/onboarding" className="text-ink hover:text-brand">Profile</Link></li>
                <li><Link to="/premium" className="text-ink hover:text-brand">Premium</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/register" className="text-ink hover:text-brand">Get started free</Link></li>
                <li><Link to="/login" className="text-ink hover:text-brand">Sign in</Link></li>
                <li><Link to="/learn" className="text-ink hover:text-brand">Roadmap</Link></li>
                <li><Link to="/premium" className="text-ink hover:text-brand">Premium</Link></li>
              </>
            )}
            <li className="text-mute">Mock interview · Coming soon</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <p className="text-xs text-mute">© {new Date().getFullYear()} Tyyari. Built for SDE interviews.</p>
          <p className="flex flex-wrap gap-3 text-xs text-mute">
            <Link to="/privacy" className="hover:text-brand">Privacy</Link>
            <Link to="/terms" className="hover:text-brand">Terms</Link>
            <span>Practice is the library. Sheets are the grind.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mute">{title}</p>
      <ul className="mt-3 grid gap-2 text-sm">
        {links.map((item) => (
          <li key={item.to}>
            <Link to={item.to} className="text-ink hover:text-brand">{item.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

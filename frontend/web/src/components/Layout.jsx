import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi, userApi } from "../services/api";
import { useAuthStore } from "../stores/authStore";
import { queryClient } from "../queryClient";
import AppMenu from "./AppMenu";
import Avatar from "./Avatar";
import Footer from "./Footer";
import { FooterLockProvider, useFooterLocked } from "./Loader";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function Layout(props) {
  return (
    <FooterLockProvider>
      <LayoutFrame {...props} />
    </FooterLockProvider>
  );
}

function LayoutFrame({ children, publicPage = false, wide = false, fill = false, hideNav = false }) {
  const navigate = useNavigate();
  const { accessToken, refreshToken, clear } = useAuthStore();
  const authed = Boolean(accessToken) && !publicPage;
  const [menuOpen, setMenuOpen] = useState(false);
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: userApi.profile,
    enabled: authed,
  });
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: authApi.me,
    enabled: authed,
  });
  const name = profileQuery.data?.data?.name || "";
  const avatar = profileQuery.data?.data?.avatar || "";
  const email = meQuery.data?.data?.email || "";

  async function logout() {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      /* ignore */
    }
    clear();
    queryClient.clear();
    navigate("/");
  }

  const footerLocked = useFooterLocked();
  const showFooter = !fill && !hideNav && !footerLocked;

  return (
    <div className="flex min-h-screen flex-col">
      {!hideNav && (
        <header className="sticky top-0 z-20 bg-surface">
          <div className="flex w-full min-w-0 items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Logo to={authed ? "/dashboard" : "/"} />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <ThemeToggle compact />
              {authed && (
                <button type="button" onClick={() => navigate("/onboarding")} aria-label="Profile">
                  <Avatar name={name} email={email} src={avatar} />
                </button>
              )}
              {!authed && publicPage && (
                <Link to="/register" className="btn-black !h-9 !px-3.5 !py-0 text-sm">
                  Get started
                </Link>
              )}
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-field"
                aria-label="Open menu"
                onClick={() => setMenuOpen(true)}
              >
                <MenuIcon />
              </button>
            </div>
          </div>
        </header>
      )}
      {!hideNav && (
        <AppMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          authed={authed}
          name={name}
          email={email}
          avatar={avatar}
          onLogout={logout}
        />
      )}
      <main
        className={
          fill
            ? hideNav
              ? "flex h-dvh min-h-0 w-full min-w-0 flex-col overflow-hidden p-0"
              : "flex h-[calc(100dvh-61px)] min-h-0 w-full min-w-0 flex-col overflow-hidden px-2 py-2 sm:px-3 sm:py-3"
            : wide
              ? "mx-auto w-full min-w-0 max-w-[1600px] flex-1 px-4 py-4 sm:px-6"
              : "mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
        }
      >
        {children}
      </main>
      {showFooter && <Footer signedIn={Boolean(accessToken)} />}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

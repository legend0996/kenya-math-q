"use client";

import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, LayoutDashboard, LogIn, UserPlus, User,
  LogOut, Mail, Phone, ChevronRight,
} from "lucide-react";
import Image from "./Image";

type User = { role?: string; name?: string };

const readTokenUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1])) as User;
  } catch {
    return null;
  }
};

const MAIN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/competition", label: "Competition" },
  { href: "/schools", label: "Schools" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/tuition", label: "Tuition" },
  { href: "/materials", label: "Materials" },
];

const UTILITY_LINKS = [
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQs" },
  { href: "/contact", label: "Contact" },
];

// Pages that should light up the "Competition" area when visited.
const DASHBOARD_PATHS = ["/dashboard", "/exam", "/contests", "/student-review", "/settings", "/support", "/parent-dashboard", "/school-dashboard", "/owner-dashboard"];

export default function Navbar() {
  const [user, setUser] = useState<User | null>(() => readTokenUser());
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    if (href === "/competition") {
      return location.pathname === "/competition" || DASHBOARD_PATHS.includes(location.pathname);
    }
    return location.pathname === href;
  };

  const linkClass = (href: string) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
      isActive(href)
        ? "text-primary-dark bg-pumpkin-spice-900/70 font-semibold"
        : "text-charcoal-600 hover:text-primary-dark hover:bg-ghost-white-500"
    }`;

  const handleProfile = () => {
    if (!user) { window.location.href = "/login"; return; }
    window.location.href =
      user.role === "school" ? "/school-dashboard"
      : user.role === "parent" ? "/parent-dashboard"
      : user.role === "owner" || user.role === "admin" ? "/owner-dashboard"
      : "/dashboard";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/";
  };

  const dashboardPath =
    user?.role === "school" ? "/school-dashboard"
    : user?.role === "parent" ? "/parent-dashboard"
    : user?.role === "owner" || user?.role === "admin" ? "/owner-dashboard"
    : "/dashboard";

  return (
    <header className="fixed top-0 left-0 w-full z-50">
      {/* ── Utility top bar ── */}
      <div className="hidden md:block bg-charcoal-200 text-white">
        <div className="max-w-7xl mx-auto px-6 h-9 flex items-center justify-between text-xs">
          <div className="flex items-center gap-5">
            <a href="mailto:info@kenyamathquest.co.ke" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
              <Mail size={13} /> info@kenyamathquest.co.ke
            </a>
            <a href="tel:+254112020336" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
              <Phone size={13} /> +254 112 020336
            </a>
          </div>
          <nav className="flex items-center gap-4">
            {UTILITY_LINKS.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className={`transition-colors ${
                  isActive(l.href) ? "text-pumpkin-spice-600 font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Main navbar ── */}
      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? "bg-white shadow-soft border-b border-border"
            : "bg-white border-b border-border"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <Image
              src="/logo.jpeg"
              alt="Kenya Math Quest"
              className="rounded-full shadow-soft ring-2 ring-pumpkin-spice-800 group-hover:ring-primary/50 transition-all"
              style={{ width: 42, height: 42 }}
            />
            <span className="font-bold text-charcoal-200 text-lg hidden sm:block tracking-tight">
              Kenya<span className="text-primary">Math</span>Quest
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {MAIN_LINKS.map((link) => (
              <Link key={link.href} to={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-charcoal-600 hover:text-primary-dark hover:bg-ghost-white-500 rounded-lg transition-all"
                >
                  <LogIn size={15} />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark shadow-soft shadow-primary/20 transition-all"
                >
                  <UserPlus size={15} />
                  Register
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleProfile}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                    DASHBOARD_PATHS.includes(location.pathname)
                      ? "text-primary-dark bg-pumpkin-spice-900/70 font-semibold"
                      : "text-charcoal-600 hover:bg-ghost-white-500"
                  }`}
                >
                  <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center">
                    <User size={13} className="text-white" />
                  </div>
                  <span className="max-w-28 truncate">{user.name || "Profile"}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  aria-label="Logout"
                >
                  <LogOut size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-charcoal-600 hover:bg-ghost-white-500 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* ── Mobile menu ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white border-b border-border shadow-card ${
          menuOpen ? "max-h-[calc(100vh-64px)] overflow-y-auto opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          {MAIN_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                isActive(link.href)
                  ? "text-primary-dark bg-pumpkin-spice-900/70 font-semibold"
                  : "text-charcoal-600 hover:text-primary-dark hover:bg-ghost-white-500"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-1 border-t border-border space-y-1">
            {UTILITY_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal-600 hover:bg-ghost-white-500 rounded-lg"
              >
                {link.label} <ChevronRight size={13} className="ml-auto text-slate-300" />
              </Link>
            ))}
          </div>
          <div className="pt-2 border-t border-border space-y-1">
            {!user ? (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal-600 hover:bg-ghost-white-500 rounded-lg">
                  <LogIn size={15} /> Login
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold bg-primary text-white rounded-lg justify-center hover:bg-primary-dark">
                  <UserPlus size={15} /> Register
                </Link>
              </>
            ) : (
              <>
                <Link to={dashboardPath} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal-600 hover:bg-ghost-white-500 rounded-lg">
                  <LayoutDashboard size={15} /> Dashboard
                </Link>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg">
                  <LogOut size={15} /> Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard, LogIn, UserPlus, User } from "lucide-react";
import Image from "next/image";

type User = { role?: string; name?: string };

const NAV_LINKS = [
  { href: "/#home",    label: "Home" },
  { href: "/#contest", label: "Contest" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/#contact", label: "Contact" },
];

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(payload);
      } catch {
        setUser(null);
      }
    }

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleProfile = () => {
    if (!user) { window.location.href = "/login"; return; }
    window.location.href = user.role === "school" ? "/school-dashboard" : "/dashboard";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/";
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-9999 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-slate-100"
          : "bg-white/80 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

        {/* ── Logo ── */}
        <a href="/" className="flex items-center gap-2.5 group">
          <Image
            src="/logo.jpeg"
            alt="Kenya Math Quest"
            width={44}
            height={44}
            className="rounded-full shadow-md ring-2 ring-slate-200 group-hover:ring-blue-300 transition-all"
          />
          <span className="font-bold text-slate-900 text-lg hidden sm:block tracking-tight">
            Kenya<span className="text-blue-600">Math</span>Quest
          </span>
        </a>

        {/* ── Desktop Links ── */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* ── Desktop CTA ── */}
        <div className="hidden md:flex items-center gap-2">
          {!user ? (
            <>
              <a
                href="/login"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <LogIn size={15} />
                Login
              </a>
              <a
                href="/register"
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200 transition-all"
              >
                <UserPlus size={15} />
                Register
              </a>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleProfile}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
              >
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center">
                  <User size={13} className="text-white" />
                </div>
                <span>{user.name || "Profile"}</span>
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-all"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── Mobile Menu ── */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white border-t border-slate-100 px-4 py-3 space-y-1 shadow-lg">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            {!user ? (
              <>
                <a href="/login" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                  <LogIn size={15} /> Login
                </a>
                <a href="/register" onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg justify-center">
                  <UserPlus size={15} /> Register
                </a>
              </>
            ) : (
              <>
                <button onClick={() => { handleProfile(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">
                  <LayoutDashboard size={15} /> Dashboard
                </button>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

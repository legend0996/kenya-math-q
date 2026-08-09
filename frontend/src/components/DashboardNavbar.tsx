import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogOut, ExternalLink, LayoutDashboard, FileQuestion, Settings, MailQuestion, Users, School, CreditCard, BarChart2, Trophy, PencilRuler, CheckCircle2, Globe } from "lucide-react";
import { fetchMe, logout } from "../utils/api";
import Image from "./Image";

type UserRole = { role?: string; name?: string };

const OWNER_LINKS = [
  { tab: "overview",  label: "Overview", href: "/owner-dashboard?tab=overview",  Icon: BarChart2 },
  { tab: "contests",  label: "Contests", href: "/owner-dashboard?tab=contests",  Icon: Trophy },
  { tab: "marking",   label: "Marking",  href: "/owner-dashboard?tab=marking",   Icon: PencilRuler },
  { tab: "results",   label: "Results",  href: "/owner-dashboard?tab=results",   Icon: CheckCircle2 },
];

const PARENT_LINKS = [
  { label: "Home",          href: "/parent-dashboard", Icon: LayoutDashboard },
  { label: "My Children",   href: "/parent-dashboard", Icon: Users },
  { label: "Payments",      href: "/parent-dashboard", Icon: CreditCard },
  { label: "Support",       href: "/support",          Icon: MailQuestion },
];

const SCHOOL_LINKS = [
  { label: "Home",               href: "/school-dashboard", Icon: LayoutDashboard },
  { label: "Students",           href: "/school-dashboard", Icon: Users },
  { label: "Contests & Results", href: "/school-dashboard", Icon: School },
  { label: "Support",            href: "/support",          Icon: MailQuestion },
];

const STUDENT_LINKS = [
  { label: "Home",         href: "/dashboard", Icon: LayoutDashboard },
  { label: "Join Contest", href: "/contests",  Icon: FileQuestion },
  { label: "Profile",      href: "/settings",  Icon: Settings },
  { label: "Support",      href: "/support",   Icon: MailQuestion },
];

export default function DashboardNavbar() {
  const [user, setUser] = useState<UserRole | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let active = true;
    fetchMe().then((u) => {
      if (!active) return;
      setUser(u ? { role: u.role, name: u.name } : null);
    });
    return () => { active = false; };
  }, [location.pathname]);

  const role = user?.role || "student";
  const isOwner = role === "owner" || role === "admin";

  const dashboardHome =
    role === "school" ? "/school-dashboard"
    : role === "parent" ? "/parent-dashboard"
    : isOwner ? "/owner-dashboard"
    : "/dashboard";

  const searchTab = new URLSearchParams(location.search).get("tab");

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const activeClass = "text-primary-dark bg-pumpkin-spice-900/70 font-semibold";
  const idleClass = "text-charcoal-600 hover:text-primary-dark hover:bg-ghost-white-500";

  const pageActive = (href: string) =>
    href === "/support"
      ? location.pathname === "/support"
      : href === "/dashboard"
        ? location.pathname === "/dashboard"
        : location.pathname === href || location.pathname.startsWith(href + "/");

  const linkClass = (isActive: boolean) =>
    `px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-1.5 ${isActive ? activeClass : idleClass}`;

  const ownerActive = (tab: string) => location.pathname === "/owner-dashboard" && searchTab === tab;

  const renderLinks = () => {
    if (isOwner) {
      return OWNER_LINKS.map(({ tab, label, Icon }) => (
        <Link key={tab} to={`/owner-dashboard?tab=${tab}`} className={linkClass(ownerActive(tab))}>
          <Icon size={15} /> {label}
        </Link>
      ));
    }
    const links = role === "school" ? SCHOOL_LINKS : role === "parent" ? PARENT_LINKS : STUDENT_LINKS;
    return links.map(({ label, href, Icon }) => (
      <Link key={label} to={href} className={linkClass(pageActive(href))}>
        <Icon size={15} /> {label}
      </Link>
    ));
  };

  return (
    <header className="sticky top-0 left-0 w-full z-50">
      <nav className="bg-white border-b border-border shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">

          {/* Logo → dashboard home */}
          <Link to={dashboardHome} className="flex items-center gap-2.5 group shrink-0">
            <Image
              src="/logo.jpeg"
              alt="Kenya Math Quest"
              className="rounded-full shadow-soft ring-2 ring-pumpkin-spice-800 group-hover:ring-primary/50 transition-all"
              style={{ width: 38, height: 38 }}
            />
            <span className="font-bold text-charcoal-200 text-lg hidden sm:block tracking-tight">
              Kenya<span className="text-primary">Math</span>Quest
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {renderLinks()}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted hover:text-primary-dark border border-border rounded-lg transition-all">
              <Globe size={14} /> View main website
            </Link>
            <span className="text-sm font-medium text-charcoal-600 max-w-28 truncate hidden xl:block">
              {user?.name || ""}
            </span>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
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
          menuOpen ? "max-h-[80vh] overflow-y-auto opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-3 space-y-1">
          {isOwner
            ? OWNER_LINKS.map(({ tab, label, Icon }) => (
                <Link key={tab} to={`/owner-dashboard?tab=${tab}`} onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg ${ownerActive(tab) ? activeClass : "text-charcoal-600 hover:bg-ghost-white-500"}`}>
                  <Icon size={15} /> {label}
                </Link>
              ))
            : (role === "school" ? SCHOOL_LINKS : role === "parent" ? PARENT_LINKS : STUDENT_LINKS).map(({ label, href, Icon }) => (
                <Link key={label} to={href} onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg ${pageActive(href) ? activeClass : "text-charcoal-600 hover:bg-ghost-white-500"}`}>
                  <Icon size={15} /> {label}
                </Link>
              ))}
          <div className="pt-2 border-t border-border space-y-1">
            <Link to="/" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-charcoal-600 hover:bg-ghost-white-500 rounded-lg">
              <ExternalLink size={15} /> View main website
            </Link>
            <button onClick={handleLogout}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg">
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
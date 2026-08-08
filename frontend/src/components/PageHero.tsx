import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  crumbs = [],
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  crumbs?: { label: string; to?: string }[];
}) {
  return (
    <section className="bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 md:py-18">
        {crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted mb-4">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight size={13} className="text-slate-300" />}
                {c.to ? (
                  <Link to={c.to} className="hover:text-primary-dark font-medium transition-colors">{c.label}</Link>
                ) : (
                  <span className="text-foreground font-medium">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && (
          <p className="text-xs font-semibold text-primary-dark uppercase tracking-widest mb-2">{eyebrow}</p>
        )}
        <h1 className="text-3xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">{title}</h1>
        {description && <p className="text-muted mt-4 max-w-2xl text-lg leading-relaxed">{description}</p>}
        {children}
      </div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}) {
  return (
    <div className={`mb-12 ${align === "center" ? "text-center mx-auto max-w-2xl" : ""}`}>
      {eyebrow && (
        <p className="text-xs font-semibold text-primary-dark uppercase tracking-widest mb-2">{eyebrow}</p>
      )}
      <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">{title}</h2>
      {description && <p className="text-muted mt-3 leading-relaxed">{description}</p>}
    </div>
  );
}

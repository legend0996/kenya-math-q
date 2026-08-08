import { type ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg" | "none";
  onClick?: () => void;
}

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({ children, className = "", hover = false, padding = "md", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-border shadow-soft
        ${paddings[padding]}
        ${hover ? "hover:shadow-lifted hover:border-border-dark hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" : ""}
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  accent?: string;
  iconBg?: string;
  sub?: string;
}

export function StatCard({ label, value, icon, accent = "text-foreground", iconBg = "bg-cool-sky-50 text-cool-sky-400", sub }: StatCardProps) {
  return (
    <Card className="flex items-start gap-4">
      {icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm text-muted font-medium truncate">{label}</p>
        <p className={`text-2xl font-bold tracking-tight mt-0.5 ${accent}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

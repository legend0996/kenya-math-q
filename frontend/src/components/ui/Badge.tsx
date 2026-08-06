import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple" | "accent";

const styles: Record<BadgeVariant, string> = {
  default: "bg-ghost-white-500 text-charcoal-600",
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border border-amber-200",
  danger: "bg-red-50 text-red-700 border border-red-200",
  info: "bg-cool-sky-50 text-cool-sky-300 border border-cool-sky-800",
  purple: "bg-violet-50 text-violet-700 border border-violet-200",
  accent: "bg-pumpkin-spice-900/60 text-primary-dark border border-pumpkin-spice-800",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  dot?: boolean;
  className?: string;
}

const dotColor: Record<BadgeVariant, string> = {
  default: "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-cool-sky-400",
  purple: "bg-violet-500",
  accent: "bg-pumpkin-spice-500",
};

export function Badge({ variant = "default", dot = false, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-xs font-semibold select-none whitespace-nowrap
        ${styles[variant]}
        ${className}
      `}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full pulse-dot ${dotColor[variant]}`} />}
      {children}
    </span>
  );
}

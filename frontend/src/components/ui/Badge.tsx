type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "purple";

const styles: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-600",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100  text-amber-700",
  danger:  "bg-red-100    text-red-700",
  info:    "bg-blue-100   text-blue-700",
  purple:  "bg-violet-100 text-violet-700",
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ variant = "default", dot = false, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full
        text-xs font-semibold select-none
        ${styles[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full pulse-dot ${
          variant === "success" ? "bg-emerald-500" :
          variant === "warning" ? "bg-amber-500" :
          variant === "danger"  ? "bg-red-500" :
          variant === "info"    ? "bg-blue-500" :
          variant === "purple"  ? "bg-violet-500" : "bg-slate-400"
        }`} />
      )}
      {children}
    </span>
  );
}

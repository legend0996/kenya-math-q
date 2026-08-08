import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "light";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center font-semibold rounded-xl " +
  "transition-all duration-200 select-none whitespace-nowrap " +
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cool-sky-400";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-dark shadow-soft shadow-primary/20 active:scale-[0.98]",
  secondary:
    "bg-white border border-primary text-primary-dark hover:bg-primary-light hover:border-primary-dark shadow-soft active:scale-[0.98]",
  outline:
    "border border-border-dark text-foreground hover:border-primary hover:text-primary-dark hover:bg-pumpkin-spice-900/40 active:scale-[0.98]",
  ghost: "text-muted hover:bg-ghost-white-500 hover:text-foreground",
  danger: "bg-red-600 text-white hover:bg-red-700 shadow-soft shadow-red-800/20 active:scale-[0.98]",
  success:
    "bg-emerald-600 text-white hover:bg-emerald-700 shadow-soft shadow-emerald-800/20 active:scale-[0.98]",
  light:
    "bg-white text-primary-dark hover:bg-ghost-white-500 shadow-card active:scale-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  fullWidth = false,
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`
        ${base}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {loading ? (
        <Loader2 size={size === "lg" ? 18 : 15} className="animate-spin" />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
}

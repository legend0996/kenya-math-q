import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "outline";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:   "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-200 active:scale-[0.98]",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-[0.98]",
  danger:    "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200 active:scale-[0.98]",
  ghost:     "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  outline:   "border border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-6 py-3 text-base rounded-xl gap-2",
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
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 select-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
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

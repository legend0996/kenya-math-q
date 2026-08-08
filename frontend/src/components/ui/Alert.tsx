import type { ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, XCircle } from "lucide-react";

type AlertVariant = "success" | "error" | "info" | "warning";

const styles: Record<AlertVariant, { box: string; icon: ReactNode }> = {
  success: { box: "bg-emerald-50 border border-emerald-200 text-emerald-800", icon: <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" /> },
  error: { box: "bg-red-50 border border-red-200 text-red-800", icon: <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" /> },
  info: { box: "bg-cool-sky-50 border border-cool-sky-800 text-cool-sky-300", icon: <Info size={16} className="text-cool-sky-400 shrink-0 mt-0.5" /> },
  warning: { box: "bg-amber-50 border border-amber-200 text-amber-800", icon: <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" /> },
};

export function Alert({ variant = "info", children, className = "" }: { variant?: AlertVariant; children: ReactNode; className?: string }) {
  const s = styles[variant];
  return (
    <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-soft ${s.box} ${className}`}>
      {s.icon}
      <div className="min-w-0">{children}</div>
    </div>
  );
}

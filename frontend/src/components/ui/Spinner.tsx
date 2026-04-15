import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  className?: string;
}

export function Spinner({ size = 20, className = "" }: SpinnerProps) {
  return <Loader2 size={size} className={`animate-spin text-blue-600 ${className}`} />;
}

export function PageSpinner({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500">
      <Spinner size={28} />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-8 w-16 rounded" />
      <div className="skeleton h-3 w-32 rounded" />
    </div>
  );
}

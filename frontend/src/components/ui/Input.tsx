import { type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
}

export function Input({ label, error, hint, icon, rightSlot, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`
            w-full px-3.5 py-2.5 text-sm bg-white rounded-xl
            border transition-all duration-200 outline-none
            placeholder:text-slate-400 text-foreground shadow-soft
            ${icon ? "pl-10" : ""}
            ${rightSlot ? "pr-11" : ""}
            ${error
              ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-100"
              : "border-border focus:border-primary-dark focus:ring-4 focus:ring-pumpkin-spice-900/60"
            }
            hover:border-border-dark
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${className}
          `}
        />
        {rightSlot && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {rightSlot}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className = "", children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <select
        {...props}
        className={`
          w-full px-3.5 py-2.5 text-sm bg-white rounded-xl
          border border-border outline-none appearance-none shadow-soft
          bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22%236d6f6f%22%20viewBox%3D%220%200%2016%2016%22%3E%3Cpath%20d%3D%22M4.5%206l3.5%204%203.5-4z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_0.75rem_center] pr-9
          focus:border-primary-dark focus:ring-4 focus:ring-pumpkin-spice-900/60
          hover:border-border-dark
          transition-all duration-200 text-foreground
          disabled:bg-slate-50 disabled:cursor-not-allowed
          ${error ? "border-red-400" : ""}
          ${className}
        `}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = "", ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <textarea
        {...props}
        className={`
          w-full px-3.5 py-2.5 text-sm bg-white rounded-xl resize-none shadow-soft
          border border-border outline-none min-h-25
          focus:border-primary-dark focus:ring-4 focus:ring-pumpkin-spice-900/60
          hover:border-border-dark
          transition-all duration-200 placeholder:text-slate-400 text-foreground
          ${error ? "border-red-400" : ""}
          ${className}
        `}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

import { type InputHTMLAttributes, type ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export function Input({ label, error, hint, icon, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`
            w-full px-3.5 py-2.5 text-sm bg-white rounded-xl
            border transition-all duration-200 outline-none
            placeholder:text-slate-400 text-slate-900
            ${icon ? "pl-10" : ""}
            ${error
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            }
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${className}
          `}
        />
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
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <select
        {...props}
        className={`
          w-full px-3.5 py-2.5 text-sm bg-white rounded-xl
          border border-slate-200 outline-none
          focus:border-blue-500 focus:ring-2 focus:ring-blue-100
          transition-all duration-200 text-slate-900
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
        <label className="text-sm font-medium text-slate-700">{label}</label>
      )}
      <textarea
        {...props}
        className={`
          w-full px-3.5 py-2.5 text-sm bg-white rounded-xl resize-none
          border border-slate-200 outline-none min-h-25
          focus:border-blue-500 focus:ring-2 focus:ring-blue-100
          transition-all duration-200 placeholder:text-slate-400 text-slate-900
          ${error ? "border-red-400" : ""}
          ${className}
        `}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

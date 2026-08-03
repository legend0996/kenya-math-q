"use client";

import { useState } from "react";
import { Calculator as CalcIcon, X } from "lucide-react";

// A full-featured scientific-ish calculator that lives entirely in the
// current tab — it never opens a new tab, never steals focus, and never
// triggers the exam's visibility-change anti-cheat.
const BTNS: { l: string; o?: string; fn?: string; span?: number }[] = [
  { l: "C", fn: "clear" },
  { l: "⌫", fn: "back" },
  { l: "%", o: "%" },
  { l: "÷", o: "/" },
  { l: "7", o: "7" },
  { l: "8", o: "8" },
  { l: "9", o: "9" },
  { l: "×", o: "*" },
  { l: "4", o: "4" },
  { l: "5", o: "5" },
  { l: "6", o: "6" },
  { l: "−", o: "-" },
  { l: "1", o: "1" },
  { l: "2", o: "2" },
  { l: "3", o: "3" },
  { l: "+", o: "+" },
  { l: "0", o: "0" },
  { l: ".", o: "." },
  { l: "(", o: "(" },
  { l: ")", o: ")" },
  { l: "x²", o: "**2" },
  { l: "√", fn: "sqrt" },
  { l: "=", fn: "eq" },
];

// Safe integer evaluator supporting + - * / ( ) % and exponent pow via "**"
//2 integer evaluator supporting + - * / ( ) % and power (^).
function safeEval(expr: string): number | null {
  const cleaned = String(expr).replace(/x²/g, "**2");
  // Strip everything that isn't a digit, operator, paren, dot or percent.
  const sanitized = cleaned.replace(/[^0-9+\-*/().%]/g, "").replace(/\s+/g, "");
  if (!sanitized) return null;
  if (!/^[0-9+\-*/().%]+$/.test(sanitized)) return null;
  try {
    const val = Function(`"use strict"; return (${sanitized});`)();
    if (typeof val === "number" && Number.isFinite(val)) return Math.round(val * 1e9) / 1e9;
    return null;
  } catch {
    return null;
  }
}

export default function CalculatorWidget() {
  const [open, setOpen] = useState(false);
  const [expr, setExpr] = useState("");
  const [ans, setAns] = useState<string | null>(null);

  const press = (b: { o?: string; fn?: string }) => {
    if (b.fn === "clear") { setExpr(""); setAns(null); return; }
    if (b.fn === "back") { setExpr((e) => e.slice(0, -1)); return; }
    if (b.fn === "sqrt") {
      const cur = safeEval(expr);
      if (cur != null) { setAns(String(Math.round(Math.sqrt(cur) * 1e9) / 1e9)); }
      return;
    }
    if (b.fn === "=") {
      const cur = safeEval(expr);
      setAns(cur != null ? String(cur) : "Error");
      return;
    }
    setExpr((e) => e + (b.o || ""));
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Calculator"
        title="Calculator"
        className="fixed bottom-5 left-5 z-50 h-14 w-14 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-700 flex items-center justify-center"
      >
        {open ? <X size={24} /> : <CalcIcon size={24} />}
      </button>

      {open && (
        <div className="fixed bottom-24 left-5 z-50 w-72 rounded-2xl bg-white shadow-2xl border border-slate-200 p-3 select-none">
          <div className="text-center mb-2 px-2 py-2 rounded-xl bg-slate-100 min-h-11 flex flex-col justify-center">
            <div className="text-xs text-slate-500 text-right truncate h-4">{expr}</div>
            <div className="text-2xl font-bold text-slate-900 text-right truncate">{ans ?? "0"}</div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {BTNS.map((b, i) => (
              <button
                key={i}
                onClick={() => press(b)}
                className={`h-12 rounded-xl text-sm font-semibold transition-colors ${
                  b.fn === "=" ? "bg-blue-600 text-white" :
                  ["C", "⌫"].includes(b.l) ? "bg-red-50 text-red-600" :
                  ["+", "-", "*", "/", "%", "**2", "√"].includes(b.o || b.fn || b.l) ? "bg-slate-100 text-slate-700" :
                  b.l === "(" || b.l === ")" ? "bg-slate-100 text-slate-700" :
                  "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50"
                }`}
              >
                {b.l}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
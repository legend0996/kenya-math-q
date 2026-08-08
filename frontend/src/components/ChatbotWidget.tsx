"use client";

import { useState, useRef, useEffect } from "react";
import { apiUrl } from "../utils/api";
import { Bot, X, Send } from "lucide-react";

interface Msg { from: "user" | "bot"; text: string }

const SUGGESTIONS = [
  "How do I register?",
  "How do I pay?",
  "How do I take an exam?",
  "How do I reset my password?",
  "what is 12 * 8?",
];

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { from: "bot", text: "Hi! I'm the Kenya Math Quest assistant. Ask me anything about the site, or type something like 'what is 15*4?' and I'll solve it." },
  ]);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [msgs, open]);

  const send = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || loading) return;
    setInput("");
    setMsgs((m) => [...m, { from: "user", text: t }]);
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/assistant/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: t }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { from: "bot", text: data.answer || data.error || "Hmm, I couldn't answer that." }]);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "I'm having trouble connecting. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="AI Assistant"
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-primary text-white shadow-overlay hover:bg-primary-dark flex items-center justify-center transition-colors"
      >
        {open ? <X size={24} /> : <Bot size={24} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[22rem] max-w-[calc(100vw-2.5rem)] h-[28rem] flex flex-col bg-white rounded-2xl shadow-overlay border border-border overflow-hidden animate-fade-scale">
          <div className="flex items-center gap-3 px-4 py-3 bg-primary text-white">
            <span className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold">Math Quest Assistant</p>
              <p className="text-xs text-pumpkin-spice-900">Instant answers • no external API</p>
            </div>
          </div>

          <div ref={bodyRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] px-3 py-2 text-sm rounded-2xl whitespace-pre-wrap ${
                m.from === "user"
                  ? "ml-auto bg-primary text-white rounded-br-sm"
                  : "bg-ghost-white-500 text-charcoal-500 rounded-bl-sm"
              }`}>
                {m.text}
              </div>
            ))}
            {loading && <div className="text-xs text-muted">typing…</div>}
          </div>

          <div className="border-t border-border p-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)}
                className="px-2 py-1 text-xs bg-pumpkin-spice-900/70 text-primary-dark rounded-full hover:bg-pumpkin-spice-900 whitespace-nowrap">
                {s}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex items-center gap-2 border-t border-border px-3 py-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-pumpkin-spice-900/60 outline-none"
            />
            <button type="submit" disabled={loading}
              className="h-9 w-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark disabled:opacity-50">
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
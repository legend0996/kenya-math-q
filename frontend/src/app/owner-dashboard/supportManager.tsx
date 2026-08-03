"use client";

import { useEffect, useState, useRef } from "react";
import { apiUrl, authHeaders } from "../../utils/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Send, PersonStanding } from "lucide-react";

interface Msg {
  id: number;
  author_role: string;
  author_id: number;
  sender_name?: string;
  recipient_id?: number;
  message: string;
  created_at: string;
}

const time = (d?: string) => (d ? new Date(d).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

export default function SupportManager() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState<Record<number, string>>({});
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    const r = await fetch(apiUrl("/api/owner/support/messages"), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) setMsgs(d.messages || []);
  };
  useEffect(() => { const t = setTimeout(load, 0); return () => clearTimeout(t); }, []);
  useEffect(() => { const t = setInterval(load, 8000); return () => clearInterval(t); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const sendReply = async (m: Msg) => {
    setError("");
    const text = (reply[m.id] || "").trim();
    if (!text) return;
    const r = await fetch(apiUrl("/api/owner/support/reply"), {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ message: text, recipient_role: m.author_role !== "owner" ? m.author_role : "student", recipient_id: m.author_id }),
    });
    const d = await r.json();
    if (!d.success) setError(d.error);
    setReply((p) => ({ ...p, [m.id]: "" }));
    load();
  };

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">⚠ {error}</div>}
      <Card>
        <h3 className="font-bold text-slate-900 mb-1 inline-flex items-center gap-2">
          <PersonStanding size={16} className="text-blue-600" /> Support Inbox
        </h3>
        <p className="text-xs text-slate-400 mb-4">Messages sent by users. Reply from your admin account (needs the reply_support permission).</p>
        <div className="space-y-3 max-h-[32rem] overflow-y-auto pr-1">
          {msgs.length === 0 && <p className="text-sm text-slate-400 py-6 text-center">No support messages yet.</p>}
          {msgs.map((m) => {
            const admin = m.author_role === "owner";
            return (
              <div key={m.id} className={`border rounded-xl p-3 ${admin ? "border-blue-100 bg-blue-50/50 ml-8" : "border-slate-100 bg-white"}`}>
                <div className="flex justify-between items-start mb-1.5">
                  <span className="text-sm font-semibold text-slate-800 text-xs">
                    {admin ? "You (Support)" : `${m.sender_name || m.author_role} (${m.author_role})`}
                  </span>
                  <span className="text-[11px] text-slate-400">{time(m.created_at)}</span>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap mb-2">{m.message}</p>
                {!admin && (
                  <div className="flex gap-2">
                    <input value={reply[m.id] || ""} onChange={(e) => setReply({ ...reply, [m.id]: e.target.value })}
                      placeholder="Reply…" className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 outline-none" />
                    <Button size="sm" icon={<Send size={14} />} onClick={() => sendReply(m)}>Reply</Button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </Card>
    </div>
  );
}
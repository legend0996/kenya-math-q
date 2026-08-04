
import { useEffect, useState, useRef, useCallback } from "react";
import { apiUrl, authHeaders } from "../../utils/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Send, MessageSquare, CheckCheck, GraduationCap, School, Users } from "lucide-react";

interface Conversation {
  role: string;
  id: number;
  name: string;
  last_message?: string;
  last_time?: string;
  unread: number;
}

interface Msg {
  id: number;
  author_role: string;
  author_id: number;
  sender_name?: string;
  recipient_role?: string;
  recipient_id?: number;
  message: string;
  read_flag?: number | boolean;
  created_at: string;
}

const time = (d?: string) => (d ? new Date(d).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "");

const roleIcon = (role: string) =>
  role === "school" ? <School size={14} /> : role === "parent" ? <Users size={14} /> : <GraduationCap size={14} />;

const roleLabel = (role: string) => (role === "school" ? "School" : role === "parent" ? "Parent" : "Student");

export default function SupportManager() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConvos = useCallback(async () => {
    try {
      const r = await fetch(apiUrl("/api/owner/support/conversations"), { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setConversations(d.conversations || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadConvos();
  }, [loadConvos]);

  // Poll conversation list; if a conversation is open also refresh messages
  useEffect(() => {
    const t = setInterval(() => {
      loadConvos();
      if (active) loadThread(active.role, active.id);
    }, 8000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const loadThread = async (role: string, id: number) => {
    try {
      const r = await fetch(apiUrl(`/api/owner/support/conversations/${role}/${id}`), { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setMsgs(d.messages || []);
    } catch { /* ignore */ }
  };

  const openConversation = async (c: Conversation) => {
    setActive(c);
    setMsgs([]);
    await loadThread(c.role, c.id);
    // Mark the conversation as read so the badge clears
    try {
      await fetch(apiUrl(`/api/owner/support/conversations/${c.role}/${c.id}/read`), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({}),
      });
      loadConvos();
    } catch { /* ignore */ }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const sendReply = async () => {
    if (!active || !reply.trim()) return;
    setError("");
    setSending(true);
    try {
      const r = await fetch(apiUrl("/api/owner/support/reply"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ message: reply.trim(), recipient_role: active.role, recipient_id: active.id }),
      });
      const d = await r.json();
      if (!d.success) setError(d.error);
      setReply("");
      await loadThread(active.role, active.id);
      await loadConvos();
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  };

  const unreadTotal = conversations.reduce((n, c) => n + (c.unread || 0), 0);

  return (
    <div className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">⚠ {error}</div>}

      <Card>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-slate-900 inline-flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-600" /> Support Inbox
          </h3>
          {unreadTotal > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">
              {unreadTotal} unread
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 mb-4">Messages from users, newest first. Student messages are blue, your replies are red.</p>

        <div className="grid md:grid-cols-[280px_1fr] gap-4">
          {/* Conversation list */}
          <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[32rem] overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No support messages yet.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {conversations.map((c) => {
                  const isActive = active?.role === c.role && active?.id === c.id;
                  return (
                    <button
                      key={`${c.role}-${c.id}`}
                      onClick={() => openConversation(c)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                        isActive ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center shrink-0">
                        {(c.name || "?")[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 text-sm truncate inline-flex items-center gap-1">
                            {c.name || "Unknown"}
                            <span className="text-slate-400 font-normal inline-flex items-center gap-0.5">
                              {roleIcon(c.role)}
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">{time(c.last_time)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-slate-500 truncate">{c.last_message || "…"}</p>
                          {c.unread > 0 && (
                            <span className="shrink-0 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                              {c.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Thread */}
          <div className="border border-slate-100 rounded-xl overflow-hidden flex flex-col">
            {!active ? (
              <div className="flex-1 min-h-[16rem] flex flex-col items-center justify-center text-slate-400 gap-2 py-10">
                <MessageSquare size={28} className="text-slate-200" />
                <p className="text-sm font-medium">Select a conversation on the left</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 text-sm font-bold flex items-center justify-center shrink-0">
                      {(active.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{active.name || "Unknown"}</p>
                      <p className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                        {roleIcon(active.role)} {roleLabel(active.role)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 max-h-[24rem] overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/60">
                  {msgs.length === 0 && (
                    <p className="text-sm text-slate-400 text-center pt-8">No messages in this conversation.</p>
                  )}
                  {msgs.map((m) => {
                    // Admin replies sit on the LEFT, student/parent/school messages on the RIGHT
                    const fromUser = m.author_role !== "owner";
                    return (
                      <div key={m.id} className={`flex flex-col ${fromUser ? "items-end" : "items-start"}`}>
                        <div
                          className={`max-w-[80%] px-3.5 py-2 text-sm rounded-2xl whitespace-pre-wrap shadow-sm ${
                            fromUser
                              ? "bg-blue-600 text-white rounded-br-sm"
                              : "bg-red-600 text-white rounded-bl-sm"
                          }`}
                        >
                          {m.message}
                        </div>
                        <div className={`flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 ${fromUser ? "" : "flex-row-reverse"}`}>
                          <span>{time(m.created_at)}</span>
                          {fromUser && (m.read_flag ? <span className="inline-flex items-center gap-0.5 text-emerald-500 font-medium"><CheckCheck size={11} /> seen</span> : <span className="text-amber-500 font-medium">unseen</span>)}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="flex items-center gap-2 border-t border-slate-200 px-3 py-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    placeholder={`Reply to ${active.name}…`}
                    className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  <Button size="sm" loading={sending} icon={<Send size={14} />} onClick={sendReply}>Reply</Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

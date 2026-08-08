
import { useState, useEffect, useRef } from "react";
import { apiUrl, authHeaders, fetchMe, getUser } from "../utils/api";
import { Send, LifeBuoy, Check, CheckCheck } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

interface Msg {
  id: number;
  author_role: string;
  author_id: number;
  sender_name?: string;
  message: string;
  read_flag?: number | boolean;
  created_at: string;
}

const time = (d?: string) =>
  d ? new Date(d).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

export default function SupportPage() {
  const [me, setMe] = useState(getUser());
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const myId = me?.id;

  useEffect(() => {
    fetchMe().then((u) => setMe(u));
  }, []);

  const load = async () => {
    if (!me) return;
    try {
      const res = await fetch(apiUrl("/api/support/messages"), { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setMsgs(data.messages);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    load();
  }, [refresh, me?.role]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  useEffect(() => {
    const t = setInterval(() => setRefresh((r) => r + 1), 8000);
    return () => clearInterval(t);
  }, []);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    setError(""); setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/support/messages"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      if (!data.success) setError(data.error);
      setInput("");
      setRefresh((r) => r + 1);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  if (!me) {
    return (
      <main className="pt-[104px] min-h-screen bg-surface px-4">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-border p-8 text-center">
          <div className="w-12 h-12 bg-primary-light text-primary-dark rounded-xl flex items-center justify-center mx-auto mb-4">
            <Lock size={22} />
          </div>
          <p className="text-muted">
            Please <a href="/login" className="text-primary-dark font-semibold">log in</a> to contact support.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-[104px] min-h-screen bg-surface px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center">
            <LifeBuoy size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Support</h1>
            <p className="text-muted text-sm">Messages go to the admin team, who can reply here.</p>
          </div>
        </div>

        {error && <div className="mt-4 mb-4"><Alert variant="error">{error}</Alert></div>}

        <div className="bg-white rounded-2xl shadow-soft border border-border overflow-hidden mt-6">
          <div className="h-[24rem] overflow-y-auto px-4 py-4 space-y-2 bg-surface">
            {msgs.length === 0 && (
              <p className="text-sm text-muted text-center pt-8">No messages yet. Ask us anything below.</p>
            )}
            {msgs.map((m) => {
              const mine = m.author_id === myId;
              return (
                <div key={m.id} className="text-xs text-muted mb-0.5">
                  {!mine && (
                    <p className="text-[11px] mb-0.5 font-medium text-muted">
                      {m.author_role === "owner" ? "Support Team" : (m.sender_name || m.author_role)} • {time(m.created_at)}
                    </p>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 text-sm rounded-2xl whitespace-pre-wrap ${
                    mine ? "ml-auto bg-primary-dark text-white rounded-br-sm" : "bg-white border border-border text-foreground rounded-bl-sm"
                  }`}>
                    {m.message}
                  </div>
                  {mine && (
                    <p className={`text-[10px] mt-0.5 inline-flex items-center gap-0.5 ${m.read_flag ? "text-emerald-500" : "text-muted"}`}>
                      {m.read_flag ? <><CheckCheck size={11} /> Seen</> : <><Check size={11} /> Sent</>}
                    </p>
                  )}
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={send} className="flex items-center gap-2 border-t border-border px-3 py-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write a message…"
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-border focus:border-primary-dark focus:ring-4 focus:ring-pumpkin-spice-900/60 outline-none transition-all"
            />
            <Button type="submit" size="sm" loading={loading} icon={<Send size={15} />}>Send</Button>
          </form>
        </div>
      </div>
    </main>
  );
}

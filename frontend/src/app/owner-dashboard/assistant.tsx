"use client";

import { useEffect, useState } from "react";
import { Bot, Plus, Trash2, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { apiUrl, authHeaders } from "../../utils/api";

type Doc = { id: number; keywords: string; answer: string };

export default function AssistantManager() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [keywords, setKeywords] = useState("");
  const [answer, setAnswer] = useState("");

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const load = () => {
    fetch(apiUrl("/api/assistant/docs"), { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setDocs(d.docs || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim() || !answer.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/assistant/docs"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ keywords: keywords.trim(), answer: answer.trim() }),
      });
      const d = await res.json();
      if (d.success) {
        showFeedback("success", "Added to the chatbot knowledge base");
        setKeywords(""); setAnswer("");
        load();
      } else showFeedback("error", d.error || "Failed to add");
    } catch { showFeedback("error", "Failed to add"); }
    finally { setBusy(false); }
  };

  const remove = async (id: number) => {
    if (!confirm("Remove this entry from the chatbot knowledge base?")) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/assistant/docs/${id}`), { method: "DELETE", headers: authHeaders() });
      const d = await res.json();
      if (d.success) { showFeedback("success", "Removed"); setDocs((p) => p.filter((x) => x.id !== id)); }
      else showFeedback("error", d.error || "Failed to remove");
    } catch { showFeedback("error", "Failed to remove"); }
    finally { setBusy(false); }
  };

  if (loading) return <PageSpinner message="Loading knowledge base…" />;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Chatbot Knowledge Base</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              These entries teach the assistant how to answer visitors. Add a topic (with keywords) and the answer to give.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3">
          <ShieldAlert size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm">
            <span className="font-semibold">Confidentiality:</span> never add answers that reveal passwords, M-PESA codes,
            private results, or any other person&apos;s personal data. The assistant automatically refuses such requests.
          </p>
        </div>

        <form onSubmit={add} className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Keywords (space-separated)</label>
            <input value={keywords} onChange={(e) => setKeywords(e.target.value)} required
              placeholder="e.g. how do i start exam start exam exam button"
              className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Answer</label>
            <textarea rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} required
              placeholder="The reply the assistant should give…"
              className="w-full px-4 py-3 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
          </div>
          <Button type="submit" loading={busy} icon={<Plus size={15} />}>Add to Knowledge Base</Button>
        </form>
      </Card>

      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Trained Topics</h2>
          <Badge variant="default">{docs.length} entries</Badge>
        </div>
        {docs.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Bot size={32} className="mx-auto mb-2 opacity-30" />
            <p>No knowledge entries yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {docs.map((d) => (
              <div key={d.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {d.keywords.split(/\s+/).filter(Boolean).slice(0, 5).map((k, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{k}</span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{d.answer}</p>
                </div>
                <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => remove(d.id)}>Remove</Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
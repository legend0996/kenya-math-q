
import { useEffect, useState } from "react";
import { BookOpen, Plus, Pencil, Trash2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { apiUrl, authHeaders } from "../../utils/api";

const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Form 1", "Form 2", "Form 3", "Form 4"];

type ContestRow = { id: number; name: string; year: number };
type Question = {
  id: number;
  contest_id: number;
  grade: string;
  question: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  correct_answer?: string | null;
  marks: number;
  type: string;
  working_space?: number | null;
};

const EMPTY = { grade: "Grade 7", type: "mcq", question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "", marks: 1, working_space: 240 };

export default function QuestionsManager() {
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [contestId, setContestId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadContests = async () => {
    const r = await fetch(apiUrl("/api/owner/contest/all"), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) {
      setContests(d.contests || []);
      setContestId((id) => id ?? d.contests?.[0]?.id ?? null);
    }
  };

  const loadQuestions = async (cid: number) => {
    const r = await fetch(apiUrl(`/api/owner/question/contest/${cid}`), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) setQuestions(d.questions || []);
  };

  useEffect(() => { loadContests().finally(() => setLoading(false)); }, []);
  useEffect(() => { if (contestId) loadQuestions(contestId); }, [contestId]);

  const resetForm = () => { setEditId(null); setForm(EMPTY); };

  const startEdit = (q: Question) => {
    setEditId(q.id);
    setForm({
      grade: q.grade,
      type: q.type || "mcq",
      question: q.question,
      option_a: q.option_a || "",
      option_b: q.option_b || "",
      option_c: q.option_c || "",
      option_d: q.option_d || "",
      correct_answer: q.correct_answer || "",
      marks: q.marks,
      working_space: q.working_space ?? 240,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.correct_answer.trim() || !contestId) return;
    setBusy(true);
    try {
      const res = editId != null
        ? await fetch(apiUrl(`/api/owner/question/${editId}/update`), {
            method: "POST", headers: authHeaders(), body: JSON.stringify(form),
          })
        : await fetch(apiUrl("/api/owner/question/create"), {
            method: "POST", headers: authHeaders(),
            body: JSON.stringify({ ...form, contest_id: contestId }),
          });
      const d = await res.json();
      if (d.success) {
        showFeedback("success", editId != null ? "Question updated" : "Question added");
        resetForm();
        loadQuestions(contestId);
      } else {
        showFeedback("error", d.error || "Failed to save");
      }
    } catch { showFeedback("error", "Failed to save"); }
    finally { setBusy(false); }
  };

  const remove = async (q: Question) => {
    if (!confirm(`Delete this question? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/owner/question/${q.id}`), { method: "DELETE", headers: authHeaders() });
      const d = await res.json();
      if (d.success) {
        showFeedback("success", "Question deleted");
        if (contestId) loadQuestions(contestId);
      } else {
        showFeedback("error", d.error || "Failed to delete");
      }
    } catch { showFeedback("error", "Failed to delete"); }
    finally { setBusy(false); }
  };

  if (loading) return <PageSpinner message="Loading questions…" />;

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === "success"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            {editId != null ? <Pencil size={18} className="text-primary-dark" /> : <Plus size={18} className="text-primary-dark" />}
            {editId != null ? "Edit Question" : "Add Question"}
          </h2>
          <select
            value={contestId ?? ""}
            onChange={(e) => setContestId(Number(e.target.value))}
            className="px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all"
          >
            {contests.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <form onSubmit={save} className="mt-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Grade / Form</label>
              <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })}
                className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all">
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Question Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all">
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="theory">Theory / Open-ended</option>
                <option value="construction">Construction / Compass &amp; Ruler</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Question Text</label>
            <textarea rows={2} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })}
              placeholder="Enter the question…"
              className="w-full px-4 py-3 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all resize-none" />
          </div>
          {form.type === "mcq" && (
            <div className="grid sm:grid-cols-2 gap-3">
              {(["option_a", "option_b", "option_c", "option_d"] as const).map((k) => (
                <div key={k}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{k.replace("option_", "Option ").toUpperCase()}</label>
                  <input value={form[k] as string} onChange={(e) => setForm({ ...form, [k]: e.target.value })} placeholder={k.replace("option_", "Option ").toUpperCase()}
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all" />
                </div>
              ))}
            </div>
          )}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Correct Answer</label>
              <input value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} placeholder="Exact correct answer"
                className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Marks</label>
              <input type="number" min={1} max={50} value={form.marks} onChange={(e) => setForm({ ...form, marks: Number(e.target.value) })}
                className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Working space height (px)</label>
              <input type="number" min={120} max={720} step={20} value={form.working_space} onChange={(e) => setForm({ ...form, working_space: Number(e.target.value) })}
                className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={busy} icon={editId != null ? <CheckCircle2 size={15} /> : <Plus size={15} />}>
              {editId != null ? "Update Question" : "Add Question"}
            </Button>
            {editId != null && <Button type="button" variant="ghost" icon={<X size={15} />} onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
      </Card>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={18} className="text-muted" /> Existing Questions
          </h2>
          <Badge variant="default">{questions.length} total</Badge>
        </div>
        {questions.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p>No questions yet for this contest</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {questions.map((q) => (
              <div key={q.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="info">{q.grade}</Badge>
                    <Badge variant="default">{q.type === "mcq" ? "MCQ" : q.type === "theory" ? "Theory" : "Construction"}</Badge>
                    <span className="text-xs font-semibold text-amber-600 px-2 py-0.5 rounded-lg bg-amber-50">{q.marks} mark{q.marks === 1 ? "" : "s"}</span>
                  </div>
                  <p className="font-semibold text-slate-900 mt-1">{q.question}</p>
                  {q.type === "mcq" && (
                    <p className="text-xs text-muted mt-0.5">
                      {[q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean).join("  |  ")}
                    </p>
                  )}
                  <p className="text-xs text-emerald-600 font-medium mt-0.5 inline-flex items-center gap-1"><CheckCircle2 size={12} /> {q.correct_answer}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" icon={<Pencil size={14} />} onClick={() => startEdit(q)}>Edit</Button>
                  <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => remove(q)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

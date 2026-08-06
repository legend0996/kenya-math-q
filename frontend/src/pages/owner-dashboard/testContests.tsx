
import { useEffect, useState } from "react";
import { apiUrl, authHeaders } from "../../utils/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Play, Plus, CheckCircle2, AlertCircle } from "lucide-react";

const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Form 1", "Form 2", "Form 3", "Form 4"];

interface Test {
  id: number;
  name: string;
  test_open?: number;
  started_at?: string;
  stopped_at?: string;
}

export default function TestContests() {
  const [tests, setTests] = useState<Test[]>([]);
  const [name, setName] = useState("");
  const [minutes, setMinutes] = useState(10);
  const [busy, setBusy] = useState<number | "create" | null>(null);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);

  // question form
  const [qTest, setQTest] = useState<number>(0);
  const [qGrade, setQGrade] = useState("Form 1");
  const [q, setQ] = useState("");

  const load = async () => {
    const r = await fetch(apiUrl("/api/owner/test/list"), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) setTests(d.tests || []);
  };
  useEffect(() => { load(); }, []);

  const act = async (action: "create" | "start" | "stop", id?: number) => {
    setBusy(action === "create" ? "create" : id ?? null);
    try {
      const body =
        action === "create"
          ? { name: name.trim() || "Practice Test", duration_minutes: minutes }
          : { contest_id: id };
      const res = await fetch(apiUrl(`/api/owner/test/${action}`), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const d = await res.json();
      setMsg(d.success ? { t: "ok", m: d.message } : { t: "err", m: d.error });
      if (d.success) { setName(""); }
      load();
    } catch {
      setMsg({ t: "err", m: "Action failed." });
    } finally {
      setBusy(null);
    }
  };

  const addQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTest || !q.trim()) return;
    try {
      const res = await fetch(apiUrl("/api/owner/question/create"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contest_id: qTest, question: q, grade: qGrade, correct_answer: "answer", type: "theory" }),
      });
      const d = await res.json();
      setMsg(d.success ? { t: "ok", m: d.message } : { t: "err", m: d.error });
      setQ("");
    } catch {
      setMsg({ t: "err", m: "Could not add question." });
    }
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${msg.t === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.t === "ok" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{msg.m}
        </div>
      )}

      <Card>
        <h3 className="font-bold text-slate-900 mb-4">Create a Test Contest</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Test name (e.g. Grade 7 Practice)"
            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-border focus:border-primary-dark outline-none" />
          <input type="number" min={1} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}
            className="w-28 px-3.5 py-2.5 text-sm rounded-xl border border-border focus:border-primary-dark outline-none" />
          <Button loading={busy === "create"} icon={<Plus size={15} />} onClick={() => act("create")}>
            Create
          </Button>
        </div>
        <p className="text-xs text-muted mt-2">Default minutes per grade. Add questions per grade below after creating.</p>
      </Card>

      <div className="space-y-3">
        {tests.length === 0 && <Card><div className="text-center py-8 text-muted">No test contests yet.</div></Card>}
        {tests.map((t) => {
          const open = !!t.test_open;
          return (
            <Card key={t.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 inline-flex items-center gap-2">
                  {t.name} <Badge variant={open ? "success" : "default"}>{open ? "Open" : "Stopped"}</Badge>
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {open && t.started_at ? `Live since ${new Date(t.started_at).toLocaleString()}` : "Not running"}
                </p>
              </div>
              <div className="flex gap-2">
                {open ? (
                  <Button variant="secondary" loading={busy === t.id} onClick={() => act("stop", t.id)}>
                    Stop
                  </Button>
                ) : (
                  <Button loading={busy === t.id} icon={<Play size={14} />} onClick={() => act("start", t.id)}>
                    Start Now
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h3 className="font-bold text-slate-900 mb-4">Add a Question to a Test Contest</h3>
        <form onSubmit={addQuestion} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <select value={qTest} onChange={(e) => setQTest(Number(e.target.value))}
              className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-border outline-none">
              <option value={0}>Select a test contest…</option>
              {tests.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select value={qGrade} onChange={(e) => setQGrade(e.target.value)}
              className="w-36 px-3.5 py-2.5 text-sm rounded-xl border border-border outline-none">
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={3}
            placeholder="Enter the question text (theory). For multiple choice, add via the Questions tab with the test contest id."
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border focus:border-primary-dark outline-none resize-none" />
          <Button type="submit" disabled={!qTest || !q.trim()} icon={<Plus size={15} />}>Add Question</Button>
        </form>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { apiUrl, authHeaders } from "../../utils/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Select } from "../../components/ui/Input";
import AnnotationCanvas from "../../components/AnnotationCanvas";
import WorkingView from "../../components/WorkingView";
import { ClipboardCheck, Wand2 } from "lucide-react";

const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Form 1", "Form 2", "Form 3", "Form 4"];

interface Contest { id: number; name: string; cat_total: string | number | null; submissions: number; unmarked?: number; marking_mode?: string }
interface Sub { student_id: number; name: string; school: string; grade: string; score: string | number; percentage: string | number | null; marked: number }
interface WS {
  question_id: number; question: string; type: string; marks: number;
  student_answer: string; correct_answer?: string; working: string[] | string | null;
  awarded: number | null; annotation: string | null;
}
interface WorksheetData {
  contest: { id: number; name: string; cat_total: number | null };
  worksheet: WS[];
  questions_total_marks: number;
  totals: { score: number; percentage: number | null; marked: boolean };
}

export default function Marking() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [contestId, setContestId] = useState<number>(0);
  const [submissions, setSubmissions] = useState<Sub[]>([]);
  const [studentId, setStudentId] = useState<number>(0);
  const [ws, setWs] = useState<WorksheetData | null>(null);
  const [marks, setMarks] = useState<Record<number, number>>({});
  const [annotations, setAnnotations] = useState<Record<number, string>>({});
  const [catTotal, setCatTotal] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [autoGrade, setAutoGrade] = useState("");
  const [autoBusy, setAutoBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/owner/marking/contests"), { headers: authHeaders() })
      .then((r) => r.json()).then((d) => { if (d.success) setContests(d.contests || []); });
  }, []);

  const loadSubs = async (cid: number) => {
    setContestId(cid); setStudentId(0); setWs(null);
    const r = await fetch(apiUrl(`/api/owner/marking/${cid}/submissions`), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) setSubmissions(d.submissions || []);
  };

  const setMode = async (mode: "auto" | "manual") => {
    setBusy(true); setMsg(null);
    const r = await fetch(apiUrl("/api/owner/marking/mode"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ contest_id: contestId, mode }),
    });
    const d = await r.json();
    setBusy(false);
    if (d.success) {
      setContests((cs) => cs.map((c) => c.id === contestId ? { ...c, marking_mode: mode } : c));
      setMsg({ t: "ok", m: `Marking set to ${mode}` });
    } else setMsg({ t: "err", m: d.error });
  };

  const release = async (hide: boolean) => {
    setBusy(true); setMsg(null);
    const r = await fetch(apiUrl(hide ? "/api/owner/marking/hide" : "/api/owner/marking/release"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ contest_id: contestId }),
    });
    const d = await r.json();
    setBusy(false);
    setMsg(d.success
      ? { t: "ok", m: hide ? "Papers hidden from students" : "Verified papers released to students" }
      : { t: "err", m: d.error });
  };

  const loadWs = async (sid: number) => {
    setStudentId(sid);
    const r = await fetch(apiUrl(`/api/owner/marking/${contestId}/student/${sid}`), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) {
      setWs(d);
      const m: Record<number, number> = {};
      const an: Record<number, string> = {};
      for (const q of d.worksheet) { if (q.awarded != null) m[q.question_id] = q.awarded; if (q.annotation) an[q.question_id] = q.annotation; }
      setMarks(m); setAnnotations(an);
      setCatTotal(d.contest.cat_total ?? d.questions_total_marks);
    }
  };

  const totalQuestion = ws ? ws.worksheet.reduce((a, q) => a + Number(q.marks), 0) : 0;
  const obtained = Object.values(marks).reduce((a, b) => a + (Number(b) || 0), 0);
  const denom = catTotal > 0 ? catTotal : totalQuestion || 1;
  const pct = Math.round((obtained / denom) * 10000) / 100;

  const save = async () => {
    setBusy(true); setMsg(null);
    const payload = ws!.worksheet.map((q) => ({
      question_id: q.question_id,
      marks_awarded: marks[q.question_id] ?? 0,
      annotation: annotations[q.question_id] || undefined,
    }));
    const r = await fetch(apiUrl("/api/owner/marking/save"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ contest_id: contestId, student_id: studentId, cat_total: catTotal, marks: payload }),
    });
    const d = await r.json();
    setMsg(d.success ? { t: "ok", m: `Saved — ${d.score}/${d.total} (${d.percentage}%) → ${d.grade}` } : { t: "err", m: d.error });
    setBusy(false);
    loadSubsAndWs();
  };

  const loadSubsAndWs = () => { if (contestId) loadSubs(contestId); };

  const runAutoGrade = async () => {
    if (!contestId || !autoGrade) return;
    if (!confirm(`Auto-mark ${autoGrade}? The backend compares each student's final answer to the correct answer and awards full marks on every match. Existing marks will be overwritten.`)) return;
    setAutoBusy(true); setMsg(null);
    try {
      const r = await fetch(apiUrl("/api/owner/marking/auto-grade"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ contest_id: contestId, grade: autoGrade }),
      });
      const d = await r.json();
      if (d.success) {
        setMsg({ t: "ok", m: `${d.grade}: ${d.marked_students} student(s) marked — ${d.correct_answers}/${d.total_comparisons} correct answers. Total marks per paper: ${d.questions_total_marks}.` });
      } else {
        setMsg({ t: "err", m: d.error || "Auto-mark failed" });
      }
    } catch {
      setMsg({ t: "err", m: "Connection error" });
    } finally {
      setAutoBusy(false);
      loadSubsAndWs();
    }
  };

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.t === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.t === "ok" ? "✓ " : "⚠ "}{msg.m}
        </div>
      )}

      <Card>
        <h3 className="font-bold text-slate-900 mb-4 inline-flex items-center gap-2">
          <ClipboardCheck size={16} className="text-blue-600" /> Mark &amp; Auto-percentage
        </h3>
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <Select label="1. Pick a contest" value={contestId || ""} onChange={(e) => loadSubs(Number(e.target.value))}>
            <option value={0}>Select contest…</option>
            {contests.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.submissions} submitted)</option>)}
          </Select>
          <Select label="2. Pick a student" value={studentId || ""} disabled={!contestId} onChange={(e) => loadWs(Number(e.target.value))}>
            <option value={0}>Select student…</option>
            {submissions.map((s) => <option key={s.student_id} value={s.student_id}>{s.name} {s.marked ? "(marked)" : ""}</option>)}
          </Select>
        </div>
        {contestId > 0 && (
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl">
            <div className="text-sm">
              <span className="text-slate-500">Marking mode: </span>
              <b className={contests.find((c) => c.id === contestId)?.marking_mode === "manual" ? "text-amber-600" : "text-emerald-700"}>
                {contests.find((c) => c.id === contestId)?.marking_mode || "auto"}
              </b>
            </div>
            <button onClick={() => setMode("auto")}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700">Auto</button>
            <button onClick={() => setMode("manual")}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-amber-50 hover:text-amber-700">Manual</button>
            <div className="flex-1" />
            <button onClick={() => release(false)}
              className="text-xs px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">Release papers</button>
            <button onClick={() => release(true)}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-100">Hide papers</button>
          </div>
        )}

        {contestId > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-violet-50 border border-violet-200 p-3 rounded-xl mt-3">
            <Wand2 size={18} className="text-violet-600 shrink-0 hidden sm:block" />
            <div className="text-sm">
              <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                Auto-mark a whole grade
              </p>
              <p className="text-xs text-slate-500">
                Pick a class, press Marks — the backend compares the admin&apos;s answer to each student&apos;s final answer and awards the marks.
              </p>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <select value={autoGrade} onChange={(e) => setAutoGrade(e.target.value)}
                className="px-3 py-2 text-sm bg-white rounded-lg border border-slate-200 outline-none">
                <option value="">Grade…</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <Button loading={autoBusy} disabled={!autoGrade} icon={<Wand2 size={15} />}
                onClick={runAutoGrade}>
                Marks
              </Button>
            </div>
          </div>
        )}
        {ws && (
          <div className="flex flex-wrap items-end gap-3 bg-slate-50 p-3 rounded-xl">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">Total (CAT) marks</label>
              <input type="number" value={catTotal} min={1} onChange={(e) => setCatTotal(Number(e.target.value))}
                className="w-28 px-3 py-2 rounded-lg border border-slate-200 outline-none" />
            </div>
            <div className="text-sm">
              <span className="text-slate-500">Obtained: </span><b className="text-slate-800">{obtained}</b>
            </div>
            <div className="text-sm">
              <span className="text-slate-500">Percentage: </span><b className="text-emerald-700">{pct}%</b>
            </div>
            <div className="flex-1" />
            <Button loading={busy} onClick={save}>Save Marking</Button>
          </div>
        )}
      </Card>

      {ws && (
        <div className="space-y-4">
          {ws.worksheet.map((q, idx) => {
            const maxQ = q.marks;
            return (
              <Card key={q.question_id}>
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <p className="font-semibold text-slate-900">
                    Q{idx + 1}. {q.question}
                    <span className="text-xs text-slate-400 ml-2">({maxQ} mark{maxQ === 1 ? "" : "s"})</span>
                    {q.type === "construction" && <span className="text-xs ml-2 px-2 py-0.5 rounded-lg bg-violet-100 text-violet-700">Construction</span>}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-slate-500 mb-1">Student&apos;s answer</p>
                    {q.student_answer ? (
                      <p className="text-sm text-slate-800 whitespace-pre-wrap">{q.student_answer}</p>
                    ) : (
                      <p className="text-sm text-slate-300 italic">No answer</p>
                    )}
                    <div className="mt-2">
                      <p className="text-xs font-medium text-slate-500 mb-1">Correct answer (reference)</p>
                      <p className="text-xs text-slate-400">{q.correct_answer || "—"}</p>
                    </div>
                    {q.working ? (
                      <>
                        <p className="text-xs font-medium text-slate-500 mt-3 mb-1">Student&apos;s working</p>
                        <WorkingView value={q.working} label="Writing" />
                      </>
                    ) : (
                      <p className="text-xs text-slate-300 italic mt-3">No working space used</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">Mark with red pen / tick / cross</p>
                    <AnnotationCanvas
                      imageUrl={typeof q.working === "string" ? q.working : undefined}
                      value={annotations[q.question_id] || q.annotation || null}
                      onChange={(d) => setAnnotations((p) => ({ ...p, [q.question_id]: d }))}
                      height={200}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm font-medium text-slate-600">
                    Marks (out of {maxQ}):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={maxQ}
                    step={0.5}
                    value={marks[q.question_id] ?? ""}
                    onChange={(e) => setMarks((p) => ({ ...p, [q.question_id]: Number(e.target.value) }))}
                    className="w-20 px-3 py-1.5 rounded-lg border border-slate-200 outline-none"
                  />
                  <span className="text-xs text-slate-400">weight: {maxQ}</span>
                </div>
              </Card>
            );
          })}

          <Card className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-600">Total: <b>{obtained}</b> / <b>{denom}</b></p>
              <p className="text-sm text-slate-600">Percentage: <b className="text-emerald-700">{pct}%</b> (auto)</p>
            </div>
            <Button loading={busy} onClick={save}>Save Marking</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
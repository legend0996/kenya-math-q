
import { useEffect, useState } from "react";
import { School, Users, UserPlus, CreditCard, CheckCircle2, LogOut, GraduationCap, AlertCircle } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, StatCard } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageSpinner } from "../components/ui/Spinner";
import { apiUrl, authHeaders } from "../utils/api";

type Student = {
  id: number;
  full_name: string;
  grade: string;
  school?: string;
  payment_status?: string;
  reg_status?: string;
  score?: number | null;
  result_grade?: string | null;
  completed?: boolean;
  timed_out?: boolean;
};

const GRADES = ["Grade 7","Grade 8","Grade 9","Form 1","Form 2","Form 3","Form 4"];

export default function SchoolDashboard() {
  const [students, setStudents]   = useState<Student[]>([]);
  const [contest, setContest]     = useState<{ id: number; name: string; year?: number } | null>(null);
  const [school, setSchool]       = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const [adding, setAdding]       = useState(false);
  const [form, setForm]           = useState({ name: "", grade: "" });
  const [feedback, setFeedback]   = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { window.location.href = "/login"; return; }
    try {
      const p = JSON.parse(atob(token.split(".")[1]));
      setSchool(p.school || "");
      fetchOverview(p.school);
    } catch { window.location.href = "/login"; }
  }, []);

  const fetchOverview = async (schoolName: string) => {
    if (!schoolName) return;
    try {
      const res  = await fetch(apiUrl(`/api/school/overview?school=${encodeURIComponent(schoolName)}`), { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setContest(data.contest);
      }
    } catch (e) { console.error(e); }
    finally { setPageLoading(false); }
  };

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.grade) return;
    setAdding(true);
    try {
      const res = await fetch(apiUrl("/api/school/add-student"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ full_name: form.name, grade: form.grade, school }),
      });
      const data = await res.json();
      if (res.ok || data.success) {
        showFeedback("success", `${form.name} added successfully`);
        setForm({ name: "", grade: "" });
        fetchOverview(school);
      } else { showFeedback("error", data.error || "Failed to add student"); }
    } catch { showFeedback("error", "Connection error"); }
    finally { setAdding(false); }
  };

  if (pageLoading) return <PageSpinner message="Loading school dashboard…" />;

  const registered = students.filter((s) => s.reg_status || s.payment_status).length;
  const paid       = students.filter((s) => s.payment_status === "paid").length;
  const results    = students.filter((s) => s.score != null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <School size={20} className="text-blue-600" />
              <p className="text-sm font-medium text-blue-600">{school}</p>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">School Dashboard</h1>
          </div>
          <Button variant="ghost" icon={<LogOut size={16} />}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}>
            Logout
          </Button>
        </div>

        {/* Feedback toast */}
        {feedback && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl mb-6 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {feedback.msg}
          </div>
        )}

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Students"   value={students.length}  icon={<Users size={22} />} />
          <StatCard label="Registered"       value={registered}       icon={<CheckCircle2 size={22} />} accent="text-emerald-600" />
          <StatCard label="Paid"             value={paid}             icon={<CreditCard size={22} />}   accent="text-amber-600" />
        </div>

        {/* Current contest banner */}
        <Card className="mb-8 border-l-4 border-l-blue-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm text-slate-500">Current contest</p>
              <h3 className="font-bold text-slate-900">{contest ? contest.name : "No contest published yet"}</h3>
            </div>
            {contest && (
              <Badge variant="info">{results.length} student(s) with results</Badge>
            )}
          </div>
        </Card>

        {/* Add Student */}
        <Card className="mb-8">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <UserPlus size={18} className="text-blue-600" /> Add Student
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              placeholder="Student full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="flex-1 px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            <select
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              className="sm:w-36 px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            >
              <option value="">Grade…</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <Button loading={adding} icon={<UserPlus size={15} />} onClick={handleAdd}>
              Add Student
            </Button>
          </div>
        </Card>

        {/* Students Table */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Users size={18} className="text-slate-400" /> Students
            </h2>
            <Badge variant="default">{students.length} total</Badge>
          </div>

          {students.length === 0 ? (
            <div className="text-center py-14">
              <GraduationCap size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No students yet</p>
              <p className="text-sm text-slate-400 mt-1">Add your first student above</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {students.map((s) => (
                <div key={s.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center shrink-0">
                      {s.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{s.full_name}</p>
                      <p className="text-xs text-slate-500">{s.grade}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {s.payment_status === "paid" && <Badge variant="success">Paid</Badge>}
                    {s.payment_status === "pending" && <Badge variant="warning">Payment pending</Badge>}
                    {(s.reg_status || s.payment_status) && <Badge variant="info">Registered</Badge>}
                    {s.result_grade && <Badge variant="success">{s.score} pts · {s.result_grade}</Badge>}
                    {s.timed_out && <Badge variant="warning">Timed out</Badge>}
                    {!s.reg_status && !s.payment_status && <Badge variant="default">Not registered</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* School results leaderboard */}
        {results.length > 0 && (
          <Card padding="none" className="mt-8">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" /> School Results
              </h2>
              <Badge variant="success">{results.length} results</Badge>
            </div>
            <div className="divide-y divide-slate-50">
              {results.map((s, i) => (
                <div key={s.id} className="px-6 py-3 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <span className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                    i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-500"
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">{s.full_name}</p>
                    <p className="text-xs text-slate-500">{s.grade}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">{s.score ?? "—"} pts</p>
                    {s.result_grade && <p className="text-xs text-emerald-600 font-medium">{s.result_grade}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </main>
  );
}


import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { apiUrl, authHeaders } from "../../utils/api";
import { Users, CheckCircle2, UserPlus, CreditCard, AlertCircle, Search } from "lucide-react";

type ContestRow = { id: number; name: string; year: number; registration_open?: boolean; status?: string };
type StudentRow = {
  id: number;
  full_name: string;
  email?: string;
  school?: string;
  grade?: string;
  county?: string;
  student_phone?: string;
  parent_phone?: string;
  created_at?: string;
  registered: boolean;
  paid: boolean;
  done: boolean;
};

const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Form 1", "Form 2", "Form 3", "Form 4"];

export default function RegistrationsManager() {
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [contestId, setContestId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [autoPaid, setAutoPaid] = useState(true);
  const [confirmAll, setConfirmAll] = useState(false);
  const [rowBusy, setRowBusy] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadContests = async () => {
    const r = await fetch(apiUrl("/api/owner/contest/all"), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) {
      setContests(d.contests || []);
      const active = (d.contests || []).find((c: ContestRow) => c.registration_open) || d.contests?.[0];
      setContestId((id) => id ?? active?.id ?? null);
    }
  };

  const loadStudents = async (cid: number) => {
    const r = await fetch(apiUrl(`/api/owner/students/table?contest_id=${cid}`), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) {
      setStudents(d.students || []);
      setSelected(new Set());
    }
  };

  useEffect(() => {
    loadContests().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (contestId) loadStudents(contestId);
  }, [contestId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (gradeFilter !== "all" && s.grade !== gradeFilter) return false;
      if (q) {
        const hay = [s.full_name, s.school, s.email, s.county].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [students, gradeFilter, search]);

  const allChecked = filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  const toggleAll = () => {
    if (allChecked) {
      const next = new Set(selected);
      filtered.forEach((s) => next.delete(s.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      filtered.forEach((s) => next.add(s.id));
      setSelected(next);
    }
  };
  const toggleOne = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const refresh = () => {
    if (contestId) loadStudents(contestId);
    loadContests();
  };

  const registerAll = async () => {
    if (!contestId) return;
    setBusy(true);
    try {
      const r = await fetch(apiUrl("/api/owner/students/register"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contest_id: contestId, mark_paid: autoPaid }),
      });
      const d = await r.json();
      if (d.success) {
        showFeedback("success", d.message || "All students registered");
        setConfirmAll(false);
        refresh();
      } else {
        showFeedback("error", d.error || "Failed to register students");
      }
    } catch {
      showFeedback("error", "Failed to register students");
    } finally {
      setBusy(false);
    }
  };

  const registerSelected = async () => {
    if (!contestId) return;
    const unreg = filtered.filter((s) => !s.registered).map((s) => s.id);
    if (unreg.length === 0) {
      showFeedback("error", "No selected students are unregistered");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(apiUrl("/api/owner/students/register"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contest_id: contestId, student_ids: unreg, mark_paid: autoPaid }),
      });
      const d = await r.json();
      if (d.success) {
        showFeedback("success", d.message || "Selected students registered");
        refresh();
      } else {
        showFeedback("error", d.error || "Failed to register selected");
      }
    } catch {
      showFeedback("error", "Failed to register selected");
    } finally {
      setBusy(false);
    }
  };

  const markSelectedPaid = async () => {
    if (!contestId) return;
    const unpaid = filtered.filter((s) => !s.paid).map((s) => s.id);
    if (unpaid.length === 0) {
      showFeedback("error", "No selected students are unpaid");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(apiUrl("/api/owner/students/mark-paid"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contest_id: contestId, student_ids: unpaid }),
      });
      const d = await r.json();
      if (d.success) {
        showFeedback("success", d.message || "Selected students marked as paid");
        refresh();
      } else {
        showFeedback("error", d.error || "Failed to mark payments");
      }
    } catch {
      showFeedback("error", "Failed to mark payments");
    } finally {
      setBusy(false);
    }
  };

  const registerOne = async (s: StudentRow) => {
    if (!contestId) return;
    setRowBusy(s.id);
    try {
      const payload = s.registered
        ? { contest_id: contestId, student_ids: [s.id] }
        : { contest_id: contestId, student_ids: [s.id], mark_paid: true };
      const r = await fetch(
        apiUrl(s.registered ? "/api/owner/students/mark-paid" : "/api/owner/students/register"),
        { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) },
      );
      const d = await r.json();
      if (d.success) {
        showFeedback("success", s.registered ? `${s.full_name} marked as paid` : `${s.full_name} registered & marked paid`);
        refresh();
      } else {
        showFeedback("error", d.error || "Action failed");
      }
    } catch {
      showFeedback("error", "Action failed");
    } finally {
      setRowBusy(null);
    }
  };

  if (loading) return <PageSpinner message="Loading students…" />;

  const contest = contests.find((c) => c.id === contestId);

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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">Contest</label>
            <select
              value={contestId ?? ""}
              onChange={(e) => setContestId(Number(e.target.value))}
              className="px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            >
              {contests.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.year}){c.registration_open ? " — OPEN" : ""}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={autoPaid}
                onChange={(e) => setAutoPaid(e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              Auto-mark paid on register
            </label>
            <Button icon={<Users size={15} />} loading={busy} onClick={() => setConfirmAll(true)}>
              Register All Students
            </Button>
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-slate-400" /> Students — {contest?.name ?? "…"}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name / school / email…"
                className="pl-9 pr-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all w-56"
              />
            </div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            >
              <option value="all">All grades</option>
              {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <Button size="sm" variant="outline" icon={<UserPlus size={14} />} loading={busy}
              disabled={filtered.filter((s) => !s.registered).length === 0} onClick={registerSelected}>
              Register Selected
            </Button>
            <Button size="sm" variant="outline" icon={<CreditCard size={14} />} loading={busy}
              disabled={filtered.filter((s) => !s.paid).length === 0} onClick={markSelectedPaid}>
              Mark Selected Paid
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                <th className="px-6 py-3 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 accent-blue-600" />
                </th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">County</th>
                <th className="px-4 py-3 text-center">Registered</th>
                <th className="px-4 py-3 text-center">Paid</th>
                <th className="px-4 py-3 text-center">Exam</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-14 text-center text-slate-400">No students found</td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleOne(s.id)}
                        className="w-4 h-4 accent-blue-600"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{s.full_name}</p>
                      <p className="text-xs text-slate-400">{s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.school || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="default">{s.grade || "—"}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{s.county || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {s.registered
                        ? <Badge variant="success" dot>Registered</Badge>
                        : <Badge variant="default">—</Badge>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.paid
                        ? <Badge variant="success">Paid</Badge>
                        : <Badge variant="warning">Unpaid</Badge>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.done ? <Badge variant="info">Done</Badge> : <Badge variant="default">—</Badge>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {s.registered && s.paid ? (
                        <span className="text-xs text-slate-400 font-medium">All done</span>
                      ) : (
                        <Button
                          size="sm"
                          variant={s.registered ? "outline" : "primary"}
                          icon={s.registered ? <CreditCard size={13} /> : <CheckCircle2 size={13} />}
                          loading={rowBusy === s.id}
                          onClick={() => registerOne(s)}
                        >
                          {s.registered ? "Mark Paid" : "Register & Mark Paid"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 text-xs text-slate-400">
          {selected.size} selected · {filtered.length} shown · {students.length} total students
        </div>
      </Card>

      {confirmAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
            <h3 className="font-bold text-lg mb-2">Register all students?</h3>
            <p className="mb-4 text-slate-600">
              Register <span className="font-semibold">{students.length}</span> students for{" "}
              <span className="font-semibold">{contest?.name}</span>?
              {autoPaid ? " They will also be marked as paid." : ""}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setConfirmAll(false)}>Cancel</Button>
              <Button loading={busy} icon={<Users size={15} />} onClick={registerAll}>
                Yes, Register All
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

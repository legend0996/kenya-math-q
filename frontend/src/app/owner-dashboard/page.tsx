"use client";

import { useEffect, useState } from "react";
import {
  BarChart2, School, Trophy, CreditCard, FileQuestion,
  CheckCircle2, XCircle, Play, LogOut, Plus, Users, ChevronRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, StatCard } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import ResultsManagement from "./results";
import CertificateManager from "./certificates";

type Tab = "overview" | "schools" | "contests" | "questions" | "payments" | "results" | "certificates";

const TABS: { key: Tab; label: string; Icon: any }[] = [
  { key: "overview",   label: "Overview",   Icon: BarChart2 },
  { key: "schools",    label: "Schools",    Icon: School },
  { key: "contests",   label: "Contests",   Icon: Trophy },
  { key: "questions",  label: "Questions",  Icon: FileQuestion },
  { key: "payments",   label: "Payments",   Icon: CreditCard },
  { key: "results",    label: "Results",    Icon: CheckCircle2 },
  { key: "certificates",label: "Certificates",Icon: FileQuestion },
];

const GRADES = ["Grade 7","Grade 8","Grade 9","Form 1","Form 2","Form 3","Form 4"];

export default function OwnerDashboard() {
  const [tab, setTab]           = useState<Tab>("overview");
  const [stats, setStats]       = useState<any>(null);
  const [schools, setSchools]   = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success"|"error"; msg: string } | null>(null);

  // Contest form
  const [contestName, setContestName] = useState("");
  const [contestDate, setContestDate] = useState<string>("");
  const [contestTime, setContestTime] = useState<string>("");

  // Question form
  const [grade, setGrade]           = useState("Form 1");
  const [qType, setQType]           = useState("mcq");
  const [question, setQuestion]     = useState("");
  const [option_a, setOptionA]      = useState("");
  const [option_b, setOptionB]      = useState("");
  const [option_c, setOptionC]      = useState("");
  const [option_d, setOptionD]      = useState("");
  const [correct_answer, setCorrect] = useState("");
  const [marks, setMarks]           = useState(1);
  const [addingQ, setAddingQ]       = useState(false);

  const getToken = () => localStorage.getItem("token") || "";

  const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const showFeedback = (type: "success"|"error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    const token = getToken();
    if (!token) { window.location.href = "/owner-login-7843-secure"; return; }

    Promise.all([
      fetch("http://localhost:5000/api/owner/stats",             { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("http://localhost:5000/api/owner/schools/pending",   { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("http://localhost:5000/api/owner/contest/all",       { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("http://localhost:5000/api/owner/registrations",     { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ]).then(([s, sc, co, st]) => {
      if (s.success)  setStats(s.stats);
      if (sc.success) setSchools(sc.schools || []);
      if (co.success) setContests(co.contests || []);
      if (st.success) setStudents(st.students || st.registrations || []);
    }).finally(() => setPageLoading(false));
  }, []);

  const updateSchoolStatus = async (id: number, status: string) => {
    await fetch("http://localhost:5000/api/owner/schools/update", {
      method: "POST", headers: authHeader(),
      body: JSON.stringify({ school_id: id, status }),
    });
    const r = await fetch("http://localhost:5000/api/owner/schools/pending", { headers: { Authorization: `Bearer ${getToken()}` } });
    const d = await r.json();
    if (d.success) setSchools(d.schools || []);
    showFeedback("success", `School ${status === "approved" ? "approved" : "rejected"}`);
  };

  const handleCreateContest = async () => {
    if (!contestName.trim() || !contestDate || !contestTime) return;
    const dateTime = `${contestDate}T${contestTime}`;
    await fetch("http://localhost:5000/api/owner/contest/create", {
      method: "POST", headers: authHeader(),
      body: JSON.stringify({ name: contestName, contest_number: 1, year: new Date().getFullYear(), scheduled_at: dateTime }),
    });
    setContestName(""); setContestDate(""); setContestTime("");
    const r = await fetch("http://localhost:5000/api/owner/contest/all", { headers: { Authorization: `Bearer ${getToken()}` } });
    const d = await r.json();
    if (d.success) setContests(d.contests || []);
    showFeedback("success", "Contest created successfully");
  };

  const activateContest = async (id: number) => {
    await fetch("http://localhost:5000/api/owner/contest/activate", {
      method: "POST", headers: authHeader(),
      body: JSON.stringify({ contest_id: id }),
    });
    const r = await fetch("http://localhost:5000/api/owner/contest/all", { headers: { Authorization: `Bearer ${getToken()}` } });
    const d = await r.json();
    if (d.success) setContests(d.contests || []);
    showFeedback("success", "Contest activated");
  };

  const handleAddQuestion = async () => {
    if (!question.trim() || !correct_answer.trim()) return;
    setAddingQ(true);
    try {
      await fetch("http://localhost:5000/api/owner/question/create", {
        method: "POST", headers: authHeader(),
        body: JSON.stringify({ contest_id: 1, grade, type: qType, question, option_a, option_b, option_c, option_d, correct_answer, marks }),
      });
      showFeedback("success", "Question added successfully");
      setQuestion(""); setOptionA(""); setOptionB(""); setOptionC(""); setOptionD(""); setCorrect(""); setMarks(1);
    } catch { showFeedback("error", "Failed to add question"); }
    finally { setAddingQ(false); }
  };

  const markPaid = async (student_id: number) => {
    await fetch("http://localhost:5000/api/owner/payment/mark", {
      method: "POST", headers: authHeader(),
      body: JSON.stringify({ student_id, contest_id: 1 }),
    });
    const r = await fetch("http://localhost:5000/api/owner/registrations", { headers: { Authorization: `Bearer ${getToken()}` } });
    const d = await r.json();
    if (d.success) setStudents(d.students || d.registrations || []);
    showFeedback("success", "Payment marked");
  };

  if (pageLoading) return <PageSpinner message="Loading admin dashboard…" />;

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Admin Panel</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Owner Dashboard</h1>
          </div>
          <Button variant="ghost" icon={<LogOut size={16} />}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => { localStorage.removeItem("token"); window.location.href = "/owner-login-7843-secure"; }}>
            Logout
          </Button>
        </div>

        {/* Feedback */}
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

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 mb-8 overflow-x-auto gap-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                tab === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Students"   value={stats.students}   icon={<Users size={22} />} />
              <StatCard label="Schools"    value={stats.schools}    icon={<School size={22} />} accent="text-violet-600" />
              <StatCard label="Registered" value={stats.registered} icon={<CheckCircle2 size={22} />} accent="text-emerald-600" />
              <StatCard label="Paid"       value={stats.paid}       icon={<CreditCard size={22} />} accent="text-amber-600" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { tab: "schools"   as Tab, icon: <School size={20} />,      label: "Manage Schools",   desc: `${schools.length} pending approvals` },
                { tab: "contests"  as Tab, icon: <Trophy size={20} />,      label: "Manage Contests",  desc: `${contests.length} total contests` },
                { tab: "questions" as Tab, icon: <FileQuestion size={20} />, label: "Add Questions",   desc: "Build contest question bank" },
                { tab: "payments"  as Tab, icon: <CreditCard size={20} />,  label: "Payments",         desc: `${students.length} registrations` },
              ].map((item) => (
                <Card key={item.tab} hover onClick={() => setTab(item.tab)} className="flex items-center gap-4 cursor-pointer">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Schools ── */}
        {tab === "schools" && (
          <Card padding="none">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <School size={18} className="text-slate-400" /> Pending School Approvals
              </h2>
              <Badge variant="warning">{schools.length} pending</Badge>
            </div>

            {schools.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-300" />
                <p className="font-medium text-slate-500">All schools approved</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {schools.map((s: any) => (
                  <div key={s.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-sm text-slate-500">{s.email} · {s.county}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" icon={<CheckCircle2 size={14} />}
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                        onClick={() => updateSchoolStatus(s.id, "approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger" icon={<XCircle size={14} />}
                        onClick={() => updateSchoolStatus(s.id, "rejected")}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── Contests ── */}
        {tab === "contests" && (
          <div className="space-y-6">
            {/* Create contest */}
            <Card>
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" /> Create New Contest
              </h2>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  placeholder="Contest name (e.g. Round 1 — 2026)"
                  value={contestName}
                  onChange={(e) => setContestName(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={contestDate}
                  onChange={(e) => setContestDate(e.target.value)}
                  className="px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <input
                  type="time"
                  value={contestTime}
                  onChange={(e) => setContestTime(e.target.value)}
                  className="px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <Button icon={<Plus size={15} />} onClick={handleCreateContest}>Create</Button>
              </div>
            </Card>

            {/* List */}
            <Card padding="none">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">All Contests</h2>
              </div>
              {contests.length === 0 ? (
                <div className="text-center py-10 text-slate-400"><Trophy size={32} className="mx-auto mb-2 opacity-30" /><p>No contests yet</p></div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {contests.map((c: any) => (
                    <div key={c.id} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div>
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        <p className="text-sm text-slate-500">{c.year}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        {c.status === "live"     && <Badge variant="success" dot>Live</Badge>}
                        {c.status === "upcoming" && <Badge variant="info">Upcoming</Badge>}
                        {c.status === "ended"    && <Badge variant="default">Ended</Badge>}
                        {c.status !== "live" && c.status !== "ended" && (
                          <Button size="sm" icon={<Play size={13} />}
                            className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                            onClick={() => activateContest(c.id)}>
                            Activate
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── Questions ── */}
        {tab === "questions" && (
          <Card>
            <h2 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <FileQuestion size={18} className="text-blue-600" /> Add Question to Contest
            </h2>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Grade / Form</label>
                  <select value={grade} onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all">
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Question Type</label>
                  <select value={qType} onChange={(e) => setQType(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all">
                    <option value="mcq">Multiple Choice (MCQ)</option>
                    <option value="theory">Theory / Open-ended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Question Text</label>
                <textarea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter the question…"
                  className="w-full px-4 py-3 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" />
              </div>

              {qType === "mcq" && (
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { label: "Option A", val: option_a, set: setOptionA },
                    { label: "Option B", val: option_b, set: setOptionB },
                    { label: "Option C", val: option_c, set: setOptionC },
                    { label: "Option D", val: option_d, set: setOptionD },
                  ].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
                      <input value={val} onChange={(e) => set(e.target.value)} placeholder={label}
                        className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                  ))}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Correct Answer</label>
                  <input value={correct_answer} onChange={(e) => setCorrect(e.target.value)} placeholder="Exact correct answer"
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Marks</label>
                  <input type="number" min={1} max={10} value={marks} onChange={(e) => setMarks(Number(e.target.value))}
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                </div>
              </div>

              <Button icon={<Plus size={16} />} loading={addingQ} onClick={handleAddQuestion}>
                Add Question
              </Button>
            </div>
          </Card>
        )}

        {/* ── Payments ── */}
        {tab === "payments" && (
          <Card padding="none">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <CreditCard size={18} className="text-slate-400" /> Registrations & Payments
              </h2>
              <Badge variant="default">{students.length} total</Badge>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-14 text-slate-400">
                <CreditCard size={36} className="mx-auto mb-3 opacity-30" />
                <p>No registrations yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {students.map((s: any) => (
                  <div key={s.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-900">{s.full_name || s.name}</p>
                      <p className="text-sm text-slate-500">{s.school} · {s.grade}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.paid ? (
                        <Badge variant="success" dot>Paid</Badge>
                      ) : (
                        <>
                          <Badge variant="warning">Unpaid</Badge>
                          <Button size="sm" icon={<CheckCircle2 size={13} />}
                            className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                            onClick={() => markPaid(s.id)}>
                            Mark Paid
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* ── Results ── */}
        {tab === "results" && <ResultsManagement />}
        {/* ── Certificates ── */}
        {tab === "certificates" && <CertificateManager />}
      </div>
    </main>
  );
}

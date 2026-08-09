
import { useEffect, useState } from "react";
import {
  BarChart2, School, Trophy, CreditCard, FileQuestion,
  FlaskConical, ShieldCheck, MessageSquare, PencilRuler,
  CheckCircle2, XCircle, Play, LogOut, Plus, Users, ChevronRight,
  AlertCircle, Clock, ImageIcon, FileText, BookOpen, Bot, CalendarDays, UsersRound, X, Database, type LucideIcon,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, StatCard } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import ResultsManagement from "./results";
import CertificateManager from "./certificates";
import TestContests from "./testContests";
import AdminManagement from "./admins";
import SupportManager from "./supportManager";
import Marking from "./marking";
import InstructionsManager from "./instructions";
import MaterialsManager from "./materials";
import AssistantManager from "./assistant";
import RegistrationsManager from "./registrations";
import QuestionsManager from "./questions";
import ParentsManager from "./parents";
import Directories from "./directories";
import { apiUrl, authHeaders, logout, fetchMe } from "../../utils/api";
import { useSearchParams } from "react-router-dom";

type Tab = "overview" | "schools" | "contests" | "questions" | "payments" | "parents" | "results" | "certificates" | "test" | "admins" | "support" | "marking" | "instructions" | "materials" | "assistant" | "directories";

type Stats = { students: number; schools: number; registered: number; paid: number; pending_payments: number };
type SchoolRow = { id: number; name: string; email: string; county: string; status: string };
type ContestRow = { id: number; name: string; year: number; status: string; registration_open: boolean; start_time?: string; entry_fee?: number | string | null; grade_schedule?: Record<string, { start: string; end: string }> | null };
type PaymentRow = { id: number; full_name?: string; school?: string; mpesa_code?: string; proof_text?: string };

const TABS: { key: Tab; label: string; Icon: LucideIcon }[] = [
  { key: "overview", label: "Overview", Icon: BarChart2 },
  { key: "directories", label: "Directories", Icon: Database },
  { key: "schools", label: "Schools", Icon: School },
  { key: "contests", label: "Contests", Icon: Trophy },
  { key: "questions", label: "Questions", Icon: FileQuestion },
  { key: "instructions", label: "Instructions", Icon: FileText },
  { key: "materials", label: "Materials", Icon: BookOpen },
  { key: "payments", label: "Payments", Icon: CreditCard },
  { key: "parents", label: "Parents", Icon: UsersRound },
  { key: "results", label: "Results", Icon: CheckCircle2 },
  { key: "certificates", label: "Certificates", Icon: ImageIcon },
  { key: "test", label: "Test Contests", Icon: FlaskConical },
  { key: "admins", label: "Admins", Icon: ShieldCheck },
  { key: "assistant", label: "Assistant", Icon: Bot },
  { key: "support", label: "Support", Icon: MessageSquare },
  { key: "marking", label: "Marking", Icon: PencilRuler },
];

const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Form 1", "Form 2", "Form 3", "Form 4"];

const fmtSlotDate = (v: string) =>
  new Date(v).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const slotStatus = (start: string, end: string): "upcoming" | "live" | "ended" => {
  const now = Date.now();
  if (now < new Date(start).getTime()) return "upcoming";
  if (now <= new Date(end).getTime()) return "live";
  return "ended";
};

const PERM: Record<string, Tab[]> = {
  manage_schools: ["schools"],
  manage_contests: ["contests", "payments", "parents"],
  manage_questions: ["questions", "test", "instructions", "materials"],
  manage_results: ["results", "marking"],
  manage_admin: ["admins"],
  reply_support: ["support", "assistant"],
};

export default function OwnerDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get("tab");
    return TABS.some(({ key }) => key === t) ? (t as Tab) : "overview";
  });
  const goTab = (t: Tab) => {
    setTab(t);
    setSearchParams({ tab: t }, { replace: true });
  };
  const [perms, setPerms] = useState<string[]>([]);
  const [isPrimary, setIsPrimary] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [pendingPays, setPendingPays] = useState<PaymentRow[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Contest form
  const [contestName, setContestName] = useState("");
  const [contestDate, setContestDate] = useState<string>("");
  const [contestTime, setContestTime] = useState<string>("");
  const [contestFee, setContestFee] = useState<string>("");
  const [feeInputs, setFeeInputs] = useState<Record<number, string>>({});

  // Grade times editor
  const [timesContest, setTimesContest] = useState<ContestRow | null>(null);
  const [times, setTimes] = useState<Record<string, number>>({});
  const [savingTimes, setSavingTimes] = useState(false);

  // Per-grade contest days editor
  const [daysContest, setDaysContest] = useState<ContestRow | null>(null);
  const [days, setDays] = useState<Record<string, { start: string; end: string } | null>>({});
  const [savingDays, setSavingDays] = useState(false);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    fetchMe().then((u) => {
      if (!u?.id || u.role !== "owner") { window.location.href = "/owner-login-7843-secure"; return; }
      setAdminName(u.name || "");
    });

    Promise.all([
      fetch(apiUrl("/api/owner/stats"), { headers: authHeaders() }).then((r) => r.json()),
      fetch(apiUrl("/api/owner/schools/pending"), { headers: authHeaders() }).then((r) => r.json()),
      fetch(apiUrl("/api/owner/contest/all"), { headers: authHeaders() }).then((r) => r.json()),
      fetch(apiUrl("/api/payment/pending"), { headers: authHeaders() }).then((r) => r.json()),
      fetch(apiUrl("/api/owner/me"), { headers: authHeaders() }).then((r) => r.json()),
    ]).then(([s, sc, co, pp, me]) => {
      if (s.success) setStats(s.stats);
      if (sc.success) setSchools(sc.schools || []);
      if (co.success) setContests(co.contests || []);
      if (pp.success) setPendingPays(pp.payments || []);
      if (me?.success) { setPerms(me.owner?.permissions || []); setIsPrimary(!!me.owner?.is_primary); setAdminName(me.owner?.name || ""); }
    }).finally(() => setPageLoading(false));
  }, []);

  // Keep the active tab in sync with ?tab= in the URL (e.g. when the dashboard
  // navbar links to a specific admin section).
  useEffect(() => {
    const t = searchParams.get("tab");
    if (t && TABS.some(({ key }) => key === t) && t !== tab) setTab(t as Tab);
  }, [searchParams, tab]);

  const updateSchoolStatus = async (id: number, status: string) => {
    await fetch(apiUrl("/api/owner/schools/update"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ school_id: id, status }),
    });
    const r = await fetch(apiUrl("/api/owner/schools/pending"), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) setSchools(d.schools || []);
    showFeedback("success", `School ${status === "approved" ? "approved" : "rejected"}`);
  };

  const handleCreateContest = async () => {
    if (!contestName.trim() || !contestDate || !contestTime) return;
    const start = new Date(`${contestDate}T${contestTime}`);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const res = await fetch(apiUrl("/api/owner/contest/create"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({
        name: contestName,
        contest_number: 1,
        year: new Date().getFullYear(),
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        entry_fee: contestFee ? Number(contestFee) : undefined,
      }),
    });
    const d = await res.json();
    if (d.success) {
      setContestName(""); setContestDate(""); setContestTime(""); setContestFee("");
      const r = await fetch(apiUrl("/api/owner/contest/all"), { headers: authHeaders() });
      const dd = await r.json();
      if (dd.success) setContests(dd.contests || []);
      showFeedback("success", "Contest created successfully");
    } else {
      showFeedback("error", d.error || "Failed to create contest");
    }
  };

  const activateContest = async (id: number) => {
    await fetch(apiUrl("/api/owner/contest/activate"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ contest_id: id }),
    });
    const r = await fetch(apiUrl("/api/owner/contest/all"), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) setContests(d.contests || []);
    showFeedback("success", "Contest activated");
  };

  const setWindow = async (id: number, open: boolean) => {
    await fetch(apiUrl("/api/owner/contest/window"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ contest_id: id, registration_open: open }),
    });
    const r = await fetch(apiUrl("/api/owner/contest/all"), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) setContests(d.contests || []);
    showFeedback("success", open ? "Registration opened" : "Registration closed");
  };

  const updateFee = async (id: number) => {
    const val = Number(feeInputs[id]);
    if (val == null || Number.isNaN(val)) return;
    const res = await fetch(apiUrl("/api/owner/contest/fee"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ contest_id: id, entry_fee: val }),
    });
    const d = await res.json();
    showFeedback(d.success ? "success" : "error", d.message || d.error);
    const r = await fetch(apiUrl("/api/owner/contest/all"), { headers: authHeaders() });
    const dd = await r.json();
    if (dd.success) setContests(dd.contests || []);
    setFeeInputs((p) => { const n = { ...p }; delete n[id]; return n; });
  };

  const openTimes = async (c: ContestRow) => {
    setTimesContest(c);
    const r = await fetch(apiUrl(`/api/owner/contest/papers/${c.id}`), { headers: authHeaders() });
    const d = await r.json();
    const map: Record<string, number> = {};
    (d.papers || []).forEach((p: { grade: string; duration_minutes: number }) => { map[p.grade] = p.duration_minutes; });
    GRADES.forEach((g) => { if (!map[g]) map[g] = 10; });
    setTimes(map);
  };

  const saveTimes = async () => {
    if (!timesContest) return;
    setSavingTimes(true);
    const papers = GRADES.map((g) => ({ grade: g, duration_minutes: Number(times[g]) || 10 }));
    const res = await fetch(apiUrl("/api/owner/contest/papers"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ contest_id: timesContest.id, papers }),
    });
    const d = await res.json();
    setSavingTimes(false);
    if (d.success) {
      showFeedback("success", "Grade times saved");
      setTimesContest(null);
    } else {
      showFeedback("error", d.error || "Failed to save");
    }
  };

  const openDays = (c: ContestRow) => {
    setDaysContest(c);
    const map: Record<string, { start: string; end: string } | null> = {};
    const schedule = c.grade_schedule || {};
    GRADES.forEach((g) => {
      const slot = schedule[g];
      map[g] = slot ? { start: slot.start, end: slot.end || slot.start } : null;
    });
    setDays(map);
  };

  const saveDays = async () => {
    if (!daysContest) return;
    setSavingDays(true);
    try {
      const res = await fetch(apiUrl("/api/owner/contest/grade-schedule"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ contest_id: daysContest.id, grade_schedule: days }),
      });
      const d = await res.json();
      if (d.success) {
        showFeedback("success", "Grade contest days saved");
        setDaysContest(null);
        const r = await fetch(apiUrl("/api/owner/contest/all"), { headers: authHeaders() });
        const dd = await r.json();
        if (dd.success) setContests(dd.contests || []);
      } else {
        showFeedback("error", d.error || "Failed to save grade days");
      }
    } catch {
      showFeedback("error", "Failed to save grade days");
    } finally {
      setSavingDays(false);
    }
  };

  const reviewPayment = async (paymentId: number, status: string) => {
    const res = await fetch(apiUrl("/api/payment/verify"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ payment_id: paymentId, status }),
    });
    const d = await res.json();
    if (d.success) {
      setPendingPays((p) => p.filter((x) => x.id !== paymentId));
      showFeedback("success", status === "paid" ? "Payment approved" : "Payment rejected");
    } else {
      showFeedback("error", d.error || "Failed to update");
    }
  };

  if (pageLoading) return <PageSpinner message="Loading admin dashboard…" />;

  const can = (t: Tab) => t === "overview" || t === "directories" || isPrimary || perms.some((p) => (PERM[p] || []).includes(t));
  const visibleTabs = TABS.filter(({ key }) => key === "overview" || can(key));

  return (
    <main className="pt-0 min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-primary-dark uppercase tracking-widest mb-1">Admin Panel</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {adminName ? `Welcome back, ${adminName}` : "Owner Dashboard"}
            </h1>
          </div>
          <Button variant="ghost" icon={<LogOut size={16} />}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={async () => { await logout(); window.location.href = "/"; }}>
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
          {visibleTabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => goTab(key)}
              className={`flex items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                tab === key
                  ? "bg-primary-light text-primary-dark shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-slate-50"
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
              <StatCard label="Students" value={stats.students} icon={<Users size={22} />} />
              <StatCard label="Schools" value={stats.schools} icon={<School size={22} />} accent="text-primary-dark" />
              <StatCard label="Registered" value={stats.registered} icon={<CheckCircle2 size={22} />} accent="text-emerald-600" />
              <StatCard label="Paid" value={stats.paid} icon={<CreditCard size={22} />} accent="text-amber-600" />
            </div>
            {stats.pending_payments > 0 && (
              <button onClick={() => goTab("payments")}
                className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-5 py-4 text-sm font-semibold hover:bg-amber-100 transition-colors">
                <AlertCircle size={18} />
                {stats.pending_payments} pending M-PESA payment(s) awaiting review
                <ChevronRight size={16} className="ml-auto" />
              </button>
            )}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { tab: "schools" as Tab, icon: <School size={20} />, label: "Manage Schools", desc: `${schools.length} pending approvals` },
                { tab: "contests" as Tab, icon: <Trophy size={20} />, label: "Manage Contests", desc: `${contests.length} total contests` },
                { tab: "questions" as Tab, icon: <FileQuestion size={20} />, label: "Add Questions", desc: "Build contest question bank" },
                { tab: "certificates" as Tab, icon: <ImageIcon size={20} />, label: "Certificates", desc: "Design, publish & generate" },
              ].map((item) => (
                <Card key={item.tab} hover onClick={() => goTab(item.tab)} className="flex items-center gap-4 cursor-pointer">
                  <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center shrink-0 text-primary-dark">
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900">{item.label}</p>
                    <p className="text-sm text-muted mt-0.5">{item.desc}</p>
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
                <School size={18} className="text-muted" /> Pending School Approvals
              </h2>
              <Badge variant="warning">{schools.length} pending</Badge>
            </div>
            {schools.length === 0 ? (
              <div className="text-center py-14 text-muted">
                <CheckCircle2 size={36} className="mx-auto mb-3 text-emerald-300" />
                <p className="font-medium text-muted">All schools approved</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {schools.map((s) => (
                  <div key={s.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50">
                    <div>
                      <p className="font-semibold text-slate-900">{s.name}</p>
                      <p className="text-sm text-muted">{s.email} · {s.county}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button size="sm" icon={<CheckCircle2 size={14} />}
                        className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                        onClick={() => updateSchoolStatus(s.id, "approved")}>Approve</Button>
                      <Button size="sm" variant="danger" icon={<XCircle size={14} />}
                        onClick={() => updateSchoolStatus(s.id, "rejected")}>Reject</Button>
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
            <Card>
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Plus size={18} className="text-primary-dark" /> Create New Contest
              </h2>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  placeholder="Contest name (e.g. Round 1 — 2026)"
                  value={contestName}
                  onChange={(e) => setContestName(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all"
                />
                <input type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={contestDate}
                  onChange={(e) => setContestDate(e.target.value)}
                  className="px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all"
                />
                <input type="time"
                  value={contestTime}
                  onChange={(e) => setContestTime(e.target.value)}
                  className="px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all"
                />
                <input type="number" min={0} placeholder="Entry fee KES"
                  value={contestFee}
                  onChange={(e) => setContestFee(e.target.value)}
                  className="w-32 px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all"
                />
                <Button icon={<Plus size={15} />} onClick={handleCreateContest}>Create</Button>
              </div>
            </Card>

            <Card padding="none">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-bold text-slate-900">All Contests</h2>
              </div>
              {contests.length === 0 ? (
                <div className="text-center py-10 text-muted"><Trophy size={32} className="mx-auto mb-2 opacity-30" /><p>No contests yet</p></div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {contests.map((c) => {
                    const slots = GRADES
                      .filter((g) => c.grade_schedule?.[g]?.start)
                      .map((g) => ({ grade: g, ...c.grade_schedule![g]! }));
                    return (
                    <div key={c.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50">
                      <div>
                        <p className="font-semibold text-slate-900">{c.name}</p>
                        <p className="text-sm text-muted">
                          {c.year}
                          {c.start_time ? ` • starts ${new Date(c.start_time).toLocaleString()}` : ""}
                        </p>
                        {slots.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {slots.map(({ grade, start, end }) => {
                              const st = slotStatus(start, end);
                              return (
                                <span key={grade}
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                    st === "live"
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : st === "upcoming"
                                        ? "bg-primary-light border-primary-light text-primary-dark"
                                        : "bg-slate-100 border-border text-muted"
                                  }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                    st === "live" ? "bg-emerald-500" : st === "upcoming" ? "bg-primary" : "bg-slate-400"
                                  }`} />
                                  {grade}: {fmtSlotDate(start)}{st === "live" ? " · LIVE" : st === "ended" ? " · ended" : ""}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {c.status === "live" && <Badge variant="success" dot>Live</Badge>}
                        {c.status === "upcoming" && <Badge variant="info">Upcoming</Badge>}
                        {c.status === "ended" && <Badge variant="default">Ended</Badge>}
                        {c.registration_open ? <Badge variant="success">Reg Open</Badge> : <Badge variant="default">Reg Closed</Badge>}
                        <Button size="sm" variant="outline" icon={<Clock size={13} />} onClick={() => openTimes(c)}>
                          Grade Times
                        </Button>
                        <Button size="sm" variant="outline" icon={<CalendarDays size={13} />} onClick={() => openDays(c)}>
                          Grade Days
                        </Button>
                        <span className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-foreground">
                          Fee: KES {c.entry_fee ?? 0}
                        </span>
                        <input type="number" min={0} placeholder="new fee"
                          value={feeInputs[c.id] ?? ""}
                          onChange={(e) => setFeeInputs((p) => ({ ...p, [c.id]: e.target.value }))}
                          className="w-20 px-2 py-1 text-xs rounded-lg border border-border outline-none"
                        />
                        <Button size="sm" variant="outline" onClick={() => updateFee(c.id)}>Set Fee</Button>
                        {c.status !== "live" && c.status !== "ended" && (
                          <Button size="sm" icon={<Play size={13} />}
                            className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                            onClick={() => activateContest(c.id)}>Activate</Button>
                        )}
                        <Button size="sm" variant={c.registration_open ? "danger" : "secondary"}
                          onClick={() => setWindow(c.id, !c.registration_open)}>
                          {c.registration_open ? "Close" : "Open"} Reg
                        </Button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Grade times editor */}
            {timesContest && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <Clock size={18} className="text-primary-dark" /> Exam Duration — {timesContest.name}
                  </h2>
                  <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => setTimesContest(null)}>Close</Button>
                </div>
                <p className="text-sm text-muted mb-4">Set the time allowed for each grade&apos;s paper (minutes).</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {GRADES.map((g) => (
                    <div key={g}>
                      <label className="block text-sm font-medium text-foreground mb-1.5">{g}</label>
                      <input type="number" min={1} max={240} value={times[g] ?? 10}
                        onChange={(e) => setTimes({ ...times, [g]: Number(e.target.value) })}
                        className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all" />
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <Button loading={savingTimes} icon={<CheckCircle2 size={15} />} onClick={saveTimes}>Save Grade Times</Button>
                </div>
              </Card>
            )}

            {/* Per-grade contest days editor */}
            {daysContest && (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-slate-900 flex items-center gap-2">
                    <CalendarDays size={18} className="text-primary-dark" /> Contest Days — {daysContest.name}
                  </h2>
                  <Button variant="ghost" size="sm" icon={<X size={14} />} onClick={() => setDaysContest(null)}>Close</Button>
                </div>
                <p className="text-sm text-muted mb-1">
                  Give each grade (class) its own contest day. Unchecked grades keep the global contest window, so all classes can still take the exam at the same time.
                </p>
                <p className="text-xs text-muted mb-4">Times shown in local time.</p>
                <div className="space-y-3">
                  {GRADES.map((g) => {
                    const on = !!days[g];
                    return (
                      <div key={g} className="flex flex-col sm:flex-row sm:items-center gap-3 bg-slate-50 rounded-xl p-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground w-28 shrink-0">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={(e) =>
                              setDays((p) => ({
                                ...p,
                                [g]: e.target.checked
                                  ? { start: p[g]?.start || "", end: p[g]?.end || "" }
                                  : null,
                              }))
                            }
                            className="w-4 h-4 accent-primary-dark"
                          />
                          {g}
                        </label>
                        {on ? (
                          <>
                            <input
                              type="datetime-local"
                              value={days[g]?.start?.slice(0, 16) || ""}
                              onChange={(e) => setDays((p) => ({ ...p, [g]: { start: e.target.value, end: p[g]?.end || e.target.value } }))}
                              className="flex-1 min-w-0 px-3 py-2 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all"
                            />
                            <input
                              type="datetime-local"
                              value={days[g]?.end?.slice(0, 16) || ""}
                              onChange={(e) => setDays((p) => ({ ...p, [g]: { start: p[g]?.start || e.target.value, end: e.target.value } }))}
                              className="flex-1 min-w-0 px-3 py-2 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all"
                            />
                          </>
                        ) : (
                          <span className="text-sm text-muted">Uses global contest window</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5">
                  <Button loading={savingDays} icon={<CheckCircle2 size={15} />} onClick={saveDays}>Save Grade Days</Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── Questions ── */}
        {tab === "questions" && (
          <QuestionsManager />
        )}

        {/* ── Payments ── */}
        {tab === "payments" && (
          <div className="space-y-6">
            {/* Pending M-PESA proofs */}
            <Card padding="none">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-amber-500" /> Pending M-PESA Proofs
                </h2>
                <Badge variant="warning">{pendingPays.length} pending</Badge>
              </div>
              {pendingPays.length === 0 ? (
                <div className="text-center py-10 text-muted">No pending M-PESA proofs</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {pendingPays.map((p) => (
                    <div key={p.id} className="px-6 py-4 hover:bg-slate-50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{p.full_name}</p>
                          <p className="text-sm text-muted">{p.school}</p>
                          {p.mpesa_code && (
                            <p className="text-xs font-mono text-emerald-600 mt-1">Code: {p.mpesa_code}</p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button size="sm" icon={<CheckCircle2 size={13} />}
                            className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                            onClick={() => reviewPayment(p.id, "paid")}>Approve</Button>
                          <Button size="sm" variant="danger" icon={<XCircle size={13} />}
                            onClick={() => reviewPayment(p.id, "rejected")}>Reject</Button>
                        </div>
                      </div>
                      {p.proof_text && (
                        <p className="text-xs text-muted mt-2 bg-slate-50 rounded-lg p-2.5 whitespace-pre-wrap">{p.proof_text}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <RegistrationsManager />
          </div>
        )}

        {/* ── Parents ── */}
        {tab === "parents" && <ParentsManager />}

        {/* ── Directories (all records) ── */}
        {tab === "directories" && <Directories />}

        {/* ── Results ── */}
        {tab === "results" && <ResultsManagement />}

        {/* ── Certificates ── */}
        {tab === "certificates" && <CertificateManager />}

        {/* ── Test Contests ── */}
        {tab === "test" && <TestContests />}

        {/* ── Instructions ── */}
        {tab === "instructions" && <InstructionsManager />}

        {/* ── Study Materials ── */}
        {tab === "materials" && <MaterialsManager />}

        {/* ── Assistant ── */}
        {tab === "assistant" && <AssistantManager />}

        {/* ── Admins ── */}
        {tab === "admins" && <AdminManagement />}

        {/* ── Support ── */}
        {tab === "support" && <SupportManager />}

        {/* ── Marking ── */}
        {tab === "marking" && <Marking />}
      </div>
    </main>
  );
}

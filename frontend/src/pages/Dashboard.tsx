
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy, BookOpen, Award, BarChart2, Calendar,
  LogOut, ChevronRight, Download, Play, Clock, CheckCircle,
  UserPlus, CreditCard, Lock, AlertCircle, ExternalLink,
  Smartphone, Receipt, X, Check,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, StatCard } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageSpinner } from "../components/ui/Spinner";
import { apiUrl, authHeaders, getUser } from "../utils/api";
import { THEMES, type Theme, themeByColor, applyTheme, emitThemeChange, readSavedTheme } from "../theme";

type User = { id?: number; name?: string; school?: string };
type Contest = { id: number; name: string; status: string; start_time: string; results_released?: boolean; is_test?: boolean };

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [contest, setContest] = useState<Contest | null>(null);
  const [registered, setRegistered] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [result, setResult] = useState<{ score: number; grade?: string } | null>(null);
  const [pastContests, setPastContests] = useState<{ id: number; name: string; status?: string; start_time?: string }[]>([]);
  const [myCerts, setMyCerts] = useState<{ id: number; contest_name?: string; year?: number; score?: number | null; grade?: string | null; source?: string; created_at: string }[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [mpesa, setMpesa] = useState({ code: "", proof: "" });
  const [submittingPay, setSubmittingPay] = useState(false);
  const [regModal, setRegModal] = useState(false);
  const [payMethod, setPayMethod] = useState<"stk" | "manual" | null>(null);
  const [stkPhone, setStkPhone] = useState("");
  const [stkBusy, setStkBusy] = useState(false);
  const [stkMsg, setStkMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [materials, setMaterials] = useState<{ id: number; title: string; description?: string; content_type: string; content?: string; created_at: string }[]>([]);
  const [myPastTests, setMyPastTests] = useState<{ id: number; name: string; is_test?: number | boolean; start_time?: string; score?: number | null; result_grade?: string | null; completed?: number | boolean }[]>([]);
  const [myGrade, setMyGrade] = useState<string>("");
  const [theme, setTheme] = useState<Theme>(() => readSavedTheme());

  const load = useCallback(async () => {
    try {
      const [statusData, historyData, certData, materialsData] = await Promise.all([
        fetch(apiUrl("/api/contest/me"), { headers: authHeaders() }).then((r) => r.json()),
        fetch(apiUrl("/api/contest/history")).then((r) => r.json()),
        fetch(apiUrl("/api/certificate/my"), { headers: authHeaders() }).then((r) => r.json()),
        fetch(apiUrl("/api/student/materials"), { headers: authHeaders() }).then((r) => r.json()),
      ]);

      if (statusData.success) {
        setContest(statusData.contest);
        setRegistered(statusData.registered);
        setPaymentStatus(statusData.payment_status);
        setHasDraft(statusData.has_draft);
        setResult(statusData.result);
      }
      if (historyData.success) setPastContests(historyData.contests || []);
      if (certData.success) setMyCerts(certData.certificates || []);
      if (materialsData.success) {
        setMaterials(materialsData.materials || []);
        setMyPastTests(materialsData.pastTests || []);
        setMyGrade(materialsData.grade || "");
        if (materialsData.theme) {
          const t = themeByColor(materialsData.theme);
          applyTheme(t, true);
          setTheme(t);
        }
      }
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    const u = getUser();
    if (!u?.id) { navigate("/login"); return; }
    setUser({ id: u.id, name: u.name || u.school || "Student", school: u.school });
    load();
  }, [navigate, load]);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const pickTheme = async (t: Theme) => {
    setTheme(t);
    applyTheme(t, true);
    emitThemeChange();
    try {
      await fetch(apiUrl("/api/student/theme"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ theme_color: t.c600 }),
      });
    } catch {
      /* theme still works locally even if save fails */
    }
  };

  const doRegister = async () => {
    if (registered) return true;
    try {
      const res = await fetch(apiUrl("/api/contest/register"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({}),
      });
      const d = await res.json();
      if (d.success) {
        setRegistered(true);
        setPaymentStatus("pending");
        return true;
      }
      showFeedback("error", d.error || "Registration failed");
      return false;
    } catch {
      showFeedback("error", "Connection error");
      return false;
    }
  };

  const handleRegisterDirect = async () => {
    const ok = await doRegister();
    if (ok) {
      showFeedback("success", "Registered for the contest!");
      load();
    }
  };

  const openPayModal = (method: "stk" | "manual") => {
    setPayMethod(method);
    setStkMsg(null);
    setRegModal(true);
  };

  const handleStk = async () => {
    if (!contest) return;
    const phone = stkPhone.replace(/\s/g, "");
    if (!/^(07\d{8}|2547\d{8})$/.test(phone)) {
      setStkMsg({ type: "error", text: "Enter a valid Safaricom number, e.g. 0712 345 678" });
      return;
    }
    setStkBusy(true);
    setStkMsg(null);
    try {
      const ok = await doRegister();
      if (!ok) return;
      const res = await fetch(apiUrl("/api/payment/stk"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ contest_id: contest.id, phone }),
      });
      const d = await res.json();
      if (d.success) {
        setStkMsg({ type: "success", text: "STK prompt sent! Check your phone and enter your M-PESA PIN to complete payment." });
        setPaymentStatus("stk_pending");
        load();
      } else {
        setStkMsg({ type: "error", text: d.error || "STK push failed. Try again or use manual payment." });
      }
    } catch {
      setStkMsg({ type: "error", text: "Connection error. Try again or use manual payment." });
    } finally {
      setStkBusy(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!contest) return;
    if (!mpesa.code.trim()) {
      showFeedback("error", "Paste the M-PESA confirmation message first");
      return;
    }
    setSubmittingPay(true);
    try {
      const ok = await doRegister();
      if (!ok) return;
      const res = await fetch(apiUrl("/api/payment/submit-proof"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ contest_id: contest.id, mpesa_code: mpesa.code.trim(), proof_text: mpesa.proof.trim() }),
      });
      const d = await res.json();
      if (d.success) {
        setRegModal(false);
        setPayMethod(null);
        setMpesa({ code: "", proof: "" });
        setPaymentStatus("pending");
        showFeedback("success", "Payment submitted. It will be reviewed by the administrator.");
        load();
      } else {
        showFeedback("error", d.error || "Failed to submit payment");
      }
    } catch {
      showFeedback("error", "Connection error");
    } finally {
      setSubmittingPay(false);
    }
  };

  const downloadMyCert = (id: number) => {
    window.open(apiUrl(`/api/certificate/my/download/${id}`));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (pageLoading) return <PageSpinner message="Loading your dashboard…" />;

  const paid = paymentStatus === "paid";
  const live = contest?.status === "live";
  const upcoming = contest?.status === "upcoming";

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Welcome back</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{user?.name} 👋</h1>
          </div>
          <Button variant="ghost" icon={<LogOut size={16} />} onClick={handleLogout}
            className="text-red-500 hover:bg-red-50 hover:text-red-600">
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
            {feedback.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {feedback.msg}
          </div>
        )}

        {/* Dashboard theme colour — 20 choices */}
        <Card className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900">Dashboard colour</h2>
              <p className="text-sm text-slate-500">Pick the colour you like — it changes your whole dashboard.</p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-lg"
              style={{ backgroundColor: theme.c100, color: theme.c700 }}>
              {theme.name}
            </span>
          </div>
          <div className="flex flex-wrap gap-2.5 mt-4">
            {THEMES.map((t) => {
              const selected = theme.name === t.name;
              return (
                <button
                  key={t.name}
                  title={t.name}
                  onClick={() => pickTheme(t)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform duration-150 ${
                    selected ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: t.c600 }}
                >
                  {selected && <Check size={16} className="text-white" />}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Your Score" value={result?.score ?? "—"} icon={<BarChart2 size={22} />} />
          <StatCard label="Contests Entered" value={pastContests.length} icon={<Trophy size={22} />} />
          <StatCard label="Certificates" value={result ? "1" : "0"} icon={<Award size={22} />} />
        </div>

        {/* Current contest */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-blue-600" /> Current Contest
          </h2>

          {!contest ? (
            <Card className="text-center py-10">
              <Trophy size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No active contest right now</p>
              <p className="text-sm text-slate-400 mt-1">Check back soon for upcoming competitions</p>
            </Card>
          ) : (
            <>
              {/* Contest info */}
              <Card className="border-l-4 border-l-blue-500 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-lg">{contest.name}</h3>
                      {live ? <Badge variant="success" dot>Live</Badge>
                        : upcoming ? <Badge variant="info">Upcoming</Badge>
                        : <Badge variant="default">Ended</Badge>}
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Calendar size={13} />
                      {contest.start_time ? new Date(contest.start_time).toDateString() : "Dates to be announced"}
                    </p>
                  </div>

                  {/* Registration / payment / exam buttons */}
                  {!registered ? (
                    contest.is_test ? (
                      <Button icon={<UserPlus size={16} />} onClick={handleRegisterDirect}>
                        Register
                      </Button>
                    ) : (
                      <Button icon={<UserPlus size={16} />} onClick={() => openPayModal("stk")}>
                        Register &amp; Pay
                      </Button>
                    )
                  ) : paid ? (
                    <Badge variant="success" dot>Registered • Paid</Badge>
                  ) : (
                    <Badge variant="warning" dot>
                      {paymentStatus === "pending"
                        ? "M-PESA Unconfirmed"
                        : paymentStatus === "stk_pending"
                          ? "STK Confirming…"
                          : paymentStatus === "rejected"
                            ? "Payment Rejected"
                            : "Payment required"}
                    </Badge>
                  )}
                </div>
              </Card>

              {/* Exam card */}
              {registered && (
                <Card className="mb-4 border-l-4 border-l-emerald-500">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-slate-900">Mathematics Paper</h3>
                      {result ? (
                        <p className="text-sm text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                          <CheckCircle size={14} /> Completed — Score: {result.score} pts
                          {contest.results_released ? ` (${result.grade})` : " • results pending release"}
                        </p>
                      ) : live && paid ? (
                        <p className="text-sm text-slate-500 mt-1">The contest is live. {hasDraft ? "Your draft is saved — resume anytime." : "Ready when you are."}</p>
                      ) : live && !paid ? (
                        <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                          <Lock size={13} />{" "}
                          {paymentStatus === "pending"
                            ? "You have registered. Awaiting admin approval of your M-PESA payment."
                            : paymentStatus === "stk_pending"
                              ? "Your M-PESA payment is being confirmed automatically — this takes a moment."
                              : paymentStatus === "rejected"
                                ? "Your payment was rejected. Please pay again."
                                : "The exam is ongoing but you must complete payment to unlock it."}
                        </p>
                      ) : upcoming ? (
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                          <Clock size={13} /> Exam opens when the contest goes live.
                        </p>
                      ) : (
                        <p className="text-sm text-slate-500 mt-1">Contest has ended.</p>
                      )}
                    </div>

                    {result ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" icon={<Download size={15} />} onClick={() => downloadMyCert(myCerts[0]?.id)} disabled={!myCerts.length}>
                          Certificate
                        </Button>
                        {contest.results_released && (
                          <Button variant="outline" onClick={() => navigate(`/student-review?contest=${contest.id}`)}>
                            Review marked paper
                          </Button>
                        )}
                      </div>
                    ) : live && paid ? (
                      <Button size="lg" icon={<Play size={16} />} onClick={() => navigate(`/exam?contest_id=${contest.id}`)}>
                        {hasDraft ? "Continue Exam" : "Start Exam"}
                      </Button>
                    ) : live && !paid ? (
                      <Button size="lg" disabled className="opacity-50">
                        <Lock size={15} />{" "}
                        {paymentStatus === "pending"
                          ? "Registered — awaiting admin approval"
                          : paymentStatus === "stk_pending"
                            ? "Confirming M-PESA…"
                            : "Payment required"}
                      </Button>
                    ) : upcoming ? (
                      <Button size="lg" disabled>Not started</Button>
                    ) : (
                      <Button size="lg" disabled>Ended</Button>
                    )}
                  </div>
                </Card>
              )}

              {/* M-PESA payment */}
              {registered && !paid && (
                <Card>
                  <h3 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
                    <CreditCard size={18} className="text-emerald-600" /> Pay Entry Fee (M-PESA)
                  </h3>

                  {paymentStatus === "pending" || paymentStatus === "stk_pending" ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
                      ⏳ {paymentStatus === "stk_pending"
                        ? "Your M-PESA (STK) payment is being confirmed automatically — once confirmed you can start the exam."
                        : "Your registration is recorded as M-PESA Unconfirmed. Await admin approval, then you can start the exam."}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-500">
                        Choose how you&apos;d like to pay the entry fee:
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button icon={<CreditCard size={15} />} onClick={() => openPayModal("stk")}>
                          Pay via M-PESA (STK) — instant
                        </Button>
                        <Button
                          variant="outline"
                          icon={<ExternalLink size={15} />}
                          className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                          onClick={() => openPayModal("manual")}
                        >
                          Pay Manually (Till 123456)
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </>
          )}
        </section>

        {/* Quick actions */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <BarChart2 size={22} />, title: "Results", desc: "View your performance", color: "text-violet-600", bg: "bg-violet-50" },
            { icon: <Award size={22} />, title: "Certificates", desc: "Download your certificates", color: "text-amber-600", bg: "bg-amber-50" },
            { icon: <BookOpen size={22} />, title: "Practice", desc: "Access study resources", color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((item) => (
            <Card key={item.title} hover className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                <span className={item.color}>{item.icon}</span>
              </div>
              <div>
                <p className="font-bold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-slate-300 ml-auto self-center shrink-0" />
            </Card>
          ))}
        </div>

        {/* My Certificates */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Award size={20} className="text-amber-500" /> My Certificates
          </h2>

          {myCerts.length === 0 ? (
            <Card className="text-center py-8">
              <Award size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No certificates yet</p>
              <p className="text-sm text-slate-400 mt-1">Certificates appear here once issued by the organizers</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {myCerts.map((c) => (
                <Card key={c.id} hover className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900">{c.contest_name || "Certificate"}</h3>
                      {c.source === "manual"
                        ? <Badge variant="info">Manual</Badge>
                        : c.grade ? <Badge variant="success">{c.grade}</Badge> : <Badge variant="default">Issued</Badge>}
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                      {c.grade && c.score != null ? `Score: ${c.score} · ${c.grade} · ` : ""}
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" icon={<Download size={14} />} onClick={() => downloadMyCert(c.id)}>
                    Download
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Past contests */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-slate-400" /> Past Contests
          </h2>

          {pastContests.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-slate-400 text-sm">No past contests yet</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {pastContests.map((c) => (
                <Card key={c.id} hover>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900">{c.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {c.start_time ? new Date(c.start_time).toDateString() : "—"}
                      </p>
                    </div>
                    <Badge variant="default">{c.status || "Ended"}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Study materials (revision) + past tests taken */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-600" /> Study Materials &amp; Past Tests
            </h2>
            {myGrade && (
              <button onClick={() => navigate("/settings")}
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5">
                My class: {myGrade} <ChevronRight size={14} />
              </button>
            )}
          </div>

          {materials.length === 0 && myPastTests.length === 0 ? (
            <Card className="text-center py-8">
              <BookOpen size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">No study materials yet</p>
              <p className="text-sm text-slate-400 mt-1">
                Revision materials uploaded by your administrator appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {materials.length > 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  {materials.map((m) => (
                    <Card key={m.id} hover className="flex flex-col">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          m.content_type === "file"
                            ? "bg-amber-50 text-amber-600"
                            : m.content_type === "link"
                              ? "bg-blue-50 text-blue-600"
                              : m.content_type === "video"
                                ? "bg-red-50 text-red-600"
                                : "bg-emerald-50 text-emerald-600"
                        }`}>
                          {m.content_type === "file" ? <Download size={18} /> : m.content_type === "link" ? <ExternalLink size={18} /> : m.content_type === "video" ? <Play size={18} /> : <BookOpen size={18} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900">{m.title}</p>
                          {m.description && <p className="text-sm text-slate-500 mt-0.5">{m.description}</p>}
                          <p className="text-xs text-slate-400 mt-1">
                            {m.content_type === "link" ? "Link" : m.content_type === "file" ? "File" : m.content_type === "video" ? "Video" : "Notes"}
                            {" · "}{new Date(m.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {m.content_type === "video" ? (
                        <button onClick={() => navigate("/tuition")}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                          <Play size={14} /> Watch on Tuition page <ChevronRight size={13} />
                        </button>
                      ) : m.content_type === "text" && m.content ? (
                        <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 mt-3 whitespace-pre-wrap">{m.content}</p>
                      ) : m.content ? (
                        <a href={m.content} target="_blank" rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700">
                          {m.content_type === "link" ? "Open resource" : "Download file"} <ExternalLink size={13} />
                        </a>
                      ) : null}
                    </Card>
                  ))}
                </div>
              )}

              {myPastTests.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Past tests you have entered</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {myPastTests.map((t) => (
                      <Card key={t.id} hover>
                        <div className="flex justify-between items-start gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-slate-900 truncate">{t.name}</h3>
                              {t.is_test ? <Badge variant="info">Test</Badge> : <Badge variant="default">Contest</Badge>}
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              {t.start_time ? new Date(t.start_time).toDateString() : "—"}
                            </p>
                          </div>
                          {t.completed ? (
                            <Badge variant="success">{t.result_grade || `Score ${t.score ?? "—"}`}</Badge>
                          ) : (
                            <Badge variant="warning">Entered</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Register & Pay modal */}
      {regModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-slate-900">
                {registered ? "Pay Entry Fee" : "Register & Pay for Contest"}
              </h3>
              <button onClick={() => { setRegModal(false); setPayMethod(null); setStkMsg(null); }}
                className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {!payMethod ? (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-slate-500">Choose how you&apos;d like to pay the entry fee:</p>
                <button
                  onClick={() => openPayModal("stk")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all text-left"
                >
                  <Smartphone size={20} className="text-blue-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">Pay via M-PESA (STK) — instant</p>
                    <p className="text-xs text-slate-500">You&apos;ll get an M-PESA prompt on your phone. Enter your PIN to pay instantly.</p>
                  </div>
                </button>
                <button
                  onClick={() => openPayModal("manual")}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-left"
                >
                  <Receipt size={20} className="text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-900">Pay Manually (Till)</p>
                    <p className="text-xs text-slate-500">Send money via Lipa na M-PESA to Till <b>123456</b>, paste the message below, and submit for review.</p>
                  </div>
                </button>
              </div>
            ) : payMethod === "stk" ? (
              <div className="space-y-4 pt-2">
                <label className="block text-sm font-medium text-slate-700">
                  M-PESA Phone Number (Safaricom)
                </label>
                <input
                  value={stkPhone}
                  onChange={(e) => setStkPhone(e.target.value)}
                  placeholder="e.g. 0712 345 678"
                  className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                {stkMsg && (
                  <div className={`text-sm px-4 py-3 rounded-xl ${
                    stkMsg.type === "success"
                      ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}>
                    {stkMsg.type === "success" ? <CheckCircle size={15} /> : <AlertCircle size={15} />} {stkMsg.text}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button loading={stkBusy} icon={<Smartphone size={15} />} onClick={handleStk}>
                    Send STK Prompt
                  </Button>
                  <Button variant="ghost" onClick={() => { setPayMethod(null); setStkMsg(null); }}>Back</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-slate-700 space-y-1">
                  <p className="font-semibold text-emerald-800">How to pay manually:</p>
                  <p>1. Go to M-PESA on your phone</p>
                  <p>2. Choose <b>Lipa na M-PESA</b> → <b>Buy Goods</b></p>
                  <p>3. Enter Till Number <b className="text-lg">123456</b></p>
                  <p>4. Enter the amount and your PIN, then confirm</p>
                  <p>5. Paste the M-PESA confirmation message below</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Paste M-PESA message</label>
                  <textarea
                    rows={3}
                    placeholder="Paste the full M-PESA confirmation message (with the code)…"
                    value={mpesa.proof}
                    onChange={(e) => setMpesa({ ...mpesa, proof: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">M-PESA code</label>
                  <input
                    value={mpesa.code}
                    onChange={(e) => setMpesa({ ...mpesa, code: e.target.value })}
                    placeholder="e.g. SFS5K7X2QZ"
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    loading={submittingPay}
                    icon={<ExternalLink size={15} />}
                    className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100"
                    onClick={handleManualSubmit}
                  >
                    Submit for Review
                  </Button>
                  <Button variant="ghost" onClick={() => { setPayMethod(null); setStkMsg(null); }}>Back</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

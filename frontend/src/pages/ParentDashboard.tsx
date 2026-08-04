
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users, GraduationCap, School, Trophy, Award,
  LogOut, Link2, Unlink, CheckCircle2, AlertCircle, UserPlus, Eye,
  Smartphone, Receipt, X,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, StatCard } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageSpinner } from "../components/ui/Spinner";
import { apiUrl, authHeaders, getUser } from "../utils/api";

type Child = {
  id: number;
  full_name: string;
  email?: string;
  school?: string;
  grade?: string;
  parent_phone?: string;
  registered: boolean;
  payment_status?: string | null;
  result?: { score?: number | null; percentage?: number | null; grade?: string | null; completed?: number; marked?: number } | null;
  certificates: number;
  contests_entered: number;
};

export default function ParentDashboard() {
  const navigate = useNavigate();

  const [children, setChildren] = useState<Child[]>([]);
  const [contest, setContest] = useState<{ id: number; name: string; status?: string } | null>(null);
  const [parentName, setParentName] = useState("");
  const [pageLoading, setPageLoading] = useState(true);

  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm] = useState({ full_name: "", email: "", username: "", password: "", school: "", grade: "Grade 7" });
  const [regBusy, setRegBusy] = useState(false);

  const [payBusy, setPayBusy] = useState<number | null>(null);
  const [manualFor, setManualFor] = useState<Child | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [manualNote, setManualNote] = useState("");
  const [manualBusy, setManualBusy] = useState(false);

  const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Form 1", "Form 2", "Form 3", "Form 4"];

  const load = async () => {
    try {
      const res  = await fetch(apiUrl("/api/parent/dashboard"), { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setChildren(data.children || []);
        setContest(data.contest);
      } else {
        setFeedback({ type: "error", msg: data.error || "Failed to load dashboard" });
      }
    } catch {
      setFeedback({ type: "error", msg: "Connection error" });
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login"); return; }
    const u = getUser();
    if (!u?.id || u.role !== "parent") { navigate("/login"); return; }
    setParentName(u.name || "Parent");
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkEmail.trim()) return;
    setLinking(true);
    try {
      const res = await fetch(apiUrl("/api/parent/link-child"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ student_email: linkEmail.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", `${data.child.full_name} linked to your account`);
        setLinkEmail("");
        load();
      } else {
        showFeedback("error", data.error || "Could not link child");
      }
    } catch {
      showFeedback("error", "Connection error");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (child: Child) => {
    if (!window.confirm(`Unlink ${child.full_name} from your account?`)) return;
    try {
      const res = await fetch(apiUrl(`/api/parent/unlink/${child.id}`), {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", `${child.full_name} was unlinked`);
        load();
      } else {
        showFeedback("error", data.error || "Could not unlink child");
      }
    } catch {
      showFeedback("error", "Connection error");
    }
  };

  const handleRegisterChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.full_name.trim() || !regForm.email.trim() || !regForm.password || !regForm.grade) return;
    setRegBusy(true);
    try {
      const res = await fetch(apiUrl("/api/parent/register-child"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          full_name: regForm.full_name.trim().toUpperCase(),
          email: regForm.email.trim().toLowerCase(),
          username: regForm.username.trim() || regForm.email.trim().split("@")[0],
          password: regForm.password,
          school: regForm.school.trim().toUpperCase(),
          grade: regForm.grade,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", `${data.student?.full_name ?? "Child"} registered and linked`);
        setRegForm({ full_name: "", email: "", username: "", password: "", school: "", grade: "Grade 7" });
        setShowRegister(false);
        load();
      } else {
        showFeedback("error", data.error || "Could not register child");
      }
    } catch {
      showFeedback("error", "Connection error");
    } finally {
      setRegBusy(false);
    }
  };

  const payStk = async (child: Child) => {
    setPayBusy(child.id);
    try {
      const res = await fetch(apiUrl(`/api/parent/child/${child.id}/pay-stk`), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ phone: getUser()?.phone || "" }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", data.checkout_request_id
          ? `M-PESA prompt sent. Complete payment on your phone${data.registration_pending ? " — registration will complete on confirmation" : ""}.`
          : "M-PESA prompt sent. Complete payment on your phone.");
        load();
      } else {
        showFeedback("error", data.error || "Could not start M-PESA payment");
      }
    } catch {
      showFeedback("error", "Connection error");
    } finally {
      setPayBusy(null);
    }
  };

  const submitManual = async () => {
    if (!manualFor || !manualCode.trim()) return;
    setManualBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/parent/child/${manualFor.id}/pay-manual`), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ mpesa_code: manualCode.trim(), proof_text: manualNote.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback("success", "Payment submitted. It will be reviewed and confirmed by the administrator.");
        setManualFor(null); setManualCode(""); setManualNote("");
        load();
      } else {
        showFeedback("error", data.error || "Could not submit payment");
      }
    } catch {
      showFeedback("error", "Connection error");
    } finally {
      setManualBusy(false);
    }
  };

  if (pageLoading) return <PageSpinner message="Loading parent dashboard…" />;

  const totalContests = children.reduce((n, c) => n + (c.contests_entered || 0), 0);
  const totalCerts = children.reduce((n, c) => n + (c.certificates || 0), 0);
  const registered = children.filter((c) => c.registered).length;

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Welcome back</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Parent Dashboard</h1>
            <p className="text-sm text-slate-500 mt-1">Track {parentName}&apos;s children on Kenya Math Quest</p>
          </div>
          <Button variant="ghost" icon={<LogOut size={16} />}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => { localStorage.removeItem("token"); window.location.href = "/login"; }}>
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

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Linked Children" value={children.length} icon={<Users size={22} />} />
          <StatCard label="Contests Entered" value={totalContests} icon={<Trophy size={22} />} accent="text-violet-600" />
          <StatCard label="Certificates" value={totalCerts} icon={<Award size={22} />} accent="text-amber-600" />
        </div>

        {/* Current contest banner */}
        <Card className="mb-8 border-l-4 border-l-blue-500">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <p className="text-sm text-slate-500">Current contest</p>
              <h3 className="font-bold text-slate-900">{contest ? contest.name : "No contest published yet"}</h3>
            </div>
            {contest && <Badge variant="info">{registered} child(ren) registered</Badge>}
          </div>
        </Card>

        {/* Link child */}
        <Card className="mb-8">
          <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Link2 size={18} className="text-blue-600" /> Link a Child
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Enter your child&apos;s account email to link them to your account. You can link more than one child.
          </p>
          <form onSubmit={handleLink} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              placeholder="child@email.com"
              required
              value={linkEmail}
              onChange={(e) => setLinkEmail(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            />
            <Button type="submit" loading={linking} icon={<Link2 size={15} />}>
              Link Child
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100">
            {!showRegister ? (
              <Button variant="outline" icon={<UserPlus size={15} />} onClick={() => setShowRegister(true)}>
                Register a Child (create new student account)
              </Button>
            ) : (
              <form onSubmit={handleRegisterChild} className="space-y-3">
                <p className="text-sm font-semibold text-slate-700">Create &amp; link a new student account for your child</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input
                    placeholder="CHILD FULL NAME" required value={regForm.full_name}
                    onChange={(e) => setRegForm({ ...regForm, full_name: e.target.value.toUpperCase() })}
                    className="px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <select
                    value={regForm.grade}
                    onChange={(e) => setRegForm({ ...regForm, grade: e.target.value })}
                    className="px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  >
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                  <input
                    type="email" placeholder="child@email.com" required value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value.toLowerCase() })}
                    className="px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <input
                    placeholder="Username (optional)" value={regForm.username}
                    onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                    className="px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <input
                    placeholder="SCHOOL NAME" value={regForm.school}
                    onChange={(e) => setRegForm({ ...regForm, school: e.target.value.toUpperCase() })}
                    className="px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <input
                    type="password" placeholder="Password" required value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    className="px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={regBusy} icon={<UserPlus size={15} />}>Register Child</Button>
                  <Button type="button" variant="ghost" icon={<X size={15} />} onClick={() => setShowRegister(false)}>Cancel</Button>
                </div>
              </form>
            )}
          </div>
        </Card>

        {/* Children */}
        {children.length === 0 ? (
          <Card className="text-center py-14">
            <GraduationCap size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No children linked yet</p>
            <p className="text-sm text-slate-400 mt-1">Link your child above to see their progress</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {children.map((c) => (
              <Card key={c.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 text-lg font-bold flex items-center justify-center shrink-0">
                    {c.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900">{c.full_name}</h3>
                      <Badge variant="info">{c.grade || "—"}</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                      <School size={13} /> {c.school || "No school"}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      {!c.registered && <Badge variant="default">Not registered for current contest</Badge>}
                      {c.registered && c.payment_status === "paid" && <Badge variant="success" dot>Registered • Paid</Badge>}
                      {c.registered && c.payment_status === "pending" && <Badge variant="warning">Payment under review</Badge>}
                      {c.registered && !c.payment_status && <Badge variant="warning">Registered • Payment required</Badge>}
                      {c.result?.completed ? (
                        <Badge variant="success">
                          {c.result.score ?? "—"} pts{c.result.percentage != null ? ` · ${c.result.percentage}%` : ""}
                          {c.result.grade ? ` · ${c.result.grade}` : ""}
                        </Badge>
                      ) : null}
                      <Badge variant="purple"><Trophy size={12} /> {c.contests_entered} contest(s)</Badge>
                      <Badge variant="default"><Award size={12} /> {c.certificates} cert(s)</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-end sm:self-center">
                  {(c.payment_status !== "paid") && (
                    <>
                      <Button size="sm" icon={<Smartphone size={14} />} loading={payBusy === c.id}
                        onClick={() => payStk(c)}>
                        Pay via M-PESA
                      </Button>
                      <Button size="sm" variant="outline" icon={<Receipt size={14} />}
                        onClick={() => { setManualFor(c); setManualCode(""); setManualNote(""); }}>
                        Manual Payment
                      </Button>
                    </>
                  )}
                  <Button size="sm" variant="outline" icon={<Eye size={14} />}
                    onClick={() => navigate(`/parent-dashboard/child/${c.id}`)}>
                    View Full Details
                  </Button>
                  <Button size="sm" variant="ghost" icon={<Unlink size={14} />}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                    onClick={() => handleUnlink(c)}>
                    Unlink
                  </Button>
                </div>
              </Card>
            ))}

            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" icon={<UserPlus size={15} />} onClick={() => setShowRegister(true)}>
                Register Another Child
              </Button>
            </div>
          </div>
        )}

        {manualFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg text-slate-900">Manual Payment</h3>
                <button onClick={() => setManualFor(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Pay M-PESA to the contest account, then enter the transaction code below. An administrator
                will review and confirm your payment.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">M-PESA Transaction Code</label>
                  <input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="e.g. SDF3A2B4C5"
                    required
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Note (optional)</label>
                  <textarea
                    rows={3}
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    placeholder="Anything the admin should know (payer name, etc.)"
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                  />
                </div>
                <div className="flex gap-3 justify-end pt-1">
                  <Button variant="ghost" onClick={() => setManualFor(null)}>Cancel</Button>
                  <Button loading={manualBusy} icon={<Receipt size={15} />} onClick={submitManual}>
                    Submit Payment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

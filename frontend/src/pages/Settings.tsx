
import { useEffect, useState } from "react";
import { apiUrl, authHeaders, fetchMe, getUser } from "../utils/api";
import { Mail, Lock, GraduationCap } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Alert } from "../components/ui/Alert";

const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Form 1", "Form 2", "Form 3", "Form 4"];

export default function Settings() {
  const [me, setMe] = useState(getUser());
  const [email, setEmail] = useState("");
  const [pwCurrent, setPwCurrent] = useState({ current: "", next: "", confirm: "" });
  const [emailCurrentPw, setEmailCurrentPw] = useState("");
  const [msg, setMsg] = useState({ ok: "", err: "" });

  const [grade, setGrade] = useState("");
  const [updatingGrade, setUpdatingGrade] = useState(false);

  useEffect(() => {
    fetchMe().then((u) => setMe(u));
  }, []);

  useEffect(() => {
    // Load the student's current class so the selector can preselect it.
    if (me?.role === "student") {
      fetch(apiUrl("/api/student/materials"), { headers: authHeaders() })
        .then((r) => r.json())
        .then((d) => { if (d.success && d.grade) setGrade(d.grade); })
        .catch(() => {});
    }
  }, [me?.role]);

  const updateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grade) return;
    setUpdatingGrade(true);
    setMsg({ ok: "", err: "" });
    try {
      const res = await fetch(apiUrl("/api/student/update-class"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ grade }),
      });
      const data = await res.json();
      if (data.success) setMsg({ ok: data.message, err: "" });
      else setMsg({ ok: "", err: data.error });
    } catch {
      setMsg({ ok: "", err: "Network error." });
    } finally {
      setUpdatingGrade(false);
    }
  };

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ ok: "", err: "" });
    try {
      const res = await fetch(apiUrl("/api/auth/change-email"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ current_password: emailCurrentPw, new_email: email }),
      });
      const data = await res.json();
      if (data.success) setMsg({ ok: data.message, err: "" });
      else setMsg({ ok: "", err: data.error });
    } catch {
      setMsg({ ok: "", err: "Network error." });
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ ok: "", err: "" });
    if (pwCurrent.next !== pwCurrent.confirm) {
      setMsg({ ok: "", err: "New passwords do not match." }); return;
    }
    try {
      const res = await fetch(apiUrl("/api/auth/change-password"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ current_password: pwCurrent.current, new_password: pwCurrent.next }),
      });
      const data = await res.json();
      if (data.success) setMsg({ ok: data.message, err: "" });
      else setMsg({ ok: "", err: data.error });
    } catch {
      setMsg({ ok: "", err: "Network error." });
    }
  };

  if (!me || me.role === "owner") {
    return (
      <main className="kmq-dashboard pt-[104px] min-h-screen bg-surface px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-border p-8 text-center">
          <div className="w-12 h-12 bg-primary-light text-primary-dark rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={22} />
          </div>
          <p className="text-muted">
            Sign in to manage your settings. Owners manage their account from the Admin Dashboard.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-[104px] min-h-screen bg-surface px-4 py-12">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>

        {msg.ok && <Alert variant="success">{msg.ok}</Alert>}
        {msg.err && <Alert variant="error">{msg.err}</Alert>}

        {me?.role === "student" && (
          <div className="bg-white rounded-2xl shadow-soft border border-border p-6">
            <h2 className="text-lg font-semibold text-foreground mb-1 inline-flex items-center gap-2">
              <GraduationCap size={18} className="text-emerald-600" /> My Class / Form
            </h2>
            <p className="text-sm text-muted mb-4">
              Update your class or form. This affects which questions, instructions and revision materials you get.
            </p>
            <form onSubmit={updateClass} className="space-y-4">
              <Select label="Current selection" value={grade} onChange={(e) => setGrade(e.target.value)} required>
                <option value="" disabled>Choose your grade / form…</option>
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </Select>
              <Button type="submit" loading={updatingGrade} icon={<GraduationCap size={15} />}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100">
                Save My Class
              </Button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-soft border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 inline-flex items-center gap-2">
            <Mail size={18} className="text-primary-dark" /> Change Email
          </h2>
          <form onSubmit={changeEmail} className="space-y-4">
            <Input label="New Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="new@email.com" icon={<Mail size={16} />} />
            <Input label="Current Password" type="password" required value={emailCurrentPw} onChange={(e) => setEmailCurrentPw(e.target.value)}
              placeholder="••••••••" icon={<Lock size={16} />} />
            <Button type="submit">Update Email</Button>
          </form>
        </div>

        <div className="bg-white rounded-2xl shadow-soft border border-border p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 inline-flex items-center gap-2">
            <Lock size={18} className="text-primary-dark" /> Change Password
          </h2>
          <form onSubmit={changePassword} className="space-y-4">
            <Input label="Current Password" type="password" required value={pwCurrent.current} onChange={(e) => setPwCurrent({ ...pwCurrent, current: e.target.value })}
              placeholder="••••••••" icon={<Lock size={16} />} />
            <Input label="New Password" type="password" required value={pwCurrent.next} onChange={(e) => setPwCurrent({ ...pwCurrent, next: e.target.value })}
              placeholder="At least 8 characters" />
            <Input label="Confirm New Password" type="password" required value={pwCurrent.confirm} onChange={(e) => setPwCurrent({ ...pwCurrent, confirm: e.target.value })}
              placeholder="••••••••" />
            <Button type="submit">Update Password</Button>
          </form>
        </div>
      </div>
    </main>
  );
}

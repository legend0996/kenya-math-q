
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { UserPlus, GraduationCap, School, Users, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Image from "../components/Image";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Alert } from "../components/ui/Alert";
import { apiUrl } from "../utils/api";

const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Form 1", "Form 2", "Form 3", "Form 4"];
const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Meru","Nyeri","Thika",
  "Machakos","Garissa","Kakamega","Kisii","Kericho","Bungoma","Other"
];

export default function Register() {
  const [params] = useSearchParams();
  const role = params.get("role");
  const initialType = role === "school" ? "school" : role === "parent" ? "parent" : "student";

  const [type, setType]       = useState<"student" | "school" | "parent">(initialType);
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    full_name: "", name: "", email: "", password: "",
    school: "", grade: "", county: "", phone: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let v = e.target.value;
    if (key === "email") v = v.toLowerCase();
    else if (key !== "password" && !["grade", "county"].includes(key)) v = v.toUpperCase();
    setForm({ ...form, [key]: v });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const endpoint =
      type === "student"
        ? apiUrl("/api/auth/student/register")
        : type === "school"
          ? apiUrl("/api/auth/school/register")
          : apiUrl("/api/auth/parent/register");

    try {
      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || "Registration successful! You can now log in.");
        setForm({ full_name: "", name: "", email: "", password: "", school: "", grade: "", county: "", phone: "" });
      } else {
        setError(data.error || "Registration failed. Please check your details.");
      }
    } catch {
      setError("Connection error. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-[104px] min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Image
            src="/logo.jpeg"
            alt="Kenya Math Quest"
            width={80}
            height={80}
            className="rounded-full mx-auto mb-4 shadow-lifted"
          />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Create Account</h1>
          <p className="text-muted text-sm mt-1">Join Kenya Math Quest today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-border p-8">

          <div className="flex bg-ghost-white-500 rounded-xl p-1 border border-border mb-6" role="tablist" aria-label="Account type">
            {[
              { key: "student", label: "Student",  Icon: GraduationCap },
              { key: "school",  label: "School",   Icon: School },
              { key: "parent",  label: "Parent",   Icon: Users },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={type === key}
                onClick={() => { setType(key as "student" | "school" | "parent"); setError(""); setSuccess(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  type === key
                    ? "bg-white text-primary-dark shadow-soft border border-border"
                    : "text-muted hover:text-foreground"
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {error && <Alert variant="error" className="mb-5">{error}</Alert>}
          {success && (
            <Alert variant="success" className="mb-5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 text-emerald-600" /> {success}
              </div>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === "student" && (
              <>
                <Input label="Full Name" placeholder="John Kamau" required value={form.full_name} onChange={set("full_name")} />
                <Input label="School Name" placeholder="Nairobi Academy" required value={form.school} onChange={set("school")} />
                <Select label="Grade / Form" required value={form.grade} onChange={set("grade")}>
                  <option value="">Select grade…</option>
                  {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                </Select>
              </>
            )}

            {type === "school" && (
              <>
                <Input label="School Name" placeholder="Nairobi Academy" required value={form.name} onChange={set("name")} />
                <Select label="County" required value={form.county} onChange={set("county")}>
                  <option value="">Select county…</option>
                  {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </>
            )}

            {type === "parent" && (
              <>
                <Input label="Full Name" placeholder="John Kamau" required value={form.full_name} onChange={set("full_name")} />
                <Input
                  label="Phone Number"
                  hint="Use the number recorded for your child"
                  type="tel"
                  placeholder="07XX XXX XXX"
                  required
                  value={form.phone}
                  onChange={set("phone")}
                />
              </>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              required
              value={form.email}
              onChange={set("email")}
            />

            <Input
              label="Password"
              type={showPw ? "text" : "password"}
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              value={form.password}
              onChange={set("password")}
              rightSlot={
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="text-slate-400 hover:text-foreground p-1">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            <Button type="submit" fullWidth size="lg" loading={loading} icon={<UserPlus size={16} />}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-primary-dark font-semibold hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

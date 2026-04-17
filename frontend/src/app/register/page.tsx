"use client";

import { useState } from "react";
import { UserPlus, GraduationCap, School, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { Button } from "../../components/ui/Button";

const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Form 1", "Form 2", "Form 3", "Form 4"];
const COUNTIES = [
  "Nairobi","Mombasa","Kisumu","Nakuru","Eldoret","Meru","Nyeri","Thika",
  "Machakos","Garissa","Kakamega","Kisii","Kericho","Bungoma","Other"
];

export default function Register() {
  const [type, setType]       = useState<"student" | "school">("student");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError]     = useState("");

  const [form, setForm] = useState({
    full_name: "", name: "", email: "", password: "",
    school: "", grade: "", county: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const endpoint =
      type === "student"
        ? apiUrl("/api/auth/student/register")
        : apiUrl("/api/auth/school/register");

    try {
      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || "Registration successful! You can now log in.");
        setForm({ full_name: "", name: "", email: "", password: "", school: "", grade: "", county: "" });
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
    <main className="pt-16 min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.jpeg"
            alt="Kenya Math Quest"
            width={80}
            height={80}
            className="rounded-full mx-auto mb-4 shadow-lg"
          />
          <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 text-sm mt-1">Join Kenya Math Quest today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">

          {/* Type toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {[
              { key: "student", label: "Student",  Icon: GraduationCap },
              { key: "school",  label: "School",   Icon: School },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setType(key as "student" | "school"); setError(""); setSuccess(""); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  type === key
                    ? "bg-white text-blue-700 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
              <span className="mt-0.5">⚠</span> {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
              <span className="mt-0.5">✓</span> {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === "student" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                  <input placeholder="John Kamau" required value={form.full_name} onChange={set("full_name")}
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">School Name</label>
                  <input placeholder="Nairobi Academy" required value={form.school} onChange={set("school")}
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Grade / Form</label>
                  <select required value={form.grade} onChange={set("grade")}
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all">
                    <option value="">Select grade…</option>
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </>
            )}

            {type === "school" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">School Name</label>
                  <input placeholder="Nairobi Academy" required value={form.name} onChange={set("name")}
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">County</label>
                  <select required value={form.county} onChange={set("county")}
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all">
                    <option value="">Select county…</option>
                    {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
              <input type="email" placeholder="your@email.com" required value={form.email} onChange={set("email")}
                className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  required minLength={8}
                  value={form.password}
                  onChange={set("password")}
                  className="w-full px-4 py-2.5 pr-11 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading} icon={<UserPlus size={16} />}>
              Create Account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 font-semibold hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}

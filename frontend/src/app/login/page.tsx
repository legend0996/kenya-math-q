"use client";

import { useState } from "react";
import { apiUrl } from "../../utils/api";
import { LogIn, GraduationCap, School, Eye, EyeOff, User } from "lucide-react";
import Image from "next/image";
import { Button } from "../../components/ui/Button";

export default function Login() {
  const [type, setType]       = useState<"student" | "school">("student");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [step, setStep]       = useState<"check" | "password">("check");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const checkIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const idValue = identifier.trim();
    if (!idValue) {
      setError("Please enter your email or username.");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(apiUrl("/api/auth/check"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: idValue, type }),
      });
      const data = await res.json();
      if (data.exists) {
        setStep("password");
      } else {
        setError("No account found with that email/username. Try a different one or register.");
      }
    } catch {
      setError("Connection error. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint =
      type === "student"
        ? apiUrl("/api/auth/student/login")
        : apiUrl("/api/auth/school/login");

    try {
      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        window.location.href = type === "school" ? "/school-dashboard" : "/dashboard";
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
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

        <div className="text-center mb-8">
          <Image
            src="/logo.jpeg"
            alt="Kenya Math Quest"
            width={80}
            height={80}
            className="rounded-full mx-auto mb-4 shadow-lg"
          />
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 text-sm mt-1">Sign in to your Kenya Math Quest account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">

          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            {[
              { key: "student", label: "Student",  Icon: GraduationCap },
              { key: "school",  label: "School",   Icon: School },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setType(key as "student" | "school"); setStep("check"); setIdentifier(""); setPassword(""); setError(""); }}
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5 flex items-start gap-2">
              <span className="mt-0.5">⚠</span> {error}
            </div>
          )}

          {step === "check" ? (
            <form onSubmit={checkIdentity} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email or Username</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="you@email.com or your username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
              </div>
              <Button type="submit" fullWidth size="lg" loading={loading} icon={<User size={16} />}>
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 inline-flex items-center gap-2">
                  <User size={14} className="text-blue-600" /> {identifier}
                </span>
                <button type="button" onClick={() => { setStep("check"); setPassword(""); }}
                  className="text-blue-600 font-medium hover:underline">
                  Change
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-11 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="text-right -mt-1">
                <a href="/forgot-password" className="text-sm text-blue-600 font-medium hover:underline">
                  Forgot password?
                </a>
              </div>
              <Button type="submit" fullWidth size="lg" loading={loading} icon={<LogIn size={16} />}>
                Sign In
              </Button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-blue-600 font-semibold hover:underline">
              Register here
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
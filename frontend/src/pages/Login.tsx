import { useState } from "react";
import { apiUrl } from "../utils/api";
import { LogIn, GraduationCap, School, Users, Eye, EyeOff, User, KeyRound, ArrowLeft } from "lucide-react";
import Image from "../components/Image";
import { Button } from "../components/ui/Button";

type ForgotStage = "email" | "code" | "done";

export default function Login() {
  const [type, setType]       = useState<"student" | "school" | "parent">("student");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [step, setStep]       = useState<"check" | "password">("check");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const [forgot, setForgot] = useState(false);
  const [forgotStage, setForgotStage] = useState<ForgotStage>("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [forgotConfirm, setForgotConfirm] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotNotice, setForgotNotice] = useState("");

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
        : type === "school"
          ? apiUrl("/api/auth/school/login")
          : apiUrl("/api/auth/parent/login");

    try {
      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        window.location.href =
          type === "school" ? "/school-dashboard"
          : type === "parent" ? "/parent-dashboard"
          : "/dashboard";
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
      }
    } catch {
      setError("Connection error. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    setForgot(true);
    setForgotStage("email");
    setForgotError("");
    setForgotNotice("");
  };

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotNotice("");
    setForgotLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/forgot"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotStage("code");
        setForgotNotice(data.dev_code ? `${data.message} (dev code: ${data.dev_code})` : data.message);
      } else {
        setForgotError(data.error || "Something went wrong.");
      }
    } catch {
      setForgotError("Connection error. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const completeReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotNotice("");
    if (forgotPassword !== forgotConfirm) { setForgotError("Passwords do not match."); return; }
    if (forgotPassword.length < 8) { setForgotError("Password must be at least 8 characters."); return; }
    setForgotLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, code: forgotCode, new_password: forgotPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setForgotStage("done");
      } else {
        setForgotError(data.error || "Could not reset password.");
      }
    } catch {
      setForgotError("Network error. Please try again.");
    } finally {
      setForgotLoading(false);
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
          <h1 className="text-2xl font-bold text-slate-900">
            {forgot ? "Reset Password" : "Welcome Back"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {forgot ? "We'll email you a code that expires in 15 minutes." : "Sign in to your Kenya Math Quest account"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">

          {!forgot && (
            <>
              <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
                {[
                  { key: "student", label: "Student",  Icon: GraduationCap },
                  { key: "school",  label: "School",   Icon: School },
                  { key: "parent",  label: "Parent",   Icon: Users },
                ].map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setType(key as "student" | "school" | "parent"); setStep("check"); setIdentifier(""); setPassword(""); setError(""); }}
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
                    <button type="button" onClick={openForgot}
                      className="text-sm text-blue-600 font-medium hover:underline">
                      Forgot password?
                    </button>
                  </div>
                  <Button type="submit" fullWidth size="lg" loading={loading} icon={<LogIn size={16} />}>
                    Sign In
                  </Button>
                </form>
              )}

              <div className="mt-4 text-center">
                <button type="button" onClick={openForgot}
                  className="text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                  Forgot password? Reset it here
                </button>
              </div>

              <p className="text-center text-sm text-slate-500 mt-4">
                Don&apos;t have an account?{" "}
                <a href="/register" className="text-blue-600 font-semibold hover:underline">
                  Register here
                </a>
              </p>
            </>
          )}

          {forgot && (
            <div className="space-y-4">
              {forgotError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                  <span className="mt-0.5">⚠</span> {forgotError}
                </div>
              )}
              {forgotNotice && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                  <KeyRound size={15} className="mt-0.5 shrink-0" /> {forgotNotice}
                </div>
              )}

              {forgotStage === "email" && (
                <form onSubmit={requestReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Email</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <Button type="submit" fullWidth size="lg" loading={forgotLoading} icon={<KeyRound size={16} />}>
                    Send Reset Code
                  </Button>
                </form>
              )}

              {forgotStage === "code" && (
                <form onSubmit={completeReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Reset Code</label>
                    <input
                      type="text"
                      required
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value)}
                      placeholder="6-digit code"
                      className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                    <input
                      type="password"
                      required
                      value={forgotPassword}
                      onChange={(e) => setForgotPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      required
                      value={forgotConfirm}
                      onChange={(e) => setForgotConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                    />
                  </div>
                  <Button type="submit" fullWidth size="lg" loading={forgotLoading} icon={<KeyRound size={16} />}>
                    Reset Password
                  </Button>
                </form>
              )}

              {forgotStage === "done" && (
                <div className="text-center py-4 space-y-4">
                  <div className="text-emerald-700 text-sm bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    Password updated! You can now log in.
                  </div>
                  <Button fullWidth size="lg" icon={<LogIn size={16} />}
                    onClick={() => { setForgot(false); setPassword(""); setStep("check"); }}>
                    Back to Login
                  </Button>
                </div>
              )}

              <button type="button" onClick={() => setForgot(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 font-medium transition-colors">
                <ArrowLeft size={14} /> Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

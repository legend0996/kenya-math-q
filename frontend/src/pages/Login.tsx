import { useState } from "react";
import { apiUrl, setUser } from "../utils/api";
import { LogIn, GraduationCap, School, Users, Eye, EyeOff, User, KeyRound, ArrowLeft } from "lucide-react";
import Image from "../components/Image";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Alert } from "../components/ui/Alert";

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

      if (data.success || data.token) {
        // Session lives in an httpOnly cookie — do NOT store the JWT in localStorage.
        if (data.user) setUser({ id: data.user.id, role: data.user.role, name: data.user.name, school: data.user.school, grade: data.user.grade });
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
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {forgot ? "Reset Password" : "Welcome Back"}
          </h1>
          <p className="text-muted text-sm mt-1">
            {forgot ? "We'll email you a code that expires in 15 minutes." : "Sign in to your Kenya Math Quest account"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-border p-8">

          {!forgot && (
            <>
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
                    onClick={() => { setType(key as "student" | "school" | "parent"); setStep("check"); setIdentifier(""); setPassword(""); setError(""); }}
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

              {step === "check" ? (
                <form onSubmit={checkIdentity} className="space-y-4">
                  <Input
                    label="Email or Username"
                    icon={<User size={16} />}
                    type="text"
                    placeholder="you@email.com or your username"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                  <Button type="submit" fullWidth size="lg" loading={loading} icon={<User size={16} />}>
                    Continue
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600 inline-flex items-center gap-2">
                      <User size={14} className="text-primary-dark" /> {identifier}
                    </span>
                    <button type="button" onClick={() => { setStep("check"); setPassword(""); }}
                      className="text-primary-dark font-medium hover:underline">
                      Change
                    </button>
                  </div>
                  <Input
                    label="Password"
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    rightSlot={
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="text-slate-400 hover:text-foreground p-1">
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <div className="text-right -mt-1">
                    <button type="button" onClick={openForgot}
                      className="text-sm text-primary-dark font-medium hover:underline">
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
                  className="text-sm text-muted hover:text-primary-dark font-medium transition-colors">
                  Forgot password? Reset it here
                </button>
              </div>

              <p className="text-center text-sm text-muted mt-4">
                Don&apos;t have an account?{" "}
                <a href="/register" className="text-primary-dark font-semibold hover:underline">
                  Register here
                </a>
              </p>
            </>
          )}

          {forgot && (
            <div className="space-y-4">
              {forgotError && <Alert variant="error">{forgotError}</Alert>}
              {forgotNotice && <Alert variant="info">{forgotNotice}</Alert>}

              {forgotStage === "email" && (
                <form onSubmit={requestReset} className="space-y-4">
                  <Input
                    label="Account Email"
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="you@email.com"
                    icon={<KeyRound size={16} />}
                  />
                  <Button type="submit" fullWidth size="lg" loading={forgotLoading} icon={<KeyRound size={16} />}>
                    Send Reset Code
                  </Button>
                </form>
              )}

              {forgotStage === "code" && (
                <form onSubmit={completeReset} className="space-y-4">
                  <Input
                    label="Reset Code"
                    type="text"
                    required
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value)}
                    placeholder="6-digit code"
                  />
                  <Input
                    label="New Password"
                    type={showPw ? "text" : "password"}
                    required
                    value={forgotPassword}
                    onChange={(e) => setForgotPassword(e.target.value)}
                    placeholder="••••••••"
                    rightSlot={
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="text-slate-400 hover:text-foreground p-1">
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <Input
                    label="Confirm Password"
                    type={showPw ? "text" : "password"}
                    required
                    value={forgotConfirm}
                    onChange={(e) => setForgotConfirm(e.target.value)}
                    placeholder="••••••••"
                    rightSlot={
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="text-slate-400 hover:text-foreground p-1">
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                  <Button type="submit" fullWidth size="lg" loading={forgotLoading} icon={<KeyRound size={16} />}>
                    Reset Password
                  </Button>
                </form>
              )}

              {forgotStage === "done" && (
                <div className="text-center py-4 space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 size={16} className="shrink-0" /> Password updated! You can now log in.
                  </div>
                  <Button fullWidth size="lg" icon={<LogIn size={16} />}
                    onClick={() => { setForgot(false); setPassword(""); setStep("check"); }}>
                    Back to Login
                  </Button>
                </div>
              )}

              <button type="button" onClick={() => setForgot(false)}
                className="w-full inline-flex items-center justify-center gap-1.5 text-sm text-muted hover:text-primary-dark font-medium transition-colors">
                <ArrowLeft size={14} /> Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

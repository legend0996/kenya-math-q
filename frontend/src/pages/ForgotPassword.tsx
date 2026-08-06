
import { useState } from "react";
import { apiUrl } from "../utils/api";
import { KeyRound, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import Image from "../components/Image";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Alert } from "../components/ui/Alert";

type Stage = "email" | "code" | "done";

export default function ForgotPassword() {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail]     = useState("");
  const [code, setCode]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [notice, setNotice]   = useState("");

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setNotice(""); setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/forgot"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStage("code");
        setNotice(data.message);
        if (data.dev_code) setNotice(`${data.message} (dev code: ${data.dev_code})`);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setNotice("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/reset"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, new_password: password }),
      });
      const data = await res.json();
      if (data.success) {
        setStage("done");
      } else {
        setError(data.error || "Could not reset password.");
      }
    } catch {
      setError("Network error. Please try again.");
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
          <h1 className="text-2xl font-bold text-foreground inline-flex items-center gap-2 justify-center tracking-tight">
            <KeyRound size={22} className="text-primary-dark" /> Reset Password
          </h1>
          <p className="text-sm text-muted mt-1">We&apos;ll email you a code that expires in 15 minutes.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-border p-8">
          {error && <Alert variant="error" className="mb-5">{error}</Alert>}
          {notice && <Alert variant="info" className="mb-5">{notice}</Alert>}

          {stage === "email" && (
            <form onSubmit={requestReset} className="space-y-4">
              <Input
                label="Account Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                icon={<KeyRound size={16} />}
              />
              <Button type="submit" fullWidth size="lg" loading={loading} icon={<KeyRound size={16} />}>
                Send Reset Code
              </Button>
            </form>
          )}

          {stage === "code" && (
            <form onSubmit={reset} className="space-y-4">
              <Input
                label="Reset Code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
              />
              <Input
                label="New Password"
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                rightSlot={
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="text-slate-400 hover:text-foreground p-1">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <Button type="submit" fullWidth size="lg" loading={loading} icon={<KeyRound size={16} />}>
                Reset Password
              </Button>
            </form>
          )}

          {stage === "done" && (
            <div className="text-center py-4 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 size={16} className="shrink-0" /> Password updated! You can now log in.
              </div>
              <a href="/login">
                <Button fullWidth size="lg">Go to Login</Button>
              </a>
            </div>
          )}

          <a href="/login"
            className="mt-6 inline-flex items-center justify-center gap-1.5 w-full text-sm text-muted hover:text-primary-dark font-medium transition-colors">
            <ArrowLeft size={14} /> Remembered it? Go back to login
          </a>
        </div>
      </div>
    </main>
  );
}

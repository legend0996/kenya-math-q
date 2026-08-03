
import { useState } from "react";
import { apiUrl } from "../utils/api";
import { KeyRound, MessageSquareText } from "lucide-react";
import { Button } from "../components/ui/Button";

type Stage = "email" | "code" | "done";

export default function ForgotPassword() {
  const [stage, setStage] = useState<Stage>("email");
  const [email, setEmail]     = useState("");
  const [code, setCode]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    <main className="pt-16 min-h-screen bg-linear-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1 inline-flex items-center gap-2">
            <KeyRound size={20} className="text-blue-600" /> Reset Password
          </h1>
          <p className="text-sm text-slate-500 mb-6">We&apos;ll email you a code that expires in 15 minutes.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-5">⚠ {error}</div>
          )}

          {stage === "email" && (
            <form onSubmit={requestReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Account Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <Button type="submit" fullWidth size="lg" loading={loading} icon={<KeyRound size={16} />}>
                Send Reset Code
              </Button>
            </form>
          )}

          {stage === "code" && (
            <div className="space-y-4">
              {notice && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
                  <MessageSquareText size={15} className="mt-0.5 shrink-0" /> {notice}
                </div>
              )}
              <form onSubmit={reset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Reset Code</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="6-digit code"
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>
                <Button type="submit" fullWidth size="lg" loading={loading} icon={<KeyRound size={16} />}>
                  Reset Password
                </Button>
              </form>
            </div>
          )}

          {stage === "done" && (
            <div className="text-center py-4 space-y-4">
              <div className="text-green-600 text-sm bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                Password updated! You can now log in.
              </div>
              <a href="/login">
                <Button fullWidth size="lg">Go to Login</Button>
              </a>
            </div>
          )}

          <p className="text-center text-sm text-slate-500 mt-6">
            Remembered it? <a href="/login" className="text-blue-600 font-semibold hover:underline">Go back to login</a>
          </p>
        </div>
      </div>
    </main>
  );
}
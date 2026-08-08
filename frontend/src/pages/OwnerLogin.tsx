
import { useState } from "react";
import { apiUrl, setUser } from "../utils/api";
import { LogIn, Eye, EyeOff, Shield } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

export default function OwnerLogin() {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res  = await fetch(apiUrl("/api/owner/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.token) {
        // Session lives in an httpOnly cookie — do NOT store the JWT in localStorage.
        if (data.owner) setUser({ id: data.owner.id, role: "owner", name: data.owner.name, email: data.owner.email });
        window.location.href = "/owner-dashboard";
      } else {
        setError(data.error || "Invalid credentials");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-[104px] min-h-screen bg-charcoal-200 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern" />
      <div className="w-full max-w-sm relative z-10">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lifted mb-4">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Kenya Math Quest — Owner Access</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {error && (
            <div className="mb-5">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <input
                type="email" required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-charcoal-300 rounded-xl border border-slate-600 text-white placeholder:text-slate-500 focus:border-cool-sky-400 focus:ring-4 focus:ring-cool-sky-400/20 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-11 text-sm bg-charcoal-300 rounded-xl border border-slate-600 text-white placeholder:text-slate-500 focus:border-cool-sky-400 focus:ring-4 focus:ring-cool-sky-400/20 outline-none transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" fullWidth size="lg" loading={loading} icon={<LogIn size={16} />}>
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">Restricted Access · Authorised Personnel Only</p>
      </div>
    </main>
  );
}

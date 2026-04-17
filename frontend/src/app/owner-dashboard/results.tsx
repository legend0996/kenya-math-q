"use client";

import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Spinner, PageSpinner } from "../../components/ui/Spinner";

export default function ResultsManagement() {
  const [contests, setContests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [releasing, setReleasing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const getToken = () => localStorage.getItem("token") || "";
  const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/owner/contest/all", { headers: authHeader() })
      .then(r => r.json())
      .then(d => { if (d.success) setContests(d.contests || []); })
      .finally(() => setLoading(false));
  }, []);

  const releaseResults = async (contestId: number) => {
    setReleasing(true);
    try {
      const r = await fetch(`http://localhost:5000/api/owner/contest/${contestId}/release-results`, {
        method: "POST", headers: authHeader(),
      });
      const d = await r.json();
      if (d.success) {
        setContests(cs => cs.map(c => c.id === contestId ? { ...c, results_status: "released" } : c));
        setFeedback({ type: "success", msg: "Results released successfully." });
      } else {
        setFeedback({ type: "error", msg: d.message || "Failed to release results." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to release results." });
    } finally {
      setReleasing(false);
      setShowConfirm(false);
    }
  };

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Results Management</h1>
        {feedback && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {feedback.msg}
          </div>
        )}
        {loading ? <PageSpinner message="Loading contests..." /> : (
          <Card>
            <h2 className="font-bold text-slate-900 mb-4">Contests/Events</h2>
            {contests.length === 0 ? (
              <div className="text-center py-10 text-slate-400">No contests found.</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {contests.map((c: any) => (
                  <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="text-sm text-slate-500">{c.year}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={c.results_status === "released" ? "success" : "warning"}>
                        {c.results_status === "released" ? "Released" : "Pending"}
                      </Badge>
                      {c.results_status !== "released" && (
                        <Button size="sm" onClick={() => { setSelected(c); setShowConfirm(true); }}>
                          Release Results
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
        {/* Confirmation Modal */}
        {showConfirm && selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full">
              <h3 className="font-bold text-lg mb-2">Release Results?</h3>
              <p className="mb-4 text-slate-600">Are you sure you want to release results for <span className="font-semibold">{selected.name}</span>?</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowConfirm(false)}>Cancel</Button>
                <Button loading={releasing} onClick={() => releaseResults(selected.id)}>
                  Yes, Release
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { useContestStore } from "../../store/contestStore";

interface Contest {
  id: number;
  name: string;
  description?: string;
  scheduled_at?: string;
  status: "upcoming" | "ongoing" | "completed";
  joined?: boolean;
}

export default function AvailableContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success"|"error"; msg: string } | null>(null);
  const { joinedContests, joinContest: markJoined } = useContestStore();

  const getToken = () => localStorage.getItem("token") || "";
  const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  useEffect(() => {
    fetch("http://localhost:5000/api/contest/all", { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        if (d.success) setContests(d.contests || []);
      })
      .catch(() => setFeedback({ type: "error", msg: "Failed to load contests." }))
      .finally(() => setLoading(false));
  }, []);

  const joinContest = async (contestId: number) => {
    setJoining(contestId);
    try {
      const r = await fetch(`http://localhost:5000/api/contest/${contestId}/join`, {
        method: "POST", headers: authHeader(),
      });
      const d = await r.json();
      if (d.success) {
        setContests(cs => cs.map(c => c.id === contestId ? { ...c, joined: true } : c));
        markJoined(contestId);
        setFeedback({ type: "success", msg: "Successfully joined contest." });
      } else {
        setFeedback({ type: "error", msg: d.message || "Failed to join contest." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to join contest." });
    } finally {
      setJoining(null);
    }
  };

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Available Contests</h1>
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
          <div className="space-y-5">
            {contests.length === 0 ? (
              <Card><div className="text-center py-10 text-slate-400">No contests available.</div></Card>
            ) : contests.map((c) => (
              <Card key={c.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-lg text-slate-900 mb-1">{c.name}</p>
                  <p className="text-sm text-slate-500 mb-1">{c.description || "No description."}</p>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={c.status === "upcoming" ? "info" : c.status === "ongoing" ? "success" : "default"}>
                      {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                    </Badge>
                    {c.scheduled_at && (
                      <span className="text-xs text-slate-400 ml-2">
                        {new Date(c.scheduled_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {c.joined || joinedContests[c.id] ? (
                    <Button variant="secondary" disabled>Joined</Button>
                  ) : (
                    <Button loading={joining === c.id} onClick={() => joinContest(c.id)}>
                      Join Contest
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

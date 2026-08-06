
import { useEffect, useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { PageSpinner } from "../components/ui/Spinner";
import { Alert } from "../components/ui/Alert";
import { Trophy, FlaskConical, CalendarClock } from "lucide-react";
import { apiUrl, authHeaders } from "../utils/api";

interface Contest {
  id: number;
  name: string;
  year?: number;
  start_time?: string;
  end_time?: string;
  status?: string;
  registration_open?: boolean;
}

interface TestContest {
  id: number;
  name: string;
  open: boolean;
}

export default function AvailableContests() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [tests, setTests] = useState<TestContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/contest/all"))
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setContests(d.contests || []);
      })
      .catch(() => setFeedback({ type: "error", msg: "Failed to load contests." }));
    fetch(apiUrl("/api/contest/test"))
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setTests(d.tests || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const joinContest = async (contestId: number) => {
    setJoining(contestId);
    try {
      const r = await fetch(apiUrl("/api/contest/register"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contest_id: contestId }),
      });
      const d = await r.json();
      if (d.success) {
        setFeedback({ type: "success", msg: "Registered for contest. Complete payment on your dashboard." });
      } else {
        setFeedback({ type: "error", msg: d.error || "Failed to register." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to register." });
    } finally {
      setJoining(null);
    }
  };

  const registerTest = async (id: number) => {
    setJoining(id);
    try {
      const r = await fetch(apiUrl("/api/contest/register"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contest_id: id }),
      });
      const d = await r.json();
      if (d.success) {
        window.location.href = `/exam?contest_id=${id}`;
      } else {
        setFeedback({ type: "error", msg: d.error || "Failed to join test." });
        setJoining(null);
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to join test." });
      setJoining(null);
    }
  };

  return (
    <main className="kmq-dashboard pt-[104px] min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center">
            <Trophy size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Available Contests</h1>
            <p className="text-sm text-muted">Register for a round or practise with a test contest</p>
          </div>
        </div>

        {feedback && (
          <div className="mt-6">
            <Alert variant={feedback.type}>{feedback.msg}</Alert>
          </div>
        )}

        {loading ? (
          <div className="py-10"><PageSpinner message="Loading contests..." /></div>
        ) : (
          <div className="mt-8 space-y-5">
            {contests.length === 0 ? (
              <Card><div className="text-center py-10 text-muted">No contests available.</div></Card>
            ) : contests.map((c) => (
              <Card key={c.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-lg text-foreground mb-1">{c.name}</p>
                  <p className="text-sm text-muted mb-1">{c.year || "—"}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.status === "live" ? "success" : c.status === "upcoming" ? "info" : "default"}>
                      {(c.status || "ended").charAt(0).toUpperCase() + (c.status || "ended").slice(1)}
                    </Badge>
                    {c.start_time && (
                      <span className="text-xs text-muted inline-flex items-center gap-1">
                        <CalendarClock size={13} /> {new Date(c.start_time).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {c.registration_open ? (
                    <Button loading={joining === c.id} onClick={() => joinContest(c.id)}>
                      Register
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled>Registration Closed</Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 mt-12 mb-4">
          <div className="w-10 h-10 bg-brandblue text-white rounded-xl flex items-center justify-center">
            <FlaskConical size={20} />
          </div>
          <h2 className="text-xl font-bold text-foreground">Practice / Test Contests</h2>
        </div>
        {tests.length === 0 ? (
          <Card><div className="text-center py-8 text-muted">No test contests right now. Check back soon — admins can start one instantly.</div></Card>
        ) : (
          <div className="space-y-4">
            {tests.map((t) => (
              <Card key={t.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-dashed">
                <div>
                  <p className="font-bold text-foreground mb-1 inline-flex items-center gap-2">
                    {t.name}
                    <Badge variant={t.open ? "success" : "default"}>{t.open ? "Open" : "Closed"}</Badge>
                  </p>
                  <p className="text-xs text-muted">Instant practice, no payment needed</p>
                </div>
                <div className="flex gap-2 items-center">
                  {t.open ? (
                    <Button loading={joining === t.id} onClick={() => registerTest(t.id)}>
                      Start Practice
                    </Button>
                  ) : (
                    <Button variant="secondary" disabled>Not Open</Button>
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

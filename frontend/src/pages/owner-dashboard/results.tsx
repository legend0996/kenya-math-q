
import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { apiUrl, authHeaders, downloadAuthorized } from "../../utils/api";
import { PageSpinner } from "../../components/ui/Spinner";
import { Download, RotateCcw, Unlock, XCircle, AlertCircle, CheckCircle2 } from "lucide-react";

type ContestRow = { id: number; name: string; year: number; results_status?: string };
type Participant = {
  id: number;
  full_name: string;
  school?: string;
  grade?: string;
  payment_status?: string;
  score: number | null;
  result_grade?: string | null;
};

export default function ResultsManagement() {
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContestRow | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  // Retake management
  const [retakeContestId, setRetakeContestId] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParts, setLoadingParts] = useState(false);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [resetting, setResetting] = useState(false);

  // Reopen (ended contest, missed by student)
  const [reopenContestId, setReopenContestId] = useState<number | null>(null);
  const [reopenDays, setReopenDays] = useState(7);
  const [reopenParts, setReopenParts] = useState<Participant[]>([]);
  const [loadingReopen, setLoadingReopen] = useState(false);
  const [reopenChecked, setReopenChecked] = useState<Set<number>>(new Set());
  const [reopening, setReopening] = useState(false);
  const [reopenGrants, setReopenGrants] = useState<{ student_id: number; full_name: string; expires_at?: string }[]>([]);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    fetch(apiUrl("/api/owner/contest/all"), { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setContests(d.contests || []);
          setRetakeContestId((id) => id ?? d.contests?.[0]?.id ?? null);
          setReopenContestId((id) => id ?? d.contests?.[0]?.id ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const loadParticipants = async (contestId: number) => {
    setLoadingParts(true);
    try {
      const r = await fetch(apiUrl(`/api/owner/contest/${contestId}/participants`), { headers: authHeaders() });
      const d = await r.json();
      if (d.success) setParticipants(d.participants || []);
    } catch {
      setParticipants([]);
    } finally {
      setLoadingParts(false);
    }
  };

  useEffect(() => {
    if (retakeContestId) loadParticipants(retakeContestId);
  }, [retakeContestId]);

  const doneList = participants.filter((p) => p.score != null && p.result_grade != null);
  const allChecked = doneList.length > 0 && doneList.every((p) => checked.has(p.id));
  const toggleAll = () => {
    const next = new Set(checked);
    if (allChecked) doneList.forEach((p) => next.delete(p.id));
    else doneList.forEach((p) => next.add(p.id));
    setChecked(next);
  };
  const toggleOne = (id: number) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  };

  const resetSelected = async () => {
    if (!retakeContestId) return;
    const ids = doneList.filter((p) => checked.has(p.id)).map((p) => p.id);
    if (ids.length === 0) return;
    setResetting(true);
    try {
      const r = await fetch(apiUrl("/api/owner/result/reset"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contest_id: retakeContestId, student_ids: ids }),
      });
      const d = await r.json();
      if (d.success) {
        showFeedback("success", d.message || "Attempts reset");
        setChecked(new Set());
        loadParticipants(retakeContestId);
      } else {
        showFeedback("error", d.error || "Failed to reset attempts");
      }
    } catch {
      showFeedback("error", "Failed to reset attempts");
    } finally {
      setResetting(false);
    }
  };

  const loadReopen = async (contestId: number) => {
    setLoadingReopen(true);
    try {
      const [p, g] = await Promise.all([
        fetch(apiUrl(`/api/owner/contest/${contestId}/participants`), { headers: authHeaders() }).then((r) => r.json()),
        fetch(apiUrl(`/api/owner/contest/${contestId}/reopens`), { headers: authHeaders() }).then((r) => r.json()),
      ]);
      setReopenParts(p.participants || []);
      setReopenGrants(g.reopens || []);
    } catch {
      setReopenParts([]);
      setReopenGrants([]);
    } finally {
      setLoadingReopen(false);
    }
  };

  useEffect(() => {
    if (reopenContestId) loadReopen(reopenContestId);
  }, [reopenContestId]);

  const reopenedIds = new Set(reopenGrants.map((g) => g.student_id));

  const toggleReopenAll = () => {
    const eligible = reopenParts.filter((p) => !reopenedIds.has(p.id));
    setReopenChecked(new Set(eligible.map((p) => p.id)));
  };

  const toggleReopenOne = (id: number) => {
    const next = new Set(reopenChecked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setReopenChecked(next);
  };

  const openContest = async () => {
    if (!reopenContestId || reopenChecked.size === 0) return;
    const ids = [...reopenChecked];
    setReopening(true);
    try {
      const r = await fetch(apiUrl("/api/owner/contest/reopen"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contest_id: reopenContestId, student_ids: ids, days: reopenDays }),
      });
      const d = await r.json();
      if (d.success) {
        showFeedback("success", d.message || "Contest reopened for the selected students");
        setReopenChecked(new Set());
        loadReopen(reopenContestId);
      } else {
        showFeedback("error", d.error || "Failed to reopen the contest");
      }
    } catch {
      showFeedback("error", "Failed to reopen the contest");
    } finally {
      setReopening(false);
    }
  };

  const revokeOpen = async (studentId: number) => {
    if (!reopenContestId) return;
    try {
      const r = await fetch(apiUrl("/api/owner/contest/reopen/revoke"), {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ contest_id: reopenContestId, student_ids: [studentId] }),
      });
      const d = await r.json();
      if (d.success) {
        showFeedback("success", "Reopen access revoked");
        loadReopen(reopenContestId);
      } else {
        showFeedback("error", d.error || "Failed to revoke access");
      }
    } catch {
      showFeedback("error", "Failed to revoke access");
    }
  };

  const releaseResults = async (contestId: number) => {
    setReleasing(true);
    try {
      const r = await fetch(apiUrl(`/api/owner/contest/${contestId}/release-results`), {
        method: "POST", headers: authHeaders(),
      });
      const d = await r.json();
      if (d.success) {
        setContests((cs) => cs.map((c) => c.id === contestId ? { ...c, results_status: "released" } : c));
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold mb-2">Results Management</h1>
        {feedback && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
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
                {contests.map((c) => (
                  <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{c.name}</p>
                      <p className="text-sm text-slate-500">{c.year}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={c.results_status === "released" ? "success" : "warning"}>
                        {c.results_status === "released" ? "Released" : "Pending"}
                      </Badge>
                      <Button size="sm" variant="outline" icon={<Download size={14} />}
                        onClick={() => downloadAuthorized(`/api/owner/contest/${c.id}/export`).catch(() => {
                          setFeedback({ type: "error", msg: "Export failed. Check your session." });
                        })}>
                        Export CSV
                      </Button>
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

        {/* ── Retakes: allow a student who did poorly to repeat ── */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <RotateCcw size={18} className="text-blue-600" /> Allow Retake
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Select students who completed the exam, then reset their attempt so they can repeat it.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={retakeContestId ?? ""}
                onChange={(e) => setRetakeContestId(Number(e.target.value))}
                className="px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
              >
                {contests.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <Button size="sm" icon={<RotateCcw size={14} />} loading={resetting}
                disabled={doneList.filter((p) => checked.has(p.id)).length === 0}
                onClick={resetSelected}>
                Reset Selected ({doneList.filter((p) => checked.has(p.id)).length})
              </Button>
            </div>
          </div>

          {loadingParts ? (
            <div className="py-12 text-center text-slate-400">Loading students…</div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No registered students for this contest yet.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="px-6 py-3 w-10">
                        <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 accent-blue-600" />
                      </th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">School</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3 text-center">Score</th>
                      <th className="px-4 py-3 text-center">Grade Awarded</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => {
                      const isDone = p.score != null && p.result_grade != null;
                      return (
                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-6 py-3">
                            <input
                              type="checkbox"
                              checked={checked.has(p.id)}
                              disabled={!isDone}
                              onChange={() => toggleOne(p.id)}
                              className="w-4 h-4 accent-blue-600 disabled:opacity-30"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{p.full_name}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{p.school || "—"}</td>
                          <td className="px-4 py-3"><Badge variant="default">{p.grade || "—"}</Badge></td>
                          <td className="px-4 py-3 text-center font-semibold text-slate-900">{isDone ? p.score : "—"}</td>
                          <td className="px-4 py-3 text-center">
                            {isDone ? <Badge variant="info">{p.result_grade}</Badge> : <span className="text-slate-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {isDone
                              ? <Badge variant="success" dot>Completed</Badge>
                              : <Badge variant="default">Not taken</Badge>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 text-xs text-slate-400">
                {checked.size} selected · {doneList.length} completed
              </div>
            </>
          )}
        </Card>

        {/* ── Reopen an ENDED contest for specific students (they missed it) ── */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Unlock size={18} className="text-violet-600" /> Reopen Ended Contest
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Grant a student who missed a contest that has already ended the chance to sit it now.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={reopenContestId ?? ""}
                onChange={(e) => setReopenContestId(Number(e.target.value))}
                className="px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
              >
                {contests.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input
                type="number" min={1} max={365} value={reopenDays}
                onChange={(e) => setReopenDays(Number(e.target.value))}
                title="Days the student is allowed to sit it"
                className="w-20 px-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-violet-500 outline-none transition-all"
              />
              <Button size="sm" variant="ghost" onClick={toggleReopenAll} disabled={reopenParts.length === 0}>
                Select all
              </Button>
              <Button size="sm" icon={<Unlock size={14} />} loading={reopening}
                disabled={reopenChecked.size === 0}
                className="bg-violet-600 hover:bg-violet-700 shadow-violet-100"
                onClick={openContest}>
                Open for Selected ({reopenChecked.size})
              </Button>
            </div>
          </div>

          {loadingReopen ? (
            <div className="py-12 text-center text-slate-400">Loading students…</div>
          ) : reopenParts.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No registered students for this contest yet.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="px-6 py-3 w-10"></th>
                      <th className="px-4 py-3">Student</th>
                      <th className="px-4 py-3">School</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Reopen Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reopenParts.map((p) => {
                      const grant = reopenGrants.find((g) => g.student_id === p.id);
                      const hasGrant = !!grant;
                      return (
                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="px-6 py-3">
                            <input
                              type="checkbox"
                              checked={reopenChecked.has(p.id)}
                              disabled={hasGrant}
                              onChange={() => toggleReopenOne(p.id)}
                              className="w-4 h-4 accent-violet-600 disabled:opacity-30"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{p.full_name}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{p.school || "—"}</td>
                          <td className="px-4 py-3"><Badge variant="default">{p.grade || "—"}</Badge></td>
                          <td className="px-4 py-3 text-center">
                            {p.score != null && p.result_grade != null
                              ? <Badge variant="success" dot>Completed</Badge>
                              : <Badge variant="default">Not taken</Badge>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {hasGrant ? (
                              <div className="flex items-center justify-center gap-2">
                                <Badge variant="info" dot>Opened</Badge>
                                {grant.expires_at && (
                                  <span className="text-[11px] text-slate-400">
                                    till {new Date(grant.expires_at).toLocaleString()}
                                  </span>
                                )}
                                <button
                                  onClick={() => revokeOpen(p.id)}
                                  className="text-xs text-red-500 hover:text-red-600 inline-flex items-center gap-1"
                                  title="Remove reopen access"
                                >
                                  <XCircle size={13} /> Revoke
                                </button>
                              </div>
                            ) : (
                              <Badge variant="default">Not opened</Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 text-xs text-slate-400">
                {reopenGrants.length} student(s) currently granted access
              </div>
            </>
          )}
        </Card>

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

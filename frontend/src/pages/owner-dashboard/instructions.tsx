
import { useEffect, useState } from "react";
import { FileText, Plus, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { apiUrl, authHeaders } from "../../utils/api";

const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Form 1", "Form 2", "Form 3", "Form 4"];

type ContestRow = { id: number; name: string; year: number };

export default function InstructionsManager() {
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [contestId, setContestId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  useEffect(() => {
    fetch(apiUrl("/api/owner/contest/all"), { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const list = (d.success && d.contests) ? d.contests : [];
        setContests(list);
        if (list.length > 0) setContestId(list[0].id);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (contestId == null) return;
    fetch(apiUrl(`/api/owner/instructions/${contestId}`), { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, string> = {};
        const exp: Record<string, boolean> = {};
        (d.success && d.instructions ? d.instructions : []).forEach((r: { grade: string; instructions: string }) => {
          map[r.grade] = r.instructions;
          exp[r.grade] = !!r.instructions;
        });
        setSaved(map);
        setDrafts({});
        setExpanded(exp);
      })
      .catch(() => {});
  }, [contestId]);

  const saveOne = async (grade: string) => {
    if (contestId == null) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl("/api/owner/instructions"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ contest_id: contestId, grade, instructions: drafts[grade] ?? "" }),
      });
      const d = await res.json();
      if (d.success) {
        setSaved((p) => ({ ...p, [grade]: drafts[grade] ?? "" }));
        setExpanded((p) => ({ ...p, [grade]: false }));
        showFeedback("success", "Instructions saved");
      } else {
        showFeedback("error", d.error || "Failed to save");
      }
    } catch { showFeedback("error", "Failed to save"); }
    finally { setBusy(false); }
  };

  const removeOne = async (grade: string) => {
    if (contestId == null) return;
    if (!confirm(`Delete instructions for ${grade}?`)) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/owner/instructions/${contestId}/${encodeURIComponent(grade)}`), {
        method: "DELETE", headers: authHeaders(),
      });
      const d = await res.json();
      if (d.success) {
        setSaved((p) => { const n = { ...p }; delete n[grade]; return n; });
        setDrafts((p) => { const n = { ...p }; delete n[grade]; return n; });
        showFeedback("success", "Instructions deleted");
      } else {
        showFeedback("error", d.error || "Failed to delete");
      }
    } catch { showFeedback("error", "Failed to delete"); }
    finally { setBusy(false); }
  };

  if (loading) return <PageSpinner message="Loading contests…" />;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Compulsory Contest Instructions</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Written instructions for each grade/form. Students see them as the FIRST page when starting the contest
              and must tap &quot;I agree&quot; before questions appear. Add, edit or delete anytime — changes apply to
              students who haven&apos;t started yet.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Contest</label>
          <select
            value={contestId ?? ""}
            onChange={(e) => setContestId(Number(e.target.value))}
            className="w-full sm:w-96 px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          >
            {contests.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
            ))}
          </select>
        </div>
      </Card>

      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {GRADES.map((g) => {
          const hasSaved = Boolean((saved[g] || "").trim());
          const editing = expanded[g];
          return (
            <Card key={g} className="flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-slate-900">{g}</h3>
                  {hasSaved ? <Badge variant="success" dot>Set</Badge> : <Badge variant="default">Not set</Badge>}
                </div>
                {hasSaved && (
                  <button onClick={() => removeOne(g)} disabled={busy}
                    className="text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg px-2.5 py-1.5 transition-colors">
                    Delete
                  </button>
                )}
              </div>

              {!editing && hasSaved && (
                <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {saved[g]}
                </div>
              )}

              {editing && (
                <textarea
                  rows={7}
                  value={drafts[g] ?? saved[g] ?? ""}
                  onChange={(e) => setDrafts((p) => ({ ...p, [g]: e.target.value }))}
                  placeholder="Type the instructions for this grade/form here…"
                  className="w-full px-4 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                />
              )}

              <div className="mt-4 flex gap-2">
                {!editing ? (
                  <Button size="sm" variant="outline" icon={<Plus size={14} />}
                    onClick={() => setExpanded((p) => ({ ...p, [g]: true }))}>
                    {hasSaved ? "Edit" : "Add instructions"}
                  </Button>
                ) : (
                  <>
                    <Button size="sm" loading={busy} icon={<CheckCircle2 size={14} />} onClick={() => saveOne(g)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setExpanded((p) => ({ ...p, [g]: false }))}>
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 flex items-center gap-1.5">
        <ChevronDown size={13} /> A grade with no instructions will start the exam directly, without the agreement page.
      </p>
    </div>
  );
}
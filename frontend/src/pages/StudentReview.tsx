
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import { apiUrl, authHeaders } from "../utils/api";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { PageSpinner } from "../components/ui/Spinner";
import WorkingView from "../components/WorkingView";
import { FileQuestion, ChevronRight } from "lucide-react";

interface WQ {
  question_id: number; question: string; type: string; marks: number;
  correct_answer?: string; student_answer?: string; working: string[] | string | null;
  awarded?: number | null; annotation?: string | null;
}
interface Review {
  contest: { name: string };
  worksheet: WQ[];
  questions_total_marks: number;
  result?: { percentage?: number | null; score_available?: boolean };
}

export default function Page() {
  return (
    <Suspense fallback={<main className="pt-16 min-h-screen bg-slate-50"><PageSpinner message="Loading your marked paper…" /></main>}>
      <StudentReviewPage />
    </Suspense>
  );
}

function StudentReviewPage() {
  const [params] = useSearchParams();
  const contestId = params.get("contest");
  const [data, setData] = useState<Review | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contestId) {
      Promise.resolve().then(() => { setLoading(false); setError("No contest specified."); });
      return;
    }
    fetch(apiUrl(`/api/exam/review/${contestId}`), { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setData(d);
        else setError(d.error || "Could not load your paper review.");
      })
      .catch(() => setError("Failed to load your paper review."))
      .finally(() => setLoading(false));
  }, [contestId]);

  if (loading) return <main className="pt-16 min-h-screen bg-slate-50"><PageSpinner message="Loading your marked paper…" /></main>;

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Marked paper</p>
            <h1 className="text-2xl font-bold text-slate-900">{data?.contest.name || "My Results"}</h1>
          </div>
          <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>Back to dashboard</Button>
        </div>

        {error && (
          <div className="px-5 py-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium mb-6">
            {error}
          </div>
        )}

        {data && (
          <>
            {typeof data.result?.percentage === "number" && (
              <Card className="mb-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><FileQuestion size={22} /></div>
                <div>
                  <p className="text-sm text-slate-500">Your final percentage</p>
                  <p className="text-2xl font-bold text-slate-900">{data.result.percentage}%</p>
                </div>
                <p className="text-xs text-slate-400 ml-auto text-right">Marks are awarded per question by your teacher.</p>
              </Card>
            )}

            <div className="space-y-4">
              {data.worksheet.map((q, idx) => (
                <Card key={q.question_id}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="font-semibold text-slate-900">
                      Q{idx + 1}. {q.question}
                      {q.type === "construction" && <span className="text-xs ml-2 px-2 py-0.5 rounded-lg bg-violet-100 text-violet-700">Construction</span>}
                    </p>
                    <span className="text-sm font-bold shrink-0 px-3 py-1 rounded-lg bg-slate-100 text-slate-700">
                      {q.awarded != null ? `${q.awarded}` : "—"}/{q.marks}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Your answer</p>
                      {q.student_answer ? (
                        <p className="text-sm text-slate-800 whitespace-pre-wrap">{q.student_answer}</p>
                      ) : <p className="text-sm text-slate-300 italic">No typed answer</p>}
                      <p className="text-xs font-medium text-slate-500 mt-3 mb-1">Expected answer</p>
                      <p className="text-xs text-slate-400">{q.correct_answer || "—"}</p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Your working</p>
                      <WorkingView value={q.working} label="Writing" />
                    </div>
                  </div>

                  {q.annotation && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-slate-500 mb-1">Teacher&apos;s correction</p>
                      <div className="rounded-xl overflow-hidden border border-slate-200">
                        <img src={q.annotation} alt="teacher annotation" className="w-full" />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
              <ChevronRight size={16} /> Total the paper was out of: <b className="text-slate-800">{data.questions_total_marks} marks</b>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { Clock, ChevronRight, Send, AlertTriangle, CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { PageSpinner } from "../../components/ui/Spinner";

type Question = {
  id: number;
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  type: string;
};

const OPTION_LABELS = ["A", "B", "C", "D"];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function Exam() {
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [answers, setAnswers]         = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft]       = useState(600);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);

  const contest_id = 1;

  const getStudentId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])).id; } catch { return null; }
  };

  const student_id = getStudentId();

  useEffect(() => {
    if (!student_id) { window.location.href = "/login"; return; }

    fetch(`http://localhost:5000/api/exam/${contest_id}/${student_id}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) { alert(data.error || "Access denied"); window.location.href = "/dashboard"; return; }
        setQuestions(data.questions || []);
      })
      .catch(() => { alert("Error loading exam"); window.location.href = "/dashboard"; })
      .finally(() => setLoading(false));
  }, [student_id]);

  useEffect(() => {
    if (submitted || loading) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, submitted, loading]);

  useEffect(() => {
    const onBlur = () => alert("⚠️ Do not leave the exam tab");
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  const handleAnswer = (qid: number, value: string) =>
    setAnswers((p) => ({ ...p, [qid]: value }));

  const handleSubmit = async (auto = false) => {
    if (submitted) return;
    if (!auto && !confirm("Are you sure you want to submit your exam?")) return;

    setSubmitting(true); setSubmitted(true);

    const formatted = Object.keys(answers).map((qid) => ({
      question_id: Number(qid),
      answer: answers[Number(qid)],
    }));

    try {
      await fetch("http://localhost:5000/api/exam/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id, contest_id, answers: formatted }),
      });
      alert("✅ Exam submitted successfully!");
      window.location.href = "/dashboard";
    } catch {
      alert("Submission failed. Please try again.");
      setSubmitted(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSpinner message="Loading your exam questions…" />;
  if (!questions.length) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-500 px-4 text-center">
      <AlertTriangle size={36} className="text-amber-400" />
      <p className="font-semibold text-slate-700">No questions available</p>
      <p className="text-sm">Please contact your school administrator.</p>
      <Button variant="outline" onClick={() => window.location.href = "/dashboard"}>Back to Dashboard</Button>
    </div>
  );

  const q           = questions[currentIndex];
  const answered    = Object.keys(answers).length;
  const unanswered  = questions.length - answered;
  const pct         = Math.round((answered / questions.length) * 100);
  const isLast      = currentIndex === questions.length - 1;
  const isUrgent    = timeLeft < 60;

  const opts = [q.option_a, q.option_b, q.option_c, q.option_d].filter(Boolean);

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* ── Top Bar ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-slate-600">
              Question <span className="font-bold text-slate-900">{currentIndex + 1}</span>
              <span className="text-slate-400"> / {questions.length}</span>
            </div>
            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-slate-400">{answered} answered</span>
          </div>

          <div className={`flex items-center gap-2 font-mono font-bold text-lg px-4 py-1.5 rounded-xl ${
            isUrgent ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-700"
          }`}>
            <Clock size={16} className={isUrgent ? "text-red-500" : "text-slate-500"} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* ── Question Card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
              {currentIndex + 1}
            </span>
            <p className="text-slate-900 font-medium leading-relaxed pt-1">{q.question}</p>
          </div>

          {q.type === "mcq" ? (
            <div className="space-y-3">
              {opts.map((opt, i) => {
                const selected = answers[q.id] === opt;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAnswer(q.id, opt!)}
                    className={`w-full text-left flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 transition-all duration-150 ${
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                      selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500"
                    }`}>
                      {OPTION_LABELS[i]}
                    </span>
                    <span className="font-medium">{opt}</span>
                    {selected && <CheckCircle2 size={16} className="ml-auto text-blue-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <textarea
              rows={5}
              className="w-full px-4 py-3 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
              placeholder="Write your answer here…"
              value={answers[q.id] || ""}
              onChange={(e) => handleAnswer(q.id, e.target.value)}
            />
          )}
        </div>

        {/* ── Navigation ── */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            icon={<ChevronLeft size={16} />}
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((p) => p - 1)}
          >
            Previous
          </Button>

          <div className="flex flex-wrap gap-1.5 justify-center">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  i === currentIndex
                    ? "bg-blue-600 text-white"
                    : answers[questions[i].id]
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          {isLast ? (
            <Button
              variant="primary"
              icon={<Send size={15} />}
              loading={submitting}
              onClick={() => handleSubmit()}
              className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
            >
              Submit{unanswered > 0 ? ` (${unanswered} left)` : ""}
            </Button>
          ) : (
            <Button
              icon={<ChevronRight size={16} />}
              onClick={() => setCurrentIndex((p) => p + 1)}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

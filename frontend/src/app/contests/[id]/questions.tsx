"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { PageSpinner } from "../../../components/ui/Spinner";

interface Question {
  id: number;
  question: string;
  type: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
}

export default function ContestQuestions() {
  const router = useRouter();
  const params = useSearchParams();
  const contestId = Number(params.get("id"));
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token") || "";
  const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  useEffect(() => {
    if (!contestId) return;
    fetch(`http://localhost:5000/api/contest/${contestId}/questions`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        if (d.success) setQuestions(d.questions || []);
        else setError(d.message || "Failed to load questions.");
      })
      .catch(() => setError("Failed to load questions."))
      .finally(() => setLoading(false));
  }, [contestId]);

  if (loading) return <PageSpinner message="Loading questions..." />;
  if (error) return <Card><div className="p-8 text-center text-red-500">{error}</div></Card>;
  if (!questions.length) return <Card><div className="p-8 text-center text-slate-400">No questions available.</div></Card>;

  const q = questions[current];
  const isMCQ = q.type === "mcq";

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-8">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-slate-400">Question {current + 1} of {questions.length}</span>
          </div>
          <div className="mb-4">
            <p className="font-semibold text-lg mb-2">{q.question}</p>
            {isMCQ ? (
              <div className="space-y-2">
                {["option_a","option_b","option_c","option_d"].map(opt => q[opt as keyof Question] && (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name={`q_${q.id}`}
                      value={q[opt as keyof Question] as string}
                      checked={answers[q.id] === q[opt as keyof Question]}
                      onChange={() => setAnswers(a => ({ ...a, [q.id]: q[opt as keyof Question] as string }))}
                    />
                    <span>{q[opt as keyof Question]}</span>
                  </label>
                ))}
              </div>
            ) : (
              <input
                type="text"
                className="w-full px-4 py-2 mt-2 border rounded-xl"
                placeholder="Your answer"
                value={answers[q.id] || ""}
                onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
              />
            )}
          </div>
          <div className="flex justify-between mt-6">
            <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent(c => c - 1)}>Previous</Button>
            <Button variant="secondary" disabled={current === questions.length - 1} onClick={() => setCurrent(c => c + 1)}>Next</Button>
          </div>
        </Card>
      </div>
    </main>
  );
}

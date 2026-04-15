"use client";

import { useEffect, useState } from "react";

type Question = {
  id: number;
  question: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  type: string;
};

export default function Exam() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(600);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  const contest_id = 1;

  // 🔐 GET USER
  const getStudentId = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.id;
    } catch {
      return null;
    }
  };

  const student_id = getStudentId();

  // 📡 FETCH QUESTIONS (SAFE)
  useEffect(() => {
    if (!student_id) {
      window.location.href = "/login";
      return;
    }

    const fetchQuestions = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/exam/${contest_id}/${student_id}`,
        );

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Access denied");
          window.location.href = "/dashboard";
          return;
        }

        setQuestions(data.questions || []);
      } catch (error) {
        console.error(error);
        alert("Error loading exam");
        window.location.href = "/dashboard";
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [student_id]);

  // ⏳ TIMER
  useEffect(() => {
    if (submitted || loading) return;

    if (timeLeft <= 0) {
      alert("⏰ Time is up. Submitting...");
      handleSubmit(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, loading]);

  // 🔐 ANTI-CHEAT
  useEffect(() => {
    const handleBlur = () => {
      alert("⚠️ Do not leave the exam tab");
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  // ✍️ ANSWER
  const handleAnswer = (qid: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: value,
    }));
  };

  // ➡️ NEXT
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // 📤 SUBMIT
  const handleSubmit = async (auto = false) => {
    if (submitted) return;

    if (!auto) {
      const confirmSubmit = confirm("Are you sure you want to submit?");
      if (!confirmSubmit) return;
    }

    setSubmitted(true);

    try {
      const formatted = Object.keys(answers).map((qid) => ({
        question_id: Number(qid),
        answer: answers[Number(qid)],
      }));

      await fetch("http://localhost:5000/api/exam/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id,
          contest_id,
          answers: formatted,
        }),
      });

      alert("✅ Exam submitted");
      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      alert("Submission failed");
      setSubmitted(false);
    }
  };

  // ⏳ LOADING
  if (loading) {
    return <div className="p-6 text-center">Loading exam...</div>;
  }

  if (!questions.length) {
    return <div className="p-6 text-center">No questions available</div>;
  }

  const q = questions[currentIndex];

  return (
    <main className="p-6 max-w-3xl mx-auto">
      {/* TOP BAR */}
      <div className="flex justify-between mb-4">
        <p className="font-semibold">
          Progress: {Object.keys(answers).length}/{questions.length}
        </p>

        <p className="font-bold text-red-600">Time: {timeLeft}s</p>
      </div>

      {/* QUESTION */}
      <div className="mb-6 bg-white p-6 rounded shadow">
        <p className="font-bold mb-2">
          Question {currentIndex + 1} of {questions.length}
        </p>

        <p className="mb-4">{q.question}</p>

        {q.type === "mcq" ? (
          <div className="space-y-2">
            {[q.option_a, q.option_b, q.option_c, q.option_d].map(
              (opt, i) =>
                opt && (
                  <label key={i} className="block">
                    <input
                      type="radio"
                      name={`q-${q.id}`}
                      checked={answers[q.id] === opt}
                      onChange={() => handleAnswer(q.id, opt)}
                    />
                    <span className="ml-2">{opt}</span>
                  </label>
                ),
            )}
          </div>
        ) : (
          <textarea
            className="border p-2 w-full"
            placeholder="Your answer"
            value={answers[q.id] || ""}
            onChange={(e) => handleAnswer(q.id, e.target.value)}
          />
        )}
      </div>

      {/* CONTROLS */}
      <div className="flex justify-end">
        {currentIndex === questions.length - 1 ? (
          <button
            onClick={() => handleSubmit()}
            className="bg-green-600 text-white px-6 py-2 rounded"
          >
            Submit Exam
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Next →
          </button>
        )}
      </div>
    </main>
  );
}

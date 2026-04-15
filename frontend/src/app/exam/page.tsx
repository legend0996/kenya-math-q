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

  // ⏳ TIMER
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // 📡 FETCH QUESTIONS
  useEffect(() => {
    fetch("http://localhost:5000/api/exam/1")
      .then((res) => res.json())
      .then((data) => setQuestions(data.questions || []));
  }, []);

  // 🔐 ANTI-CHEAT (NO TAB SWITCH)
  useEffect(() => {
    const handleBlur = () => {
      alert("⚠️ You left the exam. This may be flagged.");
    };

    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, []);

  const handleAnswer = (qid: number, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qid]: value,
    }));
  };

  const handleNext = () => {
    // 🚫 cannot go back → only forward
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSubmit = async () => {
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
        student_id: 1, // 🔥 later replace with real user
        contest_id: 1,
        answers: formatted,
      }),
    });

    alert("✅ Exam submitted");
  };

  // ⏳ Loading
  if (questions.length === 0) {
    return <div className="p-6">Loading questions...</div>;
  }

  const q = questions[currentIndex];

  return (
    <main className="p-6 max-w-3xl mx-auto">
      {/* TIMER */}
      <div className="text-right font-bold text-red-600 mb-4">
        Time Left: {timeLeft}s
      </div>

      {/* QUESTION */}
      <div className="mb-6">
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
          <input
            className="border p-2 w-full"
            placeholder="Your answer"
            value={answers[q.id] || ""}
            onChange={(e) => handleAnswer(q.id, e.target.value)}
          />
        )}
      </div>

      {/* CONTROLS */}
      <div className="flex justify-between">
        <button
          disabled
          className="bg-gray-300 text-gray-600 px-4 py-2 rounded cursor-not-allowed"
        >
          Back Disabled
        </button>

        {currentIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
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

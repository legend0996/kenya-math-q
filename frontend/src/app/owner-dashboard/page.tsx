"use client";

import { useEffect, useState } from "react";

export default function OwnerDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [contests, setContests] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  const [name, setName] = useState("");

  // ✅ NEW (IMPORTANT)
  const [grade, setGrade] = useState("Form 1");
  const [type, setType] = useState("mcq");

  // 🧠 QUESTION STATES
  const [question, setQuestion] = useState("");
  const [option_a, setOptionA] = useState("");
  const [option_b, setOptionB] = useState("");
  const [option_c, setOptionC] = useState("");
  const [option_d, setOptionD] = useState("");
  const [correct_answer, setCorrectAnswer] = useState("");
  const [marks, setMarks] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/owner-login-7843-secure";
      return;
    }

    fetchStats(token);
    fetchSchools(token);
    fetchContests(token);
    fetchRegistrations(token);
  }, []);

  // 📊 STATS
  const fetchStats = async (token: string) => {
    const res = await fetch("http://localhost:5000/api/owner/stats", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setStats(data.stats);
  };

  // 🏫 SCHOOLS
  const fetchSchools = async (token: string) => {
    const res = await fetch("http://localhost:5000/api/owner/schools/pending", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setSchools(data.schools);
  };

  const updateStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:5000/api/owner/schools/update", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ school_id: id, status }),
    });

    fetchSchools(token!);
  };

  // 🏆 CONTESTS
  const fetchContests = async (token: string) => {
    const res = await fetch("http://localhost:5000/api/owner/contest/all", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setContests(data.contests);
  };

  const handleCreate = async () => {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:5000/api/owner/contest/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        contest_number: 1,
        year: 2026,
      }),
    });

    setName("");
    fetchContests(token!);
  };

  const activate = async (id: number) => {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:5000/api/owner/contest/activate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contest_id: id }),
    });

    fetchContests(token!);
  };

  // 💰 PAYMENTS
  const fetchRegistrations = async (token: string) => {
    const res = await fetch("http://localhost:5000/api/owner/registrations", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) setStudents(data.students);
  };

  const markPaid = async (student_id: number) => {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:5000/api/owner/payment/mark", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        student_id,
        contest_id: 1,
      }),
    });

    fetchRegistrations(token!);
  };

  // 🧠 ADD QUESTION
  const handleAddQuestion = async () => {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:5000/api/owner/question/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        contest_id: 1,
        grade,
        type,
        question,
        option_a,
        option_b,
        option_c,
        option_d,
        correct_answer,
        marks,
      }),
    });

    alert("Question added");

    setQuestion("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("");
    setMarks(1);
  };

  if (!stats) {
    return <div className="pt-24 text-center">Loading dashboard...</div>;
  }

  return (
    <main className="pt-24 p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Owner Dashboard</h1>

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white p-4 shadow rounded text-center">
          <p>Students</p>
          <h2>{stats.students}</h2>
        </div>
        <div className="bg-white p-4 shadow rounded text-center">
          <p>Schools</p>
          <h2>{stats.schools}</h2>
        </div>
        <div className="bg-white p-4 shadow rounded text-center">
          <p>Registered</p>
          <h2>{stats.registered}</h2>
        </div>
        <div className="bg-white p-4 shadow rounded text-center">
          <p>Paid</p>
          <h2>{stats.paid}</h2>
        </div>
      </div>

      {/* QUESTIONS */}
      <h2 className="font-bold mt-10 mb-3">Add Question</h2>

      {/* ✅ NEW */}
      <select value={grade} onChange={(e) => setGrade(e.target.value)}>
        <option>Form 1</option>
        <option>Form 2</option>
        <option>Form 3</option>
        <option>Form 4</option>
      </select>

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="mcq">MCQ</option>
        <option value="theory">Theory</option>
      </select>

      <input
        placeholder="Question"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      {type === "mcq" && (
        <>
          <input
            placeholder="Option A"
            value={option_a}
            onChange={(e) => setOptionA(e.target.value)}
          />
          <input
            placeholder="Option B"
            value={option_b}
            onChange={(e) => setOptionB(e.target.value)}
          />
          <input
            placeholder="Option C"
            value={option_c}
            onChange={(e) => setOptionC(e.target.value)}
          />
          <input
            placeholder="Option D"
            value={option_d}
            onChange={(e) => setOptionD(e.target.value)}
          />
        </>
      )}

      <input
        placeholder="Correct Answer"
        value={correct_answer}
        onChange={(e) => setCorrectAnswer(e.target.value)}
      />

      <input
        type="number"
        value={marks}
        onChange={(e) => setMarks(Number(e.target.value))}
      />

      <button onClick={handleAddQuestion}>Add Question</button>
    </main>
  );
}

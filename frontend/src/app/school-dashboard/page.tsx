"use client";

import { useEffect, useState } from "react";

type Student = {
  id: number;
  full_name: string;
  grade: string;
};

export default function SchoolDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [school, setSchool] = useState("");

  // 🔐 CHECK LOGIN + GET SCHOOL FROM TOKEN
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "/login";
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setSchool(payload.school);
    } catch (err) {
      console.error("Token decode error:", err);
    }
  }, []);

  // 📡 FETCH STUDENTS
  const fetchStudents = async (schoolName: string) => {
    if (!schoolName) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/school/students?school=${schoolName}`,
      );
      const data = await res.json();

      if (data.success) {
        setStudents(data.students);
      }
    } catch (error) {
      console.error("Fetch students error:", error);
    }
  };

  // 🔁 REFRESH WHEN SCHOOL READY
  useEffect(() => {
    if (school) {
      fetchStudents(school);
    }
  }, [school]);

  // ➕ ADD STUDENT
  const handleAdd = async () => {
    if (!name || !grade) return;

    try {
      await fetch("http://localhost:5000/api/school/add-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: name,
          grade,
          school,
        }),
      });

      setName("");
      setGrade("");
      fetchStudents(school);
    } catch (error) {
      console.error("Add student error:", error);
    }
  };

  // 📝 REGISTER
  const handleRegister = async (id: number) => {
    await fetch("http://localhost:5000/api/contest/register-student", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ student_id: id }),
    });
  };

  // 💰 PAY
  const handlePay = async (id: number) => {
    await fetch("http://localhost:5000/api/contest/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ student_id: id }),
    });
  };

  return (
    <main className="pt-24 p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">🏫 School Dashboard</h1>

      <h2 className="mb-6 text-gray-600">School: {school}</h2>

      {/* ➕ ADD STUDENT */}
      <div className="mb-6 bg-white p-4 shadow rounded">
        <h2 className="font-bold mb-2">Add Student</h2>

        <input
          placeholder="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border p-2 mr-2"
        />

        <input
          placeholder="Grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="border p-2 mr-2"
        />

        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      {/* 📋 STUDENTS LIST */}
      <div className="bg-white p-4 shadow rounded">
        <h2 className="font-bold mb-4">Students</h2>

        {students.map((s) => (
          <div
            key={s.id}
            className="border-b py-3 flex justify-between items-center"
          >
            <div>
              <p className="font-medium">{s.full_name}</p>
              <p className="text-sm text-gray-500">{s.grade}</p>
            </div>

            <div className="space-x-2">
              <button
                onClick={() => handleRegister(s.id)}
                className="bg-blue-500 text-white px-3 py-1 rounded"
              >
                Register
              </button>

              <button
                onClick={() => handlePay(s.id)}
                className="bg-green-600 text-white px-3 py-1 rounded"
              >
                Pay
              </button>
            </div>
          </div>
        ))}

        {students.length === 0 && (
          <p className="text-gray-500 text-center">No students found</p>
        )}
      </div>
    </main>
  );
}

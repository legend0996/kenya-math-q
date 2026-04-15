"use client";

import { useState } from "react";

export default function Register() {
  const [type, setType] = useState("student");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    school: "",
    grade: "",
    county: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const endpoint =
      type === "student"
        ? "http://localhost:5000/api/auth/student/register"
        : "http://localhost:5000/api/auth/school/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      alert(data.message || "Success");
    } catch (err) {
      console.error(err);
      alert("Error");
    }
  };

  return (
    <main className="pt-24 flex justify-center">
      <div className="bg-white p-6 shadow rounded w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">Register</h2>

        {/* SWITCH */}
        <div className="flex mb-4">
          <button
            onClick={() => setType("student")}
            className={`flex-1 p-2 ${type === "student" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            Student
          </button>

          <button
            onClick={() => setType("school")}
            className={`flex-1 p-2 ${type === "school" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          >
            School
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {type === "student" && (
            <>
              <input
                placeholder="Full Name"
                className="input"
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
              />
              <input
                placeholder="School"
                className="input"
                onChange={(e) => setForm({ ...form, school: e.target.value })}
              />
              <input
                placeholder="Grade"
                className="input"
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
              />
            </>
          )}

          {type === "school" && (
            <>
              <input
                placeholder="School Name"
                className="input"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <input
                placeholder="County"
                className="input"
                onChange={(e) => setForm({ ...form, county: e.target.value })}
              />
            </>
          )}

          <input
            placeholder="Email"
            className="input"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            className="input"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          <button className="w-full bg-blue-600 text-white py-2 rounded">
            Register
          </button>
        </form>
      </div>
    </main>
  );
}

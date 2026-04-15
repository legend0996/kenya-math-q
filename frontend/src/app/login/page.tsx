"use client";

import { useState } from "react";

export default function Login() {
  const [type, setType] = useState("student");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const handleLogin = async (e: any) => {
    e.preventDefault();

    const endpoint =
      type === "student"
        ? "http://localhost:5000/api/auth/student/login"
        : "http://localhost:5000/api/auth/school/login";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        alert("Login successful");
        window.location.href = "/dashboard";
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Login error");
    }
  };

  return (
    <main className="pt-24 flex justify-center">
      <div className="bg-white p-6 shadow rounded w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

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

        <form onSubmit={handleLogin} className="space-y-3">
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
            Login
          </button>
        </form>
      </div>
    </main>
  );
}

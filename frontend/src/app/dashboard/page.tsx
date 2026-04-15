"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id?: number;
  name?: string;
};

type Contest = {
  id: number;
  name: string;
  status: string;
  start_time: string;
};

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [currentContest, setCurrentContest] = useState<Contest | null>(null);
  const [pastContests, setPastContests] = useState<Contest[]>([]);
  const [result, setResult] = useState<any>(null);

  // 🔐 INIT
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    let payload: any;

    try {
      payload = JSON.parse(atob(token.split(".")[1]));
      setUser({
        id: payload.id,
        name: payload.name || "Student",
      });
    } catch {
      router.push("/login");
      return;
    }

    // 🔥 CURRENT CONTEST
    fetch("http://localhost:5000/api/contest/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCurrentContest(data);
      });

    // 🔥 PAST CONTESTS
    fetch("http://localhost:5000/api/contest/history")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPastContests(data.contests);
      })
      .catch(() => setPastContests([]));

    // 🔥 CHECK RESULT (IF DONE)
    fetch(
      `http://localhost:5000/api/exam/result?student_id=${payload.id}&contest_id=1`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setResult(data.result);
        }
      });
  }, [router]);

  // 🔐 BLOCK REFRESH (ONLY IF EXAM NOT DONE)
  useEffect(() => {
    if (result) return;

    const handleBeforeUnload = (e: any) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [result]);

  const handleDownloadCertificate = () => {
    if (!user?.id) return;

    window.open(
      `http://localhost:5000/api/exam/certificate?student_id=${user.id}&contest_id=1`,
    );
  };

  return (
    <main className="pt-24 p-6 max-w-6xl mx-auto">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Welcome {user?.name || "Student"} 👋
        </h1>

        <button
          onClick={() => {
            localStorage.removeItem("token");
            router.push("/login");
          }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* CURRENT CONTEST */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Current Contest</h2>

        {currentContest ? (
          <div className="bg-blue-50 p-4 rounded shadow">
            <h3 className="font-bold text-lg">{currentContest.name}</h3>
            <p>Status: {currentContest.status}</p>

            {/* 🎯 EXAM CONTROL */}
            {currentContest.status === "live" && (
              <>
                {result ? (
                  <div className="mt-3 bg-gray-100 p-3 rounded text-center">
                    <p className="font-bold text-green-600">
                      ✅ Exam Completed
                    </p>

                    <p className="text-sm text-gray-600 mt-2">
                      Wait for results or next contest
                    </p>

                    <button
                      onClick={handleDownloadCertificate}
                      className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Download Certificate
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => router.push("/exam")}
                    className="mt-3 bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Start Exam
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <p>No active contest</p>
        )}
      </section>

      {/* DASHBOARD CARDS */}
      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-4 shadow rounded">
          <h2 className="font-bold mb-2">📊 Results</h2>
          <p>View your performance</p>
        </div>

        <div className="bg-white p-4 shadow rounded">
          <h2 className="font-bold mb-2">🎓 Certificates</h2>
          <p>Download your certificates</p>
        </div>

        <div className="bg-white p-4 shadow rounded">
          <h2 className="font-bold mb-2">📚 Practice</h2>
          <p>Access study resources</p>
        </div>
      </div>

      {/* PAST CONTESTS */}
      <section>
        <h2 className="text-xl font-bold mb-4">Past Contests</h2>

        {pastContests.length === 0 ? (
          <p className="text-gray-600">No past contests yet</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {pastContests.map((contest) => (
              <div key={contest.id} className="bg-gray-100 p-4 rounded shadow">
                <h3 className="font-bold">{contest.name}</h3>

                <p className="text-sm text-gray-600">
                  Date: {new Date(contest.start_time).toDateString()}
                </p>

                <p>Status: {contest.status}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

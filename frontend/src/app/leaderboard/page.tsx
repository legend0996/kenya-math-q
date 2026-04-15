"use client";

import { useEffect, useState } from "react";

type Leader = {
  id: number;
  rank: number;
  full_name: string;
  school: string;
  grade: string;
  score: number;
};

type MyRank = Leader | null;

export default function Leaderboard() {
  const [type, setType] = useState("national");
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [myRank, setMyRank] = useState<MyRank>(null);
  const [loading, setLoading] = useState(true);

  const contest_id = 1;

  const fetchLeaderboard = async () => {
    setLoading(true);

    // 🔐 GET USER ID FROM TOKEN
    const token = localStorage.getItem("token");
    let studentId = "";

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        studentId = payload.id;
      } catch (err) {
        console.error("Token decode error:", err);
      }
    }

    let url = `http://localhost:5000/api/leaderboard?contest_id=${contest_id}&student_id=${studentId}`;

    if (type === "school") {
      url += `&type=school&school=Nairobi School`; // 🔥 later dynamic
    }

    if (type === "class") {
      url += `&type=class&grade=Form 2`; // 🔥 later dynamic
    }

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setLeaders(data.leaderboard || []);
        setMyRank(data.myRank || null);
      } else {
        setLeaders([]);
        setMyRank(null);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setLeaders([]);
      setMyRank(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [type]);

  return (
    <main className="pt-24 p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🏆 Leaderboard</h1>

      {/* TABS */}
      <div className="flex justify-center mb-6 space-x-2">
        {["national", "school", "class"].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-2 rounded ${
              type === t ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* LOADING */}
      {loading ? (
        <p className="text-center text-gray-600">Loading...</p>
      ) : (
        <>
          {/* 🔥 MY RANK */}
          {myRank && (
            <div className="bg-blue-100 p-4 rounded mb-6 text-center shadow">
              <h2 className="font-bold text-lg">Your Position</h2>

              <p className="text-xl font-bold">#{myRank.rank}</p>

              <p>{myRank.full_name}</p>
              <p className="font-bold">{myRank.score} pts</p>
            </div>
          )}

          {/* 🏆 TOP 3 */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {leaders.slice(0, 3).map((l, i) => (
              <div
                key={l.id}
                className={`p-4 rounded text-center shadow ${
                  i === 0
                    ? "bg-yellow-200"
                    : i === 1
                      ? "bg-gray-200"
                      : "bg-orange-200"
                }`}
              >
                <h2 className="text-xl font-bold">#{l.rank}</h2>
                <p>{l.full_name}</p>
                <p className="text-sm">{l.school}</p>
                <p className="font-bold">{l.score} pts</p>
              </div>
            ))}
          </div>

          {/* 📊 TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2">Rank</th>
                  <th>Name</th>
                  <th>School</th>
                  <th>Grade</th>
                  <th>Score</th>
                </tr>
              </thead>

              <tbody>
                {leaders.map((l) => (
                  <tr
                    key={l.id}
                    className={`text-center border-t ${
                      myRank?.id === l.id ? "bg-blue-200 font-bold" : ""
                    }`}
                  >
                    <td className="p-2">{l.rank}</td>
                    <td>{l.full_name}</td>
                    <td>{l.school}</td>
                    <td>{l.grade}</td>
                    <td className="font-bold">{l.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* EMPTY */}
          {leaders.length === 0 && (
            <p className="text-center text-gray-500 mt-6">No data available</p>
          )}
        </>
      )}
    </main>
  );
}

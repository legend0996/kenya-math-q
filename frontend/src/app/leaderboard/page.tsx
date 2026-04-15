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

export default function Leaderboard() {
  const [type, setType] = useState("national");
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [myRank, setMyRank] = useState<Leader | null>(null);
  const [loading, setLoading] = useState(true);

  const contest_id = 1;

  // 🔐 GET USER DATA
  const getUser = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);

    const user = getUser();

    let url = `http://localhost:5000/api/leaderboard?contest_id=${contest_id}`;

    if (user?.id) {
      url += `&student_id=${user.id}`;
    }

    if (type === "school" && user?.school) {
      url += `&type=school&school=${encodeURIComponent(user.school)}`;
    }

    if (type === "class" && user?.grade) {
      url += `&type=class&grade=${encodeURIComponent(user.grade)}`;
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
      console.error("Leaderboard error:", error);
      setLeaders([]);
      setMyRank(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [type]);

  return (
    <main className="pt-24 px-4 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">🏆 Leaderboard</h1>

      {/* TABS */}
      <div className="flex justify-center mb-6 gap-2 flex-wrap">
        {["national", "school", "class"].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-4 py-2 rounded text-sm ${
              type === t
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">
          Loading leaderboard...
        </div>
      ) : (
        <>
          {/* 🔥 MY RANK */}
          {myRank && (
            <div className="bg-blue-100 p-4 rounded mb-6 text-center shadow">
              <h2 className="font-bold text-lg">Your Position</h2>
              <p className="text-2xl font-bold text-blue-700">#{myRank.rank}</p>
              <p>{myRank.full_name}</p>
              <p className="font-bold">{myRank.score} pts</p>
            </div>
          )}

          {/* 🏆 TOP 3 */}
          {leaders.length >= 3 && (
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
          )}

          {/* 📊 TABLE */}
          {leaders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border rounded">
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
          ) : (
            <div className="text-center text-gray-500 mt-10">
              No leaderboard data yet
            </div>
          )}
        </>
      )}
    </main>
  );
}

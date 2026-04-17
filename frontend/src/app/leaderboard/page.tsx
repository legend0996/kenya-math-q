"use client";

import { useEffect, useState } from "react";
import { Trophy, Medal, Globe, School, BookOpen, Star } from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { PageSpinner } from "../../components/ui/Spinner";

type Leader = {
  id: number;
  rank: number;
  full_name: string;
  school: string;
  grade: string;
  score: number;
};

const TABS = [
  { key: "national", label: "National",  Icon: Globe },
  { key: "school",   label: "School",    Icon: School },
  { key: "class",    label: "Class",     Icon: BookOpen },
];

const RANK_STYLES = [
  "bg-linear-to-br from-amber-400  to-amber-500  text-white shadow-amber-200",
  "bg-linear-to-br from-slate-300  to-slate-400  text-white shadow-slate-200",
  "bg-linear-to-br from-orange-400 to-orange-500 text-white shadow-orange-200",
];

export default function Leaderboard() {
  const [type, setType]       = useState("national");
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [myRank, setMyRank]   = useState<Leader | null>(null);
  const [loading, setLoading] = useState(true);

  const contest_id = 1;

  const getUser = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try { return JSON.parse(atob(token.split(".")[1])); } catch { return null; }
  };

  useEffect(() => {
    setLoading(true);
    const user = getUser();
    let url = apiUrl(`/api/leaderboard?contest_id=${contest_id}`);
    if (user?.id)     url += `&student_id=${user.id}`;
    if (type === "school" && user?.school) url += `&type=school&school=${encodeURIComponent(user.school)}`;
    if (type === "class"  && user?.grade)  url += `&type=class&grade=${encodeURIComponent(user.grade)}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setLeaders(d.success ? d.leaderboard || [] : []);
        setMyRank(d.success ? d.myRank || null : null);
      })
      .catch(() => { setLeaders([]); setMyRank(null); })
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-400 rounded-2xl shadow-lg shadow-amber-200 mb-5">
            <Trophy size={30} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Leaderboard</h1>
          <p className="text-slate-500 mt-2">See how students rank across school, grade, and national levels</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 mb-8 max-w-sm mx-auto">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                type === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {loading ? (
          <PageSpinner message="Loading leaderboard…" />
        ) : (
          <>
            {/* My Rank */}
            {myRank && (
              <div className="bg-linear-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-4 shadow-lg shadow-blue-200">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                  <Star size={24} className="text-amber-300" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-blue-200 text-sm font-medium mb-0.5">Your Ranking</p>
                  <p className="text-2xl font-extrabold">{myRank.full_name}</p>
                  <p className="text-blue-200 text-sm">{myRank.school} · {myRank.grade}</p>
                </div>
                <div className="sm:ml-auto text-center">
                  <p className="text-blue-200 text-xs uppercase tracking-wider">Rank</p>
                  <p className="text-4xl font-extrabold">#{myRank.rank}</p>
                  <p className="text-blue-200 text-sm">{myRank.score} pts</p>
                </div>
              </div>
            )}

            {/* Podium Top 3 */}
            {leaders.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[leaders[1], leaders[0], leaders[2]].map((l, idx) => {
                  const origIdx = idx === 0 ? 1 : idx === 1 ? 0 : 2;
                  return l ? (
                    <div
                      key={l.id}
                      className={`rounded-2xl p-5 text-center shadow-md ${RANK_STYLES[origIdx]} ${
                        origIdx === 0 ? "scale-105 -translate-y-2" : ""
                      }`}
                    >
                      <div className="text-2xl mb-2">
                        {origIdx === 0 ? "🥇" : origIdx === 1 ? "🥈" : "🥉"}
                      </div>
                      <p className="font-bold text-sm leading-tight">{l.full_name}</p>
                      <p className="text-xs opacity-80 mt-0.5 truncate">{l.school}</p>
                      <p className="font-extrabold text-lg mt-2">{l.score}</p>
                      <p className="text-xs opacity-75">pts</p>
                    </div>
                  ) : <div key={idx} />;
                })}
              </div>
            )}

            {/* Full Table */}
            {leaders.length > 0 ? (
              <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-5 py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Rank</th>
                        <th className="text-left px-4    py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Student</th>
                        <th className="text-left px-4    py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">School</th>
                        <th className="text-left px-4    py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Grade</th>
                        <th className="text-right px-5   py-3.5 font-semibold text-slate-600 text-xs uppercase tracking-wider">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaders.map((l) => {
                        const isMe = myRank?.id === l.id;
                        return (
                          <tr
                            key={l.id}
                            className={`border-b border-slate-50 last:border-0 transition-colors ${
                              isMe ? "bg-blue-50" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="px-5 py-3.5">
                              {l.rank <= 3 ? (
                                <span className="text-lg">{l.rank === 1 ? "🥇" : l.rank === 2 ? "🥈" : "🥉"}</span>
                              ) : (
                                <span className="font-bold text-slate-500">#{l.rank}</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <p className={`font-semibold ${isMe ? "text-blue-700" : "text-slate-900"}`}>{l.full_name}</p>
                              {isMe && <Badge variant="info" className="mt-0.5">You</Badge>}
                            </td>
                            <td className="px-4 py-3.5 text-slate-500 hidden sm:table-cell">{l.school}</td>
                            <td className="px-4 py-3.5 hidden md:table-cell">
                              <Badge variant="default">{l.grade}</Badge>
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-slate-900">{l.score}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="text-center py-14">
                <Medal size={40} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No leaderboard data available</p>
                <p className="text-sm text-slate-400 mt-1">Results will appear after the contest ends</p>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}
function apiUrl(path: string) {
  // Prefix with NEXT_PUBLIC_API_URL if set, else use relative path
  const base = process.env.NEXT_PUBLIC_API_URL || "";
  if (path.startsWith("/")) {
    return base + path;
  }
  return base + "/" + path;
}


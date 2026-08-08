
import { useEffect, useState } from "react";
import { Trophy, Medal, Globe, School, BookOpen, Star, Crown } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { PageSpinner } from "../components/ui/Spinner";
import { apiUrl, fetchMe } from "../utils/api";

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
  "bg-violet-500 text-white shadow-soft",
  "bg-charcoal-800 text-white shadow-soft",
  "bg-amber-500 text-white shadow-soft",
];

const MEDAL_ICONS = [
  <Crown key="1" size={22} className="mx-auto mb-1.5" />,
  <Medal key="2" size={22} className="mx-auto mb-1.5" />,
  <Medal key="3" size={22} className="mx-auto mb-1.5" />,
];

export default function Leaderboard() {
  const [type, setType]       = useState("national");
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [myRank, setMyRank]   = useState<Leader | null>(null);
  const [loading, setLoading] = useState(true);
  const [contestId, setContestId] = useState<number | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/contest/current"))
      .then((r) => r.json())
      .then(async (d) => {
        const id = d?.success && d?.id ? Number(d.id) : null;
        setContestId(id);
        if (!id) return;
        let url = apiUrl(`/api/leaderboard?contest_id=${id}`);
        const user = await fetchMe();
        if (user?.id)     url += `&student_id=${user.id}`;
        if (type === "school" && user?.school) url += `&type=school&school=${encodeURIComponent(user.school)}`;
        if (type === "class"  && user?.grade)  url += `&type=class&grade=${encodeURIComponent(user.grade)}`;

        const r = await fetch(url);
        const ld = await r.json();
        setLeaders(ld.success ? ld.leaderboard || [] : []);
        setMyRank(ld.success ? ld.myRank || null : null);
      })
      .catch(() => { setLeaders([]); setMyRank(null); })
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <main className="kmq-dashboard pt-[104px] min-h-screen bg-surface">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-violet-500 rounded-2xl shadow-lifted mb-5">
            <Trophy size={30} className="text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Leaderboard</h1>
          <p className="text-muted mt-2">See how students rank across school, grade, and national levels</p>
        </div>

        <div className="flex bg-white rounded-2xl border border-border shadow-soft p-1.5 mb-8 max-w-sm mx-auto" role="tablist" aria-label="Leaderboard scope">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setType(key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                type === key
                  ? "bg-primary-light text-primary-dark shadow-sm"
                  : "text-muted hover:text-foreground"
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
            {myRank && (
              <div className="bg-charcoal-200 text-white rounded-2xl p-6 mb-8 flex flex-col sm:flex-row items-center gap-4 shadow-lifted">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                  <Star size={24} className="text-pumpkin-spice-600" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-slate-500 text-sm font-medium mb-0.5">Your Ranking</p>
                  <p className="text-2xl font-bold text-white">{myRank.full_name}</p>
                  <p className="text-slate-500 text-sm">{myRank.school} · {myRank.grade}</p>
                </div>
                <div className="sm:ml-auto text-center">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Rank</p>
                  <p className="text-4xl font-bold text-pumpkin-spice-600">#{myRank.rank}</p>
                  <p className="text-slate-500 text-sm">{myRank.score} pts</p>
                </div>
              </div>
            )}

            {leaders.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[leaders[1], leaders[0], leaders[2]].map((l, idx) => {
                  const origIdx = idx === 0 ? 1 : idx === 1 ? 0 : 2;
                  return l ? (
                    <div
                      key={l.id}
                      className={`rounded-2xl p-5 text-center ${RANK_STYLES[origIdx]} ${
                        origIdx === 0 ? "scale-105 -translate-y-2 shadow-lg" : "shadow-md"
                      }`}
                    >
                      {MEDAL_ICONS[origIdx]}
                      <p className="font-bold text-sm leading-tight">{l.full_name}</p>
                      <p className="text-xs opacity-80 mt-0.5 truncate">{l.school}</p>
                      <p className="font-extrabold text-lg mt-2">{l.score}</p>
                      <p className="text-xs opacity-75">pts</p>
                    </div>
                  ) : <div key={idx} />;
                })}
              </div>
            )}

            {leaders.length > 0 ? (
              <Card padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-ghost-white-500 border-b border-border">
                        <th className="text-left px-5 py-3.5 font-semibold text-muted text-xs uppercase tracking-wider">Rank</th>
                        <th className="text-left px-4    py-3.5 font-semibold text-muted text-xs uppercase tracking-wider">Student</th>
                        <th className="text-left px-4    py-3.5 font-semibold text-muted text-xs uppercase tracking-wider hidden sm:table-cell">School</th>
                        <th className="text-left px-4    py-3.5 font-semibold text-muted text-xs uppercase tracking-wider hidden md:table-cell">Grade</th>
                        <th className="text-right px-5   py-3.5 font-semibold text-muted text-xs uppercase tracking-wider">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaders.map((l) => {
                        const isMe = myRank?.id === l.id;
                        return (
                          <tr
                            key={l.id}
                            className={`border-b border-border last:border-0 transition-colors ${
                              isMe ? "bg-pumpkin-spice-900/50" : "hover:bg-ghost-white-500"
                            }`}
                          >
                            <td className="px-5 py-3.5">
                              {l.rank <= 3 ? (
                                <span className={`inline-flex w-8 h-8 items-center justify-center rounded-lg ${
                                  l.rank === 1 ? "bg-violet-500 text-white" : l.rank === 2 ? "bg-charcoal-800 text-white" : "bg-amber-100 text-amber-700"
                                }`}>
                                  {l.rank === 1 ? <Crown size={15} /> : <Medal size={15} />}
                                </span>
                              ) : (
                                <span className="font-bold text-muted">#{l.rank}</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              <p className={`font-semibold ${isMe ? "text-primary-dark" : "text-foreground"}`}>{l.full_name}</p>
                              {isMe && <Badge variant="info" className="mt-0.5">You</Badge>}
                            </td>
                            <td className="px-4 py-3.5 text-muted hidden sm:table-cell">{l.school}</td>
                            <td className="px-4 py-3.5 hidden md:table-cell">
                              <Badge variant="default">{l.grade}</Badge>
                            </td>
                            <td className="px-5 py-3.5 text-right font-bold text-foreground">{l.score}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="text-center py-14">
                <Medal size={40} className="text-charcoal-800 mx-auto mb-3" />
                <p className="text-muted font-medium">
                  {contestId === null ? "No active contest" : "No leaderboard data available"}
                </p>
                <p className="text-sm text-charcoal-600 mt-1">
                  {contestId === null ? "Results will appear once a contest is activated" : "Results will appear after the contest ends"}
                </p>
              </Card>
            )}
          </>
        )}
      </div>
    </main>
  );
}

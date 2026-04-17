"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "../../utils/api";
import { useRouter } from "next/navigation";
import {
  Trophy, BookOpen, Award, BarChart2, Calendar,
  LogOut, ChevronRight, Download, Play, Clock, CheckCircle,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card, StatCard } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner, SkeletonCard } from "../../components/ui/Spinner";

type User    = { id?: number; name?: string };
type Contest = { id: number; name: string; status: string; start_time: string };

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser]                     = useState<User | null>(null);
  const [currentContest, setCurrentContest] = useState<Contest | null>(null);
  const [pastContests, setPastContests]     = useState<Contest[]>([]);
  const [result, setResult]                 = useState<any>(null);
  const [pageLoading, setPageLoading]       = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    let payload: any;
    try {
      payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ id: payload.id, name: payload.name || "Student" });
    } catch {
      router.push("/login"); return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(apiUrl("/api/contest/current"),              { headers }).then((r) => r.json()),
      fetch(apiUrl("/api/contest/history"),              { headers }).then((r) => r.json()),
      fetch(apiUrl(`/api/exam/result?student_id=${payload.id}&contest_id=1`), { headers }).then((r) => r.json()),
    ]).then(([contestData, historyData, resultData]) => {
      if (contestData.success) setCurrentContest(contestData);
      if (historyData.success) setPastContests(historyData.contests || []);
      if (resultData.success)  setResult(resultData.result);
    }).finally(() => setPageLoading(false));
  }, [router]);

  useEffect(() => {
    if (result) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [result]);

  const handleDownloadCertificate = () => {
    if (!user?.id) return;
    window.open(apiUrl(`/api/exam/certificate?student_id=${user.id}&contest_id=1`));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (pageLoading) return <PageSpinner message="Loading your dashboard…" />;

  const statusBadge = (status: string) => {
    if (status === "live")     return <Badge variant="success" dot>Live</Badge>;
    if (status === "upcoming") return <Badge variant="info">Upcoming</Badge>;
    if (status === "ended")    return <Badge variant="default">Ended</Badge>;
    return <Badge variant="default">{status}</Badge>;
  };

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Welcome back</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
              {user?.name} 👋
            </h1>
          </div>
          <Button variant="ghost" icon={<LogOut size={16} />} onClick={handleLogout}
            className="text-red-500 hover:bg-red-50 hover:text-red-600">
            Logout
          </Button>
        </div>

        {/* ── Quick stats ── */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Your Score"       value={result?.score ?? "—"}  icon={<BarChart2 size={22} />} />
          <StatCard label="Contests Entered" value={pastContests.length}   icon={<Trophy size={22} />} />
          <StatCard label="Certificates"     value={result ? "1" : "0"}    icon={<Award size={22} />} />
        </div>

        {/* ── Current Contest ── */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Trophy size={20} className="text-blue-600" /> Current Contest
          </h2>

          {currentContest ? (
            <Card className="border-l-4 border-l-blue-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-lg">{currentContest.name}</h3>
                    {statusBadge(currentContest.status)}
                  </div>
                  <p className="text-sm text-slate-500 flex items-center gap-1.5">
                    <Calendar size={13} />
                    {new Date(currentContest.start_time).toDateString()}
                  </p>
                </div>

                {currentContest.status === "live" && (
                  result ? (
                    <div className="flex flex-col sm:items-end gap-2">
                      <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                        <CheckCircle size={16} /> Exam Completed
                      </div>
                      <Button size="sm" variant="outline" icon={<Download size={15} />} onClick={handleDownloadCertificate}>
                        Certificate
                      </Button>
                    </div>
                  ) : (
                    <Button icon={<Play size={16} />} onClick={() => router.push("/exam")}>
                      Start Exam
                    </Button>
                  )
                )}

                {currentContest.status === "upcoming" && (
                  <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                    <Clock size={15} /> Opens soon
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="text-center py-10">
              <Trophy size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No active contest right now</p>
              <p className="text-sm text-slate-400 mt-1">Check back soon for upcoming competitions</p>
            </Card>
          )}
        </section>

        {/* ── Quick Actions ── */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: <BarChart2 size={22} />, title: "Results",      desc: "View your performance",       color: "text-violet-600", bg: "bg-violet-50" },
            { icon: <Award size={22} />,     title: "Certificates", desc: "Download your certificates",  color: "text-amber-600",  bg: "bg-amber-50" },
            { icon: <BookOpen size={22} />,  title: "Practice",     desc: "Access study resources",      color: "text-emerald-600",bg: "bg-emerald-50" },
          ].map((item) => (
            <Card key={item.title} hover className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                <span className={item.color}>{item.icon}</span>
              </div>
              <div>
                <p className="font-bold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{item.desc}</p>
              </div>
              <ChevronRight size={16} className="text-slate-300 ml-auto self-center shrink-0" />
            </Card>
          ))}
        </div>

        {/* ── Past Contests ── */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-slate-400" /> Past Contests
          </h2>

          {pastContests.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-slate-400 text-sm">No past contests yet</p>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {pastContests.map((contest) => (
                <Card key={contest.id} hover>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900">{contest.name}</h3>
                      <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
                        <Calendar size={12} />
                        {new Date(contest.start_time).toDateString()}
                      </p>
                    </div>
                    {statusBadge(contest.status)}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

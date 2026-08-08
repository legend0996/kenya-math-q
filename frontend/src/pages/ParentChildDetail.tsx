
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft, GraduationCap, School, Trophy, Award,
  Calendar, Download, AlertCircle, User, Phone, MapPin,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { PageSpinner } from "../components/ui/Spinner";
import { apiUrl, authHeaders, downloadAuthorized, fetchMe } from "../utils/api";

type HistoryRow = {
  id: number;
  contest_id: number;
  contest_name: string;
  year?: string;
  is_test?: number | boolean;
  start_time?: string;
  score?: number | null;
  percentage?: number | null;
  result_grade?: string | null;
  completed?: number | boolean;
  timed_out?: number | boolean;
  marked?: number | boolean;
  payment_status?: string | null;
};

type Cert = {
  id: number;
  contest_id?: number;
  contest_name?: string;
  year?: string;
  score?: number | null;
  grade?: string | null;
  source?: string;
  created_at: string;
};

type Student = {
  id: number;
  full_name: string;
  email?: string;
  username?: string;
  school?: string;
  grade?: string;
  county?: string;
  student_phone?: string;
  parent_phone?: string;
  created_at?: string;
};

export default function ParentChildDetail() {
  const navigate = useNavigate();
  const { studentId } = useParams<{ studentId: string }>();

  const [student, setStudent] = useState<Student | null>(null);
  const [contest, setContest] = useState<{ id: number; name: string; status?: string } | null>(null);
  const [registered, setRegistered] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<{ score?: number | null; percentage?: number | null; grade?: string | null; completed?: number; marked?: number; timed_out?: number } | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [certificates, setCertificates] = useState<Cert[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetails = () => {
    if (!studentId) { navigate("/parent-dashboard"); return; }
    fetch(apiUrl(`/api/parent/child/${studentId}`), { headers: authHeaders() })
      .then((res) => res.json())
      .then((d) => {
        if (d.success) {
          setStudent(d.student);
          setContest(d.contest);
          setRegistered(d.registered);
          setPaymentStatus(d.payment_status);
          setCurrentResult(d.current_result);
          setHistory(d.history || []);
          setCertificates(d.certificates || []);
        } else {
          setError(d.error || "Could not load child details");
        }
      })
      .catch(() => setError("Connection error"))
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    fetchMe().then((u) => {
      if (!u?.id || u.role !== "parent") { navigate("/login"); return; }
      loadDetails();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, studentId]);

  if (pageLoading) return <PageSpinner message="Loading child details…" />;

  const downloadCert = (id: number) => {
    downloadAuthorized(`/api/parent/certificate/download/${id}`).catch((e) =>
      setError(e.message || "Download failed")
    );
  };

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate("/parent-dashboard")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft size={15} /> Back to parent dashboard
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 text-2xl font-bold flex items-center justify-center shrink-0">
                {student?.full_name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{student?.full_name}</h1>
                <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <GraduationCap size={13} /> {student?.grade || "—"}
                  <School size={13} className="ml-2" /> {student?.school || "No school"}
                </p>
              </div>
            </div>
            <Badge variant="info">Linked child</Badge>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {!error && student && (
          <>
            {/* Account info */}
            <Card className="mb-8">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <User size={18} className="text-blue-600" /> Account
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <User size={14} className="text-slate-400" />
                  <span className="text-slate-500">Email:</span> {student.email || "—"}
                </div>
                {student.county && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={14} className="text-slate-400" />
                    <span className="text-slate-500">County:</span> {student.county}
                  </div>
                )}
                {student.student_phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={14} className="text-slate-400" />
                    <span className="text-slate-500">Student phone:</span> {student.student_phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  <span className="text-slate-500">Joined:</span>{" "}
                  {student.created_at ? new Date(student.created_at).toLocaleDateString() : "—"}
                </div>
              </div>
            </Card>

            {/* Current contest */}
            <Card className="mb-8 border-l-4 border-l-blue-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Current contest</p>
                  <h3 className="font-bold text-slate-900">{contest ? contest.name : "No contest published yet"}</h3>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {!registered && <Badge variant="default">Not registered</Badge>}
                  {registered && paymentStatus === "paid" && <Badge variant="success" dot>Registered • Paid</Badge>}
                  {registered && paymentStatus === "pending" && <Badge variant="warning">Payment under review</Badge>}
                  {registered && !paymentStatus && <Badge variant="warning">Registered • Payment required</Badge>}
                  {currentResult?.completed ? (
                    <Badge variant="success">
                      Score {currentResult.score ?? "—"}
                      {currentResult.percentage != null ? ` · ${currentResult.percentage}%` : ""}
                      {currentResult.grade ? ` · ${currentResult.grade}` : ""}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </Card>

            {/* Contest history */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Trophy size={20} className="text-violet-600" /> Contest History
              </h2>
              {history.length === 0 ? (
                <Card className="text-center py-10">
                  <Trophy size={36} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No completed contests yet</p>
                  <p className="text-sm text-slate-400 mt-1">Results appear here once the child completes a contest</p>
                </Card>
              ) : (
                <Card padding="none">
                  <div className="divide-y divide-slate-50">
                    {history.map((h) => (
                      <div key={h.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          h.result_grade === "Distinction" ? "bg-amber-50 text-amber-600"
                          : h.result_grade === "Merit" ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-500"
                        }`}>
                          <Trophy size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-slate-900 truncate">{h.contest_name}</p>
                            {h.is_test ? <Badge variant="info">Test</Badge> : null}
                            {h.timed_out ? <Badge variant="warning">Timed out</Badge> : null}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {h.start_time ? new Date(h.start_time).toDateString() : (h.year || "—")}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-slate-900 text-sm">
                            {h.score ?? "—"} pts
                            {h.percentage != null ? ` · ${h.percentage}%` : ""}
                          </p>
                          {h.result_grade && <p className="text-xs text-emerald-600 font-medium">{h.result_grade}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </section>

            {/* Certificates */}
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Award size={20} className="text-amber-500" /> Certificates
              </h2>
              {certificates.length === 0 ? (
                <Card className="text-center py-10">
                  <Award size={36} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No certificates yet</p>
                  <p className="text-sm text-slate-400 mt-1">Certificates appear here once issued by the organizers</p>
                </Card>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {certificates.map((c) => (
                    <Card key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-slate-900">{c.contest_name || "Certificate"}</h3>
                          {c.source === "manual"
                            ? <Badge variant="info">Manual</Badge>
                            : c.grade ? <Badge variant="success">{c.grade}</Badge> : <Badge variant="default">Issued</Badge>}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                          {c.grade && c.score != null ? `Score: ${c.score} · ${c.grade} · ` : ""}
                          {new Date(c.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" icon={<Download size={14} />}
                        onClick={() => downloadCert(c.id)}>
                        Download
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <div className="mt-8">
          <Link to="/parent-dashboard">
            <Button variant="outline" icon={<ArrowLeft size={15} />}>Back to parent dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "../../utils/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Spinner, PageSpinner } from "../../components/ui/Spinner";

export default function CertificateManager() {
  const [contests, setContests] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [feedback, setFeedback] = useState<{ type: "success"|"error"; msg: string } | null>(null);

  const getToken = () => localStorage.getItem("token") || "";
  const authHeader = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  useEffect(() => {
    fetch(apiUrl("/api/owner/contest/all"), { headers: authHeader() })
      .then(r => r.json())
      .then(d => { if (d.success) setContests(d.contests || []); })
      .finally(() => setLoading(false));
  }, []);

  const fetchParticipants = async (contestId: number) => {
    setLoading(true);
    setSelected(contestId);
    const r = await fetch(apiUrl(`/api/owner/contest/${contestId}/participants`), { headers: authHeader() });
    const d = await r.json();
    setParticipants(d.participants || []);
    setLoading(false);
  };

  const generateCertificates = async () => {
    setGenerating(true);
    try {
      const r = await fetch(apiUrl(`/api/owner/contest/${selected}/generate-certificates`), {
        method: "POST", headers: authHeader(),
      });
      const d = await r.json();
      if (d.success) {
        setFeedback({ type: "success", msg: "Certificates generated successfully." });
      } else {
        setFeedback({ type: "error", msg: d.message || "Failed to generate certificates." });
      }
    } catch {
      setFeedback({ type: "error", msg: "Failed to generate certificates." });
    } finally {
      setGenerating(false);
    }
  };

  const previewCertificate = (participant: any) => {
    setPreview(participant);
  };

  const downloadCertificate = async (participantId: number) => {
    const r = await fetch(apiUrl(`/api/owner/certificate/${participantId}/download`), { headers: authHeader() });
    const blob = await r.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate_${participantId}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Certificate Generation</h1>
        {feedback && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {feedback.msg}
          </div>
        )}
        {loading ? <PageSpinner message="Loading contests..." /> : (
          <Card>
            <h2 className="font-bold text-slate-900 mb-4">Select Contest</h2>
            <select className="w-full mb-4 px-4 py-2 border rounded-xl" value={selected || ""} onChange={e => fetchParticipants(Number(e.target.value))}>
              <option value="">-- Select Contest --</option>
              {contests.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
              ))}
            </select>
            {participants.length > 0 && (
              <>
                <Button className="mb-4" loading={generating} onClick={generateCertificates}>Generate Certificates</Button>
                <div className="divide-y divide-slate-50">
                  {participants.map((p: any) => (
                    <div key={p.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{p.full_name || p.name}</p>
                        <p className="text-sm text-slate-500">{p.school}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => previewCertificate(p)}>Preview</Button>
                        <Button size="sm" onClick={() => downloadCertificate(p.id)}>Download PDF</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        )}
        {/* Certificate Preview Modal */}
        {preview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-lg w-full relative">
              <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-600" onClick={() => setPreview(null)}>&times;</button>
              <div className="flex flex-col items-center justify-center min-h-100">
                {/* Premium certificate layout */}
                <div className="w-full max-w-md border-4 border-blue-600 rounded-2xl p-8 text-center bg-white shadow-lg">
                  <img src="/logo.png" alt="Logo" className="mx-auto mb-4 w-20 h-20 object-contain" />
                  <h2 className="text-xl font-bold mb-2">Certificate of Participation</h2>
                  <p className="mb-4 text-slate-700">This is to certify that</p>
                  <p className="text-2xl font-bold text-blue-700 mb-2">{preview.full_name || preview.name}</p>
                  <p className="mb-2 text-slate-700">from <span className="font-semibold">{preview.school}</span></p>
                  <p className="mb-4 text-slate-700">has participated in</p>
                  <p className="text-lg font-semibold text-blue-600 mb-2">{contests.find(c => c.id === selected)?.name}</p>
                  <p className="mb-4 text-slate-700">held on <span className="font-semibold">{new Date().toLocaleDateString()}</span></p>
                  <div className="mt-6 text-slate-400 text-xs">&copy; {new Date().getFullYear()} Kenya Math Q</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

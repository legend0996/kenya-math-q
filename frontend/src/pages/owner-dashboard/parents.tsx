
import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { apiUrl, authHeaders } from "../../utils/api";
import { Users, GraduationCap, Search, AlertCircle } from "lucide-react";

type ChildRow = {
  student_id: number;
  student_name: string;
  student_email?: string;
  school?: string;
  grade?: string;
};

type ParentRow = {
  id: number;
  full_name: string;
  email?: string;
  username?: string;
  phone?: string;
  created_at?: string;
  children: ChildRow[];
};

export default function ParentsManager() {
  const [parents, setParents] = useState<ParentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(apiUrl(`/api/owner/parents?search=${encodeURIComponent(search)}`), { headers: authHeaders() });
        const d = await r.json();
        if (!alive) return;
        if (d.success) setParents(d.parents || []);
        else setError(d.error || "Failed to load parents");
      } catch {
        if (alive) setError("Connection error");
      } finally {
        if (alive) setLoading(false);
      }
    }, 350);
    return () => { alive = false; clearTimeout(t); };
  }, [search]);

  const counts = useMemo(() => ({
    parents: parents.length,
    children: parents.reduce((n, p) => n + p.children.length, 0),
  }), [parents]);

  if (loading) return <PageSpinner message="Loading parents…" />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-50 border border-red-200 text-red-700">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Users size={18} className="text-slate-400" /> Parents &amp; their Children
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search parent or child…"
                className="pl-9 pr-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all w-64"
              />
            </div>
            <Badge variant="info">{counts.parents} parents</Badge>
            <Badge variant="purple">{counts.children} children</Badge>
          </div>
        </div>

        {parents.length === 0 ? (
          <div className="text-center py-14 text-slate-400">
            <GraduationCap size={32} className="mx-auto mb-2 opacity-30" />
            <p>No parents found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {parents.map((p) => (
              <div key={p.id} className="px-6 py-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 text-sm font-bold flex items-center justify-center shrink-0">
                    {p.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{p.full_name}</p>
                    <p className="text-xs text-slate-400">
                      {p.email}{p.phone ? ` · ${p.phone}` : ""}{p.username ? ` · @${p.username}` : ""}
                    </p>
                  </div>
                  <Badge variant="purple"><GraduationCap size={12} /> {p.children.length} child(ren)</Badge>
                </div>
                {p.children.length > 0 && (
                  <div className="mt-3 ml-12 grid sm:grid-cols-2 gap-2">
                    {p.children.map((c) => (
                      <div key={c.student_id} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                        <GraduationCap size={14} className="text-blue-500 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">{c.student_name}</p>
                          <p className="text-xs text-slate-400 truncate">
                            {c.student_email}
                            {c.grade ? ` · ${c.grade}` : ""}
                            {c.school ? ` · ${c.school}` : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

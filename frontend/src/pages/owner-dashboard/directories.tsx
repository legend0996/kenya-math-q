import { useEffect, useMemo, useState } from "react";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { apiUrl, authHeaders } from "../../utils/api";
import { Users, School, GraduationCap, ShieldCheck, Search, Database } from "lucide-react";

type DirStudent = {
  id: number;
  name: string;
  email?: string | null;
  school?: string | null;
  grade?: string | null;
  parent_phone?: string | null;
  student_phone?: string | null;
  created_at?: string;
};

type DirSchool = {
  id: number;
  name: string;
  email?: string | null;
  county?: string | null;
  status?: string;
  created_at?: string;
};

type DirParent = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  children?: number;
  created_at?: string;
};

type DirAdmin = {
  id: number;
  name: string;
  email?: string | null;
  username?: string | null;
  is_primary?: number;
  permissions?: string | null;
  created_at?: string;
};

type Data = {
  students: DirStudent[];
  schools: DirSchool[];
  parents: DirParent[];
  admins: DirAdmin[];
};

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—");

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search this table…"
        className="w-full sm:w-72 pl-9 pr-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all"
      />
    </div>
  );
}

function DataTable<T extends { id: number }>({
  rows,
  cols,
}: {
  rows: T[];
  cols: { key: keyof T | string; label: string; render?: (r: T) => React.ReactNode }[];
}) {
  if (rows.length === 0) {
    return <div className="text-center py-12 text-muted text-sm">No records found</div>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="bg-surface border-b border-slate-100 text-xs uppercase tracking-wide text-muted">
            {cols.map((c) => (
              <th key={String(c.key)} className="px-6 py-3 font-semibold">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/60">
              {cols.map((c) => (
                <td key={String(c.key)} className="px-6 py-3">
                  {c.render ? c.render(r) : String((r as Record<string, unknown>)[String(c.key)] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Directories() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sub, setSub] = useState<"students" | "schools" | "parents" | "admins">("students");
  const [q, setQ] = useState("");

  useEffect(() => {
    let alive = true;
    fetch(apiUrl("/api/owner/schools/all"), { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.success) setData(d);
        else setError(d.error || "Failed to load directory");
      })
      .catch(() => {
        if (alive) setError("Connection error");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!data) return { students: [], schools: [], parents: [], admins: [] };
    const has = (...vals: (string | null | number | undefined)[]) => vals.some((v) => String(v ?? "").toLowerCase().includes(s));
    return {
      students: data.students.filter((x) => has(x.name, x.email, x.school, x.grade)),
      schools: data.schools.filter((x) => has(x.name, x.email, x.county, x.status)),
      parents: data.parents.filter((x) => has(x.name, x.email, x.phone)),
      admins: data.admins.filter((x) => has(x.name, x.email, x.username)),
    };
  }, [data, q]);

  if (loading) return <PageSpinner message="Loading directories…" />;

  const SUBTABS: { key: typeof sub; label: string; Icon: typeof Users; count: number }[] = [
    { key: "students", label: "Students", Icon: GraduationCap, count: data?.students.length ?? 0 },
    { key: "schools", label: "Schools", Icon: School, count: data?.schools.length ?? 0 },
    { key: "parents", label: "Parents", Icon: Users, count: data?.parents.length ?? 0 },
    { key: "admins", label: "Admins", Icon: ShieldCheck, count: data?.admins.length ?? 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-bold text-slate-900 flex items-center gap-2">
          <Database size={18} className="text-primary-dark" /> Directories
        </h2>
        <SearchBox value={q} onChange={setQ} />
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium bg-red-50 border border-red-200 text-red-700">{error}</div>
      )}

      <div className="flex bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 gap-1 overflow-x-auto">
        {SUBTABS.map(({ key, label, Icon, count }) => (
          <button
            key={key}
            onClick={() => setSub(key)}
            className={`flex items-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              sub === key ? "bg-primary-light text-primary-dark shadow-sm" : "text-muted hover:bg-slate-50"
            }`}
          >
            <Icon size={15} /> {label} <Badge variant="default">{count}</Badge>
          </button>
        ))}
      </div>

      <Card padding="none">
        {sub === "students" && (
          <DataTable
            rows={filtered.students}
            cols={[
              { key: "name", label: "Student" },
              { key: "email", label: "Email", render: (r) => r.email || <span className="text-slate-300">—</span> },
              { key: "school", label: "School", render: (r) => r.school || "—" },
              { key: "grade", label: "Grade" },
              { key: "parent_phone", label: "Parent Phone", render: (r) => r.parent_phone || "—" },
              { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
            ]}
          />
        )}
        {sub === "schools" && (
          <DataTable
            rows={filtered.schools}
            cols={[
              { key: "name", label: "School" },
              { key: "email", label: "Email", render: (r) => r.email || <span className="text-slate-300">—</span> },
              { key: "county", label: "County", render: (r) => r.county || "—" },
              {
                key: "status",
                label: "Status",
                render: (r) => (
                  <Badge variant={r.status === "approved" ? "success" : r.status === "pending" ? "warning" : "default"}>
                    {r.status || "—"}
                  </Badge>
                ),
              },
              { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
            ]}
          />
        )}
        {sub === "parents" && (
          <DataTable
            rows={filtered.parents}
            cols={[
              { key: "name", label: "Parent" },
              { key: "email", label: "Email", render: (r) => r.email || <span className="text-slate-300">—</span> },
              { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
              { key: "children", label: "Linked Children", render: (r) => r.children ?? 0 },
              { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
            ]}
          />
        )}
        {sub === "admins" && (
          <DataTable
            rows={filtered.admins}
            cols={[
              { key: "name", label: "Admin" },
              { key: "email", label: "Email", render: (r) => r.email || <span className="text-slate-300">—</span> },
              {
                key: "is_primary",
                label: "Role",
                render: (r) => (r.is_primary ? <Badge variant="info">Primary</Badge> : <Badge variant="default">Admin</Badge>),
              },
              {
                key: "permissions",
                label: "Permissions",
                render: (r) => {
                  const perms = (r.permissions || "").split(",").map((p) => p.trim()).filter(Boolean);
                  return perms.length ? (
                    <span className="flex flex-wrap gap-1">
                      {perms.map((p) => <Badge key={p} variant="default">{p.replace(/_/g, " ")}</Badge>)}
                    </span>
                  ) : (
                    <span className="text-slate-300">All</span>
                  );
                },
              },
              { key: "created_at", label: "Date", render: (r) => fmtDate(r.created_at) },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
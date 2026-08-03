"use client";

import { useEffect, useState } from "react";
import { apiUrl, authHeaders } from "../../utils/api";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { UserPlus, Trash2, Shield, UserCog, Undo2 } from "lucide-react";

const ALL_PERMS = ["manage_schools", "manage_results", "reply_support", "manage_questions", "manage_admin"];

interface Owner {
  id: number;
  name: string;
  email: string;
  is_primary?: number;
  permissions?: string[];
}

interface StudentRow {
  id: number;
  name: string;
  email: string;
  username?: string;
  school: string;
  grade: string;
  is_admin?: number;
  permissions?: string[];
}

export default function AdminManagement() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "", permissions: [] as string[] });
  const [msg, setMsg] = useState<{ t: "ok" | "err"; m: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const r = await fetch(apiUrl("/api/owner/admin/list"), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) setOwners(d.owners || []);
    const s = await fetch(apiUrl("/api/owner/students"), { headers: authHeaders() });
    const sd = await s.json();
    if (sd.success) setStudents(sd.students || []);
  };
  useEffect(() => { load(); }, []);

  const togglePerm = (p: string) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p],
    }));

  const addAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null); setBusy("add");
    try {
      const res = await fetch(apiUrl("/api/owner/admin/add"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const d = await res.json();
      setMsg(d.success ? { t: "ok", m: d.message } : { t: "err", m: d.error });
      if (d.success) setForm({ name: "", email: "", username: "", password: "", permissions: [] });
      load();
    } catch { setMsg({ t: "err", m: "Action failed." }); }
    finally { setBusy(null); }
  };

  const toggleStudentPerm = async (id: number, p: string) => {
    const st = students.find((s) => s.id === id);
    const cur = st?.permissions || [];
    const on = cur.includes(p);
    const next = on ? cur.filter((x) => x !== p) : [...cur, p];
    setBusy(`st-${id}`);
    const r = await fetch(apiUrl("/api/owner/students/promote"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ student_id: id, permissions: next }),
    });
    const d = await r.json();
    setMsg(d.success ? { t: "ok", m: d.message } : { t: "err", m: d.error });
    load(); setBusy(null);
  };

  const revokeStudent = async (id: number) => {
    if (!confirm("Revoke this student's admin role?")) return;
    const r = await fetch(apiUrl("/api/owner/students/revoke"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ student_id: id }),
    });
    const d = await r.json();
    setMsg(d.success ? { t: "ok", m: d.message } : { t: "err", m: d.error });
    load();
  };

  const setPerms = async (id: number, permissions: string[]) => {
    setBusy(String(id));
    const r = await fetch(apiUrl("/api/owner/admin/permissions"), {
      method: "POST", headers: authHeaders(),
      body: JSON.stringify({ owner_id: id, permissions }),
    });
    const d = await r.json();
    setMsg(d.success ? { t: "ok", m: "Permissions updated" } : { t: "err", m: d.error });
    load();
    setBusy(null);
  };

  const remove = async (id: number) => {
    if (!confirm("Remove this admin?")) return;
    const r = await fetch(apiUrl(`/api/owner/admin/${id}/remove`), { method: "DELETE", headers: authHeaders() });
    const d = await r.json();
    setMsg(d.success ? { t: "ok", m: d.message } : { t: "err", m: d.error });
    load();
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium ${msg.t === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {msg.t === "ok" ? "✓ " : "⚠ "}{msg.m}
        </div>
      )}

      <Card>
        <h3 className="font-bold text-slate-900 mb-1 inline-flex items-center gap-2"><UserCog size={16} className="text-blue-600" /> Issue Admin Permission to Students</h3>
        <p className="text-xs text-slate-400 mb-4">Students register normally. Toggle permissions below to turn their account into an admin — their dashboard changes to the admin dashboard when they log in.</p>
        <div className="space-y-3">
          {students.length === 0 && <p className="text-sm text-slate-400">No students found.</p>}
          {students.map((st) => {
            const isAdmin = !!st.is_admin;
            return (
              <div key={st.id} className="border border-slate-100 rounded-xl p-3">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <p className="font-semibold text-slate-900 flex items-center gap-2">
                      {st.name}
                      {isAdmin && <Badge variant="info">Admin</Badge>}
                    </p>
                    <p className="text-xs text-slate-400">{st.email} • {st.school || st.grade || st.username}</p>
                  </div>
                  {isAdmin && (
                    <button onClick={() => revokeStudent(st.id)} className="flex items-center gap-1 text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg">
                      <Undo2 size={13} /> Revoke
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-slate-500">Perms:</span>
                  {!isAdmin && <span className="text-xs text-slate-300 italic mr-1">(none — toggle below to grant)</span>}
                  {ALL_PERMS.map((p) => {
                    const on = (st.permissions || []).includes(p);
                    return (
                      <button key={p} disabled={busy === `st-${st.id}`} onClick={() => toggleStudentPerm(st.id, p)}
                        className={`px-2.5 py-1.5 text-xs rounded-full border ${on ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"}`}>
                        {p.replace(/_/g, " ")}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-900 mb-4 inline-flex items-center gap-2"><UserPlus size={16} className="text-blue-600" /> Add an Admin</h3>
        <form onSubmit={addAdmin} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none" />
          <input placeholder="Username (optional)" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none" />
          <input required type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-blue-500 outline-none" />
          <div className="sm:col-span-2 flex flex-wrap gap-2">
            {ALL_PERMS.map((p) => (
              <button key={p} type="button" onClick={() => togglePerm(p)}
                className={`px-3 py-1.5 text-xs rounded-full border ${form.permissions.includes(p) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200"}`}>
                {p.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          <div className="sm:col-span-2"><Button type="submit" loading={busy === "add"}>Add Admin</Button></div>
        </form>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-900 mb-4 inline-flex items-center gap-2"><Shield size={16} className="text-blue-600" /> Existing Admins</h3>
        <div className="space-y-3">
          {owners.length === 0 && <p className="text-sm text-slate-400">No admins loaded.</p>}
          {owners.map((o) => (
            <div key={o.id} className="border border-slate-100 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                    {o.name}
                    {!!o.is_primary && <Badge>Primary</Badge>}
                  </p>
                  <p className="text-xs text-slate-400">{o.email}</p>
                </div>
                {!o.is_primary && (
                  <button onClick={() => remove(o.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                )}
              </div>
              {!o.is_primary && (
                <div className="flex flex-wrap gap-2">
                  {ALL_PERMS.map((p) => {
                    const on = (o.permissions || []).includes(p);
                    return (
                      <button key={p} disabled={busy === String(o.id)} onClick={() => setPerms(o.id, on ? (o.permissions || []).filter((x) => x !== p) : [...(o.permissions || []), p])}
                        className={`px-3 py-1.5 text-xs rounded-full border ${on ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-slate-600 border-slate-200"}`}>
                        {p.replace(/_/g, " ")}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
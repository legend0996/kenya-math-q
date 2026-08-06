
import { useEffect, useRef, useState } from "react";
import { BookOpen, Plus, Trash2, CheckCircle2, AlertCircle, ExternalLink, FileDown, Upload } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner } from "../../components/ui/Spinner";
import { apiUrl, authHeaders } from "../../utils/api";

const GRADES = ["Grade 7", "Grade 8", "Grade 9", "Form 1", "Form 2", "Form 3", "Form 4"];

type Material = {
  id: number;
  grade: string;
  title: string;
  description?: string | null;
  content_type: string;
  content?: string | null;
  created_at: string;
};

export default function MaterialsManager() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // add form
  const [grade, setGrade] = useState("Grade 7");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("link");
  const [content, setContent] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const uploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await fetch(apiUrl("/api/owner/materials/upload"), {
        method: "POST",
        headers: { Authorization: authHeaders().Authorization },
        body: fd,
      });
      const d = await res.json();
      if (d.success) {
        setContent(d.url);
        showFeedback("success", `Uploaded: ${d.original}`);
      } else {
        showFeedback("error", d.error || "Upload failed");
      }
    } catch {
      showFeedback("error", "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const load = () => {
    fetch(apiUrl("/api/owner/materials"), { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setMaterials(d.materials || []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setEditId(null); setGrade("Grade 7"); setTitle(""); setDescription(""); setContentType("link"); setContent("");
  };

  const startEdit = (m: Material) => {
    setEditId(m.id); setGrade(m.grade); setTitle(m.title); setDescription(m.description || "");
    setContentType(m.content_type); setContent(m.content || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    try {
      const body = { id: editId ?? undefined, grade, title: title.trim(), description: description.trim(), content_type: contentType, content: content.trim() };
      const res = await fetch(apiUrl("/api/owner/materials" + (editId ? `/${editId}` : "")), {
        method: "POST", headers: authHeaders(), body: JSON.stringify(body),
      });
      const d = await res.json();
      if (d.success) {
        showFeedback("success", editId ? "Material updated" : "Material added");
        resetForm();
        load();
      } else {
        showFeedback("error", d.error || "Failed to save");
      }
    } catch { showFeedback("error", "Failed to save"); }
    finally { setBusy(false); }
  };

  const remove = async (m: Material) => {
    if (!confirm(`Delete "${m.title}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl(`/api/owner/materials/${m.id}`), { method: "DELETE", headers: authHeaders() });
      const d = await res.json();
      if (d.success) { showFeedback("success", "Material removed"); setMaterials((p) => p.filter((x) => x.id !== m.id)); }
      else showFeedback("error", d.error || "Failed to delete");
    } catch { showFeedback("error", "Failed to delete"); }
    finally { setBusy(false); }
  };

  if (loading) return <PageSpinner message="Loading materials…" />;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
          <BookOpen size={18} className="text-emerald-600" /> {editId ? "Edit" : "Add"} Revision Material
        </h2>
        <p className="text-sm text-muted mb-4">
          Students see these on their dashboard under &quot;Study Materials&quot;, filtered by their class/form.
        </p>
        <form onSubmit={save} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Grade / Form</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all">
                {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Type</label>
              <select value={contentType} onChange={(e) => setContentType(e.target.value)}
                className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all">
                <option value="link">Link (URL)</option>
                <option value="file">File (URL / PDF link)</option>
                <option value="text">Notes (typed below)</option>
                <option value="video">YouTube video (streamed)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Form 2 — Algebra revision notes"
              className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short summary"
              className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {contentType === "text"
                ? "Notes content"
                : contentType === "file"
                  ? "Upload a file (PDF / image / document)"
                  : contentType === "video"
                    ? "YouTube video URL or ID"
                    : "Link / file URL"}
            </label>
            {contentType === "text" ? (
              <textarea rows={5} value={content} onChange={(e) => setContent(e.target.value)}
                placeholder="Type the study notes here…"
                className="w-full px-4 py-3 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all resize-none" />
            ) : contentType === "file" ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 flex items-center gap-3 px-4 py-3 text-sm bg-surface border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary-dark transition-colors">
                  <Upload size={16} className="text-primary shrink-0" />
                  <span className="flex items-center gap-1.5">
                    {content ? <><CheckCircle2 size={14} className="text-emerald-600 shrink-0" /><span className="truncate">{content}</span></> : <>{uploading ? "Uploading…" : "Choose a file from your computer"}</>}
                  </span>
                  <input
                    ref={fileRef}
                    type="file"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
                  />
                </label>
                {content && (
                  <Button type="button" variant="outline" onClick={() => setContent("")}>Remove file</Button>
                )}
              </div>
            ) : (
              <div>
                <input value={content} onChange={(e) => setContent(e.target.value)}
                  placeholder={contentType === "video" ? "e.g. https://www.youtube.com/watch?v=VIDEO_ID" : contentType === "file" ? "https://your-host/uploads/notes.pdf" : "https://example.com/resource"}
                  className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all" />
                {contentType === "video" && content.trim() && (
                  <p className="text-xs text-muted mt-1.5">
                    Students will stream this video right from YouTube on their dashboard.
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" loading={busy} icon={editId ? <CheckCircle2 size={15} /> : <Plus size={15} />}>
              {editId ? "Update Material" : "Add Material"}
            </Button>
            {editId && <Button type="button" variant="ghost" onClick={resetForm}>Cancel</Button>}
          </div>
        </form>
      </Card>

      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      <Card padding="none">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">All Materials</h2>
          <Badge variant="default">{materials.length} total</Badge>
        </div>
        {materials.length === 0 ? (
          <div className="text-center py-12 text-muted">
            <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
            <p>No revision materials yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {materials.map((m) => (
              <div key={m.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900">{m.title}</p>
                    <Badge variant="info">{m.grade}</Badge>
                    <Badge variant="default">
                      {m.content_type === "link" ? "Link" : m.content_type === "file" ? "File" : m.content_type === "video" ? "Video" : "Notes"}
                    </Badge>
                  </div>
                  {m.description && <p className="text-sm text-muted mt-0.5">{m.description}</p>}
                  {m.content_type === "text" && m.content && (
                    <p className="text-xs text-muted mt-1 bg-surface rounded-lg p-2 whitespace-pre-wrap line-clamp-2">{m.content}</p>
                  )}
                  {m.content_type !== "text" && m.content && (
                    <a href={m.content} target="_blank" rel="noopener noreferrer"
                      className="text-xs text-primary-dark font-semibold inline-flex items-center gap-1 mt-1">
                      {m.content_type === "link" ? "Open link" : "View file"} <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" icon={<FileDown size={14} />} onClick={() => startEdit(m)}>Edit</Button>
                  <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => remove(m)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
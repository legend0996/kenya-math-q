
import { useEffect, useRef, useState } from "react";
import { apiUrl, authHeaders } from "../../utils/api";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { PageSpinner, Spinner } from "../../components/ui/Spinner";
import {
  UploadCloud, Trash2, Lock, CheckCircle2, AlertCircle, Download,
  Type, Square, Minus, ImagePlus, Undo2, Redo2, MousePointer2, FileText, X,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// Publisher-like design elements (normalized 0..1 coordinates)
// ────────────────────────────────────────────────────────────────────────────
export type DesignElement = {
  id: string;
  type: "text" | "image" | "rect" | "line";
  x: number;
  y: number;
  w: number;
  h: number;
  text?: string;
  fontSize?: number;   // design units (595 = full page height)
  color?: string;
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  align?: "left" | "center" | "right";
  url?: string;
  fill?: string;
  borderColor?: string;
  borderWidth?: number;
  radius?: number;
  lineWidth?: number;
};

type Template = {
  title: string;
  subtitle: string;
  bg_color: string;
  text_color: string;
  accent_color: string;
  elements: DesignElement[];
  published: boolean;
};

type Participant = {
  id: number;
  full_name: string;
  school: string;
  grade: string;
  score: number | null;
  payment_status: string;
};

type CertRow = {
  id: number;
  full_name: string;
  source: string;
  is_visible: number;
  file_url: string;
  notes: string | null;
  created_at: string;
};

const FONTS = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Impact"];
const TOKENS = ["{name}", "{school}", "{contest}", "{year}", "{score}", "{grade}", "{date}", "{contest_number}"];

const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `e_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;

// design px → container-height % (1cqh = 1% of canvas height, 595 design units tall)
const cqh = (v: number) => `calc(${v} * 1cqh / 5.95)`;

const DEFAULT_BG = "#ffffff";
const DEFAULT_TEXT = "#0f172a";
const DEFAULT_ACCENT = "#2563eb";

const defaultElements = (t?: Template): DesignElement[] => {
  const text = t?.text_color || DEFAULT_TEXT;
  const accent = t?.accent_color || DEFAULT_ACCENT;
  const bg = t?.bg_color || DEFAULT_BG;
  return [
    { id: uid(), type: "rect", x: 0.014, y: 0.014, w: 0.972, h: 0.972, fill: bg, borderColor: accent, borderWidth: 3, radius: 0 },
    { id: uid(), type: "rect", x: 0.026, y: 0.026, w: 0.948, h: 0.948, fill: "transparent", borderColor: accent, borderWidth: 1, radius: 0 },
    { id: uid(), type: "text", x: 0.1, y: 0.055, w: 0.8, h: 0.07, text: t?.subtitle || "KENYA MATH QUEST", fontSize: 18, color: text, fontFamily: "Arial", bold: true, italic: false, align: "center" },
    { id: uid(), type: "text", x: 0.1, y: 0.13, w: 0.8, h: 0.1, text: t?.title || "Certificate of Achievement", fontSize: 36, color: accent, fontFamily: "Times New Roman", bold: true, italic: false, align: "center" },
    { id: uid(), type: "text", x: 0.1, y: 0.27, w: 0.8, h: 0.06, text: "This is to certify that", fontSize: 16, color: text, fontFamily: "Arial", bold: false, italic: false, align: "center" },
    { id: uid(), type: "text", x: 0.1, y: 0.33, w: 0.8, h: 0.1, text: "{name}", fontSize: 36, color: accent, fontFamily: "Times New Roman", bold: true, italic: false, align: "center" },
    { id: uid(), type: "text", x: 0.1, y: 0.44, w: 0.8, h: 0.06, text: "from {school}", fontSize: 16, color: text, fontFamily: "Arial", bold: false, italic: false, align: "center" },
    { id: uid(), type: "text", x: 0.1, y: 0.5, w: 0.8, h: 0.07, text: "has successfully participated in {contest} ({year})", fontSize: 15, color: text, fontFamily: "Arial", bold: false, italic: false, align: "center" },
    { id: uid(), type: "text", x: 0.1, y: 0.58, w: 0.8, h: 0.06, text: "Score: {score}  |  Grade: {grade}", fontSize: 15, color: text, fontFamily: "Arial", bold: false, italic: false, align: "center" },
    { id: uid(), type: "text", x: 0.1, y: 0.93, w: 0.8, h: 0.04, text: "Contest No. {contest_number}  •  {date}", fontSize: 10, color: "#64748b", fontFamily: "Arial", bold: false, italic: false, align: "center" },
  ];
};

const migrateTemplate = (t: Template): Template => {
  const els = (t.elements || []).map((e) => ({ ...e, id: e.id || uid() }));
  const hasDesign = els.some((e) => e.type === "text" || e.type === "rect" || e.type === "line");
  if (hasDesign) return { ...t, elements: els };
  // Legacy slot-based template → migrate images into a full design
  const images = els.map((e) => ({ ...e, id: uid(), type: "image" as const }));
  return { ...t, elements: [...defaultElements(t), ...images] };
};

const SAMPLE_NAME = "JOHN KAMAU";
const SAMPLE_SCHOOL = "Nairobi Academy";

export default function CertificateManager() {
  const [contests, setContests] = useState<{ id: number; name: string; year?: number }[]>([]);
  const [contestId, setContestId] = useState<number | null>(null);
  const [template, setTemplate] = useState<Template>({
    title: "Certificate of Achievement", subtitle: "KENYA MATH QUEST",
    bg_color: DEFAULT_BG, text_color: DEFAULT_TEXT, accent_color: DEFAULT_ACCENT,
    elements: defaultElements(), published: false,
  });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"image" | "manual" | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // undo / redo
  const historyRef = useRef<DesignElement[][]>([]);
  const historyIndex = useRef(-1);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: "move" | "resize"; id: string; dx: number; dy: number; sx: number; sy: number } | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [manualStudent, setManualStudent] = useState<number | null>(null);
  const [manualNotes, setManualNotes] = useState("");
  const [manualFile, setManualFile] = useState<File | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const persist = async (els: DesignElement[]) => {
    if (!contestId) return;
    try {
      await fetch(apiUrl("/api/certificate/template/save"), {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ contest_id: contestId, ...template, elements: els }),
      });
    } catch { /* keep editing offline-friendly */ }
  };

  // push history snapshot + apply new elements + save
  const applyElements = (els: DesignElement[], record = true) => {
    setTemplate((t) => {
      const next = { ...t, elements: els };
      if (record) {
        historyRef.current = historyRef.current.slice(0, historyIndex.current + 1);
        historyRef.current.push(t.elements);
        if (historyRef.current.length > 60) historyRef.current.shift();
        historyIndex.current = historyRef.current.length - 1;
      }
      persist(next.elements);
      return next;
    });
  };

  const undo = () => {
    if (historyIndex.current <= 0) return;
    historyIndex.current -= 1;
    const prev = historyRef.current[historyIndex.current];
    setSelectedId(null);
    applyElements(prev, false);
  };

  const redo = () => {
    if (historyIndex.current >= historyRef.current.length - 1) return;
    historyIndex.current += 1;
    const next = historyRef.current[historyIndex.current];
    setSelectedId(null);
    applyElements(next, false);
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") { e.preventDefault(); redo(); return; }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !editingId) {
        e.preventDefault();
        const els = template.elements.filter((el) => el.id !== selectedId);
        setSelectedId(null);
        applyElements(els);
      }
      if (e.key === "Escape") { setSelectedId(null); setEditingId(null); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, editingId, template.elements]);

  useEffect(() => {
    fetch(apiUrl("/api/owner/contest/all"), { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => { if (d.success) setContests(d.contests || []); })
      .finally(() => setLoading(false));
  }, []);

  const loadContest = async (id: number) => {
    setContestId(id);
    setSelectedId(null);
    historyRef.current = [];
    historyIndex.current = -1;
    const r = await fetch(apiUrl(`/api/certificate/template?contest_id=${id}`), { headers: authHeaders() });
    const d = await r.json();
    if (d.success && d.template) {
      const migrated = migrateTemplate({
        title: d.template.title || "Certificate of Achievement",
        subtitle: d.template.subtitle || "KENYA MATH QUEST",
        bg_color: d.template.bg_color || DEFAULT_BG,
        text_color: d.template.text_color || DEFAULT_TEXT,
        accent_color: d.template.accent_color || DEFAULT_ACCENT,
        elements: d.template.elements || [],
        published: !!d.template.published,
      });
      setTemplate(migrated);
      historyRef.current = [migrated.elements];
      historyIndex.current = 0;
    } else {
      const fresh = { ...template, elements: defaultElements(), published: false };
      setTemplate(fresh);
      historyRef.current = [fresh.elements];
      historyIndex.current = 0;
    }
    loadParticipants(id);
    loadCerts(id);
  };

  const loadParticipants = async (id: number) => {
    const r = await fetch(apiUrl(`/api/owner/contest/${id}/participants`), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) setParticipants(d.participants || []);
  };

  const loadCerts = async (id: number) => {
    const r = await fetch(apiUrl(`/api/certificate/contest/${id}/list`), { headers: authHeaders() });
    const d = await r.json();
    if (d.success) setCerts(d.certificates || []);
  };

  const selected = template.elements.find((e) => e.id === selectedId) || null;

  const updateElement = (id: string, patch: Partial<DesignElement>, record = true) => {
    applyElements(template.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)), record);
  };

  // ── Add elements ──
  const addText = () => {
    const el: DesignElement = { id: uid(), type: "text", x: 0.3, y: 0.3, w: 0.4, h: 0.08, text: "New text", fontSize: 24, color: "#0f172a", fontFamily: "Arial", bold: false, italic: false, align: "center" };
    applyElements([...template.elements, el]);
    setSelectedId(el.id);
  };

  const addRect = () => {
    const el: DesignElement = { id: uid(), type: "rect", x: 0.25, y: 0.25, w: 0.5, h: 0.3, fill: "transparent", borderColor: "#2563eb", borderWidth: 2, radius: 0 };
    applyElements([...template.elements, el]);
    setSelectedId(el.id);
  };

  const addLine = () => {
    const el: DesignElement = { id: uid(), type: "line", x: 0.25, y: 0.5, w: 0.5, h: 0, color: "#0f172a", lineWidth: 2 };
    applyElements([...template.elements, el]);
    setSelectedId(el.id);
  };

  const addImage = async (file: File) => {
    setUploading("image");
    const fd = new FormData();
    fd.append("image", file);
    try {
      const r = await fetch(apiUrl("/api/certificate/image"), {
        method: "POST", body: fd,
      });
      const d = await r.json();
      if (!d.success) { showFeedback("error", d.error || "Upload failed"); return; }
      const img = new Image();
      img.src = apiUrl(d.url);
      await new Promise((res) => { img.onload = res; img.onerror = res; });
      const ratio = (img.naturalWidth / img.naturalHeight) || 1;
      let w = 0.2, h = 0.2 / ratio;
      if (h > 0.18) { h = 0.18; w = h * ratio; }
      const el: DesignElement = { id: uid(), type: "image", url: d.url, x: 0.4 - w / 2, y: 0.4, w, h };
      applyElements([...template.elements, el]);
      setSelectedId(el.id);
      showFeedback("success", "Image added");
    } catch { showFeedback("error", "Upload failed"); }
    finally { setUploading(null); }
  };

  // ── Drag / resize on canvas ──
  const onPointerDown = (e: React.PointerEvent, id: string, mode: "move" | "resize") => {
    e.stopPropagation();
    setSelectedId(id);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const el = template.elements.find((x) => x.id === id);
    if (!el) return;
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    if (mode === "resize") dragRef.current = { mode, id, dx: 0, dy: 0, sx: px, sy: py };
    else dragRef.current = { mode, id, dx: px - el.x, dy: py - el.y, sx: 0, sy: 0 };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTemplate((t) => ({
      ...t,
      elements: t.elements.map((el) => {
        if (el.id !== drag.id) return el;
        if (drag.mode === "move") {
          return { ...el, x: Math.min(0.99, Math.max(0, px - drag.dx)), y: Math.min(0.99, Math.max(0, py - drag.dy)) };
        }
        const w = Math.max(0.02, px - el.x);
        const h = Math.max(0.02, py - el.y);
        return { ...el, w, h };
      }),
    }));
  };

  const endDrag = () => {
    if (dragRef.current) {
      persist(template.elements);
      dragRef.current = null;
    }
  };

  // ── Text inline editing ──
  const beginEdit = (id: string) => {
    setEditingId(id);
  };
  const commitEdit = (id: string, text: string) => {
    setEditingId(null);
    if (selectedId === id) updateElement(id, { text });
  };

  // ── Publish / generate ──
  const publish = async () => {
    if (!contestId) return;
    setSaving(true);
    try {
      const r = await fetch(apiUrl("/api/certificate/template/publish"), {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ contest_id: contestId }),
      });
      const d = await r.json();
      if (d.success) { setTemplate((t) => ({ ...t, published: true })); showFeedback("success", "Template published"); }
      else showFeedback("error", d.error || "Failed to publish");
    } finally { setSaving(false); }
  };

  const generate = async () => {
    if (!contestId) return;
    setGenerating(true);
    try {
      const r = await fetch(apiUrl("/api/certificate/generate"), {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ contest_id: contestId }),
      });
      const d = await r.json();
      if (d.success) { showFeedback("success", `Generated ${d.total} certificate(s).`); loadCerts(contestId); }
      else showFeedback("error", d.message || d.error || "Failed to generate");
    } catch { showFeedback("error", "Failed to generate"); }
    finally { setGenerating(false); }
  };

  // ── Manual upload + allocate ──
  const allocateManual = async () => {
    if (!contestId || !manualStudent || !manualFile) { showFeedback("error", "Select a student and a file"); return; }
    setUploading("manual");
    const fd = new FormData();
    fd.append("file", manualFile);
    fd.append("student_id", String(manualStudent));
    fd.append("contest_id", String(contestId));
    if (manualNotes) fd.append("notes", manualNotes);
    try {
      const r = await fetch(apiUrl("/api/certificate/manual"), {
        method: "POST", body: fd,
      });
      const d = await r.json();
      if (d.success) { showFeedback("success", "Certificate allocated to student"); setManualFile(null); setManualNotes(""); loadCerts(contestId); }
      else showFeedback("error", d.error || "Upload failed");
    } catch { showFeedback("error", "Upload failed"); }
    finally { setUploading("manual" as never); setUploading(null); }
  };

  const deleteCert = async (id: number) => {
    const r = await fetch(apiUrl(`/api/certificate/${id}`), { method: "DELETE", headers: authHeaders() });
    const d = await r.json();
    if (d.success) { showFeedback("success", "Certificate deleted"); loadCerts(contestId!); }
    else showFeedback("error", d.error || "Delete failed");
  };

  const resetLayout = () => {
    applyElements(defaultElements(template));
    setSelectedId(null);
  };

  if (loading) return <PageSpinner message="Loading contests…" />;

  const previewValue = (el: DesignElement) => {
    switch (el.type) {
      case "text": return el.text?.replace(/\{name\}/g, SAMPLE_NAME).replace(/\{school\}/g, SAMPLE_SCHOOL)
        .replace(/\{contest\}/g, "Kenya Math Quest").replace(/\{year\}/g, "2026")
        .replace(/\{score\}/g, "82").replace(/\{grade\}/g, "Distinction")
        .replace(/\{date\}/g, new Date().toDateString()).replace(/\{contest_number\}/g, "001") || "";
      case "image": return null;
      case "rect": return null;
      case "line": return null;
    }
  };

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
          feedback.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
          : "bg-red-50 border border-red-200 text-red-700"}`}>
          {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {feedback.msg}
        </div>
      )}

      {/* Contest selector */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold text-slate-900">1 · Select Contest</h2>
          {contestId && (template.published
            ? <Badge variant="success" dot>Published</Badge>
            : <Badge variant="warning">Draft</Badge>)}
        </div>
        <select
          value={contestId || ""}
          onChange={(e) => e.target.value && loadContest(Number(e.target.value))}
          className="mt-3 w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark focus:ring-2 focus:ring-primary-light outline-none transition-all"
        >
          <option value="">-- Select Contest --</option>
          {contests.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
          ))}
        </select>
      </Card>

      {contestId && (
        <>
          {/* 2 · Designer */}
          <Card padding="none">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-primary-dark" /> 2 · Design Certificate
                {template.published ? <Badge variant="success" dot>In Use</Badge> : <Badge variant="warning">Draft</Badge>}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={undo} icon={<Undo2 size={14} />}>Undo</Button>
                <Button size="sm" variant="outline" onClick={redo} icon={<Redo2 size={14} />}>Redo</Button>
                <Button size="sm" variant="outline" onClick={resetLayout}>Reset Layout</Button>
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-muted">Zoom</span>
                  <input type="range" min={0.5} max={1.5} step={0.1} value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))} className="w-24 accent-primary-dark" />
                </div>
                {!template.published ? (
                  <Button size="sm" loading={saving} icon={<Lock size={14} />} onClick={publish}>Publish</Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={generate} loading={generating} icon={<Download size={14} />}>Regenerate</Button>
                )}
              </div>
            </div>

            <div className="grid xl:grid-cols-[220px_1fr_260px]">
              {/* Toolbar */}
              <div className="p-4 border-b xl:border-b-0 xl:border-r border-slate-100 space-y-2">
                <p className="text-xs font-bold text-muted uppercase tracking-wide mb-3">Add Element</p>
                <button onClick={addText} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-surface hover:bg-primary-light hover:text-primary-dark transition-colors">
                  <Type size={15} /> Text
                </button>
                <button onClick={() => imageInputRef.current?.click()} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-surface hover:bg-primary-light hover:text-primary-dark transition-colors">
                  {uploading === "image" ? <Spinner size={15} /> : <ImagePlus size={15} />} Image
                </button>
                <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                  onChange={(e) => e.target.files?.[0] && addImage(e.target.files[0])} />
                <button onClick={addRect} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-surface hover:bg-primary-light hover:text-primary-dark transition-colors">
                  <Square size={15} /> Shape
                </button>
                <button onClick={addLine} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-surface hover:bg-primary-light hover:text-primary-dark transition-colors">
                  <Minus size={15} /> Line
                </button>

                <div className="border-t border-slate-100 pt-3 mt-3">
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Dynamic Tokens</p>
                  <p className="text-[11px] text-muted leading-relaxed">
                    Insert these in any text element. They are filled per-student at generation time.
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {TOKENS.map((t) => <code key={t} className="text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-foreground">{t}</code>)}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 mt-3">
                  <p className="text-xs font-bold text-muted uppercase tracking-wide mb-2">Page</p>
                  <label className="flex items-center justify-between text-sm text-foreground">
                    Background
                    <input type="color" value={template.bg_color}
                      onChange={(e) => setTemplate((t) => ({ ...t, bg_color: e.target.value }))}
                      className="h-7 w-12 rounded border border-border cursor-pointer" />
                  </label>
                </div>
              </div>

              {/* Canvas */}
              <div className="p-5 bg-slate-100/70 overflow-auto">
                <div className="mx-auto" style={{ width: `${zoom * 100}%`, maxWidth: 920 }}>
                  <div
                    ref={canvasRef}
                    className="relative w-full rounded-md shadow-xl bg-white select-none"
                    style={{
                      aspectRatio: "842/595",
                      containerType: "size",
                      background: template.bg_color,
                      touchAction: "none",
                    }}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerLeave={endDrag}
                    onClick={() => { if (!selectedId) return; }}
                  >
                    {template.elements.map((el) => {
                      const isSel = el.id === selectedId;
                      const common = {
                        style: {
                          left: `${el.x * 100}%`,
                          top: `${el.y * 100}%`,
                          width: `${el.w * 100}%`,
                          height: `${el.h * 100}%`,
                        } as React.CSSProperties,
                      };
                      if (el.type === "rect") {
                        return (
                          <div
                            key={el.id}
                            {...common}
                            onPointerDown={(e) => onPointerDown(e, el.id, "move")}
                            className={`absolute cursor-move rounded-sm ${isSel ? "ring-2 ring-primary" : ""}`}
                            style={{
                              ...common.style,
                              backgroundColor: el.fill === "transparent" ? "transparent" : el.fill || "transparent",
                              border: `${cqh(el.borderWidth || 1)} solid ${el.borderColor || "#000"}`,
                              borderRadius: cqh(el.radius || 0),
                            }}
                          />
                        );
                      }
                      if (el.type === "line") {
                        const len = Math.sqrt((el.w * 842) ** 2 + (el.h * 595) ** 2) / 842;
                        const ang = (Math.atan2(el.h * 595, el.w * 842) * 180) / Math.PI;
                        return (
                          <div
                            key={el.id}
                            {...common}
                            onPointerDown={(e) => onPointerDown(e, el.id, "move")}
                            className={`absolute cursor-move ${isSel ? "ring-2 ring-primary" : ""}`}
                            style={{
                              ...common.style,
                              height: 0,
                              borderTop: `${cqh(el.lineWidth || 2)} solid ${el.color || "#000"}`,
                              transform: `rotate(${ang}deg)`,
                              transformOrigin: "left top",
                              width: `${Math.max(0.01, len) * 100}%`,
                            }}
                          />
                        );
                      }
                      if (el.type === "image") {
                        return (
                          <div
                            key={el.id}
                            {...common}
                            onPointerDown={(e) => onPointerDown(e, el.id, "move")}
                            className={`absolute cursor-move ${isSel ? "ring-2 ring-primary" : ""}`}
                          >
                            <img src={apiUrl(el.url!)} alt="" draggable={false} className="w-full h-full object-contain" />
                          </div>
                        );
                      }
                      // text
                      return (
                        <div
                          key={el.id}
                          {...common}
                          onPointerDown={(e) => onPointerDown(e, el.id, "move")}
                          onDoubleClick={(e) => { e.stopPropagation(); beginEdit(el.id); }}
                          className={`absolute cursor-move ${isSel ? "ring-1 ring-primary" : ""}`}
                          style={{
                            ...common.style,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start",
                          }}
                        >
                          {editingId === el.id ? (
                            <textarea
                              autoFocus
                              defaultValue={el.text}
                              onBlur={(e) => commitEdit(el.id, e.target.value)}
                              onPointerDown={(e) => e.stopPropagation()}
                              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(el.id, (e.target as HTMLTextAreaElement).value); } }}
                              className="w-full h-full bg-transparent outline-none resize-none text-left leading-tight"
                              style={{ fontFamily: el.fontFamily, fontSize: cqh(el.fontSize || 16), color: el.color, fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? "italic" : "normal" }}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center whitespace-pre-wrap break-words leading-tight"
                              style={{ fontFamily: el.fontFamily, fontSize: cqh(el.fontSize || 16), color: el.color, fontWeight: el.bold ? 700 : 400, fontStyle: el.italic ? "italic" : "normal", textAlign: el.align || "left" }}
                            >
                              {previewValue(el)}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* selection resize handle */}
                    {selected && selected.type !== "line" && (
                      <div
                        onPointerDown={(e) => onPointerDown(e, selected.id, "resize")}
                        className="absolute w-3 h-3 bg-primary-dark rounded-full border-2 border-white cursor-nwse-resize z-10"
                        style={{ left: `calc(${selected.x * 100}% + ${selected.w * 100}% - 6px)`, top: `calc(${selected.y * 100}% + ${selected.h * 100}% - 6px)` }}
                      />
                    )}
                    {!template.elements.length && (
                      <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
                        Use the toolbar to add text, images, shapes and lines.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Properties panel */}
              <div className="p-4 border-t xl:border-t-0 xl:border-l border-slate-100">
                {!selected ? (
                  <div className="text-center text-muted text-sm py-10">
                    <MousePointer2 size={28} className="mx-auto mb-2" />
                    Select an element to edit its properties.<br />
                    Drag to move · handle to resize · double-click text to edit · Del to remove.
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground uppercase tracking-wide">{selected.type} · {selected.id.slice(0, 5)}</p>
                      <button onClick={() => { applyElements(template.elements.filter((el) => el.id !== selected.id)); setSelectedId(null); }}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><Trash2 size={15} /></button>
                    </div>

                    {selected.type === "text" && (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-muted mb-1 block">Text (tokens allowed)</label>
                          <textarea value={selected.text || ""} rows={3}
                            onChange={(e) => updateElement(selected.id, { text: e.target.value })}
                            className="w-full px-3 py-2 text-sm bg-white rounded-xl border border-border focus:border-primary-dark outline-none" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-semibold text-muted mb-1 block">Font size</label>
                            <input type="number" min={6} max={120} value={selected.fontSize || 16}
                              onChange={(e) => updateElement(selected.id, { fontSize: Number(e.target.value) })}
                              className="w-full px-2 py-1.5 text-sm bg-white rounded-lg border border-border outline-none" />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted mb-1 block">Font</label>
                            <select value={selected.fontFamily || "Arial"}
                              onChange={(e) => updateElement(selected.id, { fontFamily: e.target.value })}
                              className="w-full px-2 py-1.5 text-sm bg-white rounded-lg border border-border outline-none">
                              {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <label className="flex items-center gap-2 text-sm text-foreground">
                            <input type="checkbox" checked={!!selected.bold} onChange={(e) => updateElement(selected.id, { bold: e.target.checked })} /> Bold
                          </label>
                          <label className="flex items-center gap-2 text-sm text-foreground">
                            <input type="checkbox" checked={!!selected.italic} onChange={(e) => updateElement(selected.id, { italic: e.target.checked })} /> Italic
                          </label>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted mb-1 block">Color</label>
                          <input type="color" value={selected.color || "#000"} onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                            className="h-8 w-16 rounded border border-border cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted mb-1 block">Align</label>
                          <div className="flex gap-1">
                            {(["left", "center", "right"] as const).map((a) => (
                              <button key={a} onClick={() => updateElement(selected.id, { align: a })}
                                className={`px-3 py-1 text-xs rounded-lg capitalize ${selected.align === a ? "bg-primary-light text-primary-dark" : "bg-slate-100 text-foreground"}`}>{a}</button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {selected.type === "image" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img src={apiUrl(selected.url!)} alt="" className="w-16 h-16 object-contain bg-surface rounded-lg border border-border" />
                          <p className="text-xs text-muted break-all">{selected.url?.split("/").pop()}</p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted mb-1 block">Width (fraction)</label>
                          <input type="range" min={0.02} max={0.8} step={0.01} value={selected.w}
                            onChange={(e) => { const w = Number(e.target.value); updateElement(selected.id, { w, h: (selected.h || 0.1) }); }}
                            className="w-full accent-primary-dark" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted mb-1 block">Height (fraction)</label>
                          <input type="range" min={0.02} max={0.5} step={0.01} value={selected.h}
                            onChange={(e) => updateElement(selected.id, { h: Number(e.target.value) })}
                            className="w-full accent-primary-dark" />
                        </div>
                        <Button size="sm" variant="outline" onClick={() => { applyElements(template.elements.filter((el) => el.id !== selected.id)); setSelectedId(null); }}>
                          Remove image
                        </Button>
                      </div>
                    )}

                    {selected.type === "rect" && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-semibold text-muted mb-1 block">Fill</label>
                            <input type="color" value={selected.fill === "transparent" ? "#ffffff" : selected.fill || "#ffffff"}
                              onChange={(e) => updateElement(selected.id, { fill: e.target.value })}
                              className="h-8 w-14 rounded border border-border cursor-pointer" />
                            <label className="flex items-center gap-1.5 mt-1 text-xs text-muted">
                              <input type="checkbox" checked={selected.fill === "transparent"}
                                onChange={(e) => updateElement(selected.id, { fill: e.target.checked ? "transparent" : "#e2e8f0" })} /> Transparent
                            </label>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-muted mb-1 block">Border</label>
                            <input type="color" value={selected.borderColor || "#000"}
                              onChange={(e) => updateElement(selected.id, { borderColor: e.target.value })}
                              className="h-8 w-14 rounded border border-border cursor-pointer" />
                            <input type="number" min={0} max={12} value={selected.borderWidth || 1}
                              onChange={(e) => updateElement(selected.id, { borderWidth: Number(e.target.value) })}
                              className="mt-1 w-full px-2 py-1 text-sm bg-white rounded-lg border border-border outline-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted mb-1 block">Corner radius</label>
                          <input type="range" min={0} max={40} value={selected.radius || 0}
                            onChange={(e) => updateElement(selected.id, { radius: Number(e.target.value) })}
                            className="w-full accent-primary-dark" />
                        </div>
                      </>
                    )}

                    {selected.type === "line" && (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-muted mb-1 block">Color</label>
                          <input type="color" value={selected.color || "#000"}
                            onChange={(e) => updateElement(selected.id, { color: e.target.value })}
                            className="h-8 w-16 rounded border border-border cursor-pointer" />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-muted mb-1 block">Thickness</label>
                          <input type="number" min={1} max={10} value={selected.lineWidth || 2}
                            onChange={(e) => updateElement(selected.id, { lineWidth: Number(e.target.value) })}
                            className="w-full px-2 py-1 text-sm bg-white rounded-lg border border-border outline-none" />
                        </div>
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                      <div>
                        <label className="text-xs font-semibold text-muted block">X {Math.round(selected.x * 100)}%</label>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-muted block">Y {Math.round(selected.y * 100)}%</label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* 3 · Generate */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600" /> 3 · Generate Certificates
                </h2>
                <p className="text-sm text-muted mt-1">
                  Creates PDFs for all <span className="font-semibold text-foreground">paid</span> students using real scores and emails each their download password.
                  {!template.published && " Publish the template first."}
                </p>
              </div>
              <Button loading={generating} disabled={!template.published} icon={<Download size={15} />}
                className="bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100" onClick={generate}>
                Generate Certificates
              </Button>
            </div>
          </Card>

          {/* 4 · Manual upload + allocate */}
          <Card>
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <UploadCloud size={18} className="text-primary-dark" /> 4 · Upload a Certificate &amp; Allocate to a Student
            </h2>
            <div className="grid sm:grid-cols-[1fr_220px_auto] gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Student</label>
                <select value={manualStudent || ""}
                  onChange={(e) => setManualStudent(Number(e.target.value))}
                  className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-border focus:border-primary-dark outline-none">
                  <option value="">-- Select student --</option>
                  {participants.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name} · {p.grade} {p.score != null ? `(${p.score} pts)` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">PDF / Image</label>
                <label className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm rounded-xl border-2 border-dashed border-border cursor-pointer hover:border-primary-dark hover:bg-primary-light/40 transition-all">
                  {manualFile ? <CheckCircle2 size={15} className="text-emerald-600" /> : <UploadCloud size={15} className="text-muted" />}
                  <span className="text-xs text-muted truncate max-w-[140px]">{manualFile ? manualFile.name : "Choose file"}</span>
                  <input type="file" accept="application/pdf,image/png,image/jpeg" className="hidden"
                    onChange={(e) => setManualFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <div className="flex gap-2">
                <input placeholder="Notes (optional)" value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-40 px-3 py-2.5 text-sm bg-white rounded-xl border border-border outline-none" />
                <Button loading={uploading === "manual"} disabled={!manualStudent || !manualFile} onClick={allocateManual}>
                  Allocate
                </Button>
              </div>
            </div>

            {certs.length > 0 && (
              <div className="mt-5 divide-y divide-slate-50 border-t border-slate-100">
                {certs.map((c) => (
                  <div key={c.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary-light text-primary-dark text-xs font-bold flex items-center justify-center shrink-0">
                        {String(c.full_name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{c.full_name}</p>
                        <p className="text-xs text-muted">{c.source} · {new Date(c.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.is_visible === 1 ? <Badge variant="success" dot>Visible</Badge> : <Badge variant="warning">Hidden</Badge>}
                      <a href={apiUrl(c.file_url)} target="_blank" rel="noreferrer"
                        className="text-xs text-primary-dark hover:underline font-semibold">View</a>
                      <button onClick={() => deleteCert(c.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

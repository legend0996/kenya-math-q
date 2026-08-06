"use client";

import { useEffect, useRef, useState } from "react";
import { Pen, Pencil, Undo2, Trash2 } from "lucide-react";

export type Tool = "pen" | "pencil" | "redPen" | "eraser";

const TOOL_STYLES: Record<Tool, { color: string; width: number; label: string }> = {
  pen:     { color: "#1d4ed8", width: 3,   label: "Pen" },
  pencil:  { color: "#64748b", width: 2,   label: "Pencil" },
  redPen:  { color: "#dc2626", width: 3.5, label: "Red pen" },
  eraser:  { color: "#ffffff", width: 24,  label: "Eraser" },
};

interface Props {
  value?: string;
  onChange: (dataUrl: string) => void;
  height?: number;
}

export default function WorkingCanvas({ value, onChange, height = 240 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const undoRef = useRef<string[]>([]);
  const [tool, setTool] = useState<Tool>("pen");

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (value) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height);
      img.src = value;
    }
  }, [value]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const rect = c.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const pushUndo = () => {
    const c = canvasRef.current;
    if (c) undoRef.current.push(c.toDataURL());
  };

  const start = (e: React.PointerEvent) => {
    const c = canvasRef.current;
    if (!c) return;
    pushUndo();
    drawingRef.current = true;
    c.setPointerCapture(e.pointerId);
    const { x, y } = pos(e);
    c.getContext("2d")!.beginPath();
    c.getContext("2d")!.moveTo(x, y);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const c = canvasRef.current!;
    const { x, y } = pos(e);
    const ctx = c.getContext("2d")!;
    const s = TOOL_STYLES[tool];
    ctx.strokeStyle = s.color;
    ctx.lineWidth = s.width;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    drawingRef.current = false;
    onChange(canvasRef.current?.toDataURL("image/jpeg", 0.65) || "");
  };

  const undo = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const prev = undoRef.current.pop();
    if (prev) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        onChange(c.toDataURL("image/jpeg", 0.65));
      };
      img.src = prev;
    } else {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
      onChange(c.toDataURL("image/jpeg", 0.65));
    }
  };

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    pushUndo();
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
    onChange(c.toDataURL("image/jpeg", 0.65));
  };

  const tools: { k: Tool; icon: React.ReactNode }[] = [
    { k: "pen", icon: <Pen size={13} /> },
    { k: "pencil", icon: <Pencil size={13} /> },
    { k: "redPen", icon: <span className="inline-block w-3.5 h-3.5 rounded-full bg-red-600" /> },
    { k: "eraser", icon: <span className="inline-block w-3.5 h-3.5 rounded bg-slate-200 border border-border-dark" /> },
  ];

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border-b border-border flex-wrap">
        {tools.map((t) => (
          <button
            key={t.k}
            type="button"
            title={TOOL_STYLES[t.k].label}
            onClick={() => setTool(t.k)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
              tool === t.k ? "bg-primary-light text-primary-dark border border-primary-dark" : "bg-white border border-border text-foreground hover:bg-slate-100"
            }`}
          >
            {t.icon}
            <span>{TOOL_STYLES[t.k].label}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button type="button" onClick={undo} className="px-2.5 py-1.5 rounded-lg text-xs bg-white border border-border text-foreground hover:bg-slate-100 flex items-center gap-1">
          <Undo2 size={12} /> Undo
        </button>
        <button type="button" onClick={clear} className="px-2.5 py-1.5 rounded-lg text-xs bg-white border border-border text-red-500 hover:bg-red-50 flex items-center gap-1">
          <Trash2 size={12} /> Clear
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={height * 2}
        style={{ width: "100%", height, touchAction: "none", cursor: "crosshair" }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { Pen, Check, Trash2 } from "lucide-react";

type Action = "draw" | "tick" | "cross";

interface Cmd {
  type: Action;
  color: string;
  width: number;
  x?: number; y?: number;
  endX?: number; endY?: number;
}

// Toolbar that lets an admin draw over the student's working with a red pen,
// or stamp a ✓ / ✗ , while keeping the original drawing underneath.
export default function AnnotationCanvas({
  imageUrl,
  value,
  onChange,
  height = 320,
}: {
  imageUrl?: string | null;
  value?: string | null;
  onChange: (dataUrl: string) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const baseRef = useRef<string | null>(null);
  const cmdsRef = useRef<Cmd[]>([]);
  const drawingRef = useRef<Cmd | null>(null);
  const [action, setAction] = useState<Action>("draw");

  const redraw = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, c.width, c.height);
    if (baseRef.current) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, c.width, c.height);
        for (const cmd of cmdsRef.current) paint(ctx, cmd);
        onChange(c.toDataURL("image/jpeg", 0.7));
      };
      img.src = baseRef.current;
    } else {
      for (const cmd of cmdsRef.current) paint(ctx, cmd);
      onChange(c.toDataURL("image/jpeg", 0.7));
    }
  };

  const paint = (ctx: CanvasRenderingContext2D, cmd: Cmd) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = cmd.color;
    ctx.lineWidth = cmd.width;
    if (cmd.type === "draw" && cmd.x != null && cmd.y != null && cmd.endX != null && cmd.endY != null) {
      ctx.beginPath();
      ctx.moveTo(cmd.x, cmd.y);
      ctx.lineTo(cmd.endX, cmd.endY);
      ctx.stroke();
    } else if (cmd.type === "tick" && cmd.x != null && cmd.y != null) {
      const s = 26;
      ctx.beginPath();
      ctx.moveTo(cmd.x - s, cmd.y);
      ctx.lineTo(cmd.x - 6, cmd.y + s * 0.7);
      ctx.lineTo(cmd.x + s, cmd.y - s * 0.8);
      ctx.stroke();
    } else if (cmd.type === "cross" && cmd.x != null && cmd.y != null) {
      const s = 18;
      ctx.beginPath();
      ctx.moveTo(cmd.x - s, cmd.y - s);
      ctx.lineTo(cmd.x + s, cmd.y + s);
      ctx.moveTo(cmd.x + s, cmd.y - s);
      ctx.lineTo(cmd.x - s, cmd.y + s);
      ctx.stroke();
    }
  };

  useEffect(() => {
    baseRef.current = imageUrl || value || null;
    cmdsRef.current = [];
    redraw();
  }, [imageUrl]);

  const pos = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const start = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    if (action === "tick" || action === "cross") {
      const { x, y } = pos(e);
      cmdsRef.current.push({ type: action, color: "#dc2626", width: 5, x, y });
      redraw();
      return;
    }
    const { x, y } = pos(e);
    drawingRef.current = { type: "draw", color: "#dc2626", width: 4.5, x, y, endX: x, endY: y };
    c.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent) => {
    if (!drawingRef.current) return;
    const { x, y } = pos(e);
    drawingRef.current.endX = x;
    drawingRef.current.endY = y;
    redraw();
  };

  const end = () => {
    if (drawingRef.current && drawingRef.current.endX != null) {
      cmdsRef.current.push(drawingRef.current);
    }
    drawingRef.current = null;
    redraw();
  };

  const clearAnnotations = () => {
    cmdsRef.current = [];
    redraw();
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-white">
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 border-b border-border flex-wrap">
        <button type="button" onClick={() => setAction("draw")}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${action === "draw" ? "bg-red-600 text-white" : "bg-white border border-border text-foreground hover:bg-slate-100"}`}>
          <Pen size={13} /> Red pen
        </button>
        <button type="button" onClick={() => setAction("tick")}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${action === "tick" ? "bg-emerald-600 text-white" : "bg-white border border-border text-emerald-600 hover:bg-slate-100"}`}>
          <Check size={13} /> Tick
        </button>
        <button type="button" onClick={() => setAction("cross")}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${action === "cross" ? "bg-red-600 text-white" : "bg-white border border-border text-red-600 hover:bg-slate-100"}`}>
          <XIcon /> Cross
        </button>
        <div className="flex-1" />
        <button type="button" onClick={clearAnnotations}
          className="px-2.5 py-1.5 rounded-lg text-xs bg-white border border-border text-red-500 hover:bg-red-50 flex items-center gap-1">
          <Trash2 size={12} /> Clear marks
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={height * 2}
        style={{ width: "100%", height, touchAction: "none", cursor: action === "draw" ? "crosshair" : "pointer" }}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
    </div>
  );
}

function XIcon(props: { size?: number }) {
  return (
    <svg width={props.size || 13} height={props.size || 13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M5 5l14 14M19 5l-14 14" />
    </svg>
  );
}
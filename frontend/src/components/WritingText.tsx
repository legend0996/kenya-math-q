"use client";

// A plain, in-house writing area shown under a question. Students type directly
// into expanding boxes. When they run out of room they can add another blank
// block ("Add more writing space"). The admin reserves the initial space via
// `working_space`.

interface Props {
  value: string[];
  onChange: (blocks: string[]) => void;
  height?: number;
  placeholder?: string;
}

export default function WritingText({ value, onChange, height = 240, placeholder = "Write your answer here…" }: Props) {
  const blocks = Array.isArray(value) ? value : [];
  const totalHeight = Math.max(height, blocks.length * 120 + (blocks.length ? 0 : 120));
  const eachHeight = Math.max(Math.floor(totalHeight / Math.max(blocks.length, 1)) - 8, 56);

  const update = (i: number, text: string) => {
    const next = blocks.slice();
    next[i] = text;
    onChange(next);
  };

  const addBlock = () => onChange([...blocks, ""]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="flex flex-col">
        {blocks.length === 0 && (
          <textarea
            value=""
            placeholder={placeholder}
            onChange={(e) => update(0, e.target.value)}
            className="w-full p-3 text-slate-800 outline-none resize-none bg-transparent"
            style={{ minHeight: Math.min(height, 360), height: height }}
          />
        )}
        {blocks.map((b, i) => (
          <textarea
            key={i}
            value={b}
            placeholder={i === 0 ? placeholder : "Continue…"}
            onChange={(e) => update(i, e.target.value)}
            className="w-full p-3 text-slate-800 outline-none resize-none bg-transparent border-b border-slate-100 last:border-b-0"
            style={{ minHeight: eachHeight }}
          />
        ))}
      </div>
      <div className="px-3 py-2 border-t border-slate-100">
        <button
          type="button"
          onClick={addBlock}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg px-3 py-1.5 transition-colors"
        >
          + Add more writing space
        </button>
      </div>
    </div>
  );
}
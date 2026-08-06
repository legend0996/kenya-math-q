"use client";

// Renders a student's working space: typed text blocks or a construction drawing.
export default function WorkingView({ value, label }: { value: string[] | string | null | undefined; label?: string }) {
  if (value == null) return <p className="text-sm text-charcoal-400 italic">No working space used</p>;

  if (Array.isArray(value)) {
    const blocks = value.filter((b) => typeof b === "string" && b.trim().length > 0);
    if (blocks.length === 0) return <p className="text-sm text-charcoal-400 italic">No working space used</p>;
    return (
      <div className="space-y-2">
        {blocks.map((b, i) => (
          <div key={i} className={`rounded-lg bg-white border border-border p-3 text-sm text-charcoal-500 whitespace-pre-wrap ${i > 0 ? "" : ""}`}>
            <p className="text-xs text-charcoal-400 select-none">{label ? `${label} ${i + 1}` : `Writing ${i + 1}`}</p>
            {b}
          </div>
        ))}
      </div>
    );
  }

  // construction drawing / legacy image
  if (typeof value === "string" && value.startsWith("data:")) {
    return <img src={value} alt="working" className="rounded-lg border border-border w-full" />;
  }
  return <p className="text-sm text-charcoal-500 whitespace-pre-wrap">{value}</p>;
}
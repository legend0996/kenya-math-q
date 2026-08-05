
import { useEffect, useState } from "react";
import { Play, GraduationCap, Loader2 } from "lucide-react";
import { apiUrl } from "../utils/api";
import { youTubeId } from "../utils/youtube";

type Video = { id: number; title: string; description?: string | null; content: string };

export default function Tuition() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(apiUrl("/api/contest/tuition/videos"))
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVideos(d.videos || []);
        else setError(d.error || "Could not load videos");
      })
      .catch(() => setError("Connection error. Please try again."));
  }, []);

  return (
    <main className="pt-16 min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <GraduationCap size={30} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Tuition &amp; Learning Videos</h1>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            Stream our hand-picked revision lessons directly from YouTube — pick a topic and start learning.
          </p>
        </div>

        {error && (
          <div className="max-w-xl mx-auto text-center bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {!videos && !error && (
          <div className="flex items-center justify-center gap-2 text-slate-400 py-16">
            <Loader2 size={18} className="animate-spin" /> Loading videos…
          </div>
        )}

        {videos && videos.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Play size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No tuition videos yet</p>
            <p className="text-sm mt-1">Check back soon — the administrator is adding new lessons.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {videos?.map((v) => {
            const vid = youTubeId(v.content);
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="aspect-video bg-slate-900">
                  {vid ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${vid}`}
                      title={v.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm">
                      Video unavailable
                    </div>
                  )}
                </div>
                <div className="p-5 flex-1">
                  <h3 className="font-bold text-slate-900 flex items-start gap-2">
                    <Play size={16} className="text-blue-600 mt-0.5 shrink-0" /> {v.title}
                  </h3>
                  {v.description && (
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{v.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

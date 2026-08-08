
import { useEffect, useState } from "react";
import { Play, GraduationCap, Loader2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageHero } from "../components/PageHero";
import { Button } from "../components/ui/Button";
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
    <main className="kmq-dashboard pt-[104px] min-h-screen bg-surface">
      <PageHero
        crumbs={[{ label: "Home", to: "/" }, { label: "Tuition" }]}
        eyebrow="Tuition & Learning"
        title="Revision videos from our tutors"
        description="Stream hand-picked mathematics lessons directly from YouTube — pick a topic and start learning."
      >
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link to="/materials">
            <Button size="lg">Browse Revision Materials <ArrowRight size={18} /></Button>
          </Link>
        </div>
      </PageHero>

      <section className="py-16 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center">
              <GraduationCap size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">All Lessons</h2>
              <p className="text-sm text-muted">Latest uploads from our tutors</p>
            </div>
          </div>

          {error && (
            <div className="max-w-xl mx-auto text-center bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {!videos && !error && (
            <div className="flex items-center justify-center gap-2 text-muted py-16">
              <Loader2 size={18} className="animate-spin" /> Loading videos…
            </div>
          )}

          {videos && videos.length === 0 && (
            <div className="text-center py-16 text-muted">
              <Play size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tuition videos yet</p>
              <p className="text-sm mt-1">Check back soon — the administrator is adding new lessons.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {videos?.map((v) => {
              const vid = youTubeId(v.content);
              return (
                <div key={v.id} className="bg-white rounded-2xl border border-border shadow-soft overflow-hidden hover:shadow-lifted transition-shadow flex flex-col">
                  <div className="aspect-video bg-charcoal-200">
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
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                        <Play size={18} className="mr-2" /> Video unavailable
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1">
                    <h3 className="font-bold text-foreground flex items-start gap-2">
                      <Play size={16} className="text-primary-dark mt-0.5 shrink-0" /> {v.title}
                    </h3>
                    {v.description && (
                      <p className="text-sm text-muted mt-1.5 leading-relaxed">{v.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

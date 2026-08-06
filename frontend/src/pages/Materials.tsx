import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Play, FileText, ExternalLink, ArrowRight, Lightbulb, Loader2, ClipboardList } from "lucide-react";
import { PageHero, SectionHeading } from "../components/PageHero";
import { Button } from "../components/ui/Button";
import { apiUrl } from "../utils/api";
import { youTubeId } from "../utils/youtube";

type Video = { id: number; title: string; description?: string | null; content: string };

const TOPICS = [
  "Number patterns & sequences",
  "Algebra — linear equations",
  "Geometry & mensuration",
  "Fractions, ratios & proportions",
  "Statistics & data handling",
  "Past-paper problem solving",
];

const TIPS = [
  { icon: <ClipboardList size={20} />, title: "Practice daily", desc: "Thirty focused minutes a day beats one long cramming session." },
  { icon: <Lightbulb size={20} />, title: "Show your working", desc: "Write down every step — the habit builds accuracy and speed." },
  { icon: <FileText size={20} />, title: "Do past papers", desc: "Familiarise yourself with the question styles and time pressure." },
  { icon: <BookOpen size={20} />, title: "Review mistakes", desc: "Learn more from wrong answers than right ones — keep a log." },
];

export default function Materials() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(apiUrl("/api/contest/tuition/videos"))
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setVideos(d.videos || []);
        else setError(d.error || "Could not load revision videos");
      })
      .catch(() => setError("Connection error. Please try again."));
  }, []);

  return (
    <main className="kmq-dashboard pt-[104px]">
      <PageHero
        crumbs={[{ label: "Home", to: "/" }, { label: "Materials" }]}
        eyebrow="Revision Materials"
        title="Prepare with free revision resources"
        description="Stream tuition videos, follow topic guides and build a study routine that gets you competition-ready."
      >
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link to="/login">
            <Button size="lg">Get Full Study Materials <ArrowRight size={18} /></Button>
          </Link>
          <Link to="/tuition">
            <Button size="lg" variant="outline">Watch Tuition Videos</Button>
          </Link>
        </div>
      </PageHero>

      {/* Topics */}
      <section className="py-16 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="What to Revise"
            title="Core mathematics topics"
            description="The competition covers the full mathematics syllabus from Grade 7 to Form 4."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {TOPICS.map((t, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-5 flex items-center gap-4 shadow-soft">
                <div className="w-10 h-10 bg-pumpkin-spice-900/70 text-primary-dark rounded-lg flex items-center justify-center shrink-0">
                  <BookOpen size={18} />
                </div>
                <p className="font-semibold text-foreground">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Study tips */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Study Smart" title="Tips from top performers" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TIPS.map((t) => (
              <div key={t.title} className="bg-surface rounded-xl border border-border p-6">
                <div className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center mb-4">
                  {t.icon}
                </div>
                <h3 className="font-bold text-foreground">{t.title}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest lessons */}
      <section className="py-16 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Latest Lessons" title="Recent tuition videos" />
          {error && (
            <div className="max-w-xl mx-auto text-center bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}
          {!videos && !error && (
            <div className="flex items-center justify-center gap-2 text-muted py-16">
              <Loader2 size={18} className="animate-spin" /> Loading lessons…
            </div>
          )}
          {videos && videos.length === 0 && (
            <div className="text-center py-16 text-muted">
              <Play size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No tuition videos yet</p>
              <p className="text-sm mt-1">Check back soon — the administrator is adding new lessons.</p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos?.slice(0, 6).map((v) => {
              const vid = youTubeId(v.content);
              return (
                <div key={v.id} className="bg-white rounded-xl border border-border overflow-hidden shadow-soft hover:shadow-lifted transition-shadow flex flex-col">
                  <div className="aspect-video bg-charcoal-200 flex items-center justify-center">
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
                    <h3 className="font-bold text-foreground">{v.title}</h3>
                    {v.description && <p className="text-sm text-muted mt-1.5 leading-relaxed line-clamp-2">{v.description}</p>}
                    <Link to="/tuition" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-dark hover:text-primary transition-colors">
                      <ExternalLink size={13} /> Watch on Tuition page
                    </Link>
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

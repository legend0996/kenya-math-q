import Counter from "../components/Counter";
import Countdown from "../components/Countdown";
import Image from "../components/Image";
import { useEffect, useState } from "react";
import {
  ArrowRight, CheckCircle2, BookOpen, Award,
  Users, School, MapPin, Clock, Send,
  ChevronRight, Play,
} from "lucide-react";import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";
import { apiUrl } from "../utils/api";

const HOW_IT_WORKS = [
  { icon: <Users size={24} />,       step: "01", title: "Create Account",     desc: "Sign up as a student or school administrator in minutes." },
  { icon: <CheckCircle2 size={24} />, step: "02", title: "Register",           desc: "Enroll your students for the upcoming contest season." },
  { icon: <Award size={24} />,        step: "03", title: "Pay Entry Fee",       desc: "Secure your spot with a simple online payment." },
  { icon: <BookOpen size={24} />,     step: "04", title: "Attempt the Exam",    desc: "Sit the mathematics contest online within the contest window." },
  { icon: <Award size={24} />,        step: "05", title: "Get Certificate",     desc: "Download your participation or merit certificate instantly." },
];

type ContestInfo = { id?: number; name?: string; status: string; start_time?: string } | null;

export default function Home() {
  const [contest, setContest] = useState<ContestInfo>(null);
  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(apiUrl("/api/contest/current"))
      .then((r) => r.json())
      .then((d) => setContest(d.status ? d : { status: "none" }))
      .catch(() => setContest({ status: "none" }));
  }, []);

  const handleContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <main className="pt-[104px]">

      {/* ── HERO ── */}
      <section
        id="home"
        className="relative flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden bg-charcoal-200 text-white"
      >
        <div className="absolute inset-0 dot-pattern" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.jpeg"
              alt="Kenya Math Quest"
              width={110}
              height={110}
              className="rounded-full shadow-lifted border-4 border-white/10"
            />
          </div>

          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full text-sm font-medium mb-8 border border-white/15">
            <span className="w-2 h-2 rounded-full bg-cool-sky-400 pulse-dot" />
            2026 Competition Season Now Open
          </span>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
            Kenya Math
            <br />
            <span className="text-pumpkin-spice-600">Quest</span>
          </h1>

          <p className="text-xl md:text-2xl mb-3 font-semibold text-slate-200">
            Challenge the Numbers, Change the Nation
          </p>

          <p className="max-w-xl mx-auto text-base md:text-lg text-slate-500 mb-10 leading-relaxed">
            A national mathematics competition empowering students from Grade 7
            to Form 4 to sharpen problem-solving and critical thinking skills.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="/register">
              <Button size="lg" variant="light">
                Get Started <ArrowRight size={18} />
              </Button>
            </a>
            <a href="/#contest">
              <Button size="lg" variant="ghost" className="border border-white/20 text-white hover:bg-white/10">
                View Contest <ChevronRight size={18} />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Our Impact</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-14">
            Shaping the Next Generation
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { value: 10000, label: "Students Participated", icon: <Users size={28} />,   suffix: "+" },
              { value: 113,   label: "Schools Involved",       icon: <School size={28} />,  suffix: "+" },
              { value: 47,    label: "Counties Reached",        icon: <MapPin size={28} />,  suffix: "" },
            ].map((item, i) => (
              <div key={i}
                className="bg-white rounded-2xl p-8 shadow-soft border border-border hover:shadow-lifted hover:border-border-dark transition-all group">
                <div className="w-14 h-14 bg-pumpkin-spice-900/70 text-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-primary group-hover:text-white transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-4xl font-bold text-primary-dark mb-2">
                  <Counter target={item.value} />{item.suffix}
                </h3>
                <p className="text-muted font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Process</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-14">
            How It Works
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-soft shadow-primary/25 group-hover:scale-105 group-hover:bg-primary-dark transition-all">
                  {item.icon}
                </div>
                <span className="block text-xs font-bold text-cool-sky-300 mb-1">{item.step}</span>
                <h3 className="font-bold text-foreground mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-muted leading-relaxed">{item.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(100%-8px)] w-4 text-border-dark">
                    <ChevronRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTEST ── */}
      <section id="contest" className="scroll-mt-32 py-20 px-4 bg-surface">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Current Contest</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10">
            Contest Status
          </h2>

          {!contest ? (
            <div className="bg-white rounded-2xl p-10 shadow-soft border border-border">
              <div className="skeleton h-6 w-32 mx-auto mb-4 rounded" />
              <div className="skeleton h-12 w-48 mx-auto rounded" />
            </div>
          ) : contest.status === "upcoming" ? (
            <div className="bg-white rounded-2xl p-10 shadow-soft border border-cool-sky-800">
              <Clock size={40} className="text-cool-sky-400 mx-auto mb-5" />
              <p className="text-muted mb-3 font-medium">Contest starts in</p>
              <p className="text-5xl font-bold text-cool-sky-300 mb-6">
                <Countdown targetDate={contest.start_time!} />
              </p>
              <a href="/register">
                <Button size="lg">Register Now <ArrowRight size={18} /></Button>
              </a>
            </div>
          ) : contest.status === "live" ? (
            <div className="bg-white rounded-2xl p-10 shadow-soft border border-emerald-300">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-emerald-500 pulse-dot" />
                <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Live Now</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">{contest.name}</h3>
              <p className="text-muted mb-6">The contest is currently in progress</p>
              <a href="/login"><Button size="lg">Join the Contest <ArrowRight size={18} /></Button></a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 shadow-soft border border-border">
              <p className="text-foreground text-lg">No active contest at the moment.</p>
              <p className="text-sm text-muted mt-2">Check back soon for the next competition.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── TUITION ── */}
      <section id="tuition" className="scroll-mt-32 py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="bg-primary-darker rounded-3xl p-10 md:p-14 text-center text-white overflow-hidden relative">
            <div className="absolute inset-0 dot-pattern" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Play size={24} className="text-pumpkin-spice-600" />
              </div>
              <p className="text-sm font-semibold text-pumpkin-spice-600 uppercase tracking-widest mb-3">Learn &amp; Revise</p>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Free Tuition Videos</h2>
              <p className="text-slate-400 mb-8 leading-relaxed max-w-xl mx-auto">
                Watch free mathematics lessons, topic breakdowns and past-paper solutions
                from our tutors to sharpen your skills before the contest.
              </p>
              <a href="/tuition">
                <Button size="lg" variant="light">
                  Watch Lessons <ArrowRight size={18} />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="scroll-mt-32 py-20 px-4 bg-surface">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Get In Touch</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Contact Us</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-card border border-border p-8">
            {sent ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={30} className="text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Message received</h3>
                <p className="text-muted mt-2 text-sm">We'll get back to you soon.</p>
                <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setContact({ name: "", email: "", message: "" }); }}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleContact} className="space-y-4">
                <Input label="Your Name" placeholder="John Kamau" required
                  value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
                <Input label="Email Address" type="email" placeholder="john@school.co.ke" required
                  value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
                <Textarea label="Message" rows={4} placeholder="How can we help you?" required
                  value={contact.message} onChange={(e) => setContact({ ...contact, message: e.target.value })} />
                <Button size="lg" fullWidth type="submit" icon={<Send size={16} />}>
                  Send Message
                </Button>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-muted mt-6">
            Prefer to chat? Use the support widget in the corner, or write to us via the{" "}
            <a href="/contact" className="font-semibold text-primary-dark hover:text-primary">contact page</a>.
          </p>
        </div>
      </section>
    </main>
  );
}

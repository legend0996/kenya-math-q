import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Clock, Trophy, Award, Users, FileQuestion, Calculator,
  BookOpen, CheckCircle2, ArrowRight, CalendarDays, Wallet,
} from "lucide-react";
import { PageHero, SectionHeading } from "../components/PageHero";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import Countdown from "../components/Countdown";
import { apiUrl } from "../utils/api";

type Contest = {
  id?: number;
  name?: string;
  year?: number;
  start_time?: string;
  status: string;
  entry_fee?: number | null;
};

const STEPS = [
  { icon: <Users size={24} />, title: "1 · Register", desc: "Create a free student account and register for the current contest round." },
  { icon: <Wallet size={24} />, title: "2 · Pay the entry fee", desc: "Secure your place via M-PESA STK push or a manual Lipa na M-PESA payment." },
  { icon: <FileQuestion size={24} />, title: "3 · Sit the exam", desc: "Answer randomised questions online within your grade's time window." },
  { icon: <Award size={24} />, title: "4 · Get recognised", desc: "Receive results, a national rank and a certificate for your performance." },
];

export default function Competition() {
  const [contest, setContest] = useState<Contest | null>(null);

  useEffect(() => {
    fetch(apiUrl("/api/contest/current"))
      .then((r) => r.json())
      .then((d) => setContest(d.status ? d : { status: "none" }))
      .catch(() => setContest({ status: "none" }));
  }, []);

  return (
    <main className="pt-[104px]">
      <PageHero
        crumbs={[{ label: "Home", to: "/" }, { label: "Competition" }]}
        eyebrow="The Competition"
        title="A national arena for mathematical excellence"
        description="Kenya Math Quest runs timed, randomised online papers for every grade from Grade 7 to Form 4. Compete individually, track your rank nationally, and earn certificates that celebrate your achievement."
      >
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link to="/register">
            <Button size="lg">Register for the Competition <ArrowRight size={18} /></Button>
          </Link>
          <Link to="/tuition">
            <Button size="lg" variant="outline">Watch Revision Lessons</Button>
          </Link>
        </div>
      </PageHero>

      {/* Current contest status */}
      <section className="py-16 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Current Round" title="Contest status" />
          {!contest ? (
            <div className="bg-white rounded-xl border border-border p-10 shadow-sm">
              <div className="skeleton h-6 w-32 mx-auto mb-4 rounded" />
              <div className="skeleton h-12 w-48 mx-auto rounded" />
            </div>
          ) : contest.status === "upcoming" ? (
            <div className="bg-white rounded-xl border border-pumpkin-spice-800 p-10 shadow-soft text-center">
              <div className="w-14 h-14 bg-pumpkin-spice-900/70 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <Clock size={26} className="text-primary-dark" />
              </div>
              <p className="text-muted mb-3 font-medium">The contest starts in</p>
              <p className="text-4xl md:text-5xl font-bold text-primary-dark tracking-tight mb-6">
                <Countdown targetDate={contest.start_time!} />
              </p>
              {contest.entry_fee != null && (
                <p className="text-sm text-muted mb-6">
                  Entry fee: <span className="font-bold text-foreground">KES {contest.entry_fee}</span>
                </p>
              )}
              <Link to="/register">
                <Button size="lg">Register Now <ArrowRight size={18} /></Button>
              </Link>
            </div>
          ) : contest.status === "live" ? (
            <div className="bg-white rounded-xl border border-emerald-200 p-10 shadow-sm text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-emerald-500 pulse-dot" />
                <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Live Now</span>
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">{contest.name}</h3>
              <p className="text-muted mb-6">The contest is currently in progress.</p>
              <Link to="/login">
                <Button size="lg">Join the Contest <ArrowRight size={18} /></Button>
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-border p-10 shadow-sm text-center">
              <Trophy size={40} className="text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-semibold text-foreground">No active contest at the moment</p>
              <p className="text-sm text-muted mt-2">Check back soon for the next round.</p>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="Process"
            title="How the competition works"
            description="Four simple steps take you from sign-up to certificate."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s, i) => (
              <div key={i} className="bg-surface rounded-xl border border-border p-6 hover:shadow-lifted transition-shadow">
                <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center mb-4">
                  {s.icon}
                </div>
                <h3 className="font-bold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Eligibility */}
      <section className="py-16 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Who Can Join" title="Eligibility" />
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: <BookOpen size={22} />, title: "Grade 7 – Form 4", desc: "Open to every learner in secondary school and upper primary." },
              { icon: <Users size={22} />, title: "All Kenyan schools", desc: "Public, private and international schools are all welcome to enrol." },
              { icon: <CalendarDays size={22} />, title: "Any county", desc: "Fully online — all you need is internet access on a phone, tablet or computer." },
            ].map((e, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-6 shadow-soft">
                <div className="w-11 h-11 bg-primary-light text-primary-dark rounded-xl flex items-center justify-center mb-4">
                  {e.icon}
                </div>
                <h3 className="font-bold text-foreground">{e.title}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Exam experience */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionHeading
                align="left"
                eyebrow="The Exam"
                title="A secure, fair exam experience"
                description="Every paper is built for fairness and integrity, so the ranking reflects real ability."
              />
              <ul className="space-y-4">
                {[
                  { icon: <FileQuestion size={20} />, text: "Questions are randomised per student with a resume-safe draft." },
                  { icon: <Calculator size={20} />, text: "An in-app calculator keeps your working in one place." },
                  { icon: <Clock size={20} />, text: "Server-enforced per-grade time limits with auto-submit." },
                  { icon: <CheckCircle2 size={20} />, text: "Anti-cheat protections: tab-switch detection and screenshot blocking." },
                  ].map((r, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-primary-light text-primary-dark rounded-lg flex items-center justify-center shrink-0">
                        {r.icon}
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed pt-1.5">{r.text}</p>
                    </li>
                  ))}
                </ul>
            </div>
            <div className="bg-charcoal-200 rounded-2xl p-10 text-white">
              <Badge variant="accent" className="mb-4">Recognition</Badge>
              <h3 className="text-2xl font-bold text-white">Prizes &amp; recognition</h3>
              <p className="text-slate-500 mt-3 leading-relaxed">
                Top performers are ranked on the national leaderboard, featured publicly and awarded certificates.
              </p>
              <ul className="mt-6 space-y-3">
                {["National leaderboard ranking", "Merit certificates by grade", "Recognition for your school"].map((p, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-400">
                    <CheckCircle2 size={16} className="text-cool-sky-400 shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Trophy size={36} className="mx-auto mb-5 text-primary" />
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Ready for the challenge?</h2>
          <p className="text-muted mt-3">Registration takes two minutes. Your national ranking is waiting.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link to="/register"><Button size="lg">Register Now <ArrowRight size={18} /></Button></Link>
            <Link to="/leaderboard"><Button size="lg" variant="outline">View the Leaderboard</Button></Link>
          </div>
        </div>
      </section>
    </main>
  );
}

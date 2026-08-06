import { Link } from "react-router-dom";
import {
  Target, Eye, ShieldCheck, GraduationCap, Users, School,
  Award, CheckCircle2, ArrowRight, MapPin,
} from "lucide-react";
import { PageHero, SectionHeading } from "../components/PageHero";
import { Button } from "../components/ui/Button";
import Counter from "../components/Counter";

const VALUES = [
  {
    icon: <Target size={22} />,
    title: "Excellence",
    desc: "We set a high bar for mathematical reasoning, problem-solving and critical thinking at every level.",
  },
  {
    icon: <Eye size={22} />,
    title: "Integrity",
    desc: "A fair, secure and transparent competition that rewards genuine ability, not shortcuts.",
  },
  {
    icon: <ShieldCheck size={22} />,
    title: "Equity",
    desc: "Any student, in any county, can compete on a level field — regardless of school or background.",
  },
  {
    icon: <GraduationCap size={22} />,
    title: "Growth",
    desc: "Beyond winning, every participant improves through revision materials and structured practice.",
  },
];

const TIMELINE = [
  { year: "2021", title: "The Idea", desc: "Kenya Math Quest is conceived as a national platform to discover and nurture mathematical talent." },
  { year: "2023", title: "First Contest", desc: "The inaugural online competition welcomes students from Grade 7 to Form 4 across Kenya." },
  { year: "2024", title: "Going National", desc: "Hundreds of schools and thousands of students register from every corner of the country." },
  { year: "Today", title: "Growing Every Term", desc: "New rounds, richer revision content and a growing community of young mathematicians." },
];

export default function About() {
  return (
    <main className="pt-[104px]">
      <PageHero
        crumbs={[{ label: "Home", to: "/" }, { label: "About" }]}
        eyebrow="About Us"
        title="Building Kenya's brightest mathematical minds"
        description="Kenya Math Quest is a national online mathematics competition that gives students from Grade 7 to Form 4 the chance to sharpen their problem-solving skills, compete fairly, and be recognised on a national stage."
      />

      {/* Stats */}
      <section className="py-16 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: 10000, suffix: "+", label: "Students participated", icon: <Users size={24} /> },
              { value: 113, suffix: "+", label: "Schools involved", icon: <School size={24} /> },
              { value: 47, suffix: "", label: "Counties reached", icon: <MapPin size={24} /> },
              { value: 3, suffix: "+", label: "Competition seasons", icon: <Award size={24} /> },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl border border-border p-6 text-center shadow-soft">
                <div className="w-12 h-12 bg-pumpkin-spice-900/70 text-primary-dark rounded-xl flex items-center justify-center mx-auto mb-4">
                  {s.icon}
                </div>
                <p className="text-3xl font-bold text-primary-dark tracking-tight">
                  <Counter target={s.value} />
                  {s.suffix}
                </p>
                <p className="text-sm text-muted mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <SectionHeading
            eyebrow="Our Mission"
            title="Challenge the numbers. Change the nation."
            description="We believe mathematics is the foundation of innovation. Our mission is to make competitive mathematics accessible to every student in Kenya — building confidence, discipline and a love for problem-solving that lasts a lifetime."
          />
          <div className="grid sm:grid-cols-3 gap-4 text-left">
            <div className="bg-surface rounded-xl border border-border p-6">
              <Users size={20} className="text-primary mb-3" />
              <p className="font-semibold text-foreground">For Students</p>
              <p className="text-sm text-muted mt-1.5">A fair, fun and challenging arena to test yourself against the best in the country.</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-6">
              <School size={20} className="text-primary mb-3" />
              <p className="font-semibold text-foreground">For Schools</p>
              <p className="text-sm text-muted mt-1.5">A simple way to enrol your students, track performance and celebrate achievement.</p>
            </div>
            <div className="bg-surface rounded-xl border border-border p-6">
              <GraduationCap size={20} className="text-primary mb-3" />
              <p className="font-semibold text-foreground">For Kenya</p>
              <p className="text-sm text-muted mt-1.5">A pipeline for national talent that feeds scholarships, olympiads and innovation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="What We Stand For" title="Our values" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {VALUES.map((v) => (
              <div key={v.title} className="bg-white rounded-xl border border-border p-6 shadow-soft hover:shadow-lifted hover:border-border-dark transition-shadow">
                <div className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center mb-4">
                  {v.icon}
                </div>
                <h3 className="font-bold text-foreground">{v.title}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Our Journey" title="How we got here" />
          <div className="space-y-0">
            {TIMELINE.map((t, i) => (
              <div key={i} className="relative pl-8 pb-8 border-l border-border last:pb-0">
                <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-primary ring-4 ring-pumpkin-spice-900/70" />
                <p className="text-xs font-bold text-primary-dark uppercase tracking-widest">{t.year}</p>
                <h3 className="font-bold text-foreground mt-1">{t.title}</h3>
                <p className="text-sm text-muted mt-1 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-charcoal-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <CheckCircle2 size={36} className="mx-auto mb-5 text-cool-sky-400" />
          <h2 className="text-3xl font-bold text-white tracking-tight">Ready to test your mathematics skills?</h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto">
            Join thousands of students competing for national recognition. Registration is simple — start today.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link to="/register">
              <Button size="lg" variant="light">Register Now <ArrowRight size={18} /></Button>
            </Link>
            <Link to="/competition">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 hover:text-white">Learn about the Competition</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

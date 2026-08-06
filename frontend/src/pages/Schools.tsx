import { Link } from "react-router-dom";
import {
  School, Users, GraduationCap, BarChart3, CheckCircle2,
  ArrowRight, Award, ClipboardCheck, FileQuestion,
} from "lucide-react";
import { PageHero, SectionHeading } from "../components/PageHero";
import { Button } from "../components/ui/Button";

const BENEFITS = [
  {
    icon: <Users size={22} />,
    title: "Enrol your students",
    desc: "Add students to your school account in seconds and register them for each contest round.",
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Track performance",
    desc: "See how your school performs per grade, per contest — with a clear overview dashboard.",
  },
  {
    icon: <Award size={22} />,
    title: "Celebrate achievement",
    desc: "Students earn national recognition and certificates that reflect well on your school.",
  },
  {
    icon: <GraduationCap size={22} />,
    title: "Support your teachers",
    desc: "Structured revision materials and past papers give your teachers ready-made practice sets.",
  },
];

const STEPS = [
  { icon: <ClipboardCheck size={22} />, title: "Register your school", desc: "Sign up with your school details. Our team approves your account." },
  { icon: <Users size={22} />, title: "Add your students", desc: "Enrol students and confirm their grades so they can register for contests." },
  { icon: <FileQuestion size={22} />, title: "Let them compete", desc: "Students register, pay and sit the exam — everything runs online." },
  { icon: <Award size={22} />, title: "Track results", desc: "Follow results and certificates from your school dashboard." },
];

export default function Schools() {
  return (
    <main className="pt-[104px]">
      <PageHero
        crumbs={[{ label: "Home", to: "/" }, { label: "Schools" }]}
        eyebrow="For Schools"
        title="Bring national competition to your school"
        description="Kenya Math Quest makes it easy for schools of any size to participate in a national mathematics competition — no invigilation, printing or logistics required."
      >
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link to="/register?role=school">
            <Button size="lg">Register Your School <ArrowRight size={18} /></Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline">Talk to Us</Button>
          </Link>
        </div>
      </PageHero>

      {/* Benefits */}
      <section className="py-16 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <SectionHeading
            eyebrow="Why Participate"
            title="Benefits for your school"
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-white rounded-xl border border-border p-6 shadow-soft hover:shadow-lifted transition-shadow">
                <div className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center mb-4">
                  {b.icon}
                </div>
                <h3 className="font-bold text-foreground">{b.title}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <SectionHeading eyebrow="Getting Started" title="How it works for schools" />
          <div className="space-y-0">
            {STEPS.map((s, i) => (
              <div key={i} className="relative pl-8 pb-8 border-l border-border last:pb-0">
                <div className="absolute left-0 top-1 w-10 h-10 bg-primary text-white rounded-lg flex items-center justify-center -ml-5 ring-4 ring-pumpkin-spice-900/70">
                  {s.icon}
                </div>
                <h3 className="font-bold text-foreground pt-1">{s.title}</h3>
                <p className="text-sm text-muted mt-1 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16 bg-charcoal-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { value: "113+", label: "Schools participating" },
              { value: "10,000+", label: "Students competing" },
              { value: "47", label: "Counties represented" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-white/5 border border-white/10 p-8">
                <p className="text-4xl font-bold text-pumpkin-spice-600 tracking-tight">{s.value}</p>
                <p className="text-slate-500 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <School size={36} className="mx-auto mb-5 text-primary" />
          <h2 className="text-3xl font-bold text-foreground tracking-tight">Give your students a national stage</h2>
          <p className="text-muted mt-3">Registration is quick and your school account is free to create.</p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-6 text-sm text-slate-600">
            {["Free school account", "No invigilation needed", "Instant results"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-primary" /> {t}
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link to="/register?role=school">
              <Button size="lg">Register Your School <ArrowRight size={18} /></Button>
            </Link>
            <Link to="/faq">
              <Button size="lg" variant="outline">Read the FAQs</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

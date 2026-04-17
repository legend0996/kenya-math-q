"use client";

import Counter from "../components/Counter";
import Countdown from "../components/Countdown";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight, CheckCircle2, BookOpen, Award,
  Users, School, MapPin, Clock, Mail, MessageSquare, Send,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/Button";

const HOW_IT_WORKS = [
  { icon: <Users size={24} />,       step: "01", title: "Create Account",     desc: "Sign up as a student or school administrator in minutes." },
  { icon: <CheckCircle2 size={24} />, step: "02", title: "Register",           desc: "Enroll your students for the upcoming contest season." },
  { icon: <Award size={24} />,        step: "03", title: "Pay Entry Fee",       desc: "Secure your spot with a simple online payment." },
  { icon: <BookOpen size={24} />,     step: "04", title: "Attempt the Exam",    desc: "Sit the mathematics contest online within the contest window." },
  { icon: <Award size={24} />,        step: "05", title: "Get Certificate",     desc: "Download your participation or merit certificate instantly." },
];

export default function Home() {
  const [contest, setContest] = useState<any>(null);
  const [contact, setContact] = useState({ name: "", email: "", message: "" });

  useEffect(() => {
    fetch(apiUrl("/api/contest/current"))
      .then((r) => r.json())
      .then((d) => setContest(d.status ? d : { status: "none" }))
      .catch(() => setContest({ status: "none" }));
  }, []);

  return (
    <main className="pt-16">

      {/* ── HERO ── */}
      <section
        id="home"
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden
          bg-linear-to-br from-blue-700 via-blue-800 to-indigo-900 text-white"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "40px 40px" }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.jpeg"
              alt="Kenya Math Quest"
              width={110}
              height={110}
              className="rounded-full shadow-2xl shadow-blue-900/50 border-4 border-white/20"
            />
          </div>

          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium mb-8 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
            2026 Competition Season Now Open
          </span>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            Kenya Math
            <br />
            <span className="text-blue-300">Quest</span>
          </h1>

          <p className="text-xl md:text-2xl mb-3 font-semibold text-blue-100">
            Challenge the Numbers, Change the Nation
          </p>

          <p className="max-w-xl mx-auto text-base md:text-lg text-blue-200 mb-10 leading-relaxed">
            A national mathematics competition empowering students from Grade 7
            to Form 4 to sharpen problem-solving and critical thinking skills.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 shadow-lg shadow-blue-900/30 transition-all"
            >
              Get Started <ArrowRight size={18} />
            </a>
            <a
              href="/#contest"
              className="inline-flex items-center gap-2 px-6 py-3.5 border border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all"
            >
              View Contest <ChevronRight size={18} />
            </a>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="fill-slate-50 w-full">
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" />
          </svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Our Impact</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-14">
            Shaping the Next Generation
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { value: 10000, label: "Students Participated", icon: <Users size={28} />,   suffix: "+" },
              { value: 113,   label: "Schools Involved",       icon: <School size={28} />,  suffix: "+" },
              { value: 47,    label: "Counties Reached",        icon: <MapPin size={28} />,  suffix: "" },
            ].map((item, i) => (
              <div key={i}
                className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-100 transition-all group">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-blue-600 group-hover:bg-blue-100 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-4xl font-extrabold text-blue-600 mb-2">
                  <Counter target={item.value} />{item.suffix}
                </h3>
                <p className="text-slate-600 font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Process</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-14">
            How It Works
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="relative text-center group">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-md shadow-blue-200 group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <span className="block text-xs font-bold text-blue-300 mb-1">{item.step}</span>
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(100%-8px)] w-4 text-slate-300">
                    <ChevronRight size={16} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTEST ── */}
      <section id="contest" className="scroll-mt-20 py-20 px-4 bg-slate-50">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Current Contest</p>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-10">
            Contest Status
          </h2>

          {!contest ? (
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
              <div className="skeleton h-6 w-32 mx-auto mb-4 rounded" />
              <div className="skeleton h-12 w-48 mx-auto rounded" />
            </div>
          ) : contest.status === "upcoming" ? (
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-blue-100">
              <Clock size={40} className="text-blue-600 mx-auto mb-5" />
              <p className="text-slate-500 mb-3 font-medium">Contest starts in</p>
              <p className="text-5xl font-extrabold text-blue-700 mb-6">
                <Countdown targetDate={contest.start_time} />
              </p>
              <a href="/register">
                <Button size="lg">Register Now <ArrowRight size={18} /></Button>
              </a>
            </div>
          ) : contest.status === "live" ? (
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-emerald-200">
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-3 h-3 rounded-full bg-emerald-500 pulse-dot" />
                <span className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">Live Now</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{contest.name}</h3>
              <p className="text-slate-500 mb-6">The contest is currently in progress</p>
              <a href="/login"><Button size="lg">Join the Contest <ArrowRight size={18} /></Button></a>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 shadow-sm border border-slate-100">
              <p className="text-slate-500 text-lg">No active contest at the moment.</p>
              <p className="text-sm text-slate-400 mt-2">Check back soon for the next competition.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="scroll-mt-20 py-20 px-4 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">Get In Touch</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Contact Us</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Your Name</label>
                <input
                  placeholder="John Kamau"
                  value={contact.name}
                  onChange={(e) => setContact({ ...contact, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="john@school.co.ke"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Message</label>
                <textarea
                  rows={4}
                  placeholder="How can we help you?"
                  value={contact.message}
                  onChange={(e) => setContact({ ...contact, message: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm bg-white rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none"
                />
              </div>
              <Button size="lg" fullWidth icon={<Send size={16} />}>
                Send Message
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

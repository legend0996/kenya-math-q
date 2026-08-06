import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, MessageSquare } from "lucide-react";
import { PageHero } from "../components/PageHero";
import { Button } from "../components/ui/Button";

const FAQS = [
  {
    q: "How do I register?",
    a: "Click 'Register' in the top bar, choose Student, School or Parent, fill in your details and submit. That account is then used to log in and enter contests.",
  },
  {
    q: "What is a test contest?",
    a: "Admins can start a Test Contest instantly, which shows on your Contests page marked as a Test. It works just like a real contest so you can practice for any grade, and it can be stopped at any time by an admin.",
  },
  {
    q: "How do I pay the entry fee?",
    a: "Payments are handled with M-PESA — either an STK push (auto-confirmed) or a manual Lipa na M-PESA payment where you paste the confirmation message. After paying, an admin approves it, unlocking your exam.",
  },
  {
    q: "How does the exam work?",
    a: "Once you are registered and paid and the contest is live, the 'Start Exam' button appears on your dashboard. You'll see compulsory instructions first, then one randomised question at a time with a server-enforced per-grade timer.",
  },
  {
    q: "What happens if my time runs out?",
    a: "The timer runs server-side. Your answers auto-save as a draft, and when time runs out the exam is auto-submitted for marking. You can also save and exit and resume later within the window.",
  },
  {
    q: "How are exams marked?",
    a: "In automatic mode, the system compares each student's final answer to the correct answer and awards full marks on every match. In manual mode, an administrator marks each question by hand.",
  },
  {
    q: "When and where do I see my results?",
    a: "Results appear on your dashboard after the administrator releases them. You can also compare yourself on the national, school or class leaderboard.",
  },
  {
    q: "How do I get my certificate?",
    a: "Once results are released, a certificate appears under 'My Certificates' on your dashboard and can be downloaded as a PDF through your logged-in account.",
  },
  {
    q: "I forgot my password. What do I do?",
    a: "Use the 'Forgot password' option on the login page. We email you a 6-digit code that expires in 15 minutes. Enter it with your new password to reset.",
  },
  {
    q: "How do schools participate?",
    a: "Schools register and are approved by an administrator. Once approved, a school can log in, add students, and view their school's overview and results.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main className="pt-[104px]">
      <PageHero
        crumbs={[{ label: "Home", to: "/" }, { label: "FAQs" }]}
        eyebrow="Frequently Asked Questions"
        title="Answers to common questions"
        description="Everything about registering, paying, sitting the exam and getting your results."
      />

      <section className="py-16 bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="space-y-3">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="bg-white rounded-xl border border-border shadow-soft overflow-hidden">
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-surface transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-foreground">{f.q}</span>
                    <ChevronDown
                      size={18}
                      className={`text-muted shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5">
                      <p className="text-sm text-muted leading-relaxed border-t border-border pt-4">{f.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 bg-charcoal-200 rounded-2xl p-8 text-center text-white">
            <MessageSquare size={28} className="mx-auto mb-3 text-cool-sky-400" />
            <h3 className="text-xl font-bold text-white">Still have questions?</h3>
            <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
              Send a message to our support team and an administrator will get back to you.
            </p>
            <Link to="/contact" className="inline-block mt-5">
              <Button variant="light">Contact Us</Button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

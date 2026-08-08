import { useState } from "react";
import { Mail, Phone, MapPin, Send, Clock, CheckCircle2 } from "lucide-react";
import { PageHero } from "../components/PageHero";
import { Button } from "../components/ui/Button";
import { Input, Textarea } from "../components/ui/Input";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <main className="pt-[104px]">
      <PageHero
        crumbs={[{ label: "Home", to: "/" }, { label: "Contact" }]}
        eyebrow="Contact Us"
        title="We'd love to hear from you"
        description="Questions about the competition, registration, payments or your account? Reach out and our team will respond promptly."
      />

      <section className="py-16 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact info */}
            <div className="space-y-4">
              {[
                { icon: <Mail size={20} />, title: "Email", lines: ["info@kenyamathquest.co.ke"], href: "mailto:info@kenyamathquest.co.ke" },
                { icon: <Phone size={20} />, title: "Phone", lines: ["+254 112 020336"], href: "tel:+254112020336" },
                { icon: <MapPin size={20} />, title: "Office", lines: ["Nairobi, Kenya"] },
                { icon: <Clock size={20} />, title: "Support hours", lines: ["Monday – Friday, 8:00am – 5:00pm EAT"] },
              ].map((c, i) => (
                <a
                  key={i}
                  href={c.href}
                  className={`bg-white rounded-xl border border-border p-5 flex items-start gap-4 shadow-soft ${c.href ? "hover:shadow-lifted hover:border-border-dark transition-shadow" : "pointer-events-none"}`}
                >
                  <div className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center shrink-0">
                    {c.icon}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{c.title}</p>
                    {c.lines.map((l) => (
                      <p key={l} className="text-sm text-muted mt-0.5">{l}</p>
                    ))}
                  </div>
                </a>
              ))}
            </div>

            {/* Form */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-8 shadow-card">
              {sent ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
                    <CheckCircle2 size={30} className="text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Message received</h3>
                  <p className="text-muted mt-2 max-w-sm">
                    Thank you for reaching out. Our team will respond to you shortly.
                  </p>
                  <Button variant="outline" className="mt-6" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                    Send another message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Input label="Your Name" required placeholder="John Kamau" value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    <Input label="Email Address" type="email" required placeholder="john@school.co.ke" value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  </div>
                  <Input label="Subject" placeholder="How can we help?" value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })} />
                  <Textarea label="Message" rows={5} required placeholder="Write your message…" value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })} />
                  <Button type="submit" size="lg" icon={<Send size={16} />}>Send Message</Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

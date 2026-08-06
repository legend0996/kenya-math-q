import { Link } from "react-router-dom";
import { Trophy, Mail, Phone, MapPin, Globe, AtSign, Camera, Play, Heart } from "lucide-react";

const COMPETITION_LINKS = [
  { to: "/competition", label: "About the Competition" },
  { to: "/leaderboard", label: "Leaderboard" },
  { to: "/contests", label: "Current Contest" },
  { to: "/register", label: "Register" },
  { to: "/login", label: "Student Login" },
];

const RESOURCE_LINKS = [
  { to: "/tuition", label: "Tuition Videos" },
  { to: "/materials", label: "Revision Materials" },
  { to: "/schools", label: "For Schools" },
  { to: "/faq", label: "FAQs" },
  { to: "/about", label: "About Us" },
];

export default function Footer() {
  return (
    <footer className="bg-charcoal-200 text-slate-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                <Trophy size={18} className="text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                Kenya<span className="text-pumpkin-spice-600">Math</span>Quest
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              A national mathematics competition empowering students from Grade 7
              to Form 4 to sharpen problem-solving and critical thinking skills
              across Kenya.
            </p>
            <div className="flex gap-2.5 mt-5">
              <a href="#" aria-label="Website"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-primary transition-colors">
                <Globe size={16} />
              </a>
              <a href="#" aria-label="X (Twitter)"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-primary transition-colors">
                <AtSign size={16} />
              </a>
              <a href="#" aria-label="Instagram"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-primary transition-colors">
                <Camera size={16} />
              </a>
              <a href="#" aria-label="YouTube"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-primary transition-colors">
                <Play size={16} />
              </a>
            </div>
          </div>

          {/* Competition */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Competition</h3>
            <ul className="space-y-2.5">
              {COMPETITION_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-slate-500 hover:text-pumpkin-spice-600 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Resources</h3>
            <ul className="space-y-2.5">
              {RESOURCE_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-slate-500 hover:text-pumpkin-spice-600 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-slate-500">
                <MapPin size={15} className="mt-0.5 shrink-0 text-cool-sky-600" />
                Nairobi, Kenya
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-500">
                <Mail size={15} className="shrink-0 text-cool-sky-600" />
                info@kenyamathquest.co.ke
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-500">
                <Phone size={15} className="shrink-0 text-cool-sky-600" />
                +254 112 020336
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} Kenya Math Quest. All rights reserved.
          </p>
          <div className="flex gap-5 text-xs text-slate-600">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Use</a>
          </div>
        </div>

        {/* Credit */}
        <div className="border-t border-white/10 mt-6 pt-4 flex flex-col items-center justify-center gap-1">
          <a
            href="https://codesolveafrica.co.ke"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-pumpkin-spice-600 font-medium transition-colors text-center"
          >
            © CodeSolveAfrica.co.ke
          </a>
          <span className="text-xs text-slate-600 flex items-center gap-1">
            Made with <Heart size={11} className="text-red-400" aria-label="love" /> by Code Solve Africa
          </span>
        </div>
      </div>
    </footer>
  );
}

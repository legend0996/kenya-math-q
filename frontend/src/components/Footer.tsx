import { Trophy, Mail, Phone, MapPin, Globe, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <Trophy size={18} className="text-white" />
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                Kenya<span className="text-blue-400">Math</span>Quest
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
              A national mathematics competition empowering students from Grade 7
              to Form 4 to sharpen problem-solving and critical thinking skills
              across Kenya.
            </p>
            <div className="flex gap-3 mt-5">
              <a href="#" aria-label="Twitter"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-blue-600 transition-colors">
                <MessageCircle size={15} />
              </a>
              <a href="#" aria-label="GitHub"
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 hover:bg-blue-600 transition-colors">
                <Globe size={15} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/#home",        label: "Home" },
                { href: "/#contest",     label: "Contest" },
                { href: "/leaderboard",  label: "Leaderboard" },
                { href: "/login",        label: "Student Login" },
                { href: "/register",     label: "Register" },
              ].map((link) => (
                <li key={link.href}>
                  <a href={link.href}
                    className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-slate-400">
                <MapPin size={15} className="mt-0.5 shrink-0 text-blue-400" />
                Nairobi, Kenya
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-400">
                <Mail size={15} className="shrink-0 text-blue-400" />
                info@kenyamathquest.co.ke
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-400">
                <Phone size={15} className="shrink-0 text-blue-400" />
                +254 112 020336
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Kenya Math Quest. All rights reserved.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Use</a>
          </div>
        </div>
      </div>
      {/* Credit Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="border-t border-slate-800 mt-6 pt-4 pb-6">
          <div className="flex flex-col items-center justify-center">
            <a
              href="https://codesolveafrica.co.ke"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-400 hover:text-blue-400 font-medium mb-1 transition-colors text-center"
              style={{ textDecoration: "none" }}
            >
              © CodeSolveAfrica.co.ke
            </a>
            <span className="text-xs text-slate-500 flex items-center gap-1" style={{ letterSpacing: 0.2 }}>
              Made with <span aria-label="love" className="text-red-400">❤️</span> by Code Solve Africa
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

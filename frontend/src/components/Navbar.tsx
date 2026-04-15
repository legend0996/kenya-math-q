"use client";

import { useEffect, useState } from "react";

type User = {
  role?: string;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // 🔐 CHECK USER
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUser(payload);
      } catch {
        setUser(null);
      }
    }
  }, []);

  // 👤 PROFILE ROUTING
  const handleProfile = () => {
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (user.role === "school") {
      window.location.href = "/school-dashboard";
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md shadow z-[9999]">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* LOGO */}
        <h1 className="font-bold text-blue-700 text-lg cursor-pointer">
          Kenya Math Quest
        </h1>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex space-x-6 items-center">
          <a href="#home" className="hover:text-blue-600 transition">
            Home
          </a>

          <a href="#contest" className="hover:text-blue-600 transition">
            Contest
          </a>

          <a href="#contact" className="hover:text-blue-600 transition">
            Contact
          </a>

          {!user ? (
            <>
              <a href="/login" className="text-blue-600 hover:underline">
                Login
              </a>

              <a
                href="/register"
                className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
              >
                Register
              </a>
            </>
          ) : (
            <button
              onClick={handleProfile}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
            >
              Profile
            </button>
          )}
        </div>

        {/* MOBILE BUTTON */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-2xl"
        >
          ☰
        </button>
      </div>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-3 shadow">
          <a href="#home" onClick={() => setMenuOpen(false)} className="block">
            Home
          </a>

          <a
            href="#contest"
            onClick={() => setMenuOpen(false)}
            className="block"
          >
            Contest
          </a>

          <a
            href="#contact"
            onClick={() => setMenuOpen(false)}
            className="block"
          >
            Contact
          </a>

          {!user ? (
            <>
              <a href="/login" className="block text-blue-600">
                Login
              </a>

              <a
                href="/register"
                className="block bg-blue-600 text-white px-3 py-2 rounded"
              >
                Register
              </a>
            </>
          ) : (
            <button
              onClick={handleProfile}
              className="block bg-blue-600 text-white px-3 py-2 rounded w-full text-left"
            >
              Profile
            </button>
          )}
        </div>
      )}
    </nav>
  );
}

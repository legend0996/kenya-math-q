"use client";

import Counter from "../components/Counter";
import Countdown from "../components/Countdown";
import { useEffect, useState } from "react";

export default function Home() {
  const [contest, setContest] = useState<any>(null);

  useEffect(() => {
    const fetchContest = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/contest/current");
        const data = await res.json();

        if (data.status) {
          setContest(data);
        } else {
          setContest({ status: "none" });
        }
      } catch (error) {
        console.error("Fetch error:", error);
        setContest({ status: "none" });
      }
    };

    fetchContest();
  }, []);

  if (!contest) {
    return (
      <div className="pt-24 text-center text-lg font-medium">Loading...</div>
    );
  }

  return (
    <main className="pt-20 bg-white text-gray-900">
      {/* HERO */}
      <section
        id="home"
        className="scroll-mt-24 min-h-screen flex flex-col justify-center items-center text-center px-6 bg-gradient-to-br from-blue-600 to-blue-900 text-white"
      >
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
          Kenya Math Quest
        </h1>

        <p className="text-xl md:text-2xl mb-4 font-semibold">
          Challenge the Numbers, Change the Nation
        </p>

        <p className="max-w-2xl text-lg mb-12 opacity-90">
          A national mathematics competition empowering students from Grade 7 to
          Form 4 to sharpen problem-solving and critical thinking skills.
        </p>

        <a
          href="#contest"
          className="bg-white text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
        >
          View Contest
        </a>
      </section>

      {/* STATS */}
      <section className="mt-32 py-20 text-center">
        <h2 className="text-3xl font-bold mb-16">Our Impact</h2>

        <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto px-4">
          {[
            { value: 10000, label: "Students Participated" },
            { value: 113, label: "Schools Involved" },
            { value: 47, label: "Counties Reached" },
          ].map((item, i) => (
            <div key={i} className="bg-gray-50 p-10 rounded-xl shadow">
              <h3 className="text-5xl font-bold text-blue-700 mb-4">
                <Counter target={item.value} />+
              </h3>
              <p className="text-gray-700">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mt-32 py-20 bg-gray-100 text-center">
        <h2 className="text-3xl font-bold mb-16">How It Works</h2>

        <div className="grid md:grid-cols-5 gap-10 max-w-6xl mx-auto px-4">
          {[
            "Create Account",
            "Register",
            "Pay",
            "Attempt",
            "Get Certificate",
          ].map((step, i) => (
            <div key={i} className="bg-white p-8 rounded-xl shadow">
              <div className="text-blue-700 text-2xl font-bold mb-3">
                {i + 1}
              </div>
              <p>{step}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTEST */}
      <section id="contest" className="scroll-mt-56 mt-32 py-20 text-center">
        <h2 className="text-3xl font-bold mb-16">Current Contest</h2>

        <div className="max-w-xl mx-auto">
          {contest.status === "upcoming" && (
            <div className="bg-blue-100 p-12 rounded-xl shadow">
              <p className="mb-4">Starts in:</p>

              <h3 className="text-4xl font-bold text-blue-700">
                <Countdown targetDate={contest.start_time} />
              </h3>
            </div>
          )}
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="scroll-mt-24 mt-32 py-20 bg-gray-100 text-center"
      >
        <h2 className="text-3xl font-bold mb-16">Contact Us</h2>

        <div className="max-w-xl mx-auto bg-white p-10 rounded-xl shadow">
          <input
            className="border p-3 w-full mb-5 rounded"
            placeholder="Your Name"
          />
          <input
            className="border p-3 w-full mb-5 rounded"
            placeholder="Your Email"
          />
          <textarea
            className="border p-3 w-full mb-5 rounded"
            placeholder="Your Message"
          />

          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg w-full">
            Send Message
          </button>
        </div>
      </section>
    </main>
  );
}

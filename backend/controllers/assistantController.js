import pool from "../config/db.js";

// ── "Trained doc": the site's help knowledge base ──────────────
// Each entry: { keywords: [terms], answer }
const KNOWLEDGE = [
  {
    keywords: ["how do i register", "how to register", "create account", "sign up", "signup", "new account"],
    answer: "To register, click 'Register' in the top bar, choose Student or School, fill in your details (name, email/username, password, grade or county) and submit. That account is then used to log in and enter contests.",
  },
  {
    keywords: ["login", "log in", "sign in", "cant log in", "cannot login", "password wrong"],
    answer: "Login is two steps: enter your email or username first — if it exists, a password field appears. Then type your password. If you forgot it, use the 'Forgot password' link to get a reset code by email.",
  },
  {
    keywords: ["forgot password", "reset password", "reset code", "change password"],
    answer: "Use the 'Forgot password' option on the login page. We email you a 6-digit code that expires in 15 minutes. Enter it with your new password to reset it. You can also change your password anytime in your Settings (Account) page using your current password.",
  },
  {
    keywords: ["change email", "change my email", "update email"],
    answer: "In Settings (Account email) enter your current password and the new email, then save. The change applies immediately.",
  },
  {
    keywords: ["change username", "change my username"],
    answer: "Contact support or an administrator to change your username, since it is a unique login identifier.",
  },
  {
    keywords: ["register contest", "join contest", "enter contest", "sign up for contest"],
    answer: "Log in, open the Contest page and click Register on the current contest. Then pay the entry fee via M-Pesa (STK or a confirmation code) and once approved you can take the exam.",
  },
  {
    keywords: ["pay", "payment", "mpesa", "mpesa", "entry fee", "fee", "stk"],
    answer: "Payments are handled with M-PESA (STK push or manual confirmation code). The amount is set by the organisers. After paying, an admin approves it, unlocking your exam. You'll see 'Registered • Paid' on your dashboard once done.",
  },
  {
    keywords: ["exam", "test", "start exam", "sit the exam", "where is the exam"],
    answer: "Once you're registered and paid, and the contest is live, the 'Start Exam' button appears on your dashboard. A test contest started by an admin can be taken instantly the same way.",
  },
  {
    keywords: ["time", "timer", "how long", "minutes", "duration"],
    answer: "The exam has a per-grade time limit set by the organisers (default 10 minutes). The timer runs server-side; drafts auto-save and are auto-submitted when time runs out. You can save and exit and resume later within the window.",
  },
  {
    keywords: ["test contest", "practice", "try contest", "mock"],
    answer: "Admins can start a Test Contest instantly, which shows on your Contest page marked as a Test. It works just like a real contest so you can practice for any grade, and it can be stopped any time by an admin.",
  },
  {
    keywords: ["certificate", "certificate download", "get certificate"],
    answer: "Once results are released and you've participated, a certificate appears for download on your dashboard under 'My Certificates'. Downloads are protected through your logged-in account.",
  },
  {
    keywords: ["result", "my result", "score", "grade awarded", "leaderboard", "rank"],
    answer: "Results appear after the admin releases them for the contest. You can view your score on the dashboard, and compare on the Leaderboard by national, school or class.",
  },
  {
    keywords: ["support", "human", "someone help", "contact support", "talk to a person"],
    answer: "Use the Support section in your account to send a message to the support team. An administrator (with permission to reply) will respond there. Our AI assistant is also here to help with common questions.",
  },
  {
    keywords: ["admin", "manage contest", "create contest", "start contest", "stop contest", "add question"],
    answer: "Admins use the Owner Dashboard: add questions per grade, create and activate contests, start/stop test contests, approve schools, verify payments, release results, manage certificates and reply to support.",
  },
  {
    keywords: ["school", "my school", "school account"],
    answer: "Schools register and are approved by an admin. Once approved, a school can log in, add students, and view their school's overview and results.",
  },
  {
    keywords: ["error", "help", "problem", "stuck", "not working", "issue"],
    answer: "I can help with common site questions. If you're stuck, try refreshing, or send a message to the support team (Contact) and an admin will reply.",
  },
  {
    keywords: ["hello", "hi", "hey", "start", "help me"],
    answer: "Hello! I'm the Kenya Math Quest assistant. Ask me how to register, pay, take an exam, get certificates, or anything else about the site. You can also type a simple arithmetic problem (e.g. 'what is 12 * 8?') and I'll answer it.",
  },
  {
    keywords: ["instructions", "paper instructions", "read instructions", "agree", "i agree", "first page", "rules of the contest"],
    answer: "Each contest has compulsory written instructions per grade/form. They are shown as the FIRST page when you open the exam — read them carefully and tap 'I agree, continue'. Questions only appear after you agree, and reading them never counts against your time. Instructions can be updated by an administrator at any time before you start.",
  },
  {
    keywords: ["revision", "study materials", "learning material", "practice material", "study guide", "notes", "revision materials"],
    answer: "Revision/study materials are uploaded by an administrator and grouped by grade/form. You'll find them on your dashboard under 'Study Materials'. They can be links to external pages, plain text notes, or files — just tap to open or read them. Past tests you've entered are shown right below so you can revise with real papers.",
  },
  {
    keywords: ["past test", "past paper", "previous tests", "old test", "past contests", "my tests"],
    answer: "Your dashboard lists every contest and test you've entered under 'Past Tests', with your score and grade where they've been marked. Test contests started by an admin also appear there once you take them.",
  },
  {
    keywords: ["change class", "update class", "change grade", "change form", "update grade", "update form", "my class", "my grade"],
    answer: "You can change your class/form/grade yourself: open Settings and use the 'My Class' section to pick your grade and save. The change takes effect immediately, including which questions and revision materials you see.",
  },
  {
    keywords: ["final answer", "auto marking", "auto mark", "marked automatically", "how is it marked", "auto-marker"],
    answer: "In every question there is a 'Final Answer' box — this is what auto-marking scores when the administrator has chosen automatic marking. Your rough work and drawings (the 'Working space' under the question) are saved for the administrator to review but are not used by the auto-marker. For MCQ questions, the option you select is your final answer.",
  },
  {
    keywords: ["privacy", "private", "confidential", "secret", "personal data", "personal info", "my password", "phone number of", "other student", "another student", "someone else account", "give me account"],
    answer: "I can only help with the site's general features and your own account. I do not reveal confidential details like passwords, M-PESA codes, or other students' or administrators' personal information. If you need help with your own account, check Settings or contact support.",
  },
];

let seeded = false;
const seen = new Set();

const ensureSeeded = async () => {
  if (seeded) return;
  try {
    // Upsert: each training entry is added only if its keyword set isn't present,
    // so new entries ship even after the table was already seeded.
    for (const doc of KNOWLEDGE) {
      await pool.query(
        `INSERT INTO assistant_docs (keywords, answer)
         SELECT ?, ? WHERE NOT EXISTS (
           SELECT 1 FROM assistant_docs WHERE keywords=?
         )`,
        [doc.keywords.join(" "), doc.answer, doc.keywords.join(" ")],
      );
    }
  } catch (e) {
    console.error("ASSISTANT SEED ERROR:", e.message);
  }
  seeded = true;
};

// ── Safe arithmetic evaluator (no eval / no external API) ──────
// Only numbers and + - * / ( ) are allowed via a strict whitelist,
// parsed with the shunting-yard algorithm and evaluated on a stack.
const ARITH_RE = /^[\s0-9+\-*/().%]+$/;

const tokenizeMath = (str) =>
  str
    .replace(/\s+/g, "")
    .match(/(\d+\.?\d*|[+\-*/()%])/g) || [];

const evalStack = (tokens) => {
  const prec = { "+": 1, "-": 1, "*": 2, "/": 2, "%": 2 };
  const ops = [];
  const out = [];
  for (const t of tokens) {
    if (/^\d/.test(t)) {
      out.push(parseFloat(t));
    } else if (t === "(") {
      ops.push(t);
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") {
        out.push(ops.pop());
      }
      ops.pop();
    } else {
      while (ops.length && ops[ops.length - 1] !== "(" && (prec[t] || 0) <= prec[ops[ops.length - 1]]) {
        out.push(ops.pop());
      }
      ops.push(t);
    }
  }
  while (ops.length) out.push(ops.pop());

  const s = [];
  for (const t of out) {
    if (typeof t === "number") {
      s.push(t);
    } else {
      const b = s.pop();
      const a = s.pop();
      let r;
      switch (t) {
        case "+": r = a + b; break;
        case "-": r = a - b; break;
        case "*": r = a * b; break;
        case "/": r = b === 0 ? NaN : a / b; break;
        case "%": r = b === 0 ? NaN : a % b; break;
      }
      s.push(r);
    }
  }
  const val = s[0];
  if (Number.isFinite(val)) return Math.round(val * 1e6) / 1e6;
  return null;
};

const isArithmetic = (text) =>
  (["+", "-", "*", "/", "%"].some((op) => text.includes(op))) &&
  /[0-9]/.test(text) &&
  ARITH_RE.test(text.replace(/\?/g, "")) &&
  tokenizeMath(text.replace(/\?/g, "")).length >= 3;

const tryMath = (text) => {
  const expr = text.replace(/what\s+is|what\'s|solve|calculate|compute|equals|plus|minus|times|\?|/gi, "").trim();
  if (!isArithmetic(expr) && !isArithmetic(text)) return null;
  const tokens = tokenizeMath(expr || text);
  const val = evalStack(tokens);
  if (val === null) return null;
  return `The answer is ${val}. Would you like help with anything else on the site?`;
};

// Match the user message against the knowledge base by keywords.
const matchKnowledge = async (text) => {
  await ensureSeeded();
  const words = text.toLowerCase();
  let docs;
  try {
    const r = await pool.query("SELECT keywords, answer FROM assistant_docs");
    docs = r.rows;
  } catch {
    docs = KNOWLEDGE;
  }
  let best = null;
  let bestScore = 0;
  for (const d of docs) {
    const kw = String(d.keywords || "").toLowerCase().split(/[,\s]+/).filter(Boolean);
    let score = 0;
    for (const k of kw) if (k.length > 2 && words.includes(k)) score += k.length;
    if (score > bestScore) {
      bestScore = score;
      best = d.answer;
    }
  }
  return best;
};

// 🔐 Confidential-detail guard: never reveal passwords, M-PESA codes, other
// people's private info, or anything not meant for a public assistant.
const CONFIDENTIAL_RE =
  /(password|passcode|otp|pin|mpesa|stk|(?:phone|mobile|cell)\s*(?:number)?|confidential|private|other student|another student|someone else|someone's account|give me (?:the )?(?:password|code)|reset (?:someone|another)|marks of (?:another|other))/i;

const isConfidentialRequest = (text) => {
  const t = String(text || "").toLowerCase();
  if (!CONFIDENTIAL_RE.test(t)) return false;
  // The word "mpesa" alone is usually a normal how-to-pay question — only block
  // when they are asking for someone's code or a code that isn't their own.
  if (/mpesa|stk/i.test(t) && !/someone|other|another|his|her|their|give me|what.{0,12}code/i.test(t)) {
    return false;
  }
  return true;
};

// ── Optional AI brain (OpenAI-compatible API) ─────────────────
// Enabled when OPENAI_API_KEY is set (see .env.production). Falls back to the
// knowledge base and built-in math solver when unconfigured or on any error,
// so the chatbot always answers.
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions";

const askOpenAI = async (message) => {
  if (!OPENAI_KEY) return null;
  try {
    const res = await fetch(OPENAI_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.6,
        max_tokens: 300,
        messages: [
          { role: "system", content: buildSystemPrompt() },
          { role: "user", content: message },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    return text ? String(text).trim() : null;
  } catch (error) {
    console.error("OPENAI ERROR:", error.message);
    return null;
  }
};

// ── Website page content the assistant may read from ──────────
// Grounded in the public pages (/faq, /competition, /schools, ...) so answers
// match what is actually on the site instead of guessing. EXAM QUESTIONS AND
// THEIR ANSWERS ARE NEVER INCLUDED, and requests for them are refused below.
const SITE_CONTEXT = `
Kenya Math Quest is a national mathematics competition website for Kenya.

PUBLIC PAGES (content users see on the website):
- Home (/): Announces the current contest round and invites students, schools and parents to join.
- Competition (/competition): Describes how the exam works — compulsory instructions first, then one randomised question at a time, with a server-enforced per-grade timer and an in-app calculator.
- Schools (/schools): Schools register and, once approved by an administrator, can log in, add students, and view the school's overview and results.
- Materials (/materials): Revision/study materials are uploaded by an administrator and grouped by grade/form; students read them from their dashboard.
- Tuition (/tuition): Free streamed YouTube video lessons added by the administrator.
- FAQ (/faq): Frequently asked questions and answers on the site.
- Contact (/contact): Visitors can message the support team; an administrator replies.

FREQUENTLY ASKED QUESTIONS (from the /faq page):
1. How do I register? Click 'Register' in the top bar, choose Student, School or Parent, fill in your details and submit. That account is then used to log in and enter contests.
2. What is a test contest? Admins can start a Test Contest instantly, which shows on the Contests page marked as a Test. It works just like a real contest so students can practice for any grade, and it can be stopped at any time by an admin.
3. How do I pay the entry fee? Payments are handled with M-PESA — either an STK push (auto-confirmed) or a manual Lipa na M-PESA payment where you paste the confirmation message. After paying, an administrator approves it, unlocking the exam.
4. How does the exam work? Once registered, paid and the contest is live, the 'Start Exam' button appears on the dashboard. Compulsory instructions are shown first, then one randomised question at a time with a server-enforced per-grade timer.
5. What happens if time runs out? The timer runs server-side. Answers auto-save as a draft, and when time runs out the exam is auto-submitted for marking. Save-and-exit lets the student resume later within the window.
6. How are exams marked? Automatic mode compares each final answer to the correct answer and awards full marks on every match. Manual mode: an administrator marks each question by hand.
7. When do results appear? Results appear on the dashboard after the administrator releases them. Students can compare on the national, school or class leaderboard.
8. How do students get a certificate? Once results are released, a certificate appears under 'My Certificates' on the dashboard and can be downloaded as a PDF through the logged-in account.
9. Forgot password? Use the 'Forgot password' option on the login page; a 6-digit code is emailed that expires in 15 minutes.
10. How do schools participate? Schools register and are approved by an administrator; once approved they can add students and see their overview and results.

RULES FOR THIS ASSISTANT:
- Answer using the website content above and the product knowledge already given.
- NEVER reveal confidential details: passwords, M-PESA codes/STK codes, other students' or administrators' personal information, or the marks of another student.
- NEVER reveal actual contest/exam questions, their options, their correct answers, or marking schemes (they are confidential to keep the competition fair). If asked, politely decline and offer unrelated help.
- Keep answers short, clear and friendly for young students.
`;

const buildSystemPrompt = () =>
  "You are the friendly Kenya Math Quest assistant. You help students, parents and schools with the Kenya Math Quest website (registering, logging in, paying the entry fee with M-PESA, taking exams and test contests, instructions, timers, results, leaderboards, certificates, revision materials and school dashboards).\n\n" +
  "WEBSITE PAGES YOU MAY READ FROM:\n" + SITE_CONTEXT;

// ── Confidential exam content guard ───────────────────────────
// Refuse any request that asks for answers/solutions/marking schemes to
// specific contest or exam questions.
const isExamAnswerRequest = (text) => {
  const t = String(text || "").toLowerCase().trim();
  if (!/((the\s*)?answer(s)?\b|answers? for|answers? to|solution|solve|marking\s*scheme|marking\s*guide|correct\s+(answer|option)|which\s+option\s+is)/.test(t)) {
    return false;
  }
  // "How do I answer a question?" is fine — only block requests for the answer itself.
  if (/^(how|can i|is it possible).{0,40}(answer|solve)|how.{0,30}(marked|answered|submit)/i.test(t)) return false;
  return /question|\bq\s*[0-9]|\bno\.?\s*[0-9]|\bexam\b|paper|contest|test|practice|item|number/.test(t);
};

// Human-like typing delay: the assistant never replies instantly; it shows the
// "typing" indicator for 3–7 seconds so it feels like a real assistant.
const typingDelay = () => new Promise((r) => setTimeout(r, 3000 + Math.random() * 4000));

// 🧠 CHAT EP (public — used by the chatbot widget)
export const chat = async (req, res) => {
  try {
    const text = String(req.body?.message || req.query?.message || "").trim();

    let out;
    if (!text) {
      out = { type: "greet", answer: "What can I help you with?" };
    } else if (isConfidentialRequest(text)) {
      out = {
        type: "privacy",
        answer:
          "I can't share confidential details like passwords, M-PESA codes, or any other student's or administrator's personal information. If you need help with your own account, check Settings, or contact support.",
      };
    } else if (isExamAnswerRequest(text)) {
      // Never reveal contest/exam questions or their answers.
      out = {
        type: "privacy",
        answer:
          "I can't reveal contest or exam questions or their answers — those are confidential to keep the competition fair. I'd be happy to help with how the exam works, your account, payments, results, or anything else on the site!",
      };
    } else {
      // Simple arithmetic is always solved locally (instant and free).
      const math = tryMath(text);
      if (math) {
        out = { type: "math", answer: math };
      } else {
        // AI brain first when configured; falls back to the knowledge base.
        const ai = await askOpenAI(text);
        const kb = ai ? null : await matchKnowledge(text);
        out = ai
          ? { type: "ai", answer: ai }
          : kb
            ? { type: "kb", answer: kb }
            : {
                type: "fallback",
                answer:
                  "I wasn't sure about that, but here are things I can help with: registration/login, changing your email or password, paying the entry fee, taking an exam or test contest, results & leaderboard, certificates, and contacting human support. I can also solve simple math like 'what is 15*4?'. Type a keyword and I'll do my best!",
              };
      }
    }

    // Human-like timing: never respond instantly — show "typing" for 3–7 s.
    await typingDelay();
    return res.json({ success: true, ...out });
  } catch (error) {
    console.error("CHAT ERROR:", error);
    res.status(500).json({ error: "Assistant unavailable. Please try again." });
  }
};

// 🔧 Admin: list / add knowledge to the trained doc
export const listDocs = async (req, res) => {
  try {
    await ensureSeeded();
    const r = await pool.query("SELECT * FROM assistant_docs ORDER BY id");
    res.json({ success: true, docs: r.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addDoc = async (req, res) => {
  try {
    const { keywords, answer } = req.body;
    if (!keywords || !answer) return res.status(400).json({ error: "keywords and answer are required" });
    await pool.query("INSERT INTO assistant_docs (keywords, answer) VALUES (?,?)", [String(keywords), String(answer)]);
    res.json({ success: true, message: "Added to the knowledge base" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeDoc = async (req, res) => {
  try {
    await pool.query("DELETE FROM assistant_docs WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
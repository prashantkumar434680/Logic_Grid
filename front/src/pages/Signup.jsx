import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser, resendVerification } from '../authSlice';

const signupSchema = z.object({
  firstName: z.string().min(3, "Minimum 3 characters required"),
  emailId:   z.string().email("Invalid email address"),
  password:  z
    .string()
    .min(8, "Minimum 8 characters required")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one symbol"),
});

// ── Tiny reusable components ──────────────────────────────────────────

function StepIndicator({ current }) {
  const steps = ["Account", "Verify", "Done"];
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => {
        const num = i + 1;
        const isDone = current > num;
        const isActive = current === num;
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center
                text-[11px] font-semibold transition-all duration-300
                ${isDone   ? "bg-emerald-500/25 text-emerald-300"
                : isActive ? "bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]"
                :            "bg-white/5 text-white/20"}`}>
                {isDone ? "✓" : num}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-white/60" : "text-white/20"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 min-w-[32px] transition-all duration-500
                ${current > num ? "bg-gradient-to-r from-violet-500 to-cyan-400" : "bg-white/[0.08]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">{label}</label>
      {children}
      {hint && !error && <p className="text-[11px] text-white/20">{hint}</p>}
      {error && <p className="text-[11px] text-red-400/90">{error.message}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full px-3.5 py-[11px] bg-white/[0.04] border rounded-xl text-sm text-white
   placeholder:text-white/15 outline-none transition-all duration-200
   focus:bg-violet-500/[0.07] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]
   ${err
     ? "border-red-500/40 focus:border-red-500/60"
     : "border-white/[0.08] focus:border-violet-500/50"}`;

// ── Platform features data ────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
      </svg>
    ),
    color: "violet",
    title: "1,200+ Curated Problems",
    desc: "Hand-picked challenges across Arrays, Graphs, DP, Trees, and Strings.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: "cyan",
    title: "Live Leaderboards",
    desc: "Compete globally with real-time ranking updates.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0018 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
      </svg>
    ),
    color: "emerald",
    title: "Deep Analytics",
    desc: "Track memory, runtime percentiles, and improvement metrics.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    color: "amber",
    title: "Multi-language IDE",
    desc: "Code in Python, Java, C++, Go, Rust, and JavaScript.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.091z" />
      </svg>
    ),
    color: "rose",
    title: "Smart Study Paths",
    desc: "AI-powered roadmaps adapted to your performance.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    color: "sky",
    title: "Active Community",
    desc: "Discussion threads, code reviews, and 40k+ engineers on Discord.",
  },
];

const COLOR_MAP = {
  violet:  { bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.25)", text: "text-violet-300" },
  cyan:    { bg: "rgba(34,211,238,0.10)",   border: "rgba(34,211,238,0.22)", text: "text-cyan-300"   },
  emerald: { bg: "rgba(52,211,153,0.10)",   border: "rgba(52,211,153,0.22)", text: "text-emerald-300"},
  amber:   { bg: "rgba(251,191,36,0.10)",   border: "rgba(251,191,36,0.20)", text: "text-amber-300"  },
  rose:    { bg: "rgba(251,113,133,0.10)",  border: "rgba(251,113,133,0.22)", text: "text-rose-300"  },
  sky:     { bg: "rgba(56,189,248,0.10)",   border: "rgba(56,189,248,0.22)", text: "text-sky-300"    },
};

const TESTIMONIALS = [
  { name: "Priya S.", role: "SWE @ Google", avatar: "PS", text: "LogicGrid's smart roadmaps helped me go from struggling with medium Graphs to cracking Google L4 in 3 months." },
  { name: "Arjun M.", role: "CS @ IIT Bombay", avatar: "AM", text: "The real-time leaderboards made me genuinely competitive. Top 200 in a semester." },
  { name: "Sara K.", role: "Intern @ Microsoft", avatar: "SK", text: "The in-browser IDE with instant feedback cut my debug time in half." },
];

// ── Email sent step ───────────────────────────────────────────────────

function EmailSentStep({ email, onResend, onBack, resendTimer, loading }) {
  const steps = ["Open your email app", "Find the email from LogicGrid", 'Click "Verify my account"'];
  return (
    <div>
      <div className="flex justify-center mb-6">
        <div className="relative" style={{ width: 72, height: 72 }}>
          <div className="absolute rounded-full" style={{ inset: -6, border: "1px solid rgba(139,92,246,0.2)", animation: "pulse-ring 2s ease-in-out infinite" }} />
          <div className="absolute rounded-full" style={{ inset: -13, border: "1px solid rgba(139,92,246,0.1)", animation: "pulse-ring 2s ease-in-out infinite 0.5s" }} />
          <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.13)", border: "1px solid rgba(139,92,246,0.28)" }}>
            <svg className="w-8 h-8 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex justify-center mb-5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
          <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-[12px] text-violet-300 font-medium">{email}</span>
        </div>
      </div>
      <div className="flex flex-col gap-2 mb-6">
        {steps.map((text, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-violet-300 flex-shrink-0" style={{ background: "rgba(139,92,246,0.2)" }}>{i + 1}</div>
            <span className="text-[12px] text-white/45">{text}</span>
          </div>
        ))}
      </div>
      <button type="button" onClick={onResend} disabled={loading || resendTimer > 0}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[.98]"
        style={loading || resendTimer > 0
          ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
          : { background: "linear-gradient(135deg,#8b5cf6,#22d3ee)", color: "white" }}>
        {loading ? "Sending…" : resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend verification link"}
      </button>
      {resendTimer > 0 && (
        <div className="mt-2.5 h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${(resendTimer / 60) * 100}%`, background: "linear-gradient(90deg,#8b5cf6,#22d3ee)" }} />
        </div>
      )}
      <p className="text-center mt-4 text-[11px] text-white/20 leading-relaxed">Didn't receive it? Check your spam folder.</p>
      <button type="button" onClick={onBack}
        className="block w-full text-center mt-3 text-[12px] text-white/20 hover:text-white/50 transition-colors underline underline-offset-4">
        ← Use a different email
      </button>
    </div>
  );
}

// ── Landing hero section (CLEANED) ────────────────────────────────────

function LandingHero({ onGetStarted }) {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">
      {/* Layered bg orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full opacity-25"
          style={{ background: "radial-gradient(circle,#8b5cf6 0%,transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle,#22d3ee 0%,transparent 70%)", filter: "blur(100px)" }} />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle,#a78bfa 0%,transparent 70%)", filter: "blur(60px)", transform: "translateX(-50%)" }} />
        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {/* Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 relative"
        style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-semibold text-violet-300 tracking-wide uppercase">Free forever · No credit card</span>
      </div>

      {/* Headline */}
      <h1 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05] mb-6 max-w-3xl">
        The coding arena<br />
        <em className="not-italic" style={{ background: "linear-gradient(135deg,#a78bfa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          built to get you hired
        </em>
      </h1>

      <p className="text-base sm:text-lg text-white/40 max-w-xl leading-relaxed mb-10">
        Master algorithms, compete on leaderboards, and land your dream job with 1,200+ interview-quality problems and real-time analytics.
      </p>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-20">
        <button onClick={onGetStarted}
          className="px-8 py-3.5 rounded-2xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[.97] shadow-[0_0_30px_rgba(139,92,246,0.35)]"
          style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
          Start for free →
        </button>
        <NavLink to="/login"
          className="px-8 py-3.5 rounded-2xl text-sm font-semibold text-white/50 hover:text-white transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          Already a member? Log in
        </NavLink>
      </div>

      {/* ✨ REMOVED: Animated stats row ✨ */}

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-30">
        <span className="text-[10px] text-white/50 uppercase tracking-widest">Explore</span>
        <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
}

// ── Features grid ─────────────────────────────────────────────────────

function FeaturesSection() {
  return (
    <section className="px-6 py-20 max-w-6xl mx-auto">
      <div className="text-center mb-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-400 mb-3">Everything you need</p>
        <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl text-white leading-tight">
          One platform.<br />Every edge.
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map(({ icon, color, title, desc }) => {
          const c = COLOR_MAP[color];
          return (
            <div key={title}
              className="group relative p-6 rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
                style={{ boxShadow: `inset 0 0 30px ${c.bg}` }} />
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                <span className={c.text}>{icon}</span>
              </div>
              <h3 className="text-[14px] font-semibold text-white mb-2">{title}</h3>
              <p className="text-[12px] text-white/35 leading-relaxed">{desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ── How it works ──────────────────────────────────────────────────────

function HowItWorksSection() {
  const steps = [
    { n: "01", title: "Create your account", body: "Sign up in seconds. No credit card needed — start solving problems immediately." },
    { n: "02", title: "Choose your path", body: "Pick problems by topic or follow our AI-powered roadmap tailored to your skill level." },
    { n: "03", title: "Compete globally", body: "Join weekly contests, track your rank, and compare solutions with top performers." },
    { n: "04", title: "Land your offer", body: "Walk into interviews confident, backed by hundreds of solved problems and a proven track record." },
  ];
  return (
    <section className="px-6 py-20 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 50%,rgba(139,92,246,0.07) 0%,transparent 70%)" }} />
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400 mb-3">The process</p>
          <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl text-white">Simple. Proven. Fast.</h2>
        </div>
        <div className="flex flex-col gap-0">
          {steps.map(({ n, title, body }, i) => (
            <div key={n} className="flex gap-6 group">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-['Instrument_Serif'] text-[13px] transition-all duration-300"
                  style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
                  {n}
                </div>
                {i < steps.length - 1 && (
                  <div className="flex-1 w-px my-2" style={{ background: "rgba(139,92,246,0.18)" }} />
                )}
              </div>
              <div className={`pb-10 ${i === steps.length - 1 ? "pb-0" : ""}`}>
                <h3 className="text-[15px] font-semibold text-white mb-1.5 mt-2">{title}</h3>
                <p className="text-[13px] text-white/35 leading-relaxed">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Testimonials ──────────────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400 mb-3">Real developers</p>
        <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl text-white">What they're saying</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TESTIMONIALS.map(({ name, role, avatar, text }) => (
          <div key={name} className="p-5 rounded-2xl flex flex-col gap-4"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <svg className="w-5 h-5 text-violet-500/50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
            </svg>
            <p className="text-[13px] text-white/50 leading-relaxed flex-1">{text}</p>
            <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05]">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
                style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
                {avatar}
              </div>
              <div>
                <p className="text-[12px] font-semibold text-white">{name}</p>
                <p className="text-[10px] text-white/30">{role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Final CTA before form ─────────────────────────────────────────────

function FinalCTASection({ onGetStarted }) {
  return (
    <section className="px-6 py-20 flex justify-center">
      <div className="relative max-w-2xl w-full rounded-3xl overflow-hidden p-10 sm:p-14 text-center"
        style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(139,92,246,0.2) 0%,transparent 70%)" }} />
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-400 mb-3 relative">No credit card. No paywalls. Ever.</p>
        <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl text-white mb-5 relative">
          Ready to level up?
        </h2>
        <p className="text-[14px] text-white/40 leading-relaxed mb-8 relative max-w-sm mx-auto">
          Join developers crushing interviews. Your first problem is waiting.
        </p>
        <button onClick={onGetStarted}
          className="px-10 py-4 rounded-2xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[.97] relative shadow-[0_0_40px_rgba(139,92,246,0.4)]"
          style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
          Create my free account →
        </button>
      </div>
    </section>
  );
}

// ── Signup form panel ─────────────────────────────────────────────────

function SignupFormPanel({ formRef }) {
  const [step,            setStep]            = useState(1);
  const [showPassword,    setShowPassword]    = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendTimer,     setResendTimer]     = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const signupForm = useForm({ resolver: zodResolver(signupSchema) });
  const se = signupForm.formState.errors;

  useEffect(() => { if (isAuthenticated) navigate("/"); }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const onRegister = async (data) => {
    const result = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(result)) {
      setRegisteredEmail(data.emailId);
      setResendTimer(60);
      setStep(2);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    await dispatch(resendVerification(registeredEmail));
    setResendTimer(60);
  };

  return (
    <section ref={formRef} className="px-6 pb-32 flex justify-center">
      <div className="w-full max-w-[420px] rounded-3xl overflow-hidden relative"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
        {/* Top glow strip */}
        <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg,transparent,#8b5cf6,#22d3ee,transparent)" }} />

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <StepIndicator current={step} />
            {step !== 2 && (
              <>
                <h2 className="font-['Instrument_Serif'] text-[28px] text-white tracking-tight mb-1">
                  {step === 1 ? "Create your account" : "You're in!"}
                </h2>
                <p className="text-[13px] text-white/35">
                  {step === 1 ? "Free forever. No card required." : "Email verified. Taking you to the dashboard…"}
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="font-['Instrument_Serif'] text-[24px] text-white tracking-tight mb-1">Check your inbox</h2>
                <p className="text-[13px] text-white/35">We sent a verification link to your email</p>
              </>
            )}
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-[12px] text-red-300">{error}</p>
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={signupForm.handleSubmit(onRegister)}>
              <Field label="First name" error={se.firstName}>
                <input type="text" placeholder="John"
                  className={inputCls(!!se.firstName)}
                  {...signupForm.register("firstName")} />
              </Field>
              <Field label="Email address" error={se.emailId}>
                <input type="email" placeholder="john@example.com"
                  className={inputCls(!!se.emailId)}
                  {...signupForm.register("emailId")} />
              </Field>
              <Field label="Password" error={se.password} hint="Min 8 chars · 1 uppercase · 1 number · 1 symbol">
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••"
                    className={inputCls(!!se.password) + " pr-11"}
                    {...signupForm.register("password")} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </Field>

              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-white text-sm font-semibold mt-2 transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
                {loading ? "Creating account…" : "Create account →"}
              </button>

              <p className="text-center mt-4 text-[12px] text-white/25">
                Already have an account?{" "}
                <NavLink to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Log in</NavLink>
              </p>

              {/* Trust signals */}
              <div className="flex items-center justify-center gap-4 mt-5 pt-5 border-t border-white/[0.05]">
                {["Free forever", "No spam", "Cancel anytime"].map(t => (
                  <div key={t} className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-emerald-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-[10px] text-white/20">{t}</span>
                  </div>
                ))}
              </div>
            </form>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <EmailSentStep
              email={registeredEmail}
              onResend={handleResend}
              onBack={() => setStep(1)}
              resendTimer={resendTimer}
              loading={loading}
            />
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)" }}>
                <svg className="w-6 h-6 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-['Instrument_Serif'] text-[22px] text-white mb-2">You're in!</p>
              <p className="text-[13px] text-white/40 leading-relaxed">Email verified. Taking you to the dashboard…</p>
              <div className="mt-5 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full animate-[progress_2.2s_linear_forwards]"
                  style={{ background: "linear-gradient(90deg,#8b5cf6,#22d3ee)" }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Sticky nav ────────────────────────────────────────────────────────

function StickyNav({ onGetStarted }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-3" : "py-5"}`}
      style={{ background: scrolled ? "rgba(10,10,15,0.85)" : "transparent", backdropFilter: scrolled ? "blur(16px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
            </svg>
          </div>
          <span className="font-['Instrument_Serif'] text-lg text-white">LogicGrid</span>
        </div>
        <div className="flex items-center gap-3">
          <NavLink to="/login" className="text-[13px] text-white/40 hover:text-white transition-colors hidden sm:block">
            Log in
          </NavLink>
          <button onClick={onGetStarted}
            className="px-5 py-2 rounded-xl text-white text-[13px] font-semibold transition-all hover:opacity-85 active:scale-[.97]"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
            Get started free
          </button>
        </div>
      </div>
    </nav>
  );
}

// ── Root export ───────────────────────────────────────────────────────

export default function Signup() {
  const formRef = useRef(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
        @keyframes pulse-ring {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.06); }
        }
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
        * { box-sizing: border-box; }
      `}</style>

      <div className="min-h-screen bg-[#080810] font-['DM_Sans'] text-white">
        <StickyNav onGetStarted={scrollToForm} />
        <LandingHero onGetStarted={scrollToForm} />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FinalCTASection onGetStarted={scrollToForm} />
        <SignupFormPanel formRef={formRef} />

        {/* Footer */}
        <footer className="border-t border-white/[0.05] px-6 py-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
                <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
                  <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
                </svg>
              </div>
              <span className="font-['Instrument_Serif'] text-sm text-white/50">LogicGrid</span>
            </div>
            <p className="text-[11px] text-white/20">© 2025 LogicGrid · Built for developers, by developers.</p>
            <div className="flex gap-5">
              {["Privacy", "Terms", "Support"].map(l => (
                <a key={l} href="#" className="text-[11px] text-white/25 hover:text-white/60 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

















// import { useState, useEffect, useRef } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate, NavLink } from 'react-router';
// import { registerUser, resendVerification } from '../authSlice';

// const signupSchema = z.object({
//   firstName: z.string().min(3, "Minimum 3 characters required"),
//   emailId:   z.string().email("Invalid email address"),
//   password:  z
//     .string()
//     .min(8, "Minimum 8 characters required")
//     .regex(/[A-Z]/, "Must contain at least one uppercase letter")
//     .regex(/[0-9]/, "Must contain at least one number")
//     .regex(/[^A-Za-z0-9]/, "Must contain at least one symbol"),
// });

// // ── Tiny reusable components ──────────────────────────────────────────

// function StepIndicator({ current }) {
//   const steps = ["Account", "Verify", "Done"];
//   return (
//     <div className="flex items-center mb-8">
//       {steps.map((label, i) => {
//         const num = i + 1;
//         const isDone = current > num;
//         const isActive = current === num;
//         return (
//           <div key={num} className="flex items-center">
//             <div className="flex flex-col items-center gap-1">
//               <div className={`w-7 h-7 rounded-full flex items-center justify-center
//                 text-[11px] font-semibold transition-all duration-300
//                 ${isDone   ? "bg-violet-500/25 text-violet-300"
//                 : isActive ? "bg-gradient-to-br from-violet-500 to-cyan-400 text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]"
//                 :            "bg-white/5 text-white/20"}`}>
//                 {isDone ? "✓" : num}
//               </div>
//               <span className={`text-[10px] font-medium ${isActive ? "text-white/60" : "text-white/20"}`}>
//                 {label}
//               </span>
//             </div>
//             {i < steps.length - 1 && (
//               <div className={`flex-1 h-px mx-2 mb-4 min-w-[32px] transition-all duration-500
//                 ${current > num ? "bg-gradient-to-r from-violet-500 to-cyan-400" : "bg-white/[0.08]"}`} />
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// function Field({ label, error, hint, children }) {
//   return (
//     <div className="flex flex-col gap-1.5 mb-4">
//       <label className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">{label}</label>
//       {children}
//       {hint && !error && <p className="text-[11px] text-white/20">{hint}</p>}
//       {error && <p className="text-[11px] text-red-400/90">{error.message}</p>}
//     </div>
//   );
// }

// const inputCls = (err) =>
//   `w-full px-3.5 py-[11px] bg-white/[0.04] border rounded-xl text-sm text-white
//    placeholder:text-white/15 outline-none transition-all duration-200
//    focus:bg-violet-500/[0.07] focus:shadow-[0_0_0_3px_rgba(139,92,246,0.12)]
//    ${err
//      ? "border-red-500/40 focus:border-red-500/60"
//      : "border-white/[0.08] focus:border-violet-500/50"}`;

// // ── Stats ticker ──────────────────────────────────────────────────────

// function AnimatedNumber({ target, suffix = "" }) {
//   const [val, setVal] = useState(0);
//   const ref = useRef(null);
//   useEffect(() => {
//     const observer = new IntersectionObserver(([e]) => {
//       if (!e.isIntersecting) return;
//       observer.disconnect();
//       let start = 0;
//       const step = target / 60;
//       const tick = () => {
//         start = Math.min(start + step, target);
//         setVal(Math.round(start));
//         if (start < target) requestAnimationFrame(tick);
//       };
//       requestAnimationFrame(tick);
//     }, { threshold: 0.3 });
//     if (ref.current) observer.observe(ref.current);
//     return () => observer.disconnect();
//   }, [target]);
//   return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
// }

// // ── Platform features data ────────────────────────────────────────────

// const FEATURES = [
//   {
//     icon: (
//       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path strokeLinecap="round" strokeLinejoin="round"
//           d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0H3" />
//       </svg>
//     ),
//     color: "violet",
//     title: "1,200+ Curated Problems",
//     desc: "Hand-picked challenges across Arrays, Graphs, DP, Trees, Strings and more — with difficulty tags, topic filters, and company-wise problem sets mirroring real interview rounds.",
//   },
//   {
//     icon: (
//       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path strokeLinecap="round" strokeLinejoin="round"
//           d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
//       </svg>
//     ),
//     color: "cyan",
//     title: "Live Leaderboards",
//     desc: "Compete globally or filter by country, college, or company. Weekly contests with ELO-based ranking keep the competition fresh. Watch your position update in real-time.",
//   },
//   {
//     icon: (
//       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path strokeLinecap="round" strokeLinejoin="round"
//           d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
//       </svg>
//     ),
//     color: "emerald",
//     title: "Deep Solution Analytics",
//     desc: "Per-submission memory and runtime percentiles, visual complexity breakdowns, and side-by-side diffs across your attempts. Know exactly where you're improving.",
//   },
//   {
//     icon: (
//       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path strokeLinecap="round" strokeLinejoin="round"
//           d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
//       </svg>
//     ),
//     color: "amber",
//     title: "Multi-language IDE",
//     desc: "A blazing-fast in-browser code editor supporting Python, Java, C++, Go, Rust, and JavaScript — with syntax highlighting, auto-complete, and instant test-case feedback.",
//   },
//   {
//     icon: (
//       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path strokeLinecap="round" strokeLinejoin="round"
//           d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.091z" />
//       </svg>
//     ),
//     color: "rose",
//     title: "Smart Study Paths",
//     desc: "AI-generated roadmaps that adapt to your weak spots. Get curated problem playlists based on your past performance, targeting exactly the topics you need to master.",
//   },
//   {
//     icon: (
//       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
//         <path strokeLinecap="round" strokeLinejoin="round"
//           d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
//       </svg>
//     ),
//     color: "sky",
//     title: "Active Community",
//     desc: "Discussion threads on every problem, community editorials, weekly code review sessions, and a Discord of 40k+ engineers helping each other crack top-tier interviews.",
//   },
// ];

// const COLOR_MAP = {
//   violet:  { bg: "rgba(139,92,246,0.12)",  border: "rgba(139,92,246,0.25)", text: "text-violet-300" },
//   cyan:    { bg: "rgba(34,211,238,0.10)",   border: "rgba(34,211,238,0.22)", text: "text-cyan-300"   },
//   emerald: { bg: "rgba(52,211,153,0.10)",   border: "rgba(52,211,153,0.22)", text: "text-emerald-300"},
//   amber:   { bg: "rgba(251,191,36,0.10)",   border: "rgba(251,191,36,0.20)", text: "text-amber-300"  },
//   rose:    { bg: "rgba(251,113,133,0.10)",  border: "rgba(251,113,133,0.22)", text: "text-rose-300"  },
//   sky:     { bg: "rgba(56,189,248,0.10)",   border: "rgba(56,189,248,0.22)", text: "text-sky-300"    },
// };

// const TESTIMONIALS = [
//   { name: "Priya S.", role: "SWE @ Google", avatar: "PS", text: "LogicGrid's smart roadmaps helped me go from struggling with medium Graphs to cracking Google L4 in 3 months. Nothing else comes close." },
//   { name: "Arjun M.", role: "CS @ IIT Bombay", avatar: "AM", text: "The real-time leaderboards made me genuinely competitive. I went from rank 4,000 to top 200 in a semester." },
//   { name: "Sara K.", role: "Intern @ Microsoft", avatar: "SK", text: "The in-browser IDE with instant feedback cut my debug time in half. I'd prep nowhere else." },
// ];

// // ── Email sent step ───────────────────────────────────────────────────

// function EmailSentStep({ email, onResend, onBack, resendTimer, loading }) {
//   const steps = ["Open your email app", "Find the email from LogicGrid", 'Click "Verify my account"'];
//   return (
//     <div>
//       <div className="flex justify-center mb-6">
//         <div className="relative" style={{ width: 72, height: 72 }}>
//           <div className="absolute rounded-full" style={{ inset: -6, border: "1px solid rgba(139,92,246,0.2)", animation: "pulse-ring 2s ease-in-out infinite" }} />
//           <div className="absolute rounded-full" style={{ inset: -13, border: "1px solid rgba(139,92,246,0.1)", animation: "pulse-ring 2s ease-in-out infinite 0.5s" }} />
//           <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: "rgba(139,92,246,0.13)", border: "1px solid rgba(139,92,246,0.28)" }}>
//             <svg className="w-8 h-8 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
//             </svg>
//           </div>
//         </div>
//       </div>
//       <div className="flex justify-center mb-5">
//         <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)" }}>
//           <svg className="w-3 h-3 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//             <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
//           </svg>
//           <span className="text-[12px] text-violet-300 font-medium">{email}</span>
//         </div>
//       </div>
//       <div className="flex flex-col gap-2 mb-6">
//         {steps.map((text, i) => (
//           <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
//             <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-violet-300 flex-shrink-0" style={{ background: "rgba(139,92,246,0.2)" }}>{i + 1}</div>
//             <span className="text-[12px] text-white/45">{text}</span>
//           </div>
//         ))}
//       </div>
//       <button type="button" onClick={onResend} disabled={loading || resendTimer > 0}
//         className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[.98]"
//         style={loading || resendTimer > 0
//           ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
//           : { background: "linear-gradient(135deg,#8b5cf6,#22d3ee)", color: "white" }}>
//         {loading ? "Sending…" : resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend verification link"}
//       </button>
//       {resendTimer > 0 && (
//         <div className="mt-2.5 h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
//           <div className="h-full rounded-full transition-all duration-1000"
//             style={{ width: `${(resendTimer / 60) * 100}%`, background: "linear-gradient(90deg,#8b5cf6,#22d3ee)" }} />
//         </div>
//       )}
//       <p className="text-center mt-4 text-[11px] text-white/20 leading-relaxed">Didn't receive it? Check your spam folder.</p>
//       <button type="button" onClick={onBack}
//         className="block w-full text-center mt-3 text-[12px] text-white/20 hover:text-white/50 transition-colors underline underline-offset-4">
//         ← Use a different email
//       </button>
//     </div>
//   );
// }

// // ── Landing hero section ──────────────────────────────────────────────

// function LandingHero({ onGetStarted }) {
//   return (
//     <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20 text-center overflow-hidden">
//       {/* Layered bg orbs */}
//       <div className="absolute inset-0 pointer-events-none">
//         <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] rounded-full opacity-25"
//           style={{ background: "radial-gradient(circle,#8b5cf6 0%,transparent 70%)", filter: "blur(80px)" }} />
//         <div className="absolute bottom-[-10%] right-[5%] w-[400px] h-[400px] rounded-full opacity-15"
//           style={{ background: "radial-gradient(circle,#22d3ee 0%,transparent 70%)", filter: "blur(100px)" }} />
//         <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full opacity-10"
//           style={{ background: "radial-gradient(circle,#a78bfa 0%,transparent 70%)", filter: "blur(60px)", transform: "translateX(-50%)" }} />
//         {/* Grid texture */}
//         <div className="absolute inset-0 opacity-[0.03]"
//           style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
//       </div>

//       {/* Badge */}
//       <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 relative"
//         style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)" }}>
//         <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
//         <span className="text-[11px] font-semibold text-violet-300 tracking-wide uppercase">Now open · Free forever plan</span>
//       </div>

//       {/* Headline */}
//       <h1 className="font-['Instrument_Serif'] text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1.05] mb-6 max-w-3xl">
//         The coding arena<br />
//         <em className="not-italic" style={{ background: "linear-gradient(135deg,#a78bfa,#22d3ee)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
//           built to get you hired
//         </em>
//       </h1>

//       <p className="text-base sm:text-lg text-white/40 max-w-xl leading-relaxed mb-10">
//         LogicGrid combines 1,200+ interview problems, live competitive leaderboards, and AI-powered study paths — so you go from learning to landing your dream offer, faster.
//       </p>

//       {/* CTA buttons */}
//       <div className="flex flex-col sm:flex-row items-center gap-3 mb-16">
//         <button onClick={onGetStarted}
//           className="px-8 py-3.5 rounded-2xl text-white text-sm font-semibold transition-all hover:opacity-90 active:scale-[.97] shadow-[0_0_30px_rgba(139,92,246,0.35)]"
//           style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
//           Start for free →
//         </button>
//         <NavLink to="/login"
//           className="px-8 py-3.5 rounded-2xl text-sm font-semibold text-white/50 hover:text-white transition-colors"
//           style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
//           Already a member? Log in
//         </NavLink>
//       </div>

//       {/* Stats row */}
//       <div className="flex flex-wrap justify-center gap-8 sm:gap-14 relative">
//         {[
//           { target: 1200, suffix: "+", label: "Problems" },
//           { target: 84000, suffix: "+", label: "Developers" },
//           { target: 320,  suffix: "+", label: "Companies" },
//           { target: 97,   suffix: "%", label: "Satisfaction" },
//         ].map(({ target, suffix, label }) => (
//           <div key={label} className="flex flex-col items-center gap-1">
//             <span className="font-['Instrument_Serif'] text-3xl text-white">
//               <AnimatedNumber target={target} suffix={suffix} />
//             </span>
//             <span className="text-[11px] text-white/30 uppercase tracking-widest">{label}</span>
//           </div>
//         ))}
//       </div>

//       {/* Scroll cue */}
//       <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-30">
//         <span className="text-[10px] text-white/50 uppercase tracking-widest">Explore</span>
//         <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//           <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//         </svg>
//       </div>
//     </section>
//   );
// }

// // ── Features grid ─────────────────────────────────────────────────────

// function FeaturesSection() {
//   return (
//     <section className="px-6 py-20 max-w-6xl mx-auto">
//       <div className="text-center mb-14">
//         <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-400 mb-3">Everything you need</p>
//         <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl text-white leading-tight">
//           One platform.<br />Every edge.
//         </h2>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
//         {FEATURES.map(({ icon, color, title, desc }) => {
//           const c = COLOR_MAP[color];
//           return (
//             <div key={title}
//               className="group relative p-6 rounded-2xl overflow-hidden transition-all duration-300 hover:translate-y-[-2px]"
//               style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
//               {/* Hover glow */}
//               <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"
//                 style={{ boxShadow: `inset 0 0 30px ${c.bg}` }} />
//               <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
//                 style={{ background: c.bg, border: `1px solid ${c.border}` }}>
//                 <span className={c.text}>{icon}</span>
//               </div>
//               <h3 className="text-[14px] font-semibold text-white mb-2">{title}</h3>
//               <p className="text-[12px] text-white/35 leading-relaxed">{desc}</p>
//             </div>
//           );
//         })}
//       </div>
//     </section>
//   );
// }

// // ── How it works ──────────────────────────────────────────────────────

// function HowItWorksSection() {
//   const steps = [
//     { n: "01", title: "Create your free account", body: "Sign up in under 60 seconds. No credit card, no paywalls — pick problems and start coding immediately." },
//     { n: "02", title: "Follow your smart roadmap", body: "Our system analyzes your performance and builds a personalized study path that targets your weakest areas first." },
//     { n: "03", title: "Compete and climb", body: "Join weekly contests, track your rank on live leaderboards, and compare solutions with top performers worldwide." },
//     { n: "04", title: "Land the offer", body: "Walk into any technical interview with confidence backed by hundreds of solved problems and verifiable streaks." },
//   ];
//   return (
//     <section className="px-6 py-20 relative overflow-hidden">
//       <div className="absolute inset-0 pointer-events-none"
//         style={{ background: "radial-gradient(ellipse at 50% 50%,rgba(139,92,246,0.07) 0%,transparent 70%)" }} />
//       <div className="max-w-3xl mx-auto">
//         <div className="text-center mb-14">
//           <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-cyan-400 mb-3">The process</p>
//           <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl text-white">Simple. Proven. Fast.</h2>
//         </div>
//         <div className="flex flex-col gap-0">
//           {steps.map(({ n, title, body }, i) => (
//             <div key={n} className="flex gap-6 group">
//               <div className="flex flex-col items-center">
//                 <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-['Instrument_Serif'] text-[13px] transition-all duration-300"
//                   style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}>
//                   {n}
//                 </div>
//                 {i < steps.length - 1 && (
//                   <div className="flex-1 w-px my-2" style={{ background: "rgba(139,92,246,0.18)" }} />
//                 )}
//               </div>
//               <div className={`pb-10 ${i === steps.length - 1 ? "pb-0" : ""}`}>
//                 <h3 className="text-[15px] font-semibold text-white mb-1.5 mt-2">{title}</h3>
//                 <p className="text-[13px] text-white/35 leading-relaxed">{body}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </section>
//   );
// }

// // ── Testimonials ──────────────────────────────────────────────────────

// function TestimonialsSection() {
//   return (
//     <section className="px-6 py-20 max-w-5xl mx-auto">
//       <div className="text-center mb-12">
//         <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-400 mb-3">Real developers</p>
//         <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl text-white">What they're saying</h2>
//       </div>
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {TESTIMONIALS.map(({ name, role, avatar, text }) => (
//           <div key={name} className="p-5 rounded-2xl flex flex-col gap-4"
//             style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
//             <svg className="w-5 h-5 text-violet-500/50" fill="currentColor" viewBox="0 0 24 24">
//               <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
//             </svg>
//             <p className="text-[13px] text-white/50 leading-relaxed flex-1">{text}</p>
//             <div className="flex items-center gap-3 pt-2 border-t border-white/[0.05]">
//               <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
//                 style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
//                 {avatar}
//               </div>
//               <div>
//                 <p className="text-[12px] font-semibold text-white">{name}</p>
//                 <p className="text-[10px] text-white/30">{role}</p>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </section>
//   );
// }

// // ── Final CTA before form ─────────────────────────────────────────────

// function FinalCTASection({ onGetStarted }) {
//   return (
//     <section className="px-6 py-20 flex justify-center">
//       <div className="relative max-w-2xl w-full rounded-3xl overflow-hidden p-10 sm:p-14 text-center"
//         style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)" }}>
//         <div className="absolute inset-0 pointer-events-none"
//           style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(139,92,246,0.2) 0%,transparent 70%)" }} />
//         <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-violet-400 mb-3 relative">No credit card needed</p>
//         <h2 className="font-['Instrument_Serif'] text-4xl sm:text-5xl text-white mb-5 relative">
//           Ready to level up?
//         </h2>
//         <p className="text-[14px] text-white/40 leading-relaxed mb-8 relative max-w-sm mx-auto">
//           Join 84,000+ developers who've already started their journey. Your first problem is waiting.
//         </p>
//         <button onClick={onGetStarted}
//           className="px-10 py-4 rounded-2xl text-white font-semibold text-sm transition-all hover:opacity-90 active:scale-[.97] relative shadow-[0_0_40px_rgba(139,92,246,0.4)]"
//           style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
//           Create my free account →
//         </button>
//       </div>
//     </section>
//   );
// }

// // ── Signup form panel ─────────────────────────────────────────────────

// function SignupFormPanel({ formRef }) {
//   const [step,            setStep]            = useState(1);
//   const [showPassword,    setShowPassword]    = useState(false);
//   const [registeredEmail, setRegisteredEmail] = useState("");
//   const [resendTimer,     setResendTimer]     = useState(0);

//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

//   const signupForm = useForm({ resolver: zodResolver(signupSchema) });
//   const se = signupForm.formState.errors;

//   useEffect(() => { if (isAuthenticated) navigate("/"); }, []);

//   useEffect(() => {
//     if (resendTimer <= 0) return;
//     const t = setTimeout(() => setResendTimer(s => s - 1), 1000);
//     return () => clearTimeout(t);
//   }, [resendTimer]);

//   const onRegister = async (data) => {
//     const result = await dispatch(registerUser(data));
//     if (registerUser.fulfilled.match(result)) {
//       setRegisteredEmail(data.emailId);
//       setResendTimer(60);
//       setStep(2);
//     }
//   };

//   const handleResend = async () => {
//     if (resendTimer > 0 || loading) return;
//     await dispatch(resendVerification(registeredEmail));
//     setResendTimer(60);
//   };

//   return (
//     <section ref={formRef} className="px-6 pb-32 flex justify-center">
//       <div className="w-full max-w-[420px] rounded-3xl overflow-hidden relative"
//         style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}>
//         {/* Top glow strip */}
//         <div className="h-[2px] w-full" style={{ background: "linear-gradient(90deg,transparent,#8b5cf6,#22d3ee,transparent)" }} />

//         <div className="p-8">
//           {/* Header */}
//           <div className="mb-8">
//             <StepIndicator current={step} />
//             {step !== 2 && (
//               <>
//                 <h2 className="font-['Instrument_Serif'] text-[28px] text-white tracking-tight mb-1">
//                   {step === 1 ? "Create your account" : "You're in!"}
//                 </h2>
//                 <p className="text-[13px] text-white/35">
//                   {step === 1 ? "Free forever. No card required." : "Email verified. Taking you to the dashboard…"}
//                 </p>
//               </>
//             )}
//             {step === 2 && (
//               <>
//                 <h2 className="font-['Instrument_Serif'] text-[24px] text-white tracking-tight mb-1">Check your inbox</h2>
//                 <p className="text-[13px] text-white/35">We sent a verification link to your email</p>
//               </>
//             )}
//           </div>

//           {/* Error banner */}
//           {error && (
//             <div className="mb-5 px-4 py-3 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
//               <p className="text-[12px] text-red-300">{error}</p>
//             </div>
//           )}

//           {/* Step 1 */}
//           {step === 1 && (
//             <form onSubmit={signupForm.handleSubmit(onRegister)}>
//               <Field label="First name" error={se.firstName}>
//                 <input type="text" placeholder="John"
//                   className={inputCls(!!se.firstName)}
//                   {...signupForm.register("firstName")} />
//               </Field>
//               <Field label="Email address" error={se.emailId}>
//                 <input type="email" placeholder="john@example.com"
//                   className={inputCls(!!se.emailId)}
//                   {...signupForm.register("emailId")} />
//               </Field>
//               <Field label="Password" error={se.password} hint="Min 8 chars · 1 uppercase · 1 number · 1 symbol">
//                 <div className="relative">
//                   <input type={showPassword ? "text" : "password"} placeholder="••••••••"
//                     className={inputCls(!!se.password) + " pr-11"}
//                     {...signupForm.register("password")} />
//                   <button type="button" onClick={() => setShowPassword(v => !v)}
//                     aria-label={showPassword ? "Hide password" : "Show password"}
//                     className="absolute top-1/2 right-3 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
//                     {showPassword ? (
//                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                       </svg>
//                     ) : (
//                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                         <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                       </svg>
//                     )}
//                   </button>
//                 </div>
//               </Field>

//               <button type="submit" disabled={loading}
//                 className="w-full py-3.5 rounded-xl text-white text-sm font-semibold mt-2 transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.3)]"
//                 style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
//                 {loading ? "Creating account…" : "Create account →"}
//               </button>

//               <p className="text-center mt-4 text-[12px] text-white/25">
//                 Already have an account?{" "}
//                 <NavLink to="/login" className="text-violet-400 hover:text-violet-300 transition-colors">Log in</NavLink>
//               </p>

//               {/* Trust signals */}
//               <div className="flex items-center justify-center gap-4 mt-5 pt-5 border-t border-white/[0.05]">
//                 {["Free forever", "No spam", "Cancel anytime"].map(t => (
//                   <div key={t} className="flex items-center gap-1">
//                     <svg className="w-3 h-3 text-emerald-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                     </svg>
//                     <span className="text-[10px] text-white/20">{t}</span>
//                   </div>
//                 ))}
//               </div>
//             </form>
//           )}

//           {/* Step 2 */}
//           {step === 2 && (
//             <EmailSentStep
//               email={registeredEmail}
//               onResend={handleResend}
//               onBack={() => setStep(1)}
//               resendTimer={resendTimer}
//               loading={loading}
//             />
//           )}

//           {/* Step 3 */}
//           {step === 3 && (
//             <div className="text-center py-6">
//               <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
//                 style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)" }}>
//                 <svg className="w-6 h-6 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                 </svg>
//               </div>
//               <p className="font-['Instrument_Serif'] text-[22px] text-white mb-2">You're in!</p>
//               <p className="text-[13px] text-white/40 leading-relaxed">Email verified. Taking you to the dashboard…</p>
//               <div className="mt-5 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
//                 <div className="h-full rounded-full animate-[progress_2.2s_linear_forwards]"
//                   style={{ background: "linear-gradient(90deg,#8b5cf6,#22d3ee)" }} />
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </section>
//   );
// }

// // ── Sticky nav ────────────────────────────────────────────────────────

// function StickyNav({ onGetStarted }) {
//   const [scrolled, setScrolled] = useState(false);
//   useEffect(() => {
//     const fn = () => setScrolled(window.scrollY > 60);
//     window.addEventListener("scroll", fn, { passive: true });
//     return () => window.removeEventListener("scroll", fn);
//   }, []);
//   return (
//     <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-3" : "py-5"}`}
//       style={{ background: scrolled ? "rgba(10,10,15,0.85)" : "transparent", backdropFilter: scrolled ? "blur(16px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
//       <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
//         <div className="flex items-center gap-2.5">
//           <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
//             <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
//               <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
//             </svg>
//           </div>
//           <span className="font-['Instrument_Serif'] text-lg text-white">LogicGrid</span>
//         </div>
//         <div className="flex items-center gap-3">
//           <NavLink to="/login" className="text-[13px] text-white/40 hover:text-white transition-colors hidden sm:block">
//             Log in
//           </NavLink>
//           <button onClick={onGetStarted}
//             className="px-5 py-2 rounded-xl text-white text-[13px] font-semibold transition-all hover:opacity-85 active:scale-[.97]"
//             style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
//             Get started free
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// }

// // ── Root export ───────────────────────────────────────────────────────

// export default function Signup() {
//   const formRef = useRef(null);

//   const scrollToForm = () => {
//     formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
//   };

//   return (
//     <>
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,400&display=swap');
//         @keyframes pulse-ring {
//           0%, 100% { opacity: 1; transform: scale(1); }
//           50%       { opacity: 0.4; transform: scale(1.06); }
//         }
//         @keyframes progress {
//           from { width: 0%; }
//           to   { width: 100%; }
//         }
//         * { box-sizing: border-box; }
//       `}</style>

//       <div className="min-h-screen bg-[#080810] font-['DM_Sans'] text-white">
//         <StickyNav onGetStarted={scrollToForm} />
//         <LandingHero onGetStarted={scrollToForm} />
//         <FeaturesSection />
//         <HowItWorksSection />
//         <TestimonialsSection />
//         <FinalCTASection onGetStarted={scrollToForm} />
//         <SignupFormPanel formRef={formRef} />

//         {/* Footer */}
//         <footer className="border-t border-white/[0.05] px-6 py-8">
//           <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
//             <div className="flex items-center gap-2">
//               <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "linear-gradient(135deg,#8b5cf6,#22d3ee)" }}>
//                 <svg className="w-3 h-3 fill-white" viewBox="0 0 24 24">
//                   <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
//                 </svg>
//               </div>
//               <span className="font-['Instrument_Serif'] text-sm text-white/50">LogicGrid</span>
//             </div>
//             <p className="text-[11px] text-white/20">© 2025 LogicGrid · Built for developers, by developers.</p>
//             <div className="flex gap-5">
//               {["Privacy", "Terms", "Support"].map(l => (
//                 <a key={l} href="#" className="text-[11px] text-white/25 hover:text-white/60 transition-colors">{l}</a>
//               ))}
//             </div>
//           </div>
//         </footer>
//       </div>
//     </>
//   );
// }


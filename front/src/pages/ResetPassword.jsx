import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { sendResetOTP, resetPassword } from "../authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ── Schemas ───────────────────────────────────────────────────────────

const step1Schema = z.object({
  emailId: z.string().email("Invalid email address"),
});

const step2Schema = z.object({
  otp: z.string().min(4, "OTP must be at least 4 digits"),
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a symbol"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// ── Animated grid background ──────────────────────────────────────────

function GridBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const CELL = 38;
      const cols = Math.floor(canvas.width / CELL) + 2;
      const rows = Math.floor(canvas.height / CELL) + 2;
      const cw = canvas.width / cols;
      const ch = canvas.height / rows;
      t += 0.012;
      for (let i = 0; i < cols * rows; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const phase = ((col * 0.7 + row * 0.5) % (Math.PI * 2));
        const o = Math.max(0, 0.05 + 0.08 * Math.sin(t + phase));
        ctx.strokeStyle = `rgba(124,92,233,${o})`;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(col * cw, row * ch, cw, ch);
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return (
    <canvas ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.3 }}
    />
  );
}

// ── Step indicator ────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Email" },
  { id: 2, label: "Reset" },
  { id: 3, label: "Done" },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((s, i) => {
        const isDone = current > s.id;
        const isActive = current === s.id;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-350
                ${isDone
                  ? "bg-teal-500/20 text-teal-300"
                  : isActive
                  ? "bg-gradient-to-br from-purple-500 to-blue-400 text-white"
                  : "bg-white/[0.06] text-white/20"}`}>
                {isDone ? "✓" : s.id}
              </div>
              <span className={`text-[10px] font-medium transition-colors
                ${isActive ? "text-white/55" : isDone ? "text-white/30" : "text-white/15"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-11 h-px mx-1.5 mb-4 transition-all duration-500
                ${current > s.id
                  ? "bg-gradient-to-r from-purple-500 to-blue-400"
                  : "bg-white/[0.08]"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Input field ───────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
        {label}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-400 mt-0.5">{error.message}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full px-3.5 py-[11px] bg-white/[0.04] border rounded-xl text-sm text-white
   placeholder:text-white/20 outline-none transition-all font-['DM_Sans']
   focus:bg-purple-500/[0.05]
   ${err
     ? "border-red-500/40 focus:border-red-500/60"
     : "border-white/[0.08] focus:border-purple-500/60"}`;

// ── Main component ────────────────────────────────────────────────────

export default function ResetPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const form1 = useForm({ resolver: zodResolver(step1Schema) });
  const form2 = useForm({ resolver: zodResolver(step2Schema) });

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated]);

  const subtitles = {
    1: "Enter your email to receive a one-time code",
    2: "Enter the OTP and choose your new password",
    3: "Your password has been successfully updated",
  };

  const sendOTP = async (data) => {
    const result = await dispatch(sendResetOTP(data.emailId));
    if (sendResetOTP.fulfilled.match(result)) {
      setEmail(data.emailId);
      setStep(2);
    }
  };

  const handleResetPassword = async (data) => {
    const result = await dispatch(
      resetPassword({ emailId: email, otp: data.otp, password: data.password })
    );
    if (resetPassword.fulfilled.match(result)) {
      setStep(3);
    }
  };

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] font-['DM_Sans'] px-4 relative overflow-hidden">

        {/* Animated grid */}
        <GridBackground />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 40%,rgba(99,60,200,0.18) 0%,transparent 60%)" }}
        />

        {/* Card */}
        <div className="w-full max-w-[380px] relative z-10 rounded-2xl px-8 py-10"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(16px)",
          }}>

          {/* Lock icon */}
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
          </div>

          <h1 className="font-['Instrument_Serif'] text-[24px] text-white text-center tracking-tight mb-1">
            Reset password
          </h1>
          <p className="text-[13px] text-white/40 text-center mb-6 leading-relaxed">
            {subtitles[step]}
          </p>

          <StepIndicator current={step} />

          {/* Error banner */}
          {error && (
            <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25">
              <p className="text-[12px] text-red-300">{error}</p>
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <form onSubmit={form1.handleSubmit(sendOTP)}>
              <Field label="Email address" error={form1.formState.errors.emailId}>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={inputCls(!!form1.formState.errors.emailId)}
                  {...form1.register("emailId")}
                />
              </Field>

              <button type="submit" disabled={loading}
                className="w-full mt-1 py-3 rounded-xl text-white text-sm font-semibold
                  transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
                {loading ? "Sending…" : "Send OTP →"}
              </button>

              <button type="button" onClick={() => navigate("/")}
                className="block w-full text-center mt-3 text-[12px] text-white/20
                  hover:text-white/50 transition-colors underline underline-offset-4 cursor-pointer">
                ← Back to dashboard
              </button>
            </form>
          )}

          {/* ── Step 2: OTP + New Password ── */}
          {step === 2 && (
            <form onSubmit={form2.handleSubmit(handleResetPassword)}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="OTP code" error={form2.formState.errors.otp}>
                  <input
                    type="text"
                    placeholder="······"
                    maxLength={6}
                    className={inputCls(!!form2.formState.errors.otp) + " text-center tracking-[0.4em] text-base font-semibold"}
                    {...form2.register("otp")}
                  />
                </Field>
                <Field label="New password" error={form2.formState.errors.password}>
                  <input
                    type="password"
                    placeholder="Min 8 chars"
                    className={inputCls(!!form2.formState.errors.password)}
                    {...form2.register("password")}
                  />
                </Field>
              </div>

              <Field label="Confirm password" error={form2.formState.errors.confirmPassword}>
                <input
                  type="password"
                  placeholder="Repeat password"
                  className={inputCls(!!form2.formState.errors.confirmPassword)}
                  {...form2.register("confirmPassword")}
                />
              </Field>

              <button type="submit" disabled={loading}
                className="w-full mt-1 py-3 rounded-xl text-white text-sm font-semibold
                  transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
                {loading ? "Resetting…" : "Reset password →"}
              </button>

              <button type="button" onClick={() => setStep(1)}
                className="block w-full text-center mt-3 text-[12px] text-white/20
                  hover:text-white/50 transition-colors underline underline-offset-4 cursor-pointer">
                ← Use a different email
              </button>
            </form>
          )}

          {/* ── Step 3: Success ── */}
          {step === 3 && (
            <div className="text-center py-2">
              <div className="w-14 h-14 rounded-full border border-teal-500/30 bg-teal-500/10
                flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-teal-300" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-['Instrument_Serif'] text-[22px] text-white mb-2">
                Password updated!
              </p>
              <p className="text-[13px] text-white/40 leading-relaxed mb-6">
                You can now sign in with your new credentials.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold
                  transition-all hover:opacity-85 active:scale-[.98] cursor-pointer"
                style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
                Go to sign in →
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
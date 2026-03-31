import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import {
  clearError,
  sendResetOTP,
  verifyResetOTP,
  resetPassword,
} from "../authSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ── Schemas ───────────────────────────────────────────────────────────

const step1Schema = z.object({
  emailId: z.string().email("Invalid email address"),
});

const step2Schema = z.object({
  otp: z
    .string()
    .min(6, "OTP must be 6 digits")
    .max(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "OTP must be numeric"),
});

const step3Schema = z.object({
  password: z
    .string()
    .min(8, "Minimum 8 characters")
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number")
    .regex(/[^A-Za-z0-9]/, "Must contain a symbol"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path:    ["confirmPassword"],
});

// ── Animated grid ─────────────────────────────────────────────────────

function GridBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    let animId;
    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const CELL = 38;
      const cols = Math.floor(canvas.width  / CELL) + 2;
      const rows = Math.floor(canvas.height / CELL) + 2;
      const cw   = canvas.width  / cols;
      const ch   = canvas.height / rows;
      t += 0.012;
      for (let i = 0; i < cols * rows; i++) {
        const col   = i % cols;
        const row   = Math.floor(i / cols);
        const phase = (col * 0.7 + row * 0.5) % (Math.PI * 2);
        const o     = Math.max(0, 0.05 + 0.08 * Math.sin(t + phase));
        ctx.strokeStyle = `rgba(124,92,233,${o})`;
        ctx.lineWidth   = 0.5;
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
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.3 }}
    />
  );
}

// ── Step indicator ────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Email"    },
  { id: 2, label: "Verify"   },
  { id: 3, label: "Password" },
  { id: 4, label: "Done"     },
];

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((s, i) => {
        const isDone   = current > s.id;
        const isActive = current === s.id;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center
                text-[11px] font-semibold transition-all duration-300
                ${isDone   ? "bg-teal-500/20 text-teal-300"
                : isActive ? "bg-gradient-to-br from-purple-500 to-blue-400 text-white"
                :            "bg-white/[0.06] text-white/20"}`}>
                {isDone ? "✓" : s.id}
              </div>
              <span className={`text-[10px] font-medium transition-colors
                ${isActive ? "text-white/55" : isDone ? "text-white/30" : "text-white/15"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-7 h-px mx-1 mb-4 transition-all duration-500
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

// ── Field ─────────────────────────────────────────────────────────────

function Field({ label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-white/20">{hint}</p>}
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

// ── Password toggle button ────────────────────────────────────────────

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" onClick={onToggle}
      className="absolute top-1/2 right-3 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
      {show ? (
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
  );
}

// ── Main component ────────────────────────────────────────────────────

export default function ResetPassword() {
  const [step,        setStep]        = useState(1);
  const [email,       setEmail]       = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const redirectTimerRef = useRef(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  // ── 3 separate forms — one per step ──
  const form1 = useForm({ resolver: zodResolver(step1Schema) });
  const form2 = useForm({ resolver: zodResolver(step2Schema) });
  const form3 = useForm({ resolver: zodResolver(step3Schema) });

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    dispatch(clearError());

    return () => {
      dispatch(clearError());
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [dispatch]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch, step]);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const subtitles = {
    1: "Enter your registered email to receive an OTP",
    2: `We sent a 6-digit OTP to ${email}`,
    3: "OTP verified — now set your new password",
    4: "Your password has been successfully updated",
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────────
  const sendOTP = async (data) => {
    const nextEmail = data.emailId.trim();
    setEmail(nextEmail);
    setResendTimer(60);
    form2.reset({ otp: "" });
    form3.reset({ password: "", confirmPassword: "" });
    setStep(2);

    try {
      await dispatch(sendResetOTP(nextEmail)).unwrap();
    } catch {
      // Redux error state renders the banner.
    }
  };

  // ── Step 2: Verify OTP ────────────────────────────────────────────
  const verifyOTP = async (data) => {
    try {
      await dispatch(verifyResetOTP({ otp: data.otp.trim() })).unwrap();
    // cookie is set by backend — no token to store on frontend
      setStep(3);
    } catch {
      // Redux error state renders the banner.
    }
  };

  // ── Step 3: Reset Password ────────────────────────────────────────
  const handleResetPassword = async (data) => {
    try {
      await dispatch(resetPassword({ password: data.password })).unwrap();
    // backend reads resetToken from cookie automatically
      setStep(4);
      redirectTimerRef.current = setTimeout(() => navigate("/login"), 2500);
    } catch {
      // Redux error state renders the banner.
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────
  const handleResend = async () => {
    if (loading || resendTimer > 0) return;

    try {
      await dispatch(sendResetOTP(email)).unwrap();
      setResendTimer(60);
      form2.reset({ otp: "" });
    } catch {
      // Redux error state renders the banner.
    }
  };

  const handleUseDifferentEmail = () => {
    dispatch(clearError());
    setStep(1);
    setEmail("");
    setResendTimer(0);
    setShowPass(false);
    setShowConfirm(false);
    form1.reset();
    form2.reset({ otp: "" });
    form3.reset({ password: "", confirmPassword: "" });
  };

  // ── Email pill ────────────────────────────────────────────────────
  const EmailPill = () => (
    <div className="flex justify-center mb-5">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
        style={{ background: "rgba(124,92,233,0.1)", border: "1px solid rgba(124,92,233,0.25)" }}>
        <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24"
          stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="text-[12px] text-purple-300 font-medium">{email}</span>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]
        font-['DM_Sans'] px-4 relative overflow-hidden">

        <GridBackground />

        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 40%,rgba(99,60,200,0.18) 0%,transparent 60%)" }}
        />

        {/* Card */}
        <div className="w-full max-w-[380px] relative z-10 rounded-2xl px-8 py-10"
          style={{
            background:     "rgba(255,255,255,0.03)",
            border:         "1px solid rgba(255,255,255,0.08)",
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
                <input type="email" placeholder="you@example.com"
                  className={inputCls(!!form1.formState.errors.emailId)}
                  {...form1.register("emailId")} />
              </Field>

              <button type="submit" disabled={loading}
                className="w-full mt-1 py-3 rounded-xl text-white text-sm font-semibold
                  transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
                {loading ? "Sending OTP…" : "Send OTP →"}
              </button>

              <button type="button" onClick={() => navigate("/login")}
                className="block w-full text-center mt-3 text-[12px] text-white/20
                  hover:text-white/50 transition-colors underline underline-offset-4 cursor-pointer">
                ← Back to login
              </button>
            </form>
          )}

          {/* ── Step 2: Verify OTP ── */}
          {step === 2 && (
            <form onSubmit={form2.handleSubmit(verifyOTP)}>
              <EmailPill />

              <Field label="6-digit OTP" error={form2.formState.errors.otp}>
                <input type="text" placeholder="······" maxLength={6}
                  className={inputCls(!!form2.formState.errors.otp) +
                    " text-center tracking-[0.5em] text-base font-semibold"}
                  {...form2.register("otp")} />
              </Field>

              <button type="submit" disabled={loading}
                className="w-full mt-1 py-3 rounded-xl text-white text-sm font-semibold
                  transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
                {loading ? "Verifying…" : "Verify OTP →"}
              </button>

              {/* Resend */}
              <div className="text-center mt-3">
                {resendTimer > 0 ? (
                  <p className="text-[12px] text-white/25">
                    Resend OTP in{" "}
                    <span className="font-semibold text-white/45 tabular-nums">{resendTimer}s</span>
                  </p>
                ) : (
                  <button type="button" onClick={handleResend} disabled={loading}
                    className="text-[12px] text-purple-400 hover:text-purple-300
                      transition-colors underline underline-offset-4 cursor-pointer">
                    Didn't receive it? Resend OTP
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {resendTimer > 0 && (
                <div className="mt-2 h-[2px] rounded-full overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width:      `${(resendTimer / 60) * 100}%`,
                      background: "linear-gradient(90deg,#7c5ce9,#4a9cf6)"
                    }} />
                </div>
              )}

              <button type="button" onClick={handleUseDifferentEmail}
                className="block w-full text-center mt-3 text-[12px] text-white/20
                  hover:text-white/50 transition-colors underline underline-offset-4 cursor-pointer">
                ← Use a different email
              </button>
            </form>
          )}

          {/* ── Step 3: New Password ── */}
          {step === 3 && (
            <form onSubmit={form3.handleSubmit(handleResetPassword)}>
              <EmailPill />

              <Field
                label="New password"
                error={form3.formState.errors.password}
                hint="Min 8 chars · 1 uppercase · 1 number · 1 symbol"
              >
                <div className="relative">
                  <input type={showPass ? "text" : "password"} placeholder="••••••••"
                    className={inputCls(!!form3.formState.errors.password) + " pr-11"}
                    {...form3.register("password")} />
                  <EyeToggle show={showPass} onToggle={() => setShowPass(v => !v)} />
                </div>
              </Field>

              <Field label="Confirm password" error={form3.formState.errors.confirmPassword}>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} placeholder="••••••••"
                    className={inputCls(!!form3.formState.errors.confirmPassword) + " pr-11"}
                    {...form3.register("confirmPassword")} />
                  <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
                </div>
              </Field>

              <button type="submit" disabled={loading}
                className="w-full mt-1 py-3 rounded-xl text-white text-sm font-semibold
                  transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
                {loading ? "Updating password…" : "Update password →"}
              </button>
            </form>
          )}

          {/* ── Step 4: Success ── */}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full border border-teal-500/30
                bg-teal-500/10 flex items-center justify-center mx-auto mb-5">
                <svg className="w-6 h-6 text-teal-300" fill="none" viewBox="0 0 24 24"
                  stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-['Instrument_Serif'] text-[22px] text-white mb-2">
                Password updated!
              </p>
              <p className="text-[13px] text-white/40 leading-relaxed mb-5">
                You can now sign in with your new credentials.
              </p>
              {/* Progress bar auto-redirecting */}
              <div className="h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full rounded-full animate-[progress_2.5s_linear_forwards]"
                  style={{ background: "linear-gradient(90deg,#7c5ce9,#4a9cf6)" }} />
              </div>
              <p className="text-[11px] text-white/20 mt-3">
                Redirecting to login…
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

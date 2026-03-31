import { useState, useEffect } from 'react';
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

// ── Step indicator ────────────────────────────────────────────────────

function StepIndicator({ current }) {
  const steps = ["Account", "Verify", "Done"];
  return (
    <div className="flex items-center mb-8">
      {steps.map((label, i) => {
        const num      = i + 1;
        const isDone   = current > num;
        const isActive = current === num;
        return (
          <div key={num} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center
                text-[11px] font-semibold transition-all duration-300
                ${isDone   ? "bg-purple-500/25 text-purple-300"
                : isActive ? "bg-gradient-to-br from-purple-500 to-blue-400 text-white"
                :            "bg-white/5 text-white/20"}`}>
                {isDone ? "✓" : num}
              </div>
              <span className={`text-[10px] font-medium transition-colors
                ${isActive ? "text-white/60" : "text-white/20"}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-4 transition-all duration-500 min-w-[32px]
                ${current > num + 0.5
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
      {error && <p className="text-[11px] text-red-400">{error.message}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full px-3.5 py-[11px] bg-white/[0.04] border rounded-xl text-sm text-white
   placeholder:text-white/20 outline-none transition-all font-['DM_Sans']
   focus:bg-purple-500/[0.06]
   ${err
     ? "border-red-500/40 focus:border-red-500/60"
     : "border-white/[0.08] focus:border-purple-500/60"}`;

// ── Step 2 — Email sent screen ────────────────────────────────────────
// No OTP input — user just needs to open their email and click the link

function EmailSentStep({ email, onResend, onBack, resendTimer, loading }) {

  const steps = [
    "Open your email app",
    `Find the email from LogicGrid`,
    'Click "Verify my account"',
  ];

  return (
    <div>
      {/* Animated envelope */}
      <div className="flex justify-center mb-6">
        <div className="relative" style={{ width: 72, height: 72 }}>
          <div className="absolute rounded-full"
            style={{
              inset: -6,
              border: "1px solid rgba(124,92,233,0.2)",
              animation: "pulse-ring 2s ease-in-out infinite"
            }} />
          <div className="absolute rounded-full"
            style={{
              inset: -12,
              border: "1px solid rgba(124,92,233,0.1)",
              animation: "pulse-ring 2s ease-in-out infinite 0.4s"
            }} />
          <div className="w-full h-full rounded-full flex items-center justify-center"
            style={{
              background: "rgba(124,92,233,0.12)",
              border:     "1px solid rgba(124,92,233,0.25)"
            }}>
            <svg className="w-8 h-8 text-purple-300" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
        </div>
      </div>

      {/* Email pill */}
      <div className="flex justify-center mb-5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: "rgba(124,92,233,0.1)",
            border:     "1px solid rgba(124,92,233,0.25)"
          }}>
          <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24"
            stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-[12px] text-purple-300 font-medium">{email}</span>
        </div>
      </div>

      {/* 3-step guide */}
      <div className="flex flex-col gap-2 mb-6">
        {steps.map((text, i) => (
          <div key={i}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
            style={{
              background: "rgba(255,255,255,0.02)",
              border:     "1px solid rgba(255,255,255,0.05)"
            }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center
              text-[10px] font-bold text-purple-300 flex-shrink-0"
              style={{ background: "rgba(124,92,233,0.2)" }}>
              {i + 1}
            </div>
            <span className="text-[12px] text-white/45">{text}</span>
          </div>
        ))}
      </div>

      {/* Resend button */}
      <button
        type="button"
        onClick={onResend}
        disabled={loading || resendTimer > 0}
        className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[.98]"
        style={
          loading || resendTimer > 0
            ? { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.25)", cursor: "not-allowed" }
            : { background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)", color: "white", cursor: "pointer" }
        }
      >
        {loading
          ? "Sending…"
          : resendTimer > 0
          ? `Resend in ${resendTimer}s`
          : "Resend verification link"}
      </button>

      {/* Cooldown progress bar */}
      {resendTimer > 0 && (
        <div className="mt-2.5 h-[2px] rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width:      `${(resendTimer / 60) * 100}%`,
              background: "linear-gradient(90deg,#7c5ce9,#4a9cf6)"
            }}
          />
        </div>
      )}

      {/* Help text */}
      <p className="text-center mt-4 text-[11px] text-white/20 leading-relaxed">
        Didn't receive it? Check your spam folder.
      </p>

      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        className="block w-full text-center mt-3 text-[12px] text-white/20
          hover:text-white/50 transition-colors underline underline-offset-4"
      >
        ← Use a different email
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

export default function Signup() {
  const [step,            setStep]            = useState(1);
  const [showPassword,    setShowPassword]    = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendTimer,     setResendTimer]     = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const signupForm = useForm({ resolver: zodResolver(signupSchema) });
  const se         = signupForm.formState.errors;

  // Redirect if already logged in on mount
  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, []);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // ── Step 1: Register + auto-send verification link ──
  const onRegister = async (data) => {
    const result = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(result)) {
      setRegisteredEmail(data.emailId);
      setResendTimer(60); // 60s cooldown on resend
      setStep(2);         // move to "check your email" screen
    }
  };

  // ── Resend link ──
  const handleResend = async () => {
    if (resendTimer > 0 || loading) return;
    await dispatch(resendVerification(registeredEmail));
    setResendTimer(60);
  };

  const subtitles = {
    1: "Welcome — fill in your details below",
    2: "We sent a verification link to your inbox",
    3: "Email verified. Taking you to the dashboard…",
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes pulse-ring {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(1.06); }
        }
      `}</style>

      <div className="min-h-screen flex bg-[#0a0a0f] font-['DM_Sans']">

        {/* ── Left panel ── */}
        <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative border-r border-white/[0.05]">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 20% 50%,rgba(99,60,200,0.18) 0%,transparent 70%),radial-gradient(ellipse at 80% 20%,rgba(56,139,253,0.12) 0%,transparent 60%)" }}
          />

          {/* Brand */}
          <div className="flex items-center gap-2.5 relative z-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
              </svg>
            </div>
            <span className="font-['Instrument_Serif'] text-lg text-white tracking-tight">LogicGrid</span>
          </div>

          {/* Headline */}
          <div className="relative z-10">
            <h2 className="font-['Instrument_Serif'] text-[38px] leading-[1.15] text-white tracking-tight mb-4">
              Start solving.<br />
              <em className="text-purple-300 not-italic">Join thousands</em><br />
              of coders.
            </h2>
            <p className="text-[13px] text-white/40 leading-relaxed max-w-[230px]">
              Track progress, compete on leaderboards, and master algorithms — all in one place.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-3 relative z-10">
            {["1,200+ curated problems", "Real-time leaderboards", "Detailed solution analytics"].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }} />
                <span className="text-[12px] text-white/35">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex items-center justify-center p-6 relative">
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 80% 30%,rgba(99,60,200,0.07) 0%,transparent 60%)" }}
          />

          <div className="w-full max-w-[340px] relative z-10">

            {/* Mobile brand */}
            <div className="flex lg:hidden items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
                </svg>
              </div>
              <span className="font-['Instrument_Serif'] text-lg text-white">LogicGrid</span>
            </div>

            <StepIndicator current={step} />

            {/* Title + subtitle — only show on steps 1 and 3 */}
            {step !== 2 && (
              <>
                <h1 className="font-['Instrument_Serif'] text-[26px] text-white tracking-tight mb-1">
                  {step === 1 ? "Create account" : "You're in!"}
                </h1>
                <p className="text-[13px] text-white/40 mb-6 leading-relaxed">
                  {subtitles[step]}
                </p>
              </>
            )}

            {/* Error banner */}
            {error && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25">
                <p className="text-[12px] text-red-300">{error}</p>
              </div>
            )}

            {/* ── Step 1: Register form ── */}
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

                <Field label="Password" error={se.password}
                  hint="Min 8 chars · 1 uppercase · 1 number · 1 symbol">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={inputCls(!!se.password) + " pr-11"}
                      {...signupForm.register("password")}
                    />
                    <button type="button"
                      onClick={() => setShowPassword(v => !v)}
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
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold mt-1
                    transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40 cursor-pointer"
                  style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
                  {loading ? "Creating account…" : "Create account →"}
                </button>

                <p className="text-center mt-4 text-[12px] text-white/25">
                  Already have an account?{" "}
                  <NavLink to="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
                    Log in
                  </NavLink>
                </p>
              </form>
            )}

            {/* ── Step 2: Check email — NO OTP input ── */}
            {step === 2 && (
              <EmailSentStep
                email={registeredEmail}
                onResend={handleResend}
                onBack={() => setStep(1)}
                resendTimer={resendTimer}
                loading={loading}
              />
            )}

            {/* ── Step 3: Success (reached after clicking link) ── */}
            {step === 3 && (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full border border-purple-500/40 bg-purple-500/15
                  flex items-center justify-center mx-auto mb-5">
                  <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-['Instrument_Serif'] text-[22px] text-white mb-2">You're in!</p>
                <p className="text-[13px] text-white/40 leading-relaxed">
                  Email verified. Your account is ready.<br />Taking you to the dashboard…
                </p>
                <div className="mt-5 h-[2px] bg-white/[0.06] rounded-full overflow-hidden">
                  <div className="h-full rounded-full animate-[progress_2.2s_linear_forwards]"
                    style={{ background: "linear-gradient(90deg,#7c5ce9,#4a9cf6)" }} />
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
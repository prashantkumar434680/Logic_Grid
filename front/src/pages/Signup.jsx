import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser, sendVerifyOTP, verifyOTP } from '../authSlice';

const signupSchema = z.object({
  firstName: z.string().min(3, "Minimum 3 characters required"),
  emailId: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Minimum 8 characters required")
    .regex(/[A-Z]/, "Must contain at least one uppercase letter")
    .regex(/[0-9]/, "Must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Must contain at least one symbol"),
});

const otpSchema = z.object({
  otp: z.string().min(4, "OTP must be at least 4 digits").max(6, "OTP too long"),
});

// ── Step indicator ────────────────────────────────────────────────────

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
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-400
                ${isDone ? "bg-purple-500/25 text-purple-300"
                  : isActive ? "bg-gradient-to-br from-purple-500 to-blue-400 text-white"
                  : "bg-white/5 text-white/20"}`}>
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
                  : "bg-white/8"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Input field ───────────────────────────────────────────────────────

function Field({ label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
        {label}
      </label>
      {children}
      {hint && !error && (
        <p className="text-[11px] text-white/20">{hint}</p>
      )}
      {error && (
        <p className="text-[11px] text-red-400">{error.message}</p>
      )}
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

// ── Main component ────────────────────────────────────────────────────

export default function Signup() {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const signupForm = useForm({ resolver: zodResolver(signupSchema) });
  const otpForm = useForm({ resolver: zodResolver(otpSchema) });
  const se = signupForm.formState.errors;
  const oe = otpForm.formState.errors;

  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const onRegister = async (data) => {
    const result = await dispatch(registerUser(data));
    if (registerUser.fulfilled.match(result)) {
      setRegisteredEmail(data.emailId);
      setStep(2);
      setResendTimer(30);
      await dispatch(sendVerifyOTP());
    }
  };

  const onVerifyOTP = async (data) => {
    const result = await dispatch(verifyOTP(data.otp));
    if (verifyOTP.fulfilled.match(result)) {
      setStep(3);
      setTimeout(() => navigate("/"), 2200);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    await dispatch(sendVerifyOTP());
    setResendTimer(30);
    otpForm.reset();
  };

  const subtitles = {
    1: "Welcome — fill in your details below",
    2: `We sent a 6-digit code to ${registeredEmail || "your inbox"}`,
    3: "Email verified. Taking you to the dashboard…",
  };

  return (
    <>
      {/* Google font import */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="min-h-screen flex bg-[#0a0a0f] font-['DM_Sans']">

        {/* ── Left panel ── */}
        <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative border-r border-white/[0.05]">
          {/* Purple glow */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(99,60,200,0.18) 0%, transparent 70%), radial-gradient(ellipse at 80% 20%, rgba(56,139,253,0.12) 0%, transparent 60%)" }}
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
            {["1,200+ curated problems", "Real-time leaderboards", "Detailed solution analytics"].map((f) => (
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
            style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(99,60,200,0.07) 0%, transparent 60%)" }}
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

            <h1 className="font-['Instrument_Serif'] text-[26px] text-white tracking-tight mb-1">
              {step === 1 ? "Create account" : step === 2 ? "Verify email" : "You're in!"}
            </h1>
            <p className="text-[13px] text-white/40 mb-6 leading-relaxed">
              {subtitles[step]}
            </p>

            {/* Error banner */}
            {error && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25">
                <p className="text-[12px] text-red-300">{error}</p>
              </div>
            )}

            {/* ── Step 1 ── */}
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

            {/* ── Step 2 ── */}
            {step === 2 && (
              <form onSubmit={otpForm.handleSubmit(onVerifyOTP)}>
                <Field label="Verification code" error={oe.otp}>
                  <input type="text" placeholder="· · · · · ·" maxLength={6}
                    className={inputCls(!!oe.otp) + " text-center tracking-[0.5em] text-xl font-semibold"}
                    {...otpForm.register("otp")} />
                </Field>

                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-white text-sm font-semibold mt-1
                    transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
                  {loading ? "Verifying…" : "Verify email →"}
                </button>

                <div className="text-center mt-4">
                  {resendTimer > 0 ? (
                    <p className="text-[12px] text-white/25">
                      Resend code in{" "}
                      <span className="font-semibold text-white/50 tabular-nums">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button type="button" onClick={handleResend}
                      className="text-[12px] text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-4">
                      Didn't receive a code? Resend
                    </button>
                  )}
                </div>

                <button type="button" onClick={() => setStep(1)}
                  className="block w-full text-center mt-3 text-[12px] text-white/20
                    hover:text-white/50 transition-colors underline underline-offset-4">
                  ← Use a different email
                </button>
              </form>
            )}

            {/* ── Step 3 ── */}
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



























// import { useState, useEffect } from 'react';
// import { useForm } from 'react-hook-form';
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { useDispatch, useSelector } from 'react-redux';
// import { useNavigate, NavLink } from 'react-router';
// import { registerUser, sendVerifyOTP, verifyOTP } from '../authSlice';
// import logo from '../assets/logo.png';

// const signupSchema = z.object({
//   firstName: z.string().min(3, "Minimum 3 characters required"),
//   emailId: z.string().email("Invalid email address"),
//   password: z
//     .string()
//     .min(8, "Minimum 8 characters required")
//     .regex(/[A-Z]/, "Must contain at least one uppercase letter")
//     .regex(/[0-9]/, "Must contain at least one number")
//     .regex(/[^A-Za-z0-9]/, "Must contain at least one symbol"),
// });

// const otpSchema = z.object({
//   otp: z.string().min(4, "OTP must be at least 4 digits").max(6, "OTP too long"),
// });

// // ── Reusable components ──────────────────────────────────────────────

// function InputField({ label, error, children }) {
//   return (
//     <div className="flex flex-col gap-1.5 mb-4">
//       <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
//         {label}
//       </label>
//       {children}
//       {error && (
//         <p className="text-xs text-red-500 mt-0.5">{error.message}</p>
//       )}
//     </div>
//   );
// }

// const inputClass = (hasError) =>
//   `w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-gray-800
//    border text-gray-900 dark:text-white placeholder:text-gray-400
//    outline-none transition-all focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700
//    ${hasError
//      ? "border-red-400 focus:border-red-400"
//      : "border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500"
//    }`;

// function StepIndicator({ current }) {
//   const steps = ["Register", "Verify", "Done"];
//   return (
//     <div className="flex items-center justify-center gap-0 mb-7">
//       {steps.map((label, i) => {
//         const num = i + 1;
//         const isDone = current > num;
//         const isActive = current === num;
//         return (
//           <div key={num} className="flex items-center">
//             <div className="flex flex-col items-center gap-1">
//               <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
//                 ${isDone
//                   ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
//                   : isActive
//                   ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
//                   : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
//                 }`}>
//                 {isDone ? "✓" : num}
//               </div>
//               <span className={`text-[10px] font-medium transition-colors
//                 ${isActive ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-600"}`}>
//                 {label}
//               </span>
//             </div>
//             {i < steps.length - 1 && (
//               <div className={`w-10 h-px mb-4 transition-all duration-500
//                 ${isDone ? "bg-gray-900 dark:bg-white" : "bg-gray-200 dark:bg-gray-700"}`}
//               />
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }

// // ── Main Component ────────────────────────────────────────────────────

// function Signup() {
//   const [step, setStep] = useState(1);
//   const [showPassword, setShowPassword] = useState(false);
//   const [registeredEmail, setRegisteredEmail] = useState("");
//   const [resendTimer, setResendTimer] = useState(0);

//   const dispatch = useDispatch();
//   const navigate = useNavigate();
//   const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

//   const signupForm = useForm({ resolver: zodResolver(signupSchema) });
//   const otpForm = useForm({ resolver: zodResolver(otpSchema) });

//   const signupErrors = signupForm.formState.errors;
//   const otpErrors = otpForm.formState.errors;

//   // ✅ Only redirect if already logged in on FIRST MOUNT — never during the signup flow
//   useEffect(() => {
//     if (isAuthenticated) navigate("/");
//   }, []); // ← empty deps — runs once on mount only

//   // Countdown timer for resend OTP
//   useEffect(() => {
//     if (resendTimer <= 0) return;
//     const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
//     return () => clearTimeout(t);
//   }, [resendTimer]);

//   // ── Handlers ──

//   const onRegister = async (data) => {
//     const result = await dispatch(registerUser(data));
//     if (registerUser.fulfilled.match(result)) {
//       setRegisteredEmail(data.emailId);
//       setStep(2);
//       setResendTimer(30);
//       await dispatch(sendVerifyOTP());
//     }
//   };

//   const onVerifyOTP = async (data) => {
//     const result = await dispatch(verifyOTP(data.otp)); // plain string only
//     if (verifyOTP.fulfilled.match(result)) {
//       setStep(3);
//       setTimeout(() => navigate("/"), 2000);
//     }
//   };

//   const handleResendOTP = async () => {
//     if (resendTimer > 0) return;
//     await dispatch(sendVerifyOTP());
//     setResendTimer(30);
//     otpForm.reset();
//   };

//   const subtitles = {
//     1: "Create your account to get started",
//     2: `We sent a code to ${registeredEmail || "your email"}`,
//     3: "You're all set — redirecting you now",
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
//       <button
//         type="button"
//         onClick={() => navigate("/")}
//         className="absolute top-5 left-5 sm:top-6 sm:left-6"
//       >
//         <img src={logo} alt="LogicGrid logo" className="w-16 sm:w-20" />
//       </button>

//       <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm px-8 py-10 relative overflow-hidden">

//         <div className="absolute -top-14 -right-14 w-40 h-40 rounded-full bg-gray-50 dark:bg-gray-800 opacity-60 pointer-events-none" />

//         <div className="w-10 h-10 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center mx-auto mb-3 relative z-10">
//           <svg className="w-5 h-5 fill-white dark:fill-gray-900" viewBox="0 0 24 24">
//             <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
//           </svg>
//         </div>

//         <h1 className="text-xl font-semibold text-center text-gray-900 dark:text-white mb-1 relative z-10">
//           LogicGrid
//         </h1>
//         <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6 leading-relaxed relative z-10">
//           {subtitles[step]}
//         </p>

//         <StepIndicator current={step} />

//         {/* ✅ Global API error banner — shows slice errors on any step */}
//         {error && (
//           <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
//             <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
//           </div>
//         )}

//         {/* ── Step 1: Register ── */}
//         {step === 1 && (
//           <form onSubmit={signupForm.handleSubmit(onRegister)}>
//             <InputField label="First Name" error={signupErrors.firstName}>
//               <input
//                 type="text"
//                 placeholder="John"
//                 className={inputClass(!!signupErrors.firstName)}
//                 {...signupForm.register("firstName")}
//               />
//             </InputField>

//             <InputField label="Email Address" error={signupErrors.emailId}>
//               <input
//                 type="email"
//                 placeholder="john@example.com"
//                 className={inputClass(!!signupErrors.emailId)}
//                 {...signupForm.register("emailId")}
//               />
//             </InputField>

//             <InputField label="Password" error={signupErrors.password}>
//               <div className="relative">
//                 <input
//                   type={showPassword ? "text" : "password"}
//                   placeholder="••••••••"
//                   className={inputClass(!!signupErrors.password) + " pr-11"}
//                   {...signupForm.register("password")}
//                 />
//                 <button
//                   type="button"
//                   aria-label={showPassword ? "Hide password" : "Show password"}
//                   onClick={() => setShowPassword((v) => !v)}
//                   className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
//                 >
//                   {showPassword ? (
//                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
//                     </svg>
//                   ) : (
//                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                     </svg>
//                   )}
//                 </button>
//               </div>
//               {/* Password hint */}
//               {!signupErrors.password && (
//                 <p className="text-[11px] text-gray-400 mt-1">
//                   Min 8 chars · 1 uppercase · 1 number · 1 symbol
//                 </p>
//               )}
//             </InputField>

//             <button
//               type="submit"
//               disabled={loading}
//               className="cursor-pointer w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900
//                 text-white text-sm font-semibold transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-50"
//             >
//               {loading ? "Creating account…" : "Create account →"}
//             </button>

//             {/* <p
//               onClick={() => navigate("/reset-password")}
//               className="text-center mt-3 text-xs text-indigo-500 hover:text-indigo-700 cursor-pointer transition-colors"
//             >
//               Forgot password?
//             </p> */}

//             <p className="text-center mt-3 text-xs text-gray-400">
//               Already have an account?{" "}
//               <NavLink to="/login" className="text-indigo-500 hover:text-indigo-700 transition-colors">
//                 Log in
//               </NavLink>
//             </p>
//           </form>
//         )}

//         {/* ── Step 2: OTP ── */}
//         {step === 2 && (
//           <form onSubmit={otpForm.handleSubmit(onVerifyOTP)}>
//             <InputField label="Verification code" error={otpErrors.otp}>
//               <input
//                 type="text"
//                 placeholder="Enter OTP"
//                 maxLength={6}
//                 className={inputClass(!!otpErrors.otp) + " text-center tracking-[0.4em] text-lg font-semibold"}
//                 {...otpForm.register("otp")}
//               />
//             </InputField>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full mt-2 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900
//                 text-sm font-semibold transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-50"
//             >
//               {loading ? "Verifying…" : "Verify email →"}
//             </button>

//             <div className="text-center mt-4">
//               {resendTimer > 0 ? (
//                 <p className="text-xs text-gray-400">
//                   Resend code in{" "}
//                   <span className="font-semibold text-gray-600 dark:text-gray-300 tabular-nums">
//                     {resendTimer}s
//                   </span>
//                 </p>
//               ) : (
//                 <button
//                   type="button"
//                   onClick={handleResendOTP}
//                   className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors underline underline-offset-4"
//                 >
//                   Didn't receive a code? Resend
//                 </button>
//               )}
//             </div>

//             <button
//               type="button"
//               onClick={() => setStep(1)}
//               className="block w-full text-center mt-3 text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors underline underline-offset-4"
//             >
//               ← Use a different email
//             </button>
//           </form>
//         )}

//         {/* ── Step 3: Success ── */}
//         {step === 3 && (
//           <div className="text-center py-4 relative z-10">
//             <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
//               <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//               </svg>
//             </div>
//             <p className="text-base font-semibold text-gray-900 dark:text-white mb-2">
//               Email verified!
//             </p>
//             <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
//               Your account is ready. Taking you to the dashboard…
//             </p>
//             <div className="mt-4 h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
//               <div className="h-full bg-gray-900 dark:bg-white rounded-full animate-[progress_2s_linear_forwards]" />
//             </div>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// }

// export default Signup;

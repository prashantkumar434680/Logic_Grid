import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { loginUser } from "../authSlice";
import { useEffect, useState } from 'react';
// import { resendVerification } from '../authSlice';
import VerifyAccount from './VerifyAccount';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleLogin } from '@react-oauth/google';


  const handleSocialLogin = (provider) => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    window.location.href = `${API_BASE_URL}/user/${provider}`;
  };


const loginSchema = z.object({
  emailId: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ── Reusable field ────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
        {label}
      </label>
      {children}
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

// ── Stats card ────────────────────────────────────────────────────────

function Stat({ num, label }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3.5">
      <p className="font-['Instrument_Serif'] text-[22px] text-white tracking-tight">{num}</p>
      <p className="text-[11px] text-white/30 mt-0.5">{label}</p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading, error } = useSelector((s) => s.auth);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated) navigate('/');
    
    // Check for verification success message
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
      setVerificationMessage('Email verified successfully! You can now login.');
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = (data) => dispatch(loginUser(data));

  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="min-h-screen flex bg-[#0a0a0f] font-['DM_Sans']">

        {/* ── Left panel ── */}
        <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative border-r border-white/[0.05]">
          {/* Glows */}
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
              Welcome<br />
              <em className="text-purple-300 not-italic">back</em> to<br />
              your grind.
            </h2>
            <p className="text-[13px] text-white/40 leading-relaxed max-w-[230px]">
              Pick up right where you left off. Your streak, progress, and problems are waiting.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 relative z-10">
            <Stat num="1,200+" label="Problems" />
            <Stat num="48k+" label="Coders" />
            <Stat num="97%" label="Uptime" />
            <Stat num="12+" label="Languages" />
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

            <h1 className="font-['Instrument_Serif'] text-[26px] text-white tracking-tight mb-1">
              Sign in
            </h1>
            <p className="text-[13px] text-white/40 mb-6 leading-relaxed">
              Enter your credentials to continue
            </p>

            {/* Success message for email verification */}
            {verificationMessage && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-green-500/10 border border-green-500/25">
                <p className="text-[12px] text-green-300">{verificationMessage}</p>
              </div>
            )}

            {/* API error banner */}
            {error && (
              <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25">
                <p className="text-[12px] text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <Field label="Email address" error={errors.emailId}>
                <input
                  type="email"
                  placeholder="john@example.com"
                  className={inputCls(!!errors.emailId)}
                  {...register("emailId")}
                />
              </Field>

              <Field label="Password" error={errors.password}>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={inputCls(!!errors.password) + " pr-11"}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                  >
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

              {/* Forgot password */}
              <div className="flex justify-end -mt-2 mb-5">
                <span
                  onClick={() => navigate("/reset-password")}
                  className="text-[12px] text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
                >
                  Forgot password?
                </span>
              </div>

               <div className="flex justify-end -mt-2 mb-5">
                <span
                  onClick={() => navigate("/verify")}
                  className="text-[12px] text-purple-400 hover:text-purple-300 cursor-pointer transition-colors"
                >
                  Verify Email?
                </span>
              </div>
            
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white text-sm font-semibold
                  transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40 cursor-pointer"
                style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}
              >
                {loading ? "Signing in…" : "Sign in →"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-2.5 my-5">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-[11px] text-white/20">or continue with</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            {/* Social buttons */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* GitHub */}
              <button
                type="button"
                className="flex items-center justify-center gap-2 py-2.5 bg-white/[0.04]
                  border border-white/[0.08] rounded-xl text-[12px] text-white/60 font-medium
                  hover:bg-white/[0.07] hover:border-white/[0.15] transition-all"
                  provider="github"
                  onClick={() => handleSocialLogin("github")}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.04c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.09 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                GitHub
              </button>

              {/* Google */}
              <button
                // onClick={googleLogin}
                type="button"
                className=" flex items-center justify-center gap-2 py-2.5 bg-white/[0.04]
                  border border-white/[0.08] rounded-xl text-[12px] text-white/60 font-medium
                  hover:bg-white/[0.07] hover:border-white/[0.15] transition-all"
                  provider="google"
                  onClick={() => handleSocialLogin("google")}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>

            <p className="text-center mt-5 text-[12px] text-white/25">
              Don't have an account?{" "}
              <NavLink to="/signup" className="text-purple-400 hover:text-purple-300 transition-colors">
                Sign up
              </NavLink>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
// pages/ResendVerification.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router';
import { resendVerification } from '../authSlice';

export default function ResendVerification() {
  const [email,       setEmail]       = useState('');
  const [sent,        setSent]        = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);

  // Countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!email || loading || resendTimer > 0) return;

    const result = await dispatch(resendVerification(email));
    if (resendVerification.fulfilled.match(result)) {
      setSent(true);
      setResendTimer(60);
    }
  };

  const handleResend = async () => {
    if (loading || resendTimer > 0) return;
    await dispatch(resendVerification(email));
    setResendTimer(60);
  };

  const steps = [
    'Open your email app',
    'Find the email from LogicGrid',
    'Click "Verify my account"',
  ];

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
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 20% 50%,rgba(99,60,200,0.18) 0%,transparent 70%),radial-gradient(ellipse at 80% 20%,rgba(56,139,253,0.12) 0%,transparent 60%)',
            }}
          />

          {/* Brand */}
          <div className="flex items-center gap-2.5 relative z-10">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#7c5ce9,#4a9cf6)' }}
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
              </svg>
            </div>
            <span className="font-['Instrument_Serif'] text-lg text-white tracking-tight">
              LogicGrid
            </span>
          </div>

          {/* Headline */}
          <div className="relative z-10">
            <h2 className="font-['Instrument_Serif'] text-[38px] leading-[1.15] text-white tracking-tight mb-4">
              One step away.<br />
              <em className="text-purple-300 not-italic">Verify your</em>
              <br />
              email to begin.
            </h2>
            <p className="text-[13px] text-white/40 leading-relaxed max-w-[230px]">
              Check your inbox for the verification link we sent, or request a new one below.
            </p>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-3 relative z-10">
            {[
              '1,200+ curated problems',
              'Real-time leaderboards',
              'Detailed solution analytics',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#7c5ce9,#4a9cf6)' }}
                />
                <span className="text-[12px] text-white/35">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="flex-1 flex items-center justify-center p-6 relative">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 80% 30%,rgba(99,60,200,0.07) 0%,transparent 60%)',
            }}
          />

          <div className="w-full max-w-[340px] relative z-10">

            {/* Mobile brand */}
            <div className="flex lg:hidden items-center gap-2.5 mb-8">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#7c5ce9,#4a9cf6)' }}
              >
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
                </svg>
              </div>
              <span className="font-['Instrument_Serif'] text-lg text-white">LogicGrid</span>
            </div>

            {/* ── STEP A: Email input form ── */}
            {!sent && (
              <>
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="relative" style={{ width: 64, height: 64 }}>
                    <div
                      className="absolute rounded-full"
                      style={{
                        inset: -6,
                        border: '1px solid rgba(124,92,233,0.2)',
                        animation: 'pulse-ring 2s ease-in-out infinite',
                      }}
                    />
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(124,92,233,0.12)',
                        border: '1px solid rgba(124,92,233,0.25)',
                      }}
                    >
                      <svg
                        className="w-7 h-7 text-purple-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <h1 className="font-['Instrument_Serif'] text-[26px] text-white tracking-tight mb-1 text-center">
                  Verify your email
                </h1>
                <p className="text-[13px] text-white/40 mb-6 leading-relaxed text-center">
                  Enter the email you signed up with and we'll send you a fresh verification link.
                </p>

                {/* Error banner */}
                {error && (
                  <div className="mb-4 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25">
                    <p className="text-[12px] text-red-300">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSend}>
                  {/* Email field */}
                  <div className="flex flex-col gap-1.5 mb-4">
                    <label className="text-[11px] font-semibold uppercase tracking-widest text-white/30">
                      Email address
                    </label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-[11px] bg-white/[0.04] border border-white/[0.08]
                        rounded-xl text-sm text-white placeholder:text-white/20 outline-none
                        transition-all focus:bg-purple-500/[0.06] focus:border-purple-500/60
                        font-['DM_Sans']"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-3 rounded-xl text-white text-sm font-semibold
                      transition-all hover:opacity-85 active:scale-[.98] disabled:opacity-40 cursor-pointer"
                    style={{ background: 'linear-gradient(135deg,#7c5ce9,#4a9cf6)' }}
                  >
                    {loading ? 'Sending…' : 'Send verification link →'}
                  </button>
                </form>

                <p className="text-center mt-4 text-[12px] text-white/25">
                  Already verified?{' '}
                  <NavLink to="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
                    Log in
                  </NavLink>
                </p>
              </>
            )}

            {/* ── STEP B: Link sent screen ── */}
            {sent && (
              <>
                {/* Animated envelope */}
                <div className="flex justify-center mb-6">
                  <div className="relative" style={{ width: 64, height: 64 }}>
                    <div
                      className="absolute rounded-full"
                      style={{
                        inset: -6,
                        border: '1px solid rgba(124,92,233,0.2)',
                        animation: 'pulse-ring 2s ease-in-out infinite',
                      }}
                    />
                    <div
                      className="absolute rounded-full"
                      style={{
                        inset: -12,
                        border: '1px solid rgba(124,92,233,0.1)',
                        animation: 'pulse-ring 2s ease-in-out infinite 0.4s',
                      }}
                    />
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center"
                      style={{
                        background: 'rgba(124,92,233,0.12)',
                        border: '1px solid rgba(124,92,233,0.25)',
                      }}
                    >
                      <svg
                        className="w-7 h-7 text-purple-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Email pill */}
                <div className="flex justify-center mb-5">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{
                      background: 'rgba(124,92,233,0.1)',
                      border: '1px solid rgba(124,92,233,0.25)',
                    }}
                  >
                    <svg
                      className="w-3 h-3 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-[12px] text-purple-300 font-medium">{email}</span>
                  </div>
                </div>

                {/* 3-step guide */}
                <div className="flex flex-col gap-2 mb-6">
                  {steps.map((text, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center
                          text-[10px] font-bold text-purple-300 flex-shrink-0"
                        style={{ background: 'rgba(124,92,233,0.2)' }}
                      >
                        {i + 1}
                      </div>
                      <span className="text-[12px] text-white/45">{text}</span>
                    </div>
                  ))}
                </div>

                {/* Resend button */}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading || resendTimer > 0}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-[.98]"
                  style={
                    loading || resendTimer > 0
                      ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.25)', cursor: 'not-allowed' }
                      : { background: 'linear-gradient(135deg,#7c5ce9,#4a9cf6)', color: 'white', cursor: 'pointer' }
                  }
                >
                  {loading
                    ? 'Sending…'
                    : resendTimer > 0
                    ? `Resend in ${resendTimer}s`
                    : 'Resend verification link'}
                </button>

                {/* Cooldown progress bar */}
                {resendTimer > 0 && (
                  <div
                    className="mt-2.5 h-[2px] rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(resendTimer / 60) * 100}%`,
                        background: 'linear-gradient(90deg,#7c5ce9,#4a9cf6)',
                      }}
                    />
                  </div>
                )}

                <p className="text-center mt-4 text-[11px] text-white/20 leading-relaxed">
                  Didn't receive it? Check your spam folder.
                </p>

                {/* Use different email */}
                <button
                  type="button"
                  onClick={() => { setSent(false); setEmail(''); setResendTimer(0); }}
                  className="block w-full text-center mt-3 text-[12px] text-white/20
                    hover:text-white/50 transition-colors underline underline-offset-4"
                >
                  ← Use a different email
                </button>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
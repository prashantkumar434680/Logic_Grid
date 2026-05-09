
import { useState } from 'react';
import { useSelector } from 'react-redux';

// ─── Icon Components (inline SVG — no extra deps) ────────────────────────────
const IconCode = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);
const IconLinkedin = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const IconStar = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const IconShare = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ value, label, accent }) {
  return (
    <div style={{
      flex: 1,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '14px 10px',
      textAlign: 'center',
      transition: 'border-color 0.2s, background 0.2s',
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = accent + '55'; e.currentTarget.style.background = accent + '11'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    >
      <div style={{ fontSize: '20px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ label, value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: '#94a3b8', fontFamily: "'DM Mono', monospace" }}>{label}</span>
        <span style={{ fontSize: '12px', color: color, fontFamily: "'DM Mono', monospace", fontWeight: 500 }}>{value}/{max}</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: pct + '%', background: color,
          borderRadius: '99px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
    </div>
  );
}

// ─── Tag ──────────────────────────────────────────────────────────────────────
function Tag({ label, variant = 'skill' }) {
  const styles = {
    skill: {
      background: 'rgba(6,182,212,0.1)',
      color: '#67e8f9',
      border: '1px solid rgba(6,182,212,0.2)',
    },
    lang: {
      background: 'rgba(139,92,246,0.1)',
      color: '#c4b5fd',
      border: '1px solid rgba(139,92,246,0.2)',
      fontFamily: "'DM Mono', monospace",
    },
  };
  return (
    <span style={{
      ...styles[variant],
      display: 'inline-block',
      fontSize: '11px',
      fontWeight: 500,
      padding: '4px 10px',
      borderRadius: '999px',
      transition: 'all 0.15s',
      cursor: 'default',
    }}>{label}</span>
  );
}

// ─── Social Button ────────────────────────────────────────────────────────────
function SocialButton({ href, icon, label, color }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '38px', height: '38px', borderRadius: '10px',
        background: hovered ? color + '22' : 'rgba(255,255,255,0.05)',
        border: `1px solid ${hovered ? color + '55' : 'rgba(255,255,255,0.1)'}`,
        color: hovered ? color : '#94a3b8',
        transition: 'all 0.2s',
        textDecoration: 'none',
      }}
    >
      {icon}
    </a>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ title, children, style = {} }) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.7) 100%)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '18px',
      padding: '20px',
      backdropFilter: 'blur(12px)',
      ...style,
    }}>
      {title && (
        <div style={{
          fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em',
          color: '#475569', textTransform: 'uppercase', marginBottom: '14px',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          {title}
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfileSidebar() {
  const { user } = useSelector((state) => state.auth);
  const [editHovered, setEditHovered] = useState(false);

  const profileData = {
    name: user?.name || 'John Developer',
    handle: user?.username || '@johndeveloper',
    userId: user?.id || 'USR_001',
    rank: 'Expert',
    rankColor: '#f59e0b',
    bio: 'Full-stack developer passionate about solving algorithmic problems and building scalable systems.',
    stats: [
      { value: '342', label: 'Solved', accent: '#06b6d4' },
      { value: '28d', label: 'Streak', accent: '#f59e0b' },
      { value: '#142', label: 'Global', accent: '#8b5cf6' },
    ],
    problems: [
      { label: 'Easy', value: 98, max: 120, color: '#22c55e' },
      { label: 'Medium', value: 187, max: 280, color: '#f59e0b' },
      { label: 'Hard', value: 57, max: 180, color: '#ef4444' },
    ],
    languages: ['JavaScript', 'Python', 'C++', 'Java', 'TypeScript'],
    skills: ['React', 'Node.js', 'Database Design', 'Web Scraping', 'APIs', 'System Design'],
    social: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      email: 'john@example.com',
    },
  };

  const initials = profileData.name.charAt(0).toUpperCase();

  return (
    <>
      {/* Google Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        .profile-sidebar * { box-sizing: border-box; }
        .profile-sidebar { font-family: 'Outfit', sans-serif; }
      `}</style>

      <div
        className="profile-sidebar"
        style={{
          width: '100%',
          maxWidth: '320px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* ── Main Profile Card ── */}
        <div style={{
          background: 'linear-gradient(160deg, #0f172a 0%, #0d1526 60%, #0a1020 100%)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '22px',
          padding: '24px 20px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative glow */}
          <div style={{
            position: 'absolute', top: '-40px', right: '-40px',
            width: '160px', height: '160px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', bottom: '-60px', left: '-40px',
            width: '180px', height: '180px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          {/* Avatar */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '18px' }}>
            <div style={{ position: 'relative', marginBottom: '14px' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '30px', fontWeight: 800, color: '#fff',
                boxShadow: '0 0 0 3px rgba(6,182,212,0.2), 0 8px 32px rgba(6,182,212,0.15)',
              }}>{initials}</div>
              {/* Online dot */}
              <div style={{
                position: 'absolute', bottom: '3px', right: '3px',
                width: '14px', height: '14px', borderRadius: '50%',
                background: '#22c55e',
                border: '2.5px solid #0f172a',
                boxShadow: '0 0 6px rgba(34,197,94,0.6)',
              }} />
            </div>

            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
              {profileData.name}
            </h2>
            <p style={{ margin: '2px 0 4px', fontSize: '12px', color: '#06b6d4', fontFamily: "'DM Mono', monospace" }}>
              {profileData.handle}
            </p>
            <p style={{ margin: 0, fontSize: '10px', color: '#334155', fontFamily: "'DM Mono', monospace" }}>
              ID: {profileData.userId}
            </p>

            {/* Rank Badge */}
            <div style={{
              marginTop: '10px',
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '11px', fontWeight: 600, color: '#fbbf24',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}>
              <IconStar /> {profileData.rank}
            </div>
          </div>

          {/* Stats Row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
            {profileData.stats.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>

          {/* Edit Button */}
          <button
            onMouseEnter={() => setEditHovered(true)}
            onMouseLeave={() => setEditHovered(false)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '7px', padding: '10px',
              background: editHovered
                ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(99,102,241,0.2))'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${editHovered ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '11px', cursor: 'pointer',
              color: editHovered ? '#67e8f9' : '#94a3b8',
              fontSize: '13px', fontWeight: 600, fontFamily: "'Outfit', sans-serif",
              transition: 'all 0.2s', marginBottom: '18px',
            }}
          >
            <IconEdit /> Edit Profile
          </button>

          {/* Bio */}
          <p style={{
            margin: '0 0 18px', fontSize: '13px', color: '#64748b',
            lineHeight: 1.7, textAlign: 'center',
            paddingBottom: '18px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {profileData.bio}
          </p>

          {/* Social Links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            <SocialButton href={profileData.social.github} icon={<IconCode />} label="GitHub" color="#06b6d4" />
            <SocialButton href={profileData.social.linkedin} icon={<IconLinkedin />} label="LinkedIn" color="#6366f1" />
            <SocialButton href={`mailto:${profileData.social.email}`} icon={<IconMail />} label="Email" color="#8b5cf6" />
            <SocialButton href="#" icon={<IconShare />} label="Share" color="#f59e0b" />
          </div>
        </div>

        {/* ── Problem Breakdown ── */}
        <SectionCard title="Problem Breakdown">
          {profileData.problems.map((p) => (
            <ProgressBar key={p.label} {...p} />
          ))}
        </SectionCard>

        {/* ── Languages ── */}
        <SectionCard title="Languages">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {profileData.languages.map((lang) => (
              <Tag key={lang} label={lang} variant="lang" />
            ))}
          </div>
        </SectionCard>

        {/* ── Skills ── */}
        <SectionCard title="Skills">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {profileData.skills.map((skill) => (
              <Tag key={skill} label={skill} variant="skill" />
            ))}
          </div>
        </SectionCard>
      </div>
    </>
  );
}









// import { Code, Share2, Mail, Edit2 } from 'lucide-react';
// import { useSelector } from 'react-redux';

// export default function ProfileSidebar() {
//   const { user } = useSelector((state) => state.auth);

//   // Mock user data - replace with actual data from backend
//   const profileData = {
//     name: user?.name || 'John Developer',
//     handle: user?.username || '@johndeveloper',
//     userId: user?.id || 'USR_001',
//     rank: 'Expert',
//     rankColor: 'from-amber-400 to-amber-600',
//     bio: 'Full-stack developer passionate about solving algorithmic problems and building scalable systems.',
//     languages: ['JavaScript', 'Python', 'C++', 'Java'],
//     skills: ['React', 'Node.js', 'Database Design', 'Web Scraping', 'APIs', 'System Design'],
//     social: {
//       github: 'https://github.com',
//       linkedin: 'https://linkedin.com',
//       email: 'john@example.com',
//     },
//   };

//   return (
//     <div className="w-full lg:w-80 space-y-6">
//       {/* Main Profile Card */}
//       <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
//         {/* Avatar Section */}
//         <div className="flex flex-col items-center mb-6">
//           <div className="relative mb-4">
//             <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
//               {profileData.name.charAt(0).toUpperCase()}
//             </div>
//             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-slate-800 rounded-full"></div>
//           </div>

//           {/* Name and Handle */}
//           <h2 className="text-2xl font-bold text-slate-100 text-center">
//             {profileData.name}
//           </h2>
//           <p className="text-cyan-400 font-medium text-sm">{profileData.handle}</p>
//           <p className="text-slate-400 text-xs mt-1">ID: {profileData.userId}</p>
//         </div>

//         {/* Rank Badge */}
//         <div className="flex justify-center mb-6">
//           <div className={`bg-gradient-to-r ${profileData.rankColor} px-4 py-2 rounded-full text-slate-900 font-bold text-sm`}>
//             {profileData.rank}
//           </div>
//         </div>

//         {/* Edit Profile Button */}
//         <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 mb-4 shadow-lg">
//           <Edit2 className="w-4 h-4" />
//           Edit Profile
//         </button>

//         {/* Bio Section */}
//         <div className="mb-6 pb-6 border-b border-slate-700">
//           <p className="text-slate-300 text-sm leading-relaxed text-center">
//             {profileData.bio}
//           </p>
//         </div>

//         {/* Social Links */}
//         <div className="flex justify-center gap-3 mb-6">
//           <a
//             href={profileData.social.github}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="p-3 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-cyan-400 transition-colors duration-200 hover:scale-110 transform"
//             title="GitHub"
//           >
//             <Code className="w-5 h-5" />
//           </a>
//           <a
//             href={profileData.social.linkedin}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="p-3 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-cyan-400 transition-colors duration-200 hover:scale-110 transform"
//             title="LinkedIn"
//           >
//             <Share2 className="w-5 h-5" />
//           </a>
//           <a
//             href={`mailto:${profileData.social.email}`}
//             className="p-3 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-cyan-400 transition-colors duration-200 hover:scale-110 transform"
//             title="Email"
//           >
//             <Mail className="w-5 h-5" />
//           </a>
//         </div>
//       </div>

//       {/* Languages Section */}
//       <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
//         <h3 className="text-lg font-bold text-slate-100 mb-4">Languages</h3>
//         <div className="grid grid-cols-2 gap-2">
//           {profileData.languages.map((lang, idx) => (
//             <div
//               key={idx}
//               className="bg-gradient-to-r from-slate-700 to-slate-600 px-3 py-2 rounded-lg text-slate-200 text-sm font-medium text-center hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 transition-all duration-200 border border-slate-600 hover:border-cyan-400"
//             >
//               {lang}
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Skills Section */}
//       <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
//         <h3 className="text-lg font-bold text-slate-100 mb-4">Skills</h3>
//         <div className="flex flex-wrap gap-2">
//           {profileData.skills.map((skill, idx) => (
//             <span
//               key={idx}
//               className="px-3 py-1 bg-cyan-500/10 text-cyan-300 text-xs font-medium rounded-full border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-200 cursor-default"
//             >
//               {skill}
//             </span>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';

export default function ProfilePage() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [submissionCalendar, setSubmissionCalendar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('activity');

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const profileResponse = await axiosClient.get('/userData/profile');
        setProfileData(profileResponse.data.user);
        const solvedResponse = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(Array.isArray(solvedResponse.data) ? solvedResponse.data : []);
        const calendarResponse = await axiosClient.get('/submission/calendar');
        setSubmissionCalendar(calendarResponse.data.counts || []);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAllData();
  }, [user]);

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingInner}>
          <div style={styles.loadingOrb} />
          <p style={styles.loadingText}>Loading your profile…</p>
        </div>
        <style>{keyframes}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.loadingScreen}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <p style={{ color: '#f87171', fontSize: 18, marginBottom: 24 }}>{error}</p>
          <button onClick={() => window.location.reload()} style={styles.retryBtn}>
            Retry
          </button>
        </div>
        <style>{keyframes}</style>
      </div>
    );
  }

  const calculateMaxStreak = (calendarData) => {
    let maxStreak = 0, currentStreak = 0;
    calendarData.forEach(day => {
      if (day.count > 0) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
      else currentStreak = 0;
    });
    return maxStreak;
  };

  const generateCalendar = () => {
    const today = new Date();
    const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 363);
    const submissionMap = new Map();
    submissionCalendar.forEach(item => { if (item.date) submissionMap.set(item.date, item.count || 0); });
    return Array.from({ length: 364 }, (_, i) => {
      const d = new Date(startDate);
      d.setUTCDate(startDate.getUTCDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const count = submissionMap.get(dateStr) || 0;
      return { date: dateStr, count, level: count === 0 ? 0 : Math.min(4, Math.ceil(count / 2)) };
    });
  };

  const calculateStats = () => {
    let easy = 0, medium = 0, hard = 0;
    solvedProblems.forEach(p => {
      const d = p?.difficulty || p?.problemId?.difficulty;
      if (d === 'easy') easy++;
      else if (d === 'medium') medium++;
      else if (d === 'hard') hard++;
    });
    return { totalSolved: solvedProblems.length, easy, medium, hard };
  };

  const userData = profileData || user;
  const calendar = generateCalendar();
  const stats = calculateStats();
  const totalSubmissions = submissionCalendar.reduce((sum, item) => sum + (item.count || 0), 0);
  const activeDays = calendar.filter(d => d.count > 0).length;
  const maxStreak = calculateMaxStreak(calendar);

  const calendarColors = [
    'rgba(255,255,255,0.04)',
    'rgba(6,182,212,0.20)',
    'rgba(6,182,212,0.42)',
    'rgba(6,182,212,0.68)',
    'rgba(6,182,212,1)',
  ];

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const difficultyStyle = {
    easy:   { bg: 'rgba(16,185,129,0.12)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
    medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
    hard:   { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)'  },
  };

  const initials = `${userData?.firstName?.charAt(0) || ''}${userData?.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';

  return (
    <div style={styles.root}>
      <style>{keyframes}</style>

      {/* Background mesh */}
      <div style={styles.bgMesh} />
      <div style={styles.bgOrb1} />
      <div style={styles.bgOrb2} />

      {/* Nav */}
      <nav style={styles.nav}>
        <div style={styles.navInner}>
          <button onClick={() => navigate('/')} style={styles.backBtn}>
            <span style={{ fontSize: 18 }}>←</span> Problems
          </button>
          <div style={styles.navLogo}>
            <span style={styles.navLogoIcon}>⬡</span>
            <span style={styles.navLogoText}>LogicGrid</span>
          </div>
          <div style={{ width: 120 }} />
        </div>
      </nav>

      {/* Main */}
      <main style={styles.main}>

        {/* ── Hero Banner ── */}
        <div style={styles.heroBanner}>
          <div style={styles.heroBannerPattern} />
          <div style={styles.heroContent}>
            {/* Avatar */}
            <div style={styles.avatarWrap}>
              {userData?.avatar ? (
                <img src={userData.avatar} alt={userData.firstName} style={styles.avatarImg} />
              ) : (
                <div style={styles.avatarFallback}>{initials}</div>
              )}
              <div style={styles.onlineDot} />
            </div>
            {/* Identity */}
            <div style={styles.heroIdentity}>
              <h1 style={styles.heroName}>
                {userData?.firstName} {userData?.lastName || ''}
              </h1>
              <p style={styles.heroHandle}>@{userData?.firstName?.toLowerCase()}</p>
              {userData?.bio && <p style={styles.heroBio}>{userData.bio}</p>}
              <div style={styles.heroBadgeRow}>
                <span style={{ ...styles.badge, ...styles.badgeCyan }}>{userData?.role || 'User'}</span>
                <span style={{ ...styles.badge, ...styles.badgeSlate }}>ID: {userData?._id?.slice(-8)}</span>
                {userData?.emailId && (
                  <span style={{ ...styles.badge, ...styles.badgeSlate }}>✉ {userData.emailId}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div style={styles.statsGrid}>
          {[
            { label: 'Total Solved', value: stats.totalSolved, accent: '#06b6d4', glow: 'rgba(6,182,212,0.18)', icon: '✓' },
            { label: 'Easy',         value: stats.easy,         accent: '#10b981', glow: 'rgba(16,185,129,0.18)', icon: '◎' },
            { label: 'Medium',       value: stats.medium,       accent: '#f59e0b', glow: 'rgba(245,158,11,0.18)', icon: '◉' },
            { label: 'Hard',         value: stats.hard,         accent: '#ef4444', glow: 'rgba(239,68,68,0.18)', icon: '⬡' },
          ].map((card, i) => (
            <div key={i} style={{ ...styles.statCard, boxShadow: `0 0 32px ${card.glow}, 0 1px 0 rgba(255,255,255,0.06) inset`, borderColor: `${card.accent}30` }}>
              <div style={{ ...styles.statIcon, color: card.accent }}>{card.icon}</div>
              <div style={{ ...styles.statValue, color: card.accent }}>{card.value}</div>
              <div style={styles.statLabel}>{card.label}</div>
              <div style={{ ...styles.statBar, background: `linear-gradient(90deg, ${card.accent}, transparent)`, opacity: card.value > 0 ? 0.3 : 0.08 }} />
            </div>
          ))}
        </div>

        {/* ── Tabs ── */}
        <div style={styles.tabBar}>
          {['activity', 'solved'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ ...styles.tabBtn, ...(activeTab === tab ? styles.tabBtnActive : {}) }}
            >
              {tab === 'activity' ? '⚡ Activity' : '✓ Solved Problems'}
            </button>
          ))}
        </div>

        {/* ── Activity Tab ── */}
        {activeTab === 'activity' && (
          <div style={styles.panel}>
            {/* Header */}
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Submission Calendar</h2>
                <p style={styles.panelSub}>{totalSubmissions.toLocaleString()} submissions in the past year</p>
              </div>
              <div style={styles.streakRow}>
                {[
                  { label: 'Active Days', value: activeDays },
                  { label: 'Max Streak',  value: maxStreak  },
                ].map((s, i) => (
                  <div key={i} style={styles.streakChip}>
                    <span style={styles.streakVal}>{s.value}</span>
                    <span style={styles.streakLabel}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
              <div style={{ minWidth: 760 }}>
                <div style={styles.calendarGrid}>
                  {calendar.map((day, i) => (
                    <div
                      key={i}
                      title={`${formatDate(day.date)}: ${day.count} submission${day.count !== 1 ? 's' : ''}`}
                      style={{
                        ...styles.calCell,
                        background: calendarColors[day.level],
                        boxShadow: day.level >= 3 ? `0 0 6px rgba(6,182,212,0.5)` : 'none',
                      }}
                    />
                  ))}
                </div>
                {/* Month labels */}
                <div style={styles.monthLabels}>
                  {Array.from({ length: 12 }, (_, i) => {
                    const d = new Date();
                    d.setMonth(d.getMonth() - 11 + i);
                    return (
                      <span key={i} style={styles.monthLabel}>
                        {d.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    );
                  })}
                </div>
                {/* Legend */}
                <div style={styles.legend}>
                  <span style={styles.legendText}>Less</span>
                  {calendarColors.map((c, i) => (
                    <div key={i} style={{ ...styles.legendCell, background: c, border: i === 0 ? '1px solid rgba(255,255,255,0.1)' : 'none' }} />
                  ))}
                  <span style={styles.legendText}>More</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Solved Tab ── */}
        {activeTab === 'solved' && (
          <div style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Solved Problems</h2>
                <p style={styles.panelSub}>{solvedProblems.length} problems solved</p>
              </div>
            </div>

            {solvedProblems.length > 0 ? (
              <div style={styles.problemList}>
                {solvedProblems.map((problem, index) => {
                  const pd = problem.problemId || problem;
                  const diff = pd?.difficulty || 'easy';
                  const ds = difficultyStyle[diff] || difficultyStyle.easy;
                  return (
                    <div key={index} style={styles.problemRow}>
                      <div style={styles.problemLeft}>
                        <div style={styles.checkCircle}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p style={styles.problemTitle}>{pd?.title || 'Problem'}</p>
                          <p style={styles.problemSub}>Solved recently</p>
                        </div>
                      </div>
                      <span style={{ ...styles.diffBadge, background: ds.bg, color: ds.color, borderColor: ds.border }}>
                        {diff.charAt(0).toUpperCase() + diff.slice(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>◎</div>
                <p style={styles.emptyTitle}>No problems solved yet</p>
                <p style={styles.emptySub}>Start solving to track your progress here.</p>
                <button onClick={() => navigate('/')} style={styles.browseBtn}>Browse Problems</button>
              </div>
            )}
          </div>
        )}

        {/* ── Footer ── */}
        <footer style={styles.footer}>
          <div style={styles.footerTop}>
            <div>
              <div style={styles.footerLogo}>
                <span style={{ color: '#06b6d4', fontSize: 22 }}>⬡</span>
                <span style={{ fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>LogicGrid</span>
              </div>
              <p style={styles.footerTagline}>A modern coding platform for problem-solving and skill development.</p>
            </div>
            {[
              { heading: 'Platform',   links: ['Problems', 'Contests', 'Discuss'] },
              { heading: 'Resources',  links: ['Documentation', 'Blog', 'FAQ'] },
              { heading: 'Connect',    links: ['Support', 'GitHub', 'Twitter'] },
            ].map((col, i) => (
              <div key={i}>
                <p style={styles.footerHeading}>{col.heading}</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" style={styles.footerLink} onMouseEnter={e => e.target.style.color='#06b6d4'} onMouseLeave={e => e.target.style.color='#64748b'}>
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={styles.footerBottom}>
            <p style={styles.footerCopy}>© 2024 LogicGrid. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 24 }}>
              {['Privacy Policy', 'Terms', 'Cookies'].map(link => (
                <a key={link} href="#" style={styles.footerLink} onMouseEnter={e => e.target.style.color='#06b6d4'} onMouseLeave={e => e.target.style.color='#64748b'}>
                  {link}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = {
  root: {
    minHeight: '100vh',
    background: '#060b14',
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    color: '#e2e8f0',
    position: 'relative',
    overflowX: 'hidden',
  },
  bgMesh: {
    position: 'fixed', inset: 0, zIndex: 0,
    backgroundImage: `
      radial-gradient(ellipse 80% 50% at 20% 20%, rgba(6,182,212,0.07) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 80%, rgba(99,102,241,0.06) 0%, transparent 60%)
    `,
    pointerEvents: 'none',
  },
  bgOrb1: {
    position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
    zIndex: 0, pointerEvents: 'none',
  },
  bgOrb2: {
    position: 'fixed', bottom: -300, left: -200, width: 700, height: 700, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)',
    zIndex: 0, pointerEvents: 'none',
  },
  nav: {
    position: 'sticky', top: 0, zIndex: 100,
    background: 'rgba(6,11,20,0.75)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  navInner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px',
    height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#94a3b8', borderRadius: 10, padding: '8px 16px',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
  },
  navLogo: { display: 'flex', alignItems: 'center', gap: 8 },
  navLogoIcon: { fontSize: 22, color: '#06b6d4' },
  navLogoText: { fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' },
  main: { position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '32px 24px 0' },

  // Hero
  heroBanner: {
    position: 'relative', borderRadius: 24,
    background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(99,102,241,0.08) 50%, rgba(6,11,20,0.6) 100%)',
    border: '1px solid rgba(6,182,212,0.2)',
    padding: '48px 40px',
    marginBottom: 28,
    overflow: 'hidden',
  },
  heroBannerPattern: {
    position: 'absolute', inset: 0,
    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(6,182,212,0.08) 1px, transparent 0)`,
    backgroundSize: '28px 28px',
    pointerEvents: 'none',
  },
  heroContent: { position: 'relative', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarImg: { width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(6,182,212,0.6)', boxShadow: '0 0 32px rgba(6,182,212,0.3)' },
  avatarFallback: {
    width: 100, height: 100, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 36, fontWeight: 800, color: '#fff',
    background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    border: '3px solid rgba(6,182,212,0.5)',
    boxShadow: '0 0 32px rgba(6,182,212,0.3)',
  },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 16, height: 16, borderRadius: '50%',
    background: '#10b981', border: '2px solid #060b14',
    boxShadow: '0 0 8px rgba(16,185,129,0.6)',
  },
  heroIdentity: { flex: 1, minWidth: 200 },
  heroName: { margin: '0 0 4px', fontSize: 32, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-1px', lineHeight: 1.1 },
  heroHandle: { margin: '0 0 10px', fontSize: 15, color: '#06b6d4', fontWeight: 500 },
  heroBio: { margin: '0 0 16px', fontSize: 14, color: '#94a3b8', lineHeight: 1.6, maxWidth: 480 },
  heroBadgeRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
  badge: { fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: '1px solid' },
  badgeCyan: { background: 'rgba(6,182,212,0.12)', color: '#06b6d4', borderColor: 'rgba(6,182,212,0.35)' },
  badgeSlate: { background: 'rgba(255,255,255,0.05)', color: '#94a3b8', borderColor: 'rgba(255,255,255,0.1)' },

  // Stat cards
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 },
  statCard: {
    borderRadius: 18, border: '1px solid', padding: '24px 20px',
    background: 'rgba(255,255,255,0.03)',
    backdropFilter: 'blur(12px)',
    position: 'relative', overflow: 'hidden',
    transition: 'transform 0.2s',
  },
  statIcon: { fontSize: 22, marginBottom: 12, display: 'block' },
  statValue: { fontSize: 42, fontWeight: 800, lineHeight: 1, marginBottom: 6, letterSpacing: '-2px' },
  statLabel: { fontSize: 13, color: '#64748b', fontWeight: 500 },
  statBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: '0 0 18px 18px' },

  // Tabs
  tabBar: { display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 4, border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' },
  tabBtn: {
    padding: '10px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontSize: 14, fontWeight: 600, color: '#64748b', background: 'transparent',
    transition: 'all 0.2s',
  },
  tabBtnActive: {
    background: 'rgba(6,182,212,0.15)',
    color: '#06b6d4',
    boxShadow: '0 0 0 1px rgba(6,182,212,0.3)',
  },

  // Panel
  panel: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 24,
    padding: '28px 32px',
    marginBottom: 28,
    backdropFilter: 'blur(12px)',
  },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 28 },
  panelTitle: { margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' },
  panelSub: { margin: 0, fontSize: 13, color: '#64748b' },
  streakRow: { display: 'flex', gap: 12 },
  streakChip: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '10px 20px', borderRadius: 12,
    background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.2)',
    gap: 2,
  },
  streakVal: { fontSize: 22, fontWeight: 800, color: '#06b6d4', lineHeight: 1 },
  streakLabel: { fontSize: 11, color: '#64748b', fontWeight: 500 },

  // Calendar
  calendarGrid: {
    display: 'grid', gridTemplateRows: 'repeat(7, 14px)', gridAutoFlow: 'column',
    gap: 3, padding: '16px', borderRadius: 14,
    background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.05)',
  },
  calCell: { width: 14, height: 14, borderRadius: 3, transition: 'transform 0.15s, box-shadow 0.15s', cursor: 'default' },
  monthLabels: { display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingLeft: 16, paddingRight: 16 },
  monthLabel: { fontSize: 11, color: '#475569' },
  legend: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 12, paddingLeft: 16 },
  legendText: { fontSize: 11, color: '#475569', marginRight: 4 },
  legendCell: { width: 13, height: 13, borderRadius: 3 },

  // Problem list
  problemList: { display: 'flex', flexDirection: 'column', gap: 10 },
  problemRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 18px', borderRadius: 14,
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
    transition: 'border-color 0.2s, background 0.2s',
  },
  problemLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  checkCircle: {
    width: 34, height: 34, borderRadius: '50%',
    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  problemTitle: { margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: '#e2e8f0' },
  problemSub: { margin: 0, fontSize: 12, color: '#475569' },
  diffBadge: { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, border: '1px solid' },

  // Empty
  emptyState: { textAlign: 'center', padding: '48px 0' },
  emptyIcon: { fontSize: 48, color: '#334155', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: '#64748b', margin: '0 0 8px' },
  emptySub: { fontSize: 14, color: '#475569', margin: '0 0 24px' },
  browseBtn: {
    padding: '12px 28px', borderRadius: 12, border: 'none', cursor: 'pointer',
    background: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    color: '#fff', fontWeight: 700, fontSize: 14,
    boxShadow: '0 4px 20px rgba(6,182,212,0.35)',
  },

  // Footer
  footer: { borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 48, paddingBottom: 32, marginTop: 16 },
  footerTop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 },
  footerLogo: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 },
  footerTagline: { fontSize: 13, color: '#475569', lineHeight: 1.7, maxWidth: 280, margin: 0 },
  footerHeading: { fontSize: 13, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16, marginTop: 0 },
  footerLink: { fontSize: 14, color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' },
  footerBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: 12 },
  footerCopy: { fontSize: 13, color: '#475569', margin: 0 },

  // Loading
  loadingScreen: {
    minHeight: '100vh', background: '#060b14',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'DM Sans', sans-serif",
  },
  loadingInner: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 },
  loadingOrb: {
    width: 56, height: 56, borderRadius: '50%',
    border: '3px solid rgba(6,182,212,0.2)',
    borderTop: '3px solid #06b6d4',
    animation: 'spin 1s linear infinite',
  },
  loadingText: { color: '#64748b', fontSize: 14, margin: 0 },
  retryBtn: {
    padding: '10px 24px', borderRadius: 10, border: 'none',
    background: '#06b6d4', color: '#fff', fontWeight: 700, cursor: 'pointer',
  },
};

const keyframes = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Responsive */
  @media (max-width: 900px) {
    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 600px) {
    .footer-top { grid-template-columns: 1fr 1fr !important; }
  }
`;











// import { useState, useEffect } from 'react';
// import { useSelector } from 'react-redux';
// import { useNavigate } from 'react-router';
// import axiosClient from '../utils/axiosClient';

// export default function ProfilePage() {
//   const { user } = useSelector((state) => state.auth);
//   const navigate = useNavigate();
//   const [profileData, setProfileData] = useState(null);
//   const [solvedProblems, setSolvedProblems] = useState([]);
//   const [submissionCalendar, setSubmissionCalendar] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     const fetchAllData = async () => {
//       try {
//         setLoading(true);
        
//         // Fetch profile data
//         const profileResponse = await axiosClient.get('/userData/profile');
//         setProfileData(profileResponse.data.user);
        
//         // Fetch solved problems
//         const solvedResponse = await axiosClient.get('/problem/problemSolvedByUser');
//         setSolvedProblems(Array.isArray(solvedResponse.data) ? solvedResponse.data : []);
        
//         // Fetch submission calendar
//         const calendarResponse = await axiosClient.get('/submission/calendar');
//         setSubmissionCalendar(calendarResponse.data.counts || []);
        
//       } catch (err) {
//         console.error('Failed to fetch data:', err);
//         setError('Failed to load profile data');
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (user) {
//       fetchAllData();
//     }
//   }, [user]);

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
//         <div className="text-center">
//           <div className="loading loading-spinner loading-lg text-cyan-400"></div>
//           <p className="text-slate-400 mt-4">Loading your profile...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-red-400 text-xl mb-4">⚠️ {error}</div>
//           <button 
//             onClick={() => window.location.reload()} 
//             className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
//           >
//             Retry
//           </button>
//         </div>
//       </div>
//     );
//   }

//   // Calculate max streak
//   const calculateMaxStreak = (calendarData) => {
//     let maxStreak = 0;
//     let currentStreak = 0;
    
//     calendarData.forEach(day => {
//       if (day.count > 0) {
//         currentStreak++;
//         maxStreak = Math.max(maxStreak, currentStreak);
//       } else {
//         currentStreak = 0;
//       }
//     });
    
//     return maxStreak;
//   };

//   // Generate calendar data
//   const generateCalendar = () => {
//     const today = new Date();
//     const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
//     const startDate = new Date(endDate);
//     startDate.setUTCDate(startDate.getUTCDate() - 363); // 364 days total

//     const calendarData = [];
//     const submissionMap = new Map();
    
//     // Create map of submission counts by date
//     submissionCalendar.forEach(item => {
//       if (item.date) {
//         submissionMap.set(item.date, item.count || 0);
//       }
//     });

//     // Generate 364 days of calendar data
//     for (let i = 0; i < 364; i++) {
//       const currentDate = new Date(startDate);
//       currentDate.setUTCDate(startDate.getUTCDate() + i);
      
//       const dateStr = currentDate.toISOString().split('T')[0];
//       const count = submissionMap.get(dateStr) || 0;
      
//       calendarData.push({
//         date: dateStr,
//         count: count,
//         level: count === 0 ? 0 : Math.min(4, Math.ceil(count / 2)) // 0-4 levels
//       });
//     }

//     return calendarData;
//   };

//   // Calculate stats from solved problems
//   const calculateStats = () => {
//     const totalSolved = solvedProblems.length;
//     let easy = 0, medium = 0, hard = 0;
    
//     solvedProblems.forEach(problem => {
//       const difficulty = problem?.difficulty || problem?.problemId?.difficulty;
//       if (difficulty === 'easy') easy++;
//       else if (difficulty === 'medium') medium++;
//       else if (difficulty === 'hard') hard++;
//     });

//     return { totalSolved, easy, medium, hard };
//   };

//   const userData = profileData || user;
//   const calendar = generateCalendar();
//   const stats = calculateStats();
//   const totalSubmissions = submissionCalendar.reduce((sum, item) => sum + (item.count || 0), 0);

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
//       {/* Simple Navbar */}
//       <nav className="bg-slate-900/50 border-b border-slate-700 px-6 py-4">
//         <div className="flex items-center justify-between max-w-7xl mx-auto">
//           <button 
//             onClick={() => navigate('/')}
//             className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
//           >
//             ← Back to Problems
//           </button>
//           <h1 className="text-xl font-bold text-white">Profile</h1>
//           <div></div>
//         </div>
//       </nav>

//       {/* Main Content */}
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
//           {/* Left Sidebar - Profile Info */}
//           <div className="lg:col-span-1">
//             <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
//               {/* Avatar Section */}
//               <div className="flex flex-col items-center mb-6">
//                 <div className="relative mb-4">
//                   {userData?.avatar ? (
//                     <img 
//                       src={userData.avatar} 
//                       alt={userData.firstName}
//                       className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400"
//                     />
//                   ) : (
//                     <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
//                       {userData?.firstName?.charAt(0)?.toUpperCase() || 'U'}
//                     </div>
//                   )}
//                   <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-slate-800 rounded-full"></div>
//                 </div>

//                 {/* Name and Info */}
//                 <h2 className="text-2xl font-bold text-slate-100 text-center">
//                   {userData?.firstName} {userData?.lastName || ''}
//                 </h2>
//                 <p className="text-cyan-400 font-medium text-sm">@{userData?.firstName?.toLowerCase()}</p>
//                 <p className="text-slate-400 text-xs mt-1">ID: {userData?._id?.slice(-8)}</p>
//               </div>

//               {/* Bio */}
//               {userData?.bio && (
//                 <div className="mb-6 pb-6 border-b border-slate-700">
//                   <p className="text-slate-300 text-sm leading-relaxed text-center">
//                     {userData.bio}
//                   </p>
//                 </div>
//               )}

//               {/* Stats */}
//               <div className="space-y-3">
//                 <div className="flex justify-between items-center">
//                   <span className="text-slate-400">Email:</span>
//                   <span className="text-slate-200 text-sm">{userData?.emailId}</span>
//                 </div>
//                 {userData?.age && (
//                   <div className="flex justify-between items-center">
//                     <span className="text-slate-400">Age:</span>
//                     <span className="text-slate-200">{userData.age}</span>
//                   </div>
//                 )}
//                 <div className="flex justify-between items-center">
//                   <span className="text-slate-400">Role:</span>
//                   <span className="text-cyan-400 capitalize">{userData?.role || 'User'}</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Right Content - Stats & Activity */}
//           <div className="lg:col-span-2 space-y-8">
            
//             {/* Stats Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//               <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30">
//                 <div className="text-cyan-400 text-3xl font-bold">✓</div>
//                 <div className="text-slate-300 text-sm font-medium mb-1">Total Solved</div>
//                 <div className="text-4xl font-bold text-cyan-400">{stats.totalSolved}</div>
//               </div>
              
//               <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
//                 <div className="text-green-400 text-3xl font-bold">●</div>
//                 <div className="text-slate-300 text-sm font-medium mb-1">Easy</div>
//                 <div className="text-4xl font-bold text-green-400">{stats.easy}</div>
//               </div>
              
//               <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
//                 <div className="text-yellow-400 text-3xl font-bold">●</div>
//                 <div className="text-slate-300 text-sm font-medium mb-1">Medium</div>
//                 <div className="text-4xl font-bold text-yellow-400">{stats.medium}</div>
//               </div>
              
//               <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
//                 <div className="text-red-400 text-3xl font-bold">●</div>
//                 <div className="text-slate-300 text-sm font-medium mb-1">Hard</div>
//                 <div className="text-4xl font-bold text-red-400">{stats.hard}</div>
//               </div>
//             </div>

//             {/* Submission Activity Calendar */}
//             <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
//               <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
//                 <div>
//                   <h2 className="text-2xl font-bold text-slate-100">Submission Activity</h2>
//                   <p className="text-slate-400 text-sm">
//                     {totalSubmissions} submissions in the past year
//                   </p>
//                 </div>
//                 <div className="flex gap-4 text-sm text-slate-400">
//                   <span>
//                     Active days: <span className="text-slate-100 font-semibold">{calendar.filter(day => day.count > 0).length}</span>
//                   </span>
//                   <span>
//                     Max streak: <span className="text-slate-100 font-semibold">{calculateMaxStreak(calendar)}</span>
//                   </span>
//                 </div>
//               </div>
              
//               {/* Calendar Grid */}
//               <div className="overflow-x-auto">
//                 <div className="grid grid-flow-col grid-rows-7 gap-1 rounded-xl bg-slate-950/40 p-4 border border-slate-700 min-w-[760px]">
//                   {calendar.map((day, i) => {
//                     const colors = [
//                       'bg-slate-700/70',           // 0 submissions
//                       'bg-emerald-900/70',         // 1-2 submissions
//                       'bg-emerald-700/80',         // 3-4 submissions
//                       'bg-emerald-500/85',         // 5-6 submissions
//                       'bg-emerald-300'             // 7+ submissions
//                     ];
                    
//                     const formatDate = (dateStr) => {
//                       const date = new Date(dateStr);
//                       return date.toLocaleDateString('en-US', { 
//                         weekday: 'short', 
//                         year: 'numeric', 
//                         month: 'short', 
//                         day: 'numeric' 
//                       });
//                     };
                    
//                     return (
//                       <div
//                         key={i}
//                         className={`h-3.5 w-3.5 rounded-sm ${colors[day.level]} transition-transform hover:scale-110 cursor-pointer`}
//                         title={`${formatDate(day.date)}: ${day.count} submission${day.count === 1 ? '' : 's'}`}
//                       />
//                     );
//                   })}
//                 </div>
                
//                 {/* Month labels */}
//                 <div className="mt-3 flex items-center justify-between text-xs text-slate-500 min-w-[760px]">
//                   {Array.from({ length: 12 }, (_, i) => {
//                     const monthDate = new Date();
//                     monthDate.setMonth(monthDate.getMonth() - 11 + i);
//                     return (
//                       <span key={i}>
//                         {monthDate.toLocaleDateString('en-US', { month: 'short' })}
//                       </span>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>

//             {/* Recent Problems */}
//             <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
//               <h2 className="text-2xl font-bold text-slate-100 mb-4">Recent Activity</h2>
              
//               {solvedProblems.length > 0 ? (
//                 <div className="space-y-3">
//                   {solvedProblems.slice(0, 5).map((problem, index) => {
//                     const problemData = problem.problemId || problem;
//                     const difficultyColors = {
//                       easy: 'bg-green-500/10 text-green-400 border-green-500/30',
//                       medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
//                       hard: 'bg-red-500/10 text-red-400 border-red-500/30'
//                     };
                    
//                     return (
//                       <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-cyan-500/50 transition-colors">
//                         <div className="flex items-center gap-3">
//                           <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
//                             <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
//                             </svg>
//                           </div>
//                           <div>
//                             <h3 className="text-slate-100 font-medium">{problemData?.title || 'Problem'}</h3>
//                             <p className="text-slate-400 text-sm">Solved recently</p>
//                           </div>
//                         </div>
//                         <div className={`px-3 py-1 rounded-full text-xs font-bold border ${difficultyColors[problemData?.difficulty] || difficultyColors.easy}`}>
//                           {problemData?.difficulty || 'Easy'}
//                         </div>
//                       </div>
//                     );
//                   })}
                  
//                   {solvedProblems.length > 5 && (
//                     <button 
//                       onClick={() => navigate('/')}
//                       className="w-full mt-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition-all duration-200 font-medium"
//                     >
//                       View All Solved Problems ({solvedProblems.length})
//                     </button>
//                   )}
//                 </div>
//               ) : (
//                 <div className="text-center py-8">
//                   <div className="text-slate-400 text-lg mb-2">No recent activity</div>
//                   <p className="text-slate-500 text-sm">Start solving problems to see your activity here!</p>
//                   <button 
//                     onClick={() => navigate('/')}
//                     className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
//                   >
//                     Browse Problems
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

//       {/* Footer */}
//       <footer className="border-t border-slate-700 mt-16">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
//             <div>
//               <h3 className="font-bold text-slate-100 mb-4">LogicGrid</h3>
//               <p className="text-slate-400 text-sm">
//                 A modern coding platform for problem-solving and skill development.
//               </p>
//             </div>
//             <div>
//               <h4 className="font-bold text-slate-100 mb-4">Platform</h4>
//               <ul className="space-y-2 text-slate-400 text-sm">
//                 <li><a href="#" className="hover:text-cyan-400 transition-colors">Problems</a></li>
//                 <li><a href="#" className="hover:text-cyan-400 transition-colors">Contests</a></li>
//                 <li><a href="#" className="hover:text-cyan-400 transition-colors">Discuss</a></li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-bold text-slate-100 mb-4">Resources</h4>
//               <ul className="space-y-2 text-slate-400 text-sm">
//                 <li><a href="#" className="hover:text-cyan-400 transition-colors">Documentation</a></li>
//                 <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
//                 <li><a href="#" className="hover:text-cyan-400 transition-colors">FAQ</a></li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-bold text-slate-100 mb-4">Contact</h4>
//               <ul className="space-y-2 text-slate-400 text-sm">
//                 <li><a href="#" className="hover:text-cyan-400 transition-colors">Support</a></li>
//                 <li><a href="#" className="hover:text-cyan-400 transition-colors">GitHub</a></li>
//                 <li><a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a></li>
//               </ul>
//             </div>
//           </div>
//           <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center">
//             <p className="text-slate-400 text-sm mb-4 md:mb-0">
//               © 2024 LogicGrid. All rights reserved.
//             </p>
//             <div className="flex gap-6 text-slate-400 text-sm">
//               <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
//               <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
//               <a href="#" className="hover:text-cyan-400 transition-colors">Cookie Policy</a>
//             </div>
//           </div>
//         </div>
//       </footer>


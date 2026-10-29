import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';
import axiosClient from '../utils/axiosClient';
import DsaLearningAssistant from '../components/DsaLearningAssistant';

export default function ProfilePage() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [submissionCalendar, setSubmissionCalendar] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('analytics');
  const [selectedTopicForAi, setSelectedTopicForAi] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const [profileRes, solvedRes, calendarRes, analyticsRes] = await Promise.allSettled([
          axiosClient.get('/userData/profile'),
          axiosClient.get('/problem/problemSolvedByUser'),
          axiosClient.get('/submission/calendar'),
          axiosClient.get('/learning/analytics'),
        ]);

        if (profileRes.status === 'fulfilled') {
          setProfileData(profileRes.value.data.user);
        }
        if (solvedRes.status === 'fulfilled') {
          setSolvedProblems(Array.isArray(solvedRes.value.data) ? solvedRes.value.data : []);
        }
        if (calendarRes.status === 'fulfilled') {
          setSubmissionCalendar(calendarRes.value.data.counts || []);
        }
        if (analyticsRes.status === 'fulfilled') {
          setAnalyticsData(analyticsRes.value.data);
        }
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
          <p style={styles.loadingText}>Loading your profile & skill analytics…</p>
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

  const overview = analyticsData?.overview || {};
  const topicWise = analyticsData?.topicWise || [];
  const strongTopics = analyticsData?.strongTopics || [];
  const weakTopics = analyticsData?.weakTopics || [];
  const insufficientPracticeTopics = analyticsData?.insufficientPracticeTopics || [];

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
          {[
            { id: 'analytics', label: '⚡ DSA Skill Analytics' },
            { id: 'activity',  label: '📅 Submission Activity' },
            { id: 'solved',    label: '✓ Solved Problems' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ ...styles.tabBtn, ...(activeTab === tab.id ? styles.tabBtnActive : {}) }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab 1: DSA Skill Analytics ── */}
        {activeTab === 'analytics' && (
          <div style={styles.panel}>
            {/* Header */}
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Personalized DSA Skill Analytics</h2>
                <p style={styles.panelSub}>
                  Explainable mastery evaluation based on your unique solve rates, attempt accuracy, and problem difficulty.
                </p>
              </div>
              <div style={styles.trendBadgeWrap}>
                <span style={styles.trendLabel}>Recent Trend:</span>
                <span
                  style={{
                    ...styles.trendBadge,
                    background:
                      overview.recentTrend === 'improving'
                        ? 'rgba(16,185,129,0.15)'
                        : overview.recentTrend === 'declining'
                        ? 'rgba(239,68,68,0.15)'
                        : 'rgba(6,182,212,0.15)',
                    color:
                      overview.recentTrend === 'improving'
                        ? '#10b981'
                        : overview.recentTrend === 'declining'
                        ? '#ef4444'
                        : '#06b6d4',
                    border:
                      overview.recentTrend === 'improving'
                        ? '1px solid rgba(16,185,129,0.3)'
                        : overview.recentTrend === 'declining'
                        ? '1px solid rgba(239,68,68,0.3)'
                        : '1px solid rgba(6,182,212,0.3)',
                  }}
                >
                  {overview.recentTrend === 'improving' ? '📈 Improving' : overview.recentTrend === 'declining' ? '📉 Needs Focus' : '➡️ Steady'}
                </span>
              </div>
            </div>

            {/* Top KPI Metrics Row */}
            <div style={styles.analyticsKpiGrid}>
              <div style={styles.kpiCard}>
                <p style={styles.kpiLabel}>Estimated Overall Mastery</p>
                <div style={styles.kpiValueRow}>
                  <span style={{ ...styles.kpiNumber, color: '#06b6d4' }}>
                    {overview.estimatedOverallMastery ?? 0}%
                  </span>
                  <div style={styles.masteryPill}>
                    {(overview.estimatedOverallMastery ?? 0) < 45
                      ? 'Beginner'
                      : (overview.estimatedOverallMastery ?? 0) < 75
                      ? 'Intermediate'
                      : 'Advanced'}
                  </div>
                </div>
                <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.progressBarFill,
                      width: `${overview.estimatedOverallMastery ?? 0}%`,
                      background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                    }}
                  />
                </div>
              </div>

              <div style={styles.kpiCard}>
                <p style={styles.kpiLabel}>Unique Problems Solved</p>
                <div style={styles.kpiValueRow}>
                  <span style={{ ...styles.kpiNumber, color: '#10b981' }}>
                    {overview.totalUniqueSolved ?? 0}
                  </span>
                  <span style={styles.kpiSubText}>
                    / {overview.totalAvailableInPlatform ?? 0} total on platform
                  </span>
                </div>
                <p style={styles.kpiFootnote}>
                  Attempted: {overview.totalUniqueAttempted ?? 0} unique
                </p>
              </div>

              <div style={styles.kpiCard}>
                <p style={styles.kpiLabel}>Observed Success Rate</p>
                <div style={styles.kpiValueRow}>
                  <span style={{ ...styles.kpiNumber, color: '#f59e0b' }}>
                    {overview.observedSuccessRate ?? 0}%
                  </span>
                </div>
                <p style={styles.kpiFootnote}>
                  {overview.acceptedSubmissions ?? 0} accepted / {overview.totalSubmissions ?? 0} total submissions
                </p>
              </div>
            </div>

            {/* Strengths & Weaknesses Summary Badges */}
            <div style={styles.insightsRow}>
              <div style={styles.insightBox}>
                <span style={styles.insightTitleGreen}>🌟 Strong Topics ({strongTopics.length})</span>
                <div style={styles.chipRow}>
                  {strongTopics.length > 0 ? (
                    strongTopics.map((t) => (
                      <span key={t.topicKey} style={styles.strongChip}>
                        {t.topicLabel} • {t.estimatedMastery}%
                      </span>
                    ))
                  ) : (
                    <span style={styles.noneNotice}>Keep practicing to develop strong mastery</span>
                  )}
                </div>
              </div>

              <div style={styles.insightBox}>
                <span style={styles.insightTitleRed}>⚠️ Weak Topics ({weakTopics.length})</span>
                <div style={styles.chipRow}>
                  {weakTopics.length > 0 ? (
                    weakTopics.map((t) => (
                      <span key={t.topicKey} style={styles.weakChip}>
                        {t.topicLabel} • {t.estimatedMastery}%
                      </span>
                    ))
                  ) : (
                    <span style={styles.noneNotice}>No topics categorized as weak</span>
                  )}
                </div>
              </div>

              <div style={styles.insightBox}>
                <span style={styles.insightTitleBlue}>
                  📘 Insufficient Practice ({insufficientPracticeTopics.length})
                </span>
                <div style={styles.chipRow}>
                  {insufficientPracticeTopics.length > 0 ? (
                    insufficientPracticeTopics.slice(0, 4).map((t) => (
                      <span key={t.topicKey} style={styles.unpracticedChip}>
                        {t.topicLabel}
                      </span>
                    ))
                  ) : (
                    <span style={styles.noneNotice}>All topics have active baseline data</span>
                  )}
                </div>
              </div>
            </div>

            {/* Topic-Wise Cards Grid */}
            <div style={{ marginTop: 32 }}>
              <h3 style={styles.sectionHeading}>Topic-Wise Mastery & Learning Paths</h3>
              <p style={styles.sectionSub}>
                Click <strong>"Learn with AI"</strong> on any topic to retrieve grounded textbook concepts, variable dry runs, and personalized practice.
              </p>

              <div style={styles.topicGrid}>
                {topicWise.map((t) => {
                  const statusColors = {
                    strong: { text: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', label: 'Strong' },
                    moderate: { text: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', label: 'Moderate' },
                    weak: { text: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', label: 'Weak' },
                    insufficient_practice: { text: '#38bdf8', bg: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.3)', label: 'Insufficient Practice' },
                  };
                  const sc = statusColors[t.status] || statusColors.insufficient_practice;

                  return (
                    <div key={t.topicKey} style={styles.topicCard}>
                      <div style={styles.topicCardHeader}>
                        <div>
                          <h4 style={styles.topicCardTitle}>{t.topicLabel}</h4>
                          <span style={{ ...styles.topicStatusBadge, color: sc.text, background: sc.bg, border: `1px solid ${sc.border}` }}>
                            {sc.label}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={styles.topicMasteryNum}>{t.estimatedMastery}%</span>
                          <span style={styles.topicMasteryLabel}>Mastery</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div style={styles.progressBarBg}>
                        <div
                          style={{
                            ...styles.progressBarFill,
                            width: `${Math.max(4, t.estimatedMastery)}%`,
                            background:
                              t.status === 'strong'
                                ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                                : t.status === 'weak'
                                ? 'linear-gradient(90deg, #ef4444, #f59e0b)'
                                : 'linear-gradient(90deg, #06b6d4, #6366f1)',
                          }}
                        />
                      </div>

                      {/* Detail Stats */}
                      <div style={styles.topicStatsRow}>
                        <div style={styles.topicStatItem}>
                          <span style={styles.topicStatVal}>{t.solvedUnique} / {t.totalInPlatform}</span>
                          <span style={styles.topicStatLbl}>Solved</span>
                        </div>
                        <div style={styles.topicStatItem}>
                          <span style={styles.topicStatVal}>{t.attemptedUnique}</span>
                          <span style={styles.topicStatLbl}>Attempted</span>
                        </div>
                        <div style={styles.topicStatItem}>
                          <span style={styles.topicStatVal}>{t.observedSuccessRate}%</span>
                          <span style={styles.topicStatLbl}>Accuracy</span>
                        </div>
                      </div>

                      {/* Reason */}
                      <p style={styles.topicReasonText}>
                        {t.recommendationReason}
                      </p>

                      {/* Learn with AI Button */}
                      <button
                        onClick={() => setSelectedTopicForAi(t)}
                        style={styles.learnAiBtn}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 6px 20px rgba(6,182,212,0.3)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <span style={{ fontSize: 16 }}>✨</span>
                        <span>Learn {t.topicLabel} with AI</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: Activity Tab ── */}
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

        {/* ── Tab 3: Solved Tab ── */}
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

        {/* ── Learning Assistant Modal ── */}
        {selectedTopicForAi && (
          <DsaLearningAssistant
            topic={selectedTopicForAi}
            initialReason={selectedTopicForAi.recommendationReason}
            onClose={() => setSelectedTopicForAi(null)}
          />
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
  panelTitle: { margin: '0 0 4px', fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.5px' },
  panelSub: { margin: 0, fontSize: 13, color: '#94a3b8', maxWidth: 640 },

  // Trend
  trendBadgeWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  trendLabel: { fontSize: 12, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' },
  trendBadge: { fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20 },

  // Analytics KPI Grid
  analyticsKpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 },
  kpiCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: '20px 24px',
  },
  kpiLabel: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, margin: '0 0 8px' },
  kpiValueRow: { display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 },
  kpiNumber: { fontSize: 36, fontWeight: 800, letterSpacing: '-1px' },
  kpiSubText: { fontSize: 13, color: '#94a3b8' },
  kpiFootnote: { fontSize: 12, color: '#64748b', margin: 0 },
  masteryPill: {
    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
    background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)',
  },
  progressBarBg: { width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 10, transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' },

  // Insights Row
  insightsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 28 },
  insightBox: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 16,
    padding: '16px 20px',
  },
  insightTitleGreen: { display: 'block', fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  insightTitleRed:   { display: 'block', fontSize: 12, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  insightTitleBlue:  { display: 'block', fontSize: 12, fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
  chipRow: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  strongChip: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' },
  weakChip: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 12, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' },
  unpracticedChip: { fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 12, background: 'rgba(56,189,248,0.12)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' },
  noneNotice: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },

  // Topic Section
  sectionHeading: { fontSize: 18, fontWeight: 700, color: '#f1f5f9', margin: '0 0 4px' },
  sectionSub: { fontSize: 13, color: '#94a3b8', margin: '0 0 20px' },
  topicGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16 },
  topicCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: '22px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.25s',
  },
  topicCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  topicCardTitle: { fontSize: 16, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px' },
  topicStatusBadge: { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', padding: '3px 8px', borderRadius: 10, letterSpacing: '0.04em' },
  topicMasteryNum: { display: 'block', fontSize: 24, fontWeight: 800, color: '#f1f5f9', lineHeight: 1 },
  topicMasteryLabel: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 600 },
  topicStatsRow: { display: 'flex', justifyContent: 'space-between', margin: '14px 0 10px', padding: '10px 12px', background: 'rgba(0,0,0,0.25)', borderRadius: 10 },
  topicStatItem: { display: 'flex', flexDirection: 'column', alignItems: 'center' },
  topicStatVal: { fontSize: 13, fontWeight: 700, color: '#e2e8f0' },
  topicStatLbl: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginTop: 2 },
  topicReasonText: { fontSize: 12, color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px', minHeight: 36 },
  learnAiBtn: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: 12,
    border: '1px solid rgba(6,182,212,0.4)',
    background: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(59,130,246,0.18))',
    color: '#06b6d4',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s',
  },

  // Calendar
  streakRow: { display: 'flex', gap: 12 },
  streakChip: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '8px 16px', borderRadius: 12,
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
  },
  streakVal: { fontSize: 20, fontWeight: 800, color: '#06b6d4', lineHeight: 1 },
  streakLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(52, 1fr)',
    gridTemplateRows: 'repeat(7, 1fr)',
    gridAutoFlow: 'column',
    gap: 3,
    marginBottom: 8,
  },
  calCell: { width: 11, height: 11, borderRadius: 2 },
  monthLabels: { display: 'flex', justifyContent: 'space-between', padding: '0 4px', marginBottom: 12 },
  monthLabel: { fontSize: 11, color: '#475569' },
  legend: { display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  legendText: { fontSize: 11, color: '#475569', margin: '0 4px' },
  legendCell: { width: 10, height: 10, borderRadius: 2 },

  // Solved
  problemList: { display: 'flex', flexDirection: 'column', gap: 10 },
  problemRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px', borderRadius: 14,
    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
  },
  problemLeft: { display: 'flex', alignItems: 'center', gap: 14 },
  checkCircle: {
    width: 26, height: 26, borderRadius: '50%',
    background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  problemTitle: { margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: '#f1f5f9' },
  problemSub: { margin: 0, fontSize: 12, color: '#64748b' },
  diffBadge: { fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20, border: '1px solid' },
  emptyState: { textAlign: 'center', padding: '48px 0' },
  emptyIcon: { fontSize: 36, color: '#475569', marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: 600, color: '#94a3b8', margin: '0 0 6px' },
  emptySub: { fontSize: 13, color: '#475569', margin: '0 0 20px' },
  browseBtn: {
    padding: '10px 22px', borderRadius: 10, border: 'none',
    background: 'rgba(6,182,212,0.15)', color: '#06b6d4',
    fontWeight: 600, cursor: 'pointer',
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

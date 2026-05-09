


import { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import axios from 'axios';
import { checkAuth, logoutUser } from '../authSlice';

// ── Animated grid ────────────────────────────────────────────────────

function GridBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const CELL = 42;
      const cols = Math.floor(canvas.width / CELL) + 2;
      const rows = Math.floor(canvas.height / CELL) + 2;
      const cw = canvas.width / cols;
      const ch = canvas.height / rows;
      t += 0.008;
      for (let i = 0; i < cols * rows; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const phase = ((col * 0.6 + row * 0.45) % (Math.PI * 2));
        const o = Math.max(0, 0.04 + 0.07 * Math.sin(t + phase));
        ctx.strokeStyle = `rgba(139,92,246,${o})`;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(col * cw, row * ch, cw, ch);
        if (Math.sin(t * 0.3 + phase) > 0.96) {
          ctx.fillStyle = `rgba(139,92,246,${o * 4})`;
          ctx.fillRect(col * cw + cw / 2 - 1.5, row * ch + ch / 2 - 1.5, 3, 3);
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3, pointerEvents: 'none',
    }} />
  );
}

// ── Badges ───────────────────────────────────────────────────────────

function DiffBadge({ difficulty }) {
  const map = {
    easy: { bg: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: 'rgba(16,185,129,0.2)' },
    medium: { bg: 'rgba(245,158,11,0.1)', color: '#fcd34d', border: 'rgba(245,158,11,0.2)' },
    hard: { bg: 'rgba(239,68,68,0.1)', color: '#fca5a5', border: 'rgba(239,68,68,0.2)' },
  };
  const s = map[difficulty?.toLowerCase()] || { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', border: 'rgba(255,255,255,0.1)' };
  return (
    <span style={{
      fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '99px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.04em', textTransform: 'capitalize',
    }}>
      {difficulty}
    </span>
  );
}

function TagBadge({ tag }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '99px',
      background: 'rgba(139,92,246,0.1)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.2)',
    }}>
      {tag}
    </span>
  );
}

// ── Stat card ────────────────────────────────────────────────────────

function StatCard({ num, label, accent }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '14px',
      padding: '16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: accent,
        }} />
      )}
      <p style={{
        fontFamily: "'Instrument Serif', serif",
        fontSize: '28px', color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1,
      }}>{num}</p>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', margin: 0, fontWeight: '500' }}>{label}</p>
    </div>
  );
}

// ── Profile Modal ────────────────────────────────────────────────────

function ProfileModal({ user, onClose, onSaved }) {
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [age, setAge] = useState(user?.age ?? '');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [avatarPublicId, setAvatarPublicId] = useState(user?.avatarPublicId || null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const previewUrl = removeAvatar ? null : (selectedFile ? URL.createObjectURL(selectedFile) : avatar);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    setError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose a valid image file'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Image size must be less than 5MB'); return; }
    setSelectedFile(file);
    setRemoveAvatar(false);
  };

  const uploadAvatar = async () => {
    if (!selectedFile) return { secureUrl: avatar, publicId: avatarPublicId };
    setUploading(true);
    try {
      const { data: sig } = await axiosClient.get('/userData/profile/upload-signature');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('signature', sig.signature);
      formData.append('timestamp', sig.timestamp);
      formData.append('public_id', sig.public_id);
      formData.append('folder', sig.folder);
      formData.append('api_key', sig.api_key);
      const res = await axios.post(sig.upload_url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      return { secureUrl: res.data.secure_url, publicId: res.data.public_id };
    } finally { setUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      let nextAvatar = avatar;
      let nextAvatarPublicId = avatarPublicId;
      if (selectedFile) {
        const r = await uploadAvatar();
        nextAvatar = r.secureUrl;
        nextAvatarPublicId = r.publicId;
      }
      await axiosClient.patch('/userData/profile', {
        firstName, lastName, bio, age,
        avatar: removeAvatar ? null : nextAvatar,
        avatarPublicId: removeAvatar ? null : nextAvatarPublicId,
        removeAvatar,
      });
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally { setSaving(false); }
  };

  const inp = {
    width: '100%', padding: '10px 14px', borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
    color: '#f1f5f9', fontSize: '13px', outline: 'none',
    fontFamily: "'DM Sans', sans-serif", boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 70, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px',
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        width: '100%', maxWidth: '600px', borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: '#0e0e1a', padding: '28px', color: '#f1f5f9',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '26px', margin: '0 0 4px' }}>Edit profile</h2>
            <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>Update your name and profile picture.</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '20px', lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '140px' }}>
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(139,92,246,0.4)' }} />
              ) : (
                <div style={{
                  width: '88px', height: '88px', borderRadius: '50%',
                  background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px', fontWeight: '700', color: '#fff',
                }}>
                  {firstName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <label style={{
                padding: '7px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)',
                color: '#c4b5fd', cursor: 'pointer',
              }}>
                Upload
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              <button type="button" onClick={() => { setSelectedFile(null); setAvatar(null); setRemoveAvatar(true); }}
                style={{ fontSize: '11px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer' }}>
                Remove photo
              </button>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" style={inp} />
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" style={inp} />
              <input type="number" min="6" max="80" value={age} onChange={e => setAge(e.target.value)} placeholder="Age" style={inp} />
              <input type="email" value={user?.emailId || ''} disabled style={{ ...inp, opacity: 0.4, cursor: 'not-allowed' }} />
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio" rows={3}
                style={{ ...inp, gridColumn: 'span 2', resize: 'vertical' }} />
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', fontSize: '13px', color: '#fca5a5', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 20px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>Cancel</button>
            <button type="submit" disabled={saving || uploading} style={{
              padding: '9px 22px', borderRadius: '9px', border: 'none',
              background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
              color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              opacity: saving || uploading ? 0.6 : 1, fontFamily: "'DM Sans', sans-serif",
            }}>
              {saving || uploading ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── User Dropdown ────────────────────────────────────────────────────

function UserDropdown({ user, onLogout, onEditProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '6px 12px 6px 6px', borderRadius: '99px',
        border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)',
        color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '13px',
        fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s',
      }}>
        {user?.avatar ? (
          <img src={user.avatar} alt={user?.firstName} style={{ width: '26px', height: '26px', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: '700', color: '#fff',
          }}>
            {user?.firstName?.[0]?.toUpperCase()}
          </div>
        )}
        {user?.firstName}
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '10px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: '188px', borderRadius: '14px', overflow: 'hidden',
          background: 'rgba(12,12,22,0.97)', border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(16px)', zIndex: 50,
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: '#f1f5f9' }}>{user?.firstName}</p>
            <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{user?.emailId}</p>
          </div>

          <div style={{ padding: '6px' }}>
            {[
              { label: 'My Profile', icon: '👤', onClick: () => { navigate('/profile'); setOpen(false); } },
              { label: 'Edit profile', icon: '✏️', onClick: () => { onEditProfile(); setOpen(false); } },
              ...(user?.role === 'admin' ? [{ label: 'Admin panel', icon: '⚙️', onClick: () => { navigate('/admin'); setOpen(false); }, color: '#a78bfa' }] : []),
            ].map(item => (
              <button key={item.label} onClick={item.onClick} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 10px', borderRadius: '8px', border: 'none',
                background: 'transparent', color: item.color || 'rgba(255,255,255,0.65)',
                fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                textAlign: 'left', transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '13px' }}>{item.icon}</span> {item.label}
              </button>
            ))}

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />

            <button onClick={() => { onLogout(); setOpen(false); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '8px 10px', borderRadius: '8px', border: 'none',
              background: 'transparent', color: '#f87171',
              fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              textAlign: 'left',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span>🚪</span> Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────

export default function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector(s => s.auth);
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [filters, setFilters] = useState({ difficulty: 'all', tag: 'all', status: 'all' });
  const [searchName, setSearchName] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(Array.isArray(data) ? data : []);
      } catch { setProblems([]); }
      if (user) {
        try {
          const { data } = await axiosClient.get('/problem/problemSolvedByUser');
          setSolvedProblems(Array.isArray(data) ? data : []);
        } catch { setSolvedProblems([]); }
      } else { setSolvedProblems([]); }
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('logicgrid-recent-searches') || '[]');
      if (Array.isArray(s)) setRecentSearches(s.slice(0, 5));
    } catch { setRecentSearches([]); }
  }, []);

  useEffect(() => {
    const trimmed = searchName.trim();
    if (!trimmed) { setHasSearched(false); setSearchResults([]); setSearchError(''); return; }
    const timer = setTimeout(() => runSearch(trimmed, true), 450);
    return () => clearTimeout(timer);
  }, [searchName]);

  const handleLogout = () => { dispatch(logoutUser()); setSolvedProblems([]); };
  const handleProfileSaved = async () => { await dispatch(checkAuth()); };

  const persistRecentSearches = (next) => {
    setRecentSearches(next);
    localStorage.setItem('logicgrid-recent-searches', JSON.stringify(next));
  };

  const addRecentSearch = (name) => {
    const deduped = recentSearches.filter(e => e.name !== name);
    persistRecentSearches([{ name }, ...deduped].slice(0, 5));
  };

  const runSearch = async (nameValue = searchName.trim(), isDebounced = false) => {
    if (!nameValue) { setHasSearched(false); setSearchResults([]); setSearchError(''); return; }
    setSearchLoading(true); setSearchError('');
    try {
      const { data } = await axiosClient.get('/problem/search', { params: { name: nameValue } });
      setSearchResults(Array.isArray(data) ? data : []);
      setHasSearched(true);
      if (!isDebounced) addRecentSearch(nameValue);
    } catch (err) {
      setHasSearched(true); setSearchResults([]);
      setSearchError(err?.response?.data?.message || 'Failed to search problems');
    } finally { setSearchLoading(false); }
  };

  const isSolved = (id) => solvedProblems.some(sp =>
    sp?._id === id || sp?.problemId === id || sp?.problemId?._id === id || sp?.problem?._id === id || sp === id
  );

  const filtered = problems.filter(p => {
    const diffOk = filters.difficulty === 'all' || p.difficulty === filters.difficulty;
    const tagOk = filters.tag === 'all' || p.tags === filters.tag;
    const statusOk = filters.status === 'all' || isSolved(p._id);
    return diffOk && tagOk && statusOk;
  });

  const displayedProblems = hasSearched ? searchResults : filtered;
  const activeQuery = searchName.trim();
  const hasActiveSearchInput = Boolean(activeQuery);
  const solvedCount = solvedProblems.length;

  const highlightText = (text = '', keyword = '') => {
    const trimmed = keyword.trim();
    if (!trimmed) return text;
    const regex = new RegExp(`(${trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
    return text.split(regex).map((part, i) =>
      part.toLowerCase() === trimmed.toLowerCase()
        ? <mark key={i} style={{ background: 'rgba(251,191,36,0.25)', color: '#fde68a', borderRadius: '3px', padding: '0 2px' }}>{part}</mark>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::placeholder { color: rgba(255,255,255,0.2) !important; }
        .search-input:focus { border-color: rgba(139,92,246,0.6) !important; box-shadow: 0 0 0 3px rgba(139,92,246,0.15) !important; }
        .filter-select:focus { border-color: rgba(139,92,246,0.5) !important; outline: none; }
        .problem-row:hover { background: rgba(139,92,246,0.06) !important; border-color: rgba(139,92,246,0.2) !important; }
        .problem-row:hover .row-title { color: #f1f5f9 !important; }
        .problem-row:hover .row-arrow { color: rgba(255,255,255,0.5) !important; }
        .problem-card:hover { border-color: rgba(139,92,246,0.35) !important; background: rgba(139,92,246,0.06) !important; transform: translateY(-2px); }
        .recent-chip:hover { background: rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.8) !important; }
        .search-btn:hover { background: rgba(139,92,246,0.18) !important; }
        select option { background: #111122; color: #f1f5f9; }
      `}</style>

      <div style={{
        minHeight: '100vh', background: '#09090f',
        fontFamily: "'DM Sans', sans-serif", position: 'relative', overflow: 'hidden',
      }}>
        <GridBackground />

        {/* Ambient glows */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(109,40,217,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 30% at 85% 70%, rgba(59,130,246,0.08) 0%, transparent 55%)',
        }} />

        <div style={{ position: 'relative', zIndex: 10 }}>

          {/* ── Navbar ── */}
          <nav style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', height: '60px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            backdropFilter: 'blur(16px)', background: 'rgba(9,9,15,0.7)',
            position: 'sticky', top: 0, zIndex: 40,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Logo */}
              <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="white">
                    <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
                  </svg>
                </div>
                <span style={{
                  fontFamily: "'Instrument Serif', serif", fontSize: '18px',
                  color: '#f1f5f9', letterSpacing: '-0.01em',
                }}>LogicGrid</span>
              </NavLink>

              <NavLink to="/daily-challenge" style={{
                fontSize: '11px', fontWeight: '600', padding: '4px 12px', borderRadius: '99px',
                border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.08)',
                color: '#fde68a', textDecoration: 'none', letterSpacing: '0.02em',
                transition: 'background 0.15s',
              }}>
                ⚡ Daily Challenge
              </NavLink>
            </div>

            {user && (
              <UserDropdown user={user} onLogout={handleLogout} onEditProfile={() => setShowProfileModal(true)} />
            )}
          </nav>

          {/* ── Content ── */}
          <div style={{ maxWidth: '880px', margin: '0 auto', padding: '36px 24px' }}>

            {/* Hero header */}
            <div style={{ marginBottom: '32px' }}>
              <h1 style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: '38px', fontWeight: '400', color: '#f1f5f9',
                margin: '0 0 8px', lineHeight: 1.1,
              }}>
                Problem Set
              </h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.35)', fontWeight: '400' }}>
                Sharpen your skills. Track your progress. Beat the leaderboard.
              </p>
            </div>

            {/* Stats */}
            {user && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '32px' }}>
                <StatCard num={solvedCount} label="Solved" accent="linear-gradient(90deg,#7c3aed,#3b82f6)" />
                <StatCard num={problems.length} label="Total problems" accent="rgba(255,255,255,0.08)" />
                <StatCard
                  num={`${Math.round((solvedCount / (problems.length || 1)) * 100)}%`}
                  label="Completion"
                  accent="linear-gradient(90deg,#059669,#10b981)"
                />
                <StatCard
                  num={problems.filter(p => p.difficulty === 'hard' && isSolved(p._id)).length}
                  label="Hard solved"
                  accent="linear-gradient(90deg,#dc2626,#ef4444)"
                />
              </div>
            )}

            {/* Search bar */}
            <div style={{
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px', padding: '16px', marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.25)', fontSize: '15px', pointerEvents: 'none',
                  }}>
                    {searchLoading ? '⟳' : '⌕'}
                  </span>
                  <input
                    className="search-input"
                    value={searchName}
                    onChange={e => setSearchName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && runSearch()}
                    placeholder="Search problems by name…"
                    style={{
                      width: '100%', padding: '11px 14px 11px 40px',
                      borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)', color: '#f1f5f9',
                      fontSize: '14px', outline: 'none', fontFamily: "'DM Sans', sans-serif",
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  />
                  {searchName && (
                    <button
                      onClick={() => { setSearchName(''); setHasSearched(false); setSearchResults([]); setSearchError(''); }}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'rgba(255,255,255,0.3)', fontSize: '16px', lineHeight: 1, padding: '2px 4px',
                      }}
                    >×</button>
                  )}
                </div>

                <button
                  className="search-btn"
                  onClick={() => runSearch()}
                  disabled={searchLoading}
                  style={{
                    padding: '11px 22px', borderRadius: '10px',
                    border: '1px solid rgba(139,92,246,0.3)',
                    background: 'rgba(139,92,246,0.1)', color: '#c4b5fd',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                  }}
                >
                  Search
                </button>
              </div>

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', alignSelf: 'center', marginRight: '4px' }}>Recent:</span>
                  {recentSearches.map((entry, i) => (
                    <button
                      key={i}
                      className="recent-chip"
                      onClick={() => { setSearchName(entry.name || ''); runSearch(entry.name || ''); }}
                      style={{
                        padding: '3px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: '500',
                        border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)',
                        color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                        transition: 'all 0.15s',
                      }}
                    >
                      {entry.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: '4px' }}>Filter</span>

              {[
                { key: 'status', opts: [['all', 'All Status'], ['solved', 'Solved']] },
                { key: 'difficulty', opts: [['all', 'All Difficulties'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']] },
                { key: 'tag', opts: [['all', 'All Tags'], ['array', 'Array'], ['linkedList', 'Linked List'], ['graph', 'Graph'], ['dp', 'DP']] },
              ].map(({ key, opts }) => (
                <select
                  key={key}
                  className="filter-select"
                  value={filters[key]}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                  style={{
                    padding: '6px 12px', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)',
                    fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.15s',
                  }}
                >
                  {opts.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              ))}

              <span style={{
                marginLeft: 'auto', fontSize: '11px', color: 'rgba(255,255,255,0.25)',
                fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                {searchLoading ? 'Searching…' : `${displayedProblems.length} problem${displayedProblems.length !== 1 ? 's' : ''}${hasSearched ? ' found' : ''}`}
              </span>
            </div>

            {/* ── Problem list ── */}

            {/* Loading */}
            {(loading || searchLoading) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{
                    height: '68px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && !searchLoading && searchError && (
              <div style={{
                padding: '14px 18px', borderRadius: '12px',
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                fontSize: '13px', color: '#fca5a5',
              }}>
                {searchError}
              </div>
            )}

            {/* Empty states */}
            {!loading && !searchLoading && !searchError && hasSearched && displayedProblems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔍</div>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px', margin: 0 }}>No results for "{searchName}"</p>
              </div>
            )}

            {!loading && !searchLoading && !searchError && !hasSearched && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '14px', margin: 0 }}>No problems match these filters.</p>
              </div>
            )}

            {/* Search results — card grid */}
            {!loading && !searchLoading && !searchError && (hasSearched || hasActiveSearchInput) && displayedProblems.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
                {displayedProblems.map(problem => (
                  <div
                    key={problem._id}
                    className="problem-card"
                    style={{
                      borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)',
                      background: 'rgba(255,255,255,0.025)', padding: '20px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.85)', lineHeight: 1.3 }}>
                        {highlightText(problem.title, activeQuery)}
                      </h3>
                      <DiffBadge difficulty={problem.difficulty} />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {problem.tags && <TagBadge tag={problem.tags} />}
                      {problem.isDailyProblem && (
                        <span style={{
                          fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '99px',
                          border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.1)', color: '#fde68a',
                        }}>Daily</span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 16px', fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', minHeight: '40px' }}>
                      {problem.description ? highlightText(`${problem.description.slice(0, 110)}${problem.description.length > 110 ? '…' : ''}`, activeQuery) : 'No description available.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {isSolved(problem._id) ? (
                        <span style={{ fontSize: '11px', color: '#6ee7b7', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          ✓ Solved
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Unsolved</span>
                      )}
                      <NavLink
                        to={`/problem/${problem._id}`}
                        style={{
                          padding: '7px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                          background: 'linear-gradient(135deg,#7c3aed,#3b82f6)',
                          color: '#fff', textDecoration: 'none', transition: 'opacity 0.15s',
                        }}
                      >
                        Solve →
                      </NavLink>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Default list view */}
            {!loading && !searchLoading && !searchError && !hasSearched && !hasActiveSearchInput && filtered.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filtered.map((problem, idx) => (
                  <NavLink
                    key={problem._id}
                    to={`/problem/${problem._id}`}
                    className="problem-row"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 18px', borderRadius: '12px', textDecoration: 'none',
                      border: '1px solid rgba(255,255,255,0.05)',
                      background: 'rgba(255,255,255,0.02)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{
                        fontSize: '12px', color: 'rgba(255,255,255,0.15)',
                        width: '28px', fontWeight: '600', fontFamily: 'monospace', flexShrink: 0,
                      }}>{String(idx + 1).padStart(2, '0')}</span>

                      <div>
                        <p className="row-title" style={{
                          margin: '0 0 6px', fontSize: '14px', fontWeight: '500',
                          color: 'rgba(255,255,255,0.75)', transition: 'color 0.15s',
                        }}>
                          {problem.title}
                        </p>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <DiffBadge difficulty={problem.difficulty} />
                          {problem.tags && <TagBadge tag={problem.tags} />}
                          {problem.isDailyProblem && (
                            <span style={{
                              fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '99px',
                              border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.1)', color: '#fde68a',
                            }}>⚡ Daily</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      {isSolved(problem._id) ? (
                        <span style={{
                          fontSize: '11px', color: '#6ee7b7', fontWeight: '600',
                          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                          padding: '3px 10px', borderRadius: '99px',
                        }}>✓ Solved</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.15)' }}>Unsolved</span>
                      )}
                      <span className="row-arrow" style={{ color: 'rgba(255,255,255,0.12)', fontSize: '18px', transition: 'color 0.15s' }}>›</span>
                    </div>
                  </NavLink>
                ))}
              </div>
            )}

          </div>
        </div>

        {showProfileModal && user && (
          <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onSaved={handleProfileSaved} />
        )}
      </div>
    </>
  );
}
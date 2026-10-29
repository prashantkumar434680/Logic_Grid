

import { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import axios from 'axios';
import { checkAuth, logoutUser } from '../authSlice';

// ── Design tokens ────────────────────────────────────────────────────
// A literal "grid" identity for a logic-puzzle platform: pale graph-paper
// background, ink text, a pine-green working accent, amber for "today", and
// rust for danger/hard. Rows read like spreadsheet cells (A1, A2…) instead
// of plain numbering, which ties the list back to the product name.

const INK = '#161B18';
const INK_SOFT = 'rgba(22,27,24,0.55)';
const INK_FAINT = 'rgba(22,27,24,0.32)';
const PAPER = '#F6F6F1';
const PAPER_RAISED = '#FFFFFF';
const LINE = 'rgba(22,27,24,0.12)';
const LINE_SOFT = 'rgba(22,27,24,0.07)';
const PINE = '#2F5D50';
const PINE_SOFT = 'rgba(47,93,80,0.09)';
const AMBER = '#C4831A';
const AMBER_SOFT = 'rgba(196,131,26,0.1)';
const RUST = '#B5482A';
const RUST_SOFT = 'rgba(181,72,42,0.09)';

// ── Grid-paper canvas ────────────────────────────────────────────────

function GridBackground() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    };
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const CELL = 34;
      ctx.strokeStyle = 'rgba(22,27,24,0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += CELL) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += CELL) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
      }
      // a few emphasised cells, like graph-paper index lines
      ctx.strokeStyle = 'rgba(47,93,80,0.09)';
      for (let x = 0; x < canvas.width; x += CELL * 5) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += CELL * 5) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);
  return (
    <canvas ref={canvasRef} style={{
      position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none',
    }} />
  );
}

// ── Spreadsheet-style cell reference (row label) ────────────────────

function colLabel(n) {
  let s = '';
  n += 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// ── Badges ───────────────────────────────────────────────────────────

function DiffBadge({ difficulty }) {
  const map = {
    easy: { bg: PINE_SOFT, color: PINE, border: 'rgba(47,93,80,0.28)' },
    medium: { bg: AMBER_SOFT, color: AMBER, border: 'rgba(196,131,26,0.3)' },
    hard: { bg: RUST_SOFT, color: RUST, border: 'rgba(181,72,42,0.3)' },
  };
  const s = map[difficulty?.toLowerCase()] || { bg: 'rgba(22,27,24,0.04)', color: INK_FAINT, border: LINE };
  return (
    <span style={{
      fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace",
    }}>
      {difficulty}
    </span>
  );
}

function TagBadge({ tag }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
      background: 'transparent', color: INK_SOFT, border: `1px solid ${LINE}`,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {tag}
    </span>
  );
}

// ── Stat card ────────────────────────────────────────────────────────

function StatCard({ num, label, accent, cell }) {
  return (
    <div style={{
      background: PAPER_RAISED,
      border: `1px solid ${LINE}`,
      borderRadius: '10px',
      padding: '16px',
      position: 'relative',
    }}>
      <span style={{
        position: 'absolute', top: '10px', right: '12px',
        fontSize: '10px', fontFamily: "'JetBrains Mono', monospace",
        color: INK_FAINT, letterSpacing: '0.04em',
      }}>{cell}</span>
      <p style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 600,
        fontSize: '26px', color: INK, margin: '0 0 4px', lineHeight: 1,
      }}>{num}</p>
      <p style={{ fontSize: '11px', color: INK_SOFT, margin: 0, fontWeight: '500' }}>{label}</p>
      <div style={{
        marginTop: '10px', height: '3px', borderRadius: '2px',
        background: LINE_SOFT, overflow: 'hidden',
      }}>
        <div style={{ height: '100%', width: '100%', background: accent }} />
      </div>
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
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: `1px solid ${LINE}`, background: PAPER,
    color: INK, fontSize: '13px', outline: 'none',
    fontFamily: "'Inter', sans-serif", boxSizing: 'border-box',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 70, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '16px',
      background: 'rgba(22,27,24,0.35)', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        width: '100%', maxWidth: '600px', borderRadius: '14px',
        border: `1px solid ${LINE}`,
        background: PAPER_RAISED, padding: '28px', color: INK,
        boxShadow: '0 24px 60px rgba(22,27,24,0.18)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <p style={{ margin: '0 0 6px', fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: PINE, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Cell · Profile</p>
            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '24px', margin: 0 }}>Edit profile</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: INK_FAINT, fontSize: '18px', lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '24px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', width: '140px' }}>
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" style={{ width: '84px', height: '84px', borderRadius: '10px', objectFit: 'cover', border: `1px solid ${LINE}` }} />
              ) : (
                <div style={{
                  width: '84px', height: '84px', borderRadius: '10px',
                  background: PINE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px', fontWeight: '600', color: '#fff',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {firstName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <label style={{
                padding: '7px 14px', borderRadius: '7px', fontSize: '11px', fontWeight: '600',
                border: `1px solid ${LINE}`, background: PAPER,
                color: INK, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              }}>
                Upload
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              <button type="button" onClick={() => { setSelectedFile(null); setAvatar(null); setRemoveAvatar(true); }}
                style={{ fontSize: '11px', color: RUST, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}>
                Remove photo
              </button>
            </div>

            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" style={inp} />
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last name" style={inp} />
              <input type="number" min="6" max="80" value={age} onChange={e => setAge(e.target.value)} placeholder="Age" style={inp} />
              <input type="email" value={user?.emailId || ''} disabled style={{ ...inp, opacity: 0.5, cursor: 'not-allowed' }} />
              <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Short bio" rows={3}
                style={{ ...inp, gridColumn: 'span 2', resize: 'vertical' }} />
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', background: RUST_SOFT, border: `1px solid rgba(181,72,42,0.25)`, fontSize: '13px', color: RUST, marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 20px', borderRadius: '7px', border: `1px solid ${LINE}`,
              background: 'transparent', color: INK_SOFT, fontSize: '13px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
            }}>Cancel</button>
            <button type="submit" disabled={saving || uploading} style={{
              padding: '9px 22px', borderRadius: '7px', border: 'none',
              background: PINE,
              color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              opacity: saving || uploading ? 0.6 : 1, fontFamily: "'Inter', sans-serif",
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
        padding: '5px 12px 5px 5px', borderRadius: '8px',
        border: `1px solid ${LINE}`, background: PAPER_RAISED,
        color: INK, cursor: 'pointer', fontSize: '13px',
        fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s',
      }}>
        {user?.avatar ? (
          <img src={user.avatar} alt={user?.firstName} style={{ width: '26px', height: '26px', borderRadius: '6px', objectFit: 'cover' }} />
        ) : (
          <div style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: PINE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: '700', color: '#fff',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            {user?.firstName?.[0]?.toUpperCase()}
          </div>
        )}
        {user?.firstName}
        <span style={{ color: INK_FAINT, fontSize: '9px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: '190px', borderRadius: '10px', overflow: 'hidden',
          background: PAPER_RAISED, border: `1px solid ${LINE}`,
          zIndex: 50,
          boxShadow: '0 20px 40px rgba(22,27,24,0.14)',
        }}>
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${LINE_SOFT}` }}>
            <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '600', color: INK }}>{user?.firstName}</p>
            <p style={{ margin: 0, fontSize: '11px', color: INK_FAINT, fontFamily: "'JetBrains Mono', monospace" }}>{user?.emailId}</p>
          </div>

          <div style={{ padding: '6px' }}>
            {[
              { label: 'My profile', onClick: () => { navigate('/profile'); setOpen(false); } },
              { label: 'Edit profile', onClick: () => { onEditProfile(); setOpen(false); } },
              ...(user?.role === 'admin' ? [{ label: 'Admin panel', onClick: () => { navigate('/admin'); setOpen(false); }, color: PINE }] : []),
            ].map(item => (
              <button key={item.label} onClick={item.onClick} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 10px', borderRadius: '6px', border: 'none',
                background: 'transparent', color: item.color || INK_SOFT,
                fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                textAlign: 'left', transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,27,24,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {item.label}
              </button>
            ))}

            <div style={{ height: '1px', background: LINE_SOFT, margin: '4px 0' }} />

            <button onClick={() => { onLogout(); setOpen(false); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 10px', borderRadius: '6px', border: 'none',
              background: 'transparent', color: RUST,
              fontSize: '12px', cursor: 'pointer', fontFamily: "'Inter', sans-serif",
              textAlign: 'left',
            }}
              onMouseEnter={e => e.currentTarget.style.background = RUST_SOFT}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              Log out
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
        ? <mark key={i} style={{ background: AMBER_SOFT, color: AMBER, borderRadius: '3px', padding: '0 2px' }}>{part}</mark>
        : <span key={i}>{part}</span>
    );
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        ::placeholder { color: rgba(22,27,24,0.28) !important; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
        .search-input:focus { border-color: ${PINE} !important; box-shadow: 0 0 0 3px ${PINE_SOFT} !important; }
        .filter-select:focus { border-color: ${PINE} !important; outline: none; }
        .problem-row { position: relative; }
        .problem-row:hover { background: ${PAPER_RAISED} !important; border-color: ${PINE} !important; box-shadow: inset 0 0 0 1px ${PINE}; }
        .problem-row:hover .row-title { color: ${INK} !important; }
        .problem-row:hover .row-arrow { color: ${PINE} !important; }
        .problem-card:hover { border-color: ${PINE} !important; box-shadow: inset 0 0 0 1px ${PINE}; }
        .recent-chip:hover { background: ${PAPER_RAISED} !important; border-color: ${INK_FAINT} !important; }
        .search-btn:hover { background: #24493f !important; }
        select option { background: ${PAPER_RAISED}; color: ${INK}; }
      `}</style>

      <div style={{
        minHeight: '100vh', background: PAPER,
        fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden',
      }}>
        <GridBackground />

        <div style={{ position: 'relative', zIndex: 10 }}>

          {/* ── Navbar ── */}
          <nav style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 28px', height: '58px',
            borderBottom: `1px solid ${LINE}`,
            background: 'rgba(246,246,241,0.85)', backdropFilter: 'blur(10px)',
            position: 'sticky', top: 0, zIndex: 40,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
              <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '6px',
                  background: PINE,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
                  </svg>
                </div>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: '17px',
                  color: INK, letterSpacing: '-0.01em',
                }}>LogicGrid</span>
              </NavLink>

              <NavLink to="/daily-challenge" style={{
                fontSize: '11px', fontWeight: '600', padding: '4px 11px', borderRadius: '6px',
                border: `1px solid rgba(196,131,26,0.35)`, background: AMBER_SOFT,
                color: AMBER, textDecoration: 'none', letterSpacing: '0.02em',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                ▲ DAILY
              </NavLink>
            </div>

            {user && (
              <UserDropdown user={user} onLogout={handleLogout} onEditProfile={() => setShowProfileModal(true)} />
            )}
          </nav>

          {/* ── Content ── */}
          <div style={{ maxWidth: '880px', margin: '0 auto', padding: '36px 24px' }}>

            {/* Hero header */}
            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '32px', fontWeight: '600', color: INK,
                margin: 0, lineHeight: 1.1,
              }}>
                Problem set
              </h1>
              <span style={{
                fontSize: '11px', color: INK_FAINT, fontFamily: "'JetBrains Mono', monospace",
              }}>
                / {problems.length} entries indexed
              </span>
            </div>

            {/* Stats */}
            {user && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '32px' }}>
                <StatCard cell="A1" num={solvedCount} label="Solved" accent={PINE} />
                <StatCard cell="A2" num={problems.length} label="Total problems" accent={INK_FAINT} />
                <StatCard
                  cell="A3"
                  num={`${Math.round((solvedCount / (problems.length || 1)) * 100)}%`}
                  label="Completion"
                  accent={AMBER}
                />
                <StatCard
                  cell="A4"
                  num={problems.filter(p => p.difficulty === 'hard' && isSolved(p._id)).length}
                  label="Hard solved"
                  accent={RUST}
                />
              </div>
            )}

            {/* Search bar */}
            <div style={{
              background: PAPER_RAISED,
              border: `1px solid ${LINE}`,
              borderRadius: '12px', padding: '16px', marginBottom: '20px',
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                    color: INK_FAINT, fontSize: '14px', pointerEvents: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
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
                      borderRadius: '8px', border: `1px solid ${LINE}`,
                      background: PAPER, color: INK,
                      fontSize: '14px', outline: 'none', fontFamily: "'Inter', sans-serif",
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  />
                  {searchName && (
                    <button
                      onClick={() => { setSearchName(''); setHasSearched(false); setSearchResults([]); setSearchError(''); }}
                      style={{
                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: INK_FAINT, fontSize: '16px', lineHeight: 1, padding: '2px 4px',
                      }}
                    >×</button>
                  )}
                </div>

                <button
                  className="search-btn"
                  onClick={() => runSearch()}
                  disabled={searchLoading}
                  style={{
                    padding: '11px 22px', borderRadius: '8px',
                    border: 'none',
                    background: PINE, color: '#fff',
                    fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif", whiteSpace: 'nowrap',
                    transition: 'background 0.15s',
                  }}
                >
                  Search
                </button>
              </div>

              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: INK_FAINT, fontFamily: "'JetBrains Mono', monospace", marginRight: '4px' }}>RECENT</span>
                  {recentSearches.map((entry, i) => (
                    <button
                      key={i}
                      className="recent-chip"
                      onClick={() => { setSearchName(entry.name || ''); runSearch(entry.name || ''); }}
                      style={{
                        padding: '3px 11px', borderRadius: '99px', fontSize: '11px', fontWeight: '500',
                        border: `1px solid ${LINE}`, background: PAPER,
                        color: INK_SOFT, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
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
              <span style={{ fontSize: '10px', color: INK_FAINT, fontWeight: '600', letterSpacing: '0.06em', textTransform: 'uppercase', marginRight: '4px', fontFamily: "'JetBrains Mono', monospace" }}>Filter</span>

              {[
                { key: 'status', opts: [['all', 'All status'], ['solved', 'Solved']] },
                { key: 'difficulty', opts: [['all', 'All difficulties'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']] },
                { key: 'tag', opts: [['all', 'All tags'], ['array', 'Array'], ['linkedList', 'Linked List'], ['graph', 'Graph'], ['dp', 'DP']] },
              ].map(({ key, opts }) => (
                <select
                  key={key}
                  className="filter-select"
                  value={filters[key]}
                  onChange={e => setFilters(f => ({ ...f, [key]: e.target.value }))}
                  style={{
                    padding: '6px 12px', borderRadius: '7px',
                    border: `1px solid ${LINE}`,
                    background: PAPER_RAISED, color: INK_SOFT,
                    fontSize: '12px', fontWeight: '500', cursor: 'pointer',
                    fontFamily: "'Inter', sans-serif", transition: 'border-color 0.15s',
                  }}
                >
                  {opts.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              ))}

              <span style={{
                marginLeft: 'auto', fontSize: '11px', color: INK_FAINT,
                fontWeight: '500', fontFamily: "'JetBrains Mono', monospace",
              }}>
                {searchLoading ? 'searching…' : `${displayedProblems.length} row${displayedProblems.length !== 1 ? 's' : ''}${hasSearched ? ' matched' : ''}`}
              </span>
            </div>

            {/* ── Problem list ── */}

            {/* Loading */}
            {(loading || searchLoading) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{
                    height: '64px', borderRadius: '10px',
                    background: PAPER_RAISED, border: `1px solid ${LINE_SOFT}`,
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && !searchLoading && searchError && (
              <div style={{
                padding: '14px 18px', borderRadius: '10px',
                background: RUST_SOFT, border: `1px solid rgba(181,72,42,0.25)`,
                fontSize: '13px', color: RUST,
              }}>
                {searchError}
              </div>
            )}

            {/* Empty states */}
            {!loading && !searchLoading && !searchError && hasSearched && displayedProblems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <p style={{ color: INK_FAINT, fontSize: '13px', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>NO ROWS MATCH "{searchName}"</p>
              </div>
            )}

            {!loading && !searchLoading && !searchError && !hasSearched && filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0' }}>
                <p style={{ color: INK_FAINT, fontSize: '13px', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>NO PROBLEMS MATCH THESE FILTERS</p>
              </div>
            )}

            {/* Search results — card grid */}
            {!loading && !searchLoading && !searchError && (hasSearched || hasActiveSearchInput) && displayedProblems.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '12px' }}>
                {displayedProblems.map((problem, idx) => (
                  <div
                    key={problem._id}
                    className="problem-card"
                    style={{
                      borderRadius: '10px', border: `1px solid ${LINE}`,
                      background: PAPER_RAISED, padding: '18px',
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: INK_FAINT }}>{colLabel(idx)}</span>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: INK, lineHeight: 1.3 }}>
                          {highlightText(problem.title, activeQuery)}
                        </h3>
                      </div>
                      <DiffBadge difficulty={problem.difficulty} />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {problem.tags && <TagBadge tag={problem.tags} />}
                      {problem.isDailyProblem && (
                        <span style={{
                          fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
                          border: `1px solid rgba(196,131,26,0.3)`, background: AMBER_SOFT, color: AMBER,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>DAILY</span>
                      )}
                    </div>

                    <p style={{ margin: '0 0 16px', fontSize: '12px', color: INK_SOFT, lineHeight: '1.6', minHeight: '40px' }}>
                      {problem.description ? highlightText(`${problem.description.slice(0, 110)}${problem.description.length > 110 ? '…' : ''}`, activeQuery) : 'No description available.'}
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {isSolved(problem._id) ? (
                        <span style={{ fontSize: '11px', color: PINE, fontFamily: "'JetBrains Mono', monospace" }}>
                          ✓ SOLVED
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', color: INK_FAINT, fontFamily: "'JetBrains Mono', monospace" }}>UNSOLVED</span>
                      )}
                      <NavLink
                        to={`/problem/${problem._id}`}
                        style={{
                          padding: '6px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: '600',
                          background: PINE,
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
                      padding: '13px 16px', borderRadius: '10px', textDecoration: 'none',
                      border: `1px solid ${LINE_SOFT}`,
                      background: PAPER_RAISED,
                      transition: 'border-color 0.15s, box-shadow 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{
                        fontSize: '11px', color: INK_FAINT,
                        width: '30px', fontWeight: '600', fontFamily: "'JetBrains Mono', monospace", flexShrink: 0,
                        border: `1px solid ${LINE}`, borderRadius: '4px', textAlign: 'center', padding: '2px 0',
                      }}>{colLabel(idx)}</span>

                      <div>
                        <p className="row-title" style={{
                          margin: '0 0 6px', fontSize: '14px', fontWeight: '500',
                          color: INK, transition: 'color 0.15s',
                        }}>
                          {problem.title}
                        </p>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <DiffBadge difficulty={problem.difficulty} />
                          {problem.tags && <TagBadge tag={problem.tags} />}
                          {problem.isDailyProblem && (
                            <span style={{
                              fontSize: '10px', fontWeight: '600', padding: '2px 8px', borderRadius: '4px',
                              border: `1px solid rgba(196,131,26,0.3)`, background: AMBER_SOFT, color: AMBER,
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>DAILY</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                      {isSolved(problem._id) ? (
                        <span style={{
                          fontSize: '11px', color: PINE, fontWeight: '600',
                          background: PINE_SOFT, border: `1px solid rgba(47,93,80,0.25)`,
                          padding: '3px 10px', borderRadius: '99px', fontFamily: "'JetBrains Mono', monospace",
                        }}>✓ SOLVED</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: INK_FAINT, fontFamily: "'JetBrains Mono', monospace" }}>UNSOLVED</span>
                      )}
                      <span className="row-arrow" style={{ color: INK_FAINT, fontSize: '16px', transition: 'color 0.15s' }}>→</span>
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
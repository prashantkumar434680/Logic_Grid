import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../utils/axiosClient';
import axios from 'axios';
import { checkAuth, logoutUser } from '../authSlice';

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

  const previewUrl = removeAvatar ? null : avatar;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    setError('');
    if (!file) return setSelectedFile(null);
    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      event.target.value = '';
      return;
    }
    setSelectedFile(file);
    setRemoveAvatar(false);
  };

  const uploadAvatar = async () => {
    if (!selectedFile) return { secureUrl: avatar, publicId: avatarPublicId };
    setUploading(true);
    try {
      const { data: signatureData } = await axiosClient.get('/userData/profile/upload-signature');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('signature', signatureData.signature);
      formData.append('timestamp', signatureData.timestamp);
      formData.append('public_id', signatureData.public_id);
      formData.append('folder', signatureData.folder);
      formData.append('api_key', signatureData.api_key);

      const uploadResponse = await axios.post(signatureData.upload_url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      return {
        secureUrl: uploadResponse.data.secure_url,
        publicId: uploadResponse.data.public_id,
      };
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      let nextAvatar = avatar;
      let nextAvatarPublicId = avatarPublicId;
      if (selectedFile) {
        const uploadResult = await uploadAvatar();
        nextAvatar = uploadResult.secureUrl;
        nextAvatarPublicId = uploadResult.publicId;
      }

      await axiosClient.patch('/userData/profile', {
        firstName,
        lastName,
        bio,
        age,
        avatar: removeAvatar ? null : nextAvatar,
        avatarPublicId: removeAvatar ? null : nextAvatarPublicId,
        removeAvatar,
      });

      await onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#121721] p-6 text-white shadow-2xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Edit profile</h2>
            <p className="mt-1 text-xs text-white/40">Update your profile details.</p>
          </div>
          <button onClick={onClose} className="text-white/45 hover:text-white/70">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-col gap-5 md:flex-row">
            <div className="md:w-1/3">
              <div className="mb-3 flex justify-center">
                {previewUrl ? (
                  <img src={previewUrl} alt="Profile" className="h-28 w-28 rounded-full border border-white/10 object-cover" />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl font-semibold text-white">
                    {firstName?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              <input type="file" accept="image/*" onChange={handleFileChange} className="file-input file-input-bordered w-full bg-white/5 text-white" />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setAvatar(null);
                  setAvatarPublicId(null);
                  setRemoveAvatar(true);
                }}
                className="mt-3 w-full rounded-lg border border-rose-500/20 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10"
              >
                Remove photo
              </button>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/50" />
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/50" />
              <input type="number" min="6" max="80" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/50" />
              <input type="email" value={user?.emailId || ''} disabled className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/45 outline-none" />
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" rows={4} className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/50" />
            </div>
          </div>

          {error && <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm text-white/45 hover:text-white/75">Cancel</button>
            <button type="submit" disabled={saving || uploading} className="rounded-xl border border-amber-400/35 bg-amber-400/15 px-5 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-400/25 disabled:opacity-60">
              {saving || uploading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Heatmap({ solvedCount }) {
  const blocks = useMemo(() => {
    return Array.from({ length: 364 }, (_, i) => {
      const seed = (i * 13 + solvedCount * 5) % 100;
      if (seed < 72) return 0;
      if (seed < 85) return 1;
      if (seed < 93) return 2;
      if (seed < 98) return 3;
      return 4;
    });
  }, [solvedCount]);

  const tones = ['bg-[#34373d]', 'bg-emerald-900/70', 'bg-emerald-700/80', 'bg-emerald-500/85', 'bg-emerald-300'];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm text-white/55">
        <p><span className="text-white">{blocks.filter((v) => v > 0).length}</span> submissions in the past one year</p>
        <div className="flex gap-4 text-xs">
          <span>Total active days: <strong className="text-white">{blocks.filter((v) => v > 0).length}</strong></span>
          <span>Max streak: <strong className="text-white">{Math.max(4, Math.floor(solvedCount / 3))}</strong></span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-flow-col grid-rows-7 gap-1 rounded-xl bg-[#1d2128] p-4">
          {blocks.map((v, i) => (
            <div key={i} className={`h-3.5 w-3.5 rounded-sm ${tones[v]} transition-transform hover:scale-110`} />
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-white/45">
        {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((m) => <span key={m}>{m}</span>)}
      </div>
    </div>
  );
}

function DifficultyChip({ value }) {
  const cls = {
    easy: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    medium: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    hard: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
  };

  return <span className={`rounded-full border px-2 py-0.5 text-[10px] ${cls[value] || 'border-white/20 bg-white/5 text-white/70'}`}>{value}</span>;
}

function TopNavbar({ user, onLogout, onEditProfile }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#11141d]/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-to-br from-amber-400 to-orange-500" />
            <span className="text-[19px] font-semibold tracking-tight text-white">LogicGrid</span>
          </div>
          <div className="hidden items-center gap-5 text-sm text-white/65 md:flex">
            <button className="hover:text-white">Problems</button>
            <button className="hover:text-white">Contest</button>
            <button className="hover:text-white">Discuss</button>
            <button className="hover:text-white">Interview</button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <span className="pointer-events-none absolute left-3 top-2.5 text-white/35">⌕</span>
            <input placeholder="Search" className="w-56 rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-amber-400/35" />
          </div>

          <div className="relative" ref={ref}>
            <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-white/80 hover:bg-white/10">
              {user?.avatar ? (
                <img src={user.avatar} alt="Profile" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-semibold text-white">
                  {user?.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-3 w-[320px] rounded-2xl border border-white/10 bg-[#2a2d33] p-4 text-white shadow-2xl">
                <p className="text-lg font-semibold">{user?.firstName || 'User'} {user?.lastName || ''}</p>
                <p className="mb-3 text-xs text-amber-300">Access all features with our Premium subscription!</p>

                <div className="mb-4 grid grid-cols-4 gap-3 text-xs">
                  {['My Lists', 'Notebook', 'Progress', 'Points'].map((item) => (
                    <button key={item} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white/75 hover:bg-white/15">{item}</button>
                  ))}
                </div>

                <div className="space-y-1 border-t border-white/10 pt-3">
                  {['Try New Features', 'Orders', 'My Playgrounds', 'Settings', 'Appearance'].map((item) => (
                    <button key={item} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-white/75 hover:bg-white/10 hover:text-white">
                      <span>{item}</span>
                      {item === 'Appearance' && <span>›</span>}
                    </button>
                  ))}

                  <button onClick={() => { onEditProfile(); setOpen(false); }} className="flex w-full rounded-lg px-2 py-2 text-sm text-amber-300 hover:bg-amber-400/10">Edit Profile</button>
                  <button onClick={() => { onLogout(); setOpen(false); }} className="flex w-full rounded-lg px-2 py-2 text-sm text-rose-300 hover:bg-rose-500/10">Sign Out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);

  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState([]);
  const [solvedProblems, setSolvedProblems] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeTab, setActiveTab] = useState('recent');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const { data } = await axiosClient.get('/problem/getAllProblem');
        setProblems(Array.isArray(data) ? data : []);
      } catch {
        setProblems([]);
      }

      if (user) {
        try {
          const { data } = await axiosClient.get('/problem/problemSolvedByUser');
          setSolvedProblems(Array.isArray(data) ? data : []);
        } catch {
          setSolvedProblems([]);
        }
      }
      setLoading(false);
    };

    fetchAll();
  }, [user]);

  const isSolved = (problemId) => solvedProblems.some((sp) => sp?._id === problemId || sp?.problemId === problemId || sp?.problemId?._id === problemId || sp?.problem?._id === problemId || sp === problemId);

  const solvedCount = solvedProblems.length;
  const totalCount = problems.length;

  const solvedEasy = useMemo(() => problems.filter((p) => p.difficulty === 'easy' && isSolved(p._id)).length, [problems, solvedProblems]);
  const solvedMedium = useMemo(() => problems.filter((p) => p.difficulty === 'medium' && isSolved(p._id)).length, [problems, solvedProblems]);
  const solvedHard = useMemo(() => problems.filter((p) => p.difficulty === 'hard' && isSolved(p._id)).length, [problems, solvedProblems]);

  const rank = formatNumber(Math.max(1, 1264787 - solvedCount * 11));
  const username = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  const userHandle = user?.emailId?.split('@')?.[0] || 'logicgrid_user';

  const badges = ['50 Days Badge 2025', 'Consistency I', 'Binary Tree Hero'];
  const skills = ['Dynamic Programming x9', 'Graph x6', 'Binary Tree x8', 'Greedy x4', 'Backtracking x3'];

  const recent = (problems.slice(0, 5).map((p, i) => ({ title: p.title, time: i === 0 ? '29 minutes ago' : `${i + 1} days ago` })));

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#10131a]"><span className="loading loading-spinner loading-lg text-amber-300" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#10131a] text-white">
      <TopNavbar user={user} onLogout={() => dispatch(logoutUser())} onEditProfile={() => setShowProfileModal(true)} />

      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
          <div className="mb-5 flex items-start gap-4">
            {user?.avatar ? <img src={user.avatar} alt="Profile" className="h-20 w-20 rounded-2xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-3xl font-bold text-white">{username[0]?.toUpperCase() || 'U'}</div>}
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-3xl font-semibold text-white">{username}</h2>
              <p className="truncate text-sm text-white/55">{userHandle}</p>
              <p className="mt-2 text-2xl text-white/90">Rank <span className="font-semibold text-amber-300">{rank}</span></p>
            </div>
          </div>

          <div className="mb-5 flex items-center gap-4 text-sm text-white/75">
            <span><strong className="text-white">0</strong> Following</span>
            <span className="text-white/25">|</span>
            <span><strong className="text-white">0</strong> Followers</span>
          </div>

          <button onClick={() => setShowProfileModal(true)} className="mb-5 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/15 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25">Edit Profile</button>

          <div className="mb-4 border-t border-white/10 pt-4">
            <h4 className="mb-3 text-lg font-semibold">Community Stats</h4>
            <div className="space-y-2 text-sm text-white/75">
              <div className="flex justify-between"><span>Views</span><span>0</span></div>
              <div className="flex justify-between"><span>Solution</span><span>0</span></div>
              <div className="flex justify-between"><span>Discuss</span><span>0</span></div>
              <div className="flex justify-between"><span>Reputation</span><span>0</span></div>
            </div>
          </div>

          <div className="mb-4 border-t border-white/10 pt-4">
            <h4 className="mb-3 text-lg font-semibold">Languages</h4>
            <div className="space-y-2 text-sm text-white/75">
              <div className="flex justify-between"><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">C++</span><span>{Math.max(1, Math.floor(solvedCount * 0.48))} solved</span></div>
              <div className="flex justify-between"><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Java</span><span>{Math.max(1, Math.floor(solvedCount * 0.32))} solved</span></div>
              <div className="flex justify-between"><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">JavaScript</span><span>{Math.max(1, Math.floor(solvedCount * 0.2))} solved</span></div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4">
            <h4 className="mb-3 text-lg font-semibold">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => <span key={s} className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{s}</span>)}
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[240px_1fr]">
                <div className="flex items-center justify-center">
                  <div className="relative flex h-44 w-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(#22c55e 0deg ${Math.round((solvedEasy / Math.max(solvedCount, 1)) * 360)}deg, #f59e0b ${Math.round((solvedEasy / Math.max(solvedCount, 1)) * 360)}deg ${Math.round(((solvedEasy + solvedMedium) / Math.max(solvedCount, 1)) * 360)}deg, #f43f5e ${Math.round(((solvedEasy + solvedMedium) / Math.max(solvedCount, 1)) * 360)}deg 360deg)` }}>
                    <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#151922]">
                      <span className="text-4xl font-semibold">{solvedCount}</span>
                      <span className="text-sm text-white/45">/ {totalCount}</span>
                      <span className="text-xs text-emerald-300">Solved</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm uppercase tracking-widest text-white/40">Difficulty Breakdown</h3>
                  <div className="flex items-center justify-between rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2"><span className="text-emerald-300">Easy</span><span>{solvedEasy}</span></div>
                  <div className="flex items-center justify-between rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2"><span className="text-amber-300">Medium</span><span>{solvedMedium}</span></div>
                  <div className="flex items-center justify-between rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-2"><span className="text-rose-300">Hard</span><span>{solvedHard}</span></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-semibold">Badges</h3>
                <span className="text-2xl text-white/35">→</span>
              </div>
              <div className="mb-3 text-5xl">🏅</div>
              <p className="text-sm text-white/50">Most Recent Badge</p>
              <p className="text-lg text-white">{badges[0]}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {badges.slice(1).map((b) => <span key={b} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/75">{b}</span>)}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
            <Heatmap solvedCount={solvedCount} />
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="tabs tabs-boxed bg-white/5 p-1">
                <button className={`tab tab-sm ${activeTab === 'recent' ? 'bg-white/15 text-white' : 'text-white/60'}`} onClick={() => setActiveTab('recent')}>Recent AC</button>
                <button className={`tab tab-sm ${activeTab === 'solutions' ? 'bg-white/15 text-white' : 'text-white/60'}`} onClick={() => setActiveTab('solutions')}>Solutions</button>
                <button className={`tab tab-sm ${activeTab === 'discuss' ? 'bg-white/15 text-white' : 'text-white/60'}`} onClick={() => setActiveTab('discuss')}>Discuss</button>
              </div>
              <button className="text-sm text-white/60 hover:text-white">View all submissions ›</button>
            </div>

            <div className="space-y-2">
              {recent.map((item) => (
                <div key={`${item.title}-${item.time}`} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10">
                  <p className="max-w-[70%] truncate text-sm text-white/90">{item.title}</p>
                  <p className="text-xs text-white/45">{item.time}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
            <h3 className="mb-3 text-xl font-semibold">Problem Library</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {problems.slice(0, 8).map((problem) => (
                <NavLink key={problem._id} to={`/problem/${problem._id}`} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-amber-400/35 hover:bg-amber-400/10">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h4 className="truncate text-sm text-white/90">{problem.title}</h4>
                    <DifficultyChip value={problem.difficulty} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-white/55">
                    <span>{problem.tags || 'untagged'}</span>
                    <span>{isSolved(problem._id) ? 'Solved' : 'Unsolved'}</span>
                  </div>
                </NavLink>
              ))}
            </div>
          </section>
        </main>
      </div>

      {showProfileModal && user && (
        <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onSaved={async () => dispatch(checkAuth())} />
      )}
    </div>
  );
}

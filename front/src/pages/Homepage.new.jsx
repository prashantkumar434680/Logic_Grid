// import { useEffect, useMemo, useRef, useState } from 'react';
// import { NavLink } from 'react-router';
// import { useDispatch, useSelector } from 'react-redux';
// import axiosClient from '../utils/axiosClient';
// import axios from 'axios';
// import { checkAuth, logoutUser } from '../authSlice';

// function ProfileModal({ user, onClose, onSaved }) {
//   const [firstName, setFirstName] = useState(user?.firstName || '');
//   const [lastName, setLastName] = useState(user?.lastName || '');
//   const [bio, setBio] = useState(user?.bio || '');
//   const [age, setAge] = useState(user?.age ?? '');
//   const [avatar, setAvatar] = useState(user?.avatar || null);
//   const [avatarPublicId, setAvatarPublicId] = useState(user?.avatarPublicId || null);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [removeAvatar, setRemoveAvatar] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [uploading, setUploading] = useState(false);
//   const [error, setError] = useState('');

//   const previewUrl = removeAvatar ? null : avatar;

//   const handleFileChange = (event) => {
//     const file = event.target.files?.[0];
//     setError('');
//     if (!file) return setSelectedFile(null);
//     if (!file.type.startsWith('image/')) {
//       setError('Please choose a valid image file');
//       event.target.value = '';
//       return;
//     }
//     if (file.size > 5 * 1024 * 1024) {
//       setError('Image size must be less than 5MB');
//       event.target.value = '';
//       return;
//     }
//     setSelectedFile(file);
//     setRemoveAvatar(false);
//   };

//   const uploadAvatar = async () => {
//     if (!selectedFile) return { secureUrl: avatar, publicId: avatarPublicId };
//     setUploading(true);
//     try {
//       const { data: signatureData } = await axiosClient.get('/userData/profile/upload-signature');
//       const formData = new FormData();
//       formData.append('file', selectedFile);
//       formData.append('signature', signatureData.signature);
//       formData.append('timestamp', signatureData.timestamp);
//       formData.append('public_id', signatureData.public_id);
//       formData.append('folder', signatureData.folder);
//       formData.append('api_key', signatureData.api_key);

//       const uploadResponse = await axios.post(signatureData.upload_url, formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });

//       return {
//         secureUrl: uploadResponse.data.secure_url,
//         publicId: uploadResponse.data.public_id,
//       };
//     } finally {
//       setUploading(false);
//     }
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     setError('');
//     setSaving(true);
//     try {
//       let nextAvatar = avatar;
//       let nextAvatarPublicId = avatarPublicId;
//       if (selectedFile) {
//         const uploadResult = await uploadAvatar();
//         nextAvatar = uploadResult.secureUrl;
//         nextAvatarPublicId = uploadResult.publicId;
//       }

//       await axiosClient.patch('/userData/profile', {
//         firstName,
//         lastName,
//         bio,
//         age,
//         avatar: removeAvatar ? null : nextAvatar,
//         avatarPublicId: removeAvatar ? null : nextAvatarPublicId,
//         removeAvatar,
//       });

//       await onSaved();
//       onClose();
//     } catch (err) {
//       setError(err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Failed to update profile');
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4">
//       <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-[#121721] p-6 text-white shadow-2xl">
//         <div className="mb-6 flex items-start justify-between">
//           <div>
//             <h2 className="text-2xl font-semibold tracking-tight">Edit profile</h2>
//             <p className="mt-1 text-xs text-white/40">Update your profile details.</p>
//           </div>
//           <button onClick={onClose} className="text-white/45 hover:text-white/70">✕</button>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-5">
//           <div className="flex flex-col gap-5 md:flex-row">
//             <div className="md:w-1/3">
//               <div className="mb-3 flex justify-center">
//                 {previewUrl ? (
//                   <img src={previewUrl} alt="Profile" className="h-28 w-28 rounded-full border border-white/10 object-cover" />
//                 ) : (
//                   <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-3xl font-semibold text-white">
//                     {firstName?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase() || 'U'}
//                   </div>
//                 )}
//               </div>

//               <input type="file" accept="image/*" onChange={handleFileChange} className="file-input file-input-bordered w-full bg-white/5 text-white" />
//               <button
//                 type="button"
//                 onClick={() => {
//                   setSelectedFile(null);
//                   setAvatar(null);
//                   setAvatarPublicId(null);
//                   setRemoveAvatar(true);
//                 }}
//                 className="mt-3 w-full rounded-lg border border-rose-500/20 px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/10"
//               >
//                 Remove photo
//               </button>
//             </div>

//             <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
//               <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/50" />
//               <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/50" />
//               <input type="number" min="6" max="80" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/50" />
//               <input type="email" value={user?.emailId || ''} disabled className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/45 outline-none" />
//               <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" rows={4} className="md:col-span-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-amber-400/50" />
//             </div>
//           </div>

//           {error && <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>}

//           <div className="flex justify-end gap-3">
//             <button type="button" onClick={onClose} className="rounded-xl px-5 py-2.5 text-sm text-white/45 hover:text-white/75">Cancel</button>
//             <button type="submit" disabled={saving || uploading} className="rounded-xl border border-amber-400/35 bg-amber-400/15 px-5 py-2.5 text-sm font-semibold text-amber-100 hover:bg-amber-400/25 disabled:opacity-60">
//               {saving || uploading ? 'Saving...' : 'Save changes'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// function Heatmap({ solvedCount }) {
//   const blocks = useMemo(() => {
//     return Array.from({ length: 364 }, (_, i) => {
//       const seed = (i * 13 + solvedCount * 5) % 100;
//       if (seed < 72) return 0;
//       if (seed < 85) return 1;
//       if (seed < 93) return 2;
//       if (seed < 98) return 3;
//       return 4;
//     });
//   }, [solvedCount]);

//   const tones = ['bg-[#34373d]', 'bg-emerald-900/70', 'bg-emerald-700/80', 'bg-emerald-500/85', 'bg-emerald-300'];

//   return (
//     <div>
//       <div className="mb-2 flex items-center justify-between text-sm text-white/55">
//         <p><span className="text-white">{blocks.filter((v) => v > 0).length}</span> submissions in the past one year</p>
//         <div className="flex gap-4 text-xs">
//           <span>Total active days: <strong className="text-white">{blocks.filter((v) => v > 0).length}</strong></span>
//           <span>Max streak: <strong className="text-white">{Math.max(4, Math.floor(solvedCount / 3))}</strong></span>
//         </div>
//       </div>

//       <div className="overflow-x-auto">
//         <div className="grid min-w-[760px] grid-flow-col grid-rows-7 gap-1 rounded-xl bg-[#1d2128] p-4">
//           {blocks.map((v, i) => (
//             <div key={i} className={`h-3.5 w-3.5 rounded-sm ${tones[v]} transition-transform hover:scale-110`} />
//           ))}
//         </div>
//       </div>

//       <div className="mt-3 flex items-center justify-between text-xs text-white/45">
//         {['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((m) => <span key={m}>{m}</span>)}
//       </div>
//     </div>
//   );
// }

// function DifficultyChip({ value }) {
//   const cls = {
//     easy: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
//     medium: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
//     hard: 'border-rose-400/30 bg-rose-400/10 text-rose-300',
//   };

//   return <span className={`rounded-full border px-2 py-0.5 text-[10px] ${cls[value] || 'border-white/20 bg-white/5 text-white/70'}`}>{value}</span>;
// }

// function TopNavbar({ user, onLogout, onEditProfile }) {
//   const [open, setOpen] = useState(false);
//   const ref = useRef(null);

//   useEffect(() => {
//     const handle = (e) => {
//       if (ref.current && !ref.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener('mousedown', handle);
//     return () => document.removeEventListener('mousedown', handle);
//   }, []);

//   return (
//     <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#11141d]/95 backdrop-blur">
//       <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-3 md:px-6">
//         <div className="flex items-center gap-6">
//           <div className="flex items-center gap-2">
//             <div className="h-7 w-7 rounded-md bg-gradient-to-br from-amber-400 to-orange-500" />
//             <span className="text-[19px] font-semibold tracking-tight text-white">LogicGrid</span>
//           </div>
//           <div className="hidden items-center gap-5 text-sm text-white/65 md:flex">
//             <button className="hover:text-white">Problems</button>
//             <button className="hover:text-white">Contest</button>
//             <button className="hover:text-white">Discuss</button>
//             <button className="hover:text-white">Interview</button>
//           </div>
//         </div>

//         <div className="flex items-center gap-3">
//           <div className="relative hidden md:block">
//             <span className="pointer-events-none absolute left-3 top-2.5 text-white/35">⌕</span>
//             <input placeholder="Search" className="w-56 rounded-full border border-white/10 bg-white/5 py-2 pl-10 pr-4 text-sm text-white outline-none focus:border-amber-400/35" />
//           </div>

//           <div className="relative" ref={ref}>
//             <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1.5 text-white/80 hover:bg-white/10">
//               {user?.avatar ? (
//                 <img src={user.avatar} alt="Profile" className="h-7 w-7 rounded-full object-cover" />
//               ) : (
//                 <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-semibold text-white">
//                   {user?.firstName?.[0]?.toUpperCase() || 'U'}
//                 </div>
//               )}
//             </button>

//             {open && (
//               <div className="absolute right-0 mt-3 w-[320px] rounded-2xl border border-white/10 bg-[#2a2d33] p-4 text-white shadow-2xl">
//                 <p className="text-lg font-semibold">{user?.firstName || 'User'} {user?.lastName || ''}</p>
//                 <p className="mb-3 text-xs text-amber-300">Access all features with our Premium subscription!</p>

//                 <div className="mb-4 grid grid-cols-4 gap-3 text-xs">
//                   {['My Lists', 'Notebook', 'Progress', 'Points'].map((item) => (
//                     <button key={item} className="rounded-2xl border border-white/10 bg-white/10 p-3 text-white/75 hover:bg-white/15">{item}</button>
//                   ))}
//                 </div>

//                 <div className="space-y-1 border-t border-white/10 pt-3">
//                   {['Try New Features', 'Orders', 'My Playgrounds', 'Settings', 'Appearance'].map((item) => (
//                     <button key={item} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-white/75 hover:bg-white/10 hover:text-white">
//                       <span>{item}</span>
//                       {item === 'Appearance' && <span>›</span>}
//                     </button>
//                   ))}

//                   <button onClick={() => { onEditProfile(); setOpen(false); }} className="flex w-full rounded-lg px-2 py-2 text-sm text-amber-300 hover:bg-amber-400/10">Edit Profile</button>
//                   <button onClick={() => { onLogout(); setOpen(false); }} className="flex w-full rounded-lg px-2 py-2 text-sm text-rose-300 hover:bg-rose-500/10">Sign Out</button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// }

// export default function Homepage() {
//   const dispatch = useDispatch();
//   const { user } = useSelector((s) => s.auth);

//   const [loading, setLoading] = useState(true);
//   const [problems, setProblems] = useState([]);
//   const [solvedProblems, setSolvedProblems] = useState([]);
//   const [showProfileModal, setShowProfileModal] = useState(false);
//   const [activeTab, setActiveTab] = useState('recent');

//   useEffect(() => {
//     const fetchAll = async () => {
//       setLoading(true);
//       try {
//         const { data } = await axiosClient.get('/problem/getAllProblem');
//         setProblems(Array.isArray(data) ? data : []);
//       } catch {
//         setProblems([]);
//       }

//       if (user) {
//         try {
//           const { data } = await axiosClient.get('/problem/problemSolvedByUser');
//           setSolvedProblems(Array.isArray(data) ? data : []);
//         } catch {
//           setSolvedProblems([]);
//         }
//       }
//       setLoading(false);
//     };

//     fetchAll();
//   }, [user]);

//   const isSolved = (problemId) => solvedProblems.some((sp) => sp?._id === problemId || sp?.problemId === problemId || sp?.problemId?._id === problemId || sp?.problem?._id === problemId || sp === problemId);

//   const solvedCount = solvedProblems.length;
//   const totalCount = problems.length;

//   const solvedEasy = useMemo(() => problems.filter((p) => p.difficulty === 'easy' && isSolved(p._id)).length, [problems, solvedProblems]);
//   const solvedMedium = useMemo(() => problems.filter((p) => p.difficulty === 'medium' && isSolved(p._id)).length, [problems, solvedProblems]);
//   const solvedHard = useMemo(() => problems.filter((p) => p.difficulty === 'hard' && isSolved(p._id)).length, [problems, solvedProblems]);

//   const rank = formatNumber(Math.max(1, 1264787 - solvedCount * 11));
//   const username = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
//   const userHandle = user?.emailId?.split('@')?.[0] || 'logicgrid_user';

//   const badges = ['50 Days Badge 2025', 'Consistency I', 'Binary Tree Hero'];
//   const skills = ['Dynamic Programming x9', 'Graph x6', 'Binary Tree x8', 'Greedy x4', 'Backtracking x3'];

//   const recent = (problems.slice(0, 5).map((p, i) => ({ title: p.title, time: i === 0 ? '29 minutes ago' : `${i + 1} days ago` })));

//   if (loading) {
//     return <div className="flex min-h-screen items-center justify-center bg-[#10131a]"><span className="loading loading-spinner loading-lg text-amber-300" /></div>;
//   }

//   return (
//     <div className="min-h-screen bg-[#10131a] text-white">
//       <TopNavbar user={user} onLogout={() => dispatch(logoutUser())} onEditProfile={() => setShowProfileModal(true)} />

//       <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[320px_1fr]">
//         <aside className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
//           <div className="mb-5 flex items-start gap-4">
//             {user?.avatar ? <img src={user.avatar} alt="Profile" className="h-20 w-20 rounded-2xl object-cover" /> : <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-3xl font-bold text-white">{username[0]?.toUpperCase() || 'U'}</div>}
//             <div className="min-w-0 flex-1">
//               <h2 className="truncate text-3xl font-semibold text-white">{username}</h2>
//               <p className="truncate text-sm text-white/55">{userHandle}</p>
//               <p className="mt-2 text-2xl text-white/90">Rank <span className="font-semibold text-amber-300">{rank}</span></p>
//             </div>
//           </div>

//           <div className="mb-5 flex items-center gap-4 text-sm text-white/75">
//             <span><strong className="text-white">0</strong> Following</span>
//             <span className="text-white/25">|</span>
//             <span><strong className="text-white">0</strong> Followers</span>
//           </div>

//           <button onClick={() => setShowProfileModal(true)} className="mb-5 w-full rounded-lg border border-emerald-500/30 bg-emerald-500/15 py-2.5 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25">Edit Profile</button>

//           <div className="mb-4 border-t border-white/10 pt-4">
//             <h4 className="mb-3 text-lg font-semibold">Community Stats</h4>
//             <div className="space-y-2 text-sm text-white/75">
//               <div className="flex justify-between"><span>Views</span><span>0</span></div>
//               <div className="flex justify-between"><span>Solution</span><span>0</span></div>
//               <div className="flex justify-between"><span>Discuss</span><span>0</span></div>
//               <div className="flex justify-between"><span>Reputation</span><span>0</span></div>
//             </div>
//           </div>

//           <div className="mb-4 border-t border-white/10 pt-4">
//             <h4 className="mb-3 text-lg font-semibold">Languages</h4>
//             <div className="space-y-2 text-sm text-white/75">
//               <div className="flex justify-between"><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">C++</span><span>{Math.max(1, Math.floor(solvedCount * 0.48))} solved</span></div>
//               <div className="flex justify-between"><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">Java</span><span>{Math.max(1, Math.floor(solvedCount * 0.32))} solved</span></div>
//               <div className="flex justify-between"><span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">JavaScript</span><span>{Math.max(1, Math.floor(solvedCount * 0.2))} solved</span></div>
//             </div>
//           </div>

//           <div className="border-t border-white/10 pt-4">
//             <h4 className="mb-3 text-lg font-semibold">Skills</h4>
//             <div className="flex flex-wrap gap-2">
//               {skills.map((s) => <span key={s} className="rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs text-amber-200">{s}</span>)}
//             </div>
//           </div>
//         </aside>

//         <main className="space-y-6">
//           <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr]">
//             <div className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
//               <div className="grid grid-cols-1 gap-5 md:grid-cols-[240px_1fr]">
//                 <div className="flex items-center justify-center">
//                   <div className="relative flex h-44 w-44 items-center justify-center rounded-full" style={{ background: `conic-gradient(#22c55e 0deg ${Math.round((solvedEasy / Math.max(solvedCount, 1)) * 360)}deg, #f59e0b ${Math.round((solvedEasy / Math.max(solvedCount, 1)) * 360)}deg ${Math.round(((solvedEasy + solvedMedium) / Math.max(solvedCount, 1)) * 360)}deg, #f43f5e ${Math.round(((solvedEasy + solvedMedium) / Math.max(solvedCount, 1)) * 360)}deg 360deg)` }}>
//                     <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-[#151922]">
//                       <span className="text-4xl font-semibold">{solvedCount}</span>
//                       <span className="text-sm text-white/45">/ {totalCount}</span>
//                       <span className="text-xs text-emerald-300">Solved</span>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <h3 className="text-sm uppercase tracking-widest text-white/40">Difficulty Breakdown</h3>
//                   <div className="flex items-center justify-between rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2"><span className="text-emerald-300">Easy</span><span>{solvedEasy}</span></div>
//                   <div className="flex items-center justify-between rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-2"><span className="text-amber-300">Medium</span><span>{solvedMedium}</span></div>
//                   <div className="flex items-center justify-between rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-2"><span className="text-rose-300">Hard</span><span>{solvedHard}</span></div>
//                 </div>
//               </div>
//             </div>

//             <div className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
//               <div className="mb-3 flex items-center justify-between">
//                 <h3 className="text-xl font-semibold">Badges</h3>
//                 <span className="text-2xl text-white/35">→</span>
//               </div>
//               <div className="mb-3 text-5xl">🏅</div>
//               <p className="text-sm text-white/50">Most Recent Badge</p>
//               <p className="text-lg text-white">{badges[0]}</p>
//               <div className="mt-4 flex flex-wrap gap-2">
//                 {badges.slice(1).map((b) => <span key={b} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/75">{b}</span>)}
//               </div>
//             </div>
//           </section>

//           <section className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
//             <Heatmap solvedCount={solvedCount} />
//           </section>

//           <section className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
//             <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
//               <div className="tabs tabs-boxed bg-white/5 p-1">
//                 <button className={`tab tab-sm ${activeTab === 'recent' ? 'bg-white/15 text-white' : 'text-white/60'}`} onClick={() => setActiveTab('recent')}>Recent AC</button>
//                 <button className={`tab tab-sm ${activeTab === 'solutions' ? 'bg-white/15 text-white' : 'text-white/60'}`} onClick={() => setActiveTab('solutions')}>Solutions</button>
//                 <button className={`tab tab-sm ${activeTab === 'discuss' ? 'bg-white/15 text-white' : 'text-white/60'}`} onClick={() => setActiveTab('discuss')}>Discuss</button>
//               </div>
//               <button className="text-sm text-white/60 hover:text-white">View all submissions ›</button>
//             </div>

//             <div className="space-y-2">
//               {recent.map((item) => (
//                 <div key={`${item.title}-${item.time}`} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 hover:bg-white/10">
//                   <p className="max-w-[70%] truncate text-sm text-white/90">{item.title}</p>
//                   <p className="text-xs text-white/45">{item.time}</p>
//                 </div>
//               ))}
//             </div>
//           </section>

//           <section className="rounded-2xl border border-white/10 bg-[#151922] p-5 shadow-lg">
//             <h3 className="mb-3 text-xl font-semibold">Problem Library</h3>
//             <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
//               {problems.slice(0, 8).map((problem) => (
//                 <NavLink key={problem._id} to={`/problem/${problem._id}`} className="rounded-xl border border-white/10 bg-white/5 p-4 hover:border-amber-400/35 hover:bg-amber-400/10">
//                   <div className="mb-2 flex items-center justify-between gap-3">
//                     <h4 className="truncate text-sm text-white/90">{problem.title}</h4>
//                     <DifficultyChip value={problem.difficulty} />
//                   </div>
//                   <div className="flex items-center justify-between text-xs text-white/55">
//                     <span>{problem.tags || 'untagged'}</span>
//                     <span>{isSolved(problem._id) ? 'Solved' : 'Unsolved'}</span>
//                   </div>
//                 </NavLink>
//               ))}
//             </div>
//           </section>
//         </main>
//       </div>

//       {showProfileModal && user && (
//         <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onSaved={async () => dispatch(checkAuth())} />
//       )}
//     </div>
//   );
// }















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
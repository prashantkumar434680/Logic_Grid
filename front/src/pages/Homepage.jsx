// import { useEffect, useState, useRef } from 'react';
// import { NavLink, useNavigate } from 'react-router';
// import { useDispatch, useSelector } from 'react-redux';
// import axiosClient from '../utils/axiosClient';
// import axios from 'axios';
// import { checkAuth, logoutUser } from '../authSlice';

// // ── Animated grid ─────────────────────────────────────────────────────

// function GridBackground() {
//   const canvasRef = useRef(null);
//   useEffect(() => {
//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext('2d');
//     let animId;
//     const resize = () => {
//       canvas.width  = canvas.offsetWidth;
//       canvas.height = canvas.offsetHeight;
//     };
//     resize();
//     window.addEventListener('resize', resize);
//     let t = 0;
//     const draw = () => {
//       ctx.clearRect(0, 0, canvas.width, canvas.height);
//       const CELL = 38;
//       const cols = Math.floor(canvas.width  / CELL) + 2;
//       const rows = Math.floor(canvas.height / CELL) + 2;
//       const cw = canvas.width  / cols;
//       const ch = canvas.height / rows;
//       t += 0.012;
//       for (let i = 0; i < cols * rows; i++) {
//         const col   = i % cols;
//         const row   = Math.floor(i / cols);
//         const phase = ((col * 0.7 + row * 0.5) % (Math.PI * 2));
//         const o     = Math.max(0, 0.06 + 0.09 * Math.sin(t + phase));
//         ctx.strokeStyle = `rgba(124,92,233,${o})`;
//         ctx.lineWidth   = 0.5;
//         ctx.strokeRect(col * cw, row * ch, cw, ch);
//         if (Math.sin(t * 0.4 + phase) > 0.94) {
//           ctx.fillStyle = `rgba(124,92,233,${o * 3})`;
//           ctx.fillRect(col * cw + cw / 2 - 1, row * ch + ch / 2 - 1, 2, 2);
//         }
//       }
//       animId = requestAnimationFrame(draw);
//     };
//     draw();
//     return () => {
//       cancelAnimationFrame(animId);
//       window.removeEventListener('resize', resize);
//     };
//   }, []);
//   return (
//     <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ opacity: 0.35 }} />
//   );
// }

// // ── Badges ────────────────────────────────────────────────────────────

// function DiffBadge({ difficulty }) {
//   const styles = {
//     easy:   "bg-teal-500/10 text-teal-300 border border-teal-500/20",
//     medium: "bg-amber-500/10 text-amber-300 border border-amber-500/20",
//     hard:   "bg-red-500/10 text-red-300 border border-red-500/20",
//   };
//   return (
//     <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full
//       ${styles[difficulty?.toLowerCase()] || "bg-white/5 text-white/40"}`}>
//       {difficulty}
//     </span>
//   );
// }

// function TagBadge({ tag }) {
//   return (
//     <span className="text-[10px] font-medium px-2 py-0.5 rounded-full
//       bg-purple-500/10 text-purple-300 border border-purple-500/20">
//       {tag}
//     </span>
//   );
// }

// // ── Stat card ─────────────────────────────────────────────────────────

// function StatCard({ num, label }) {
//   return (
//     <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3.5">
//       <p className="font-['Instrument_Serif'] text-[22px] text-white tracking-tight">{num}</p>
//       <p className="text-[11px] text-white/30 mt-0.5">{label}</p>
//     </div>
//   );
// }

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

//     if (!file) {
//       setSelectedFile(null);
//       return;
//     }

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
//     if (!selectedFile) {
//       return {
//         secureUrl: avatar,
//         publicId: avatarPublicId,
//       };
//     }

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
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
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
//       setError(
//         err.response?.data?.message ||
//         err.response?.data?.error?.message ||
//         err.message ||
//         'Failed to update profile'
//       );
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4">
//       <div
//         className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#101019] p-6 text-white shadow-2xl"
//         style={{ backdropFilter: 'blur(16px)' }}
//       >
//         <div className="mb-6 flex items-start justify-between">
//           <div>
//             <h2 className="font-['Instrument_Serif'] text-[28px] tracking-tight">Edit profile</h2>
//             <p className="mt-1 text-[12px] text-white/35">Update your name and profile picture.</p>
//           </div>
//           <button onClick={onClose} className="text-white/40 transition-colors hover:text-white/70">
//             <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-5">
//           <div className="flex flex-col gap-5 md:flex-row">
//             <div className="md:w-1/3">
//               <div className="mb-3 flex justify-center">
//                 {previewUrl ? (
//                   <img
//                     src={previewUrl}
//                     alt="Profile"
//                     className="h-28 w-28 rounded-full border border-white/10 object-cover"
//                   />
//                 ) : (
//                   <div
//                     className="flex h-28 w-28 items-center justify-center rounded-full text-3xl font-semibold text-white"
//                     style={{ background: 'linear-gradient(135deg,#7c5ce9,#4a9cf6)' }}
//                   >
//                     {firstName?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase() || 'U'}
//                   </div>
//                 )}
//               </div>

//               <input
//                 type="file"
//                 accept="image/*"
//                 onChange={handleFileChange}
//                 className="file-input file-input-bordered w-full bg-white/[0.04] text-white"
//               />

//               <button
//                 type="button"
//                 onClick={() => {
//                   setSelectedFile(null);
//                   setAvatar(null);
//                   setAvatarPublicId(null);
//                   setRemoveAvatar(true);
//                 }}
//                 className="mt-3 w-full rounded-lg border border-red-500/20 px-3 py-2 text-[12px] text-red-300 transition-colors hover:bg-red-500/10"
//               >
//                 Remove photo
//               </button>
//             </div>

//             <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
//               <input
//                 type="text"
//                 value={firstName}
//                 onChange={(e) => setFirstName(e.target.value)}
//                 placeholder="First name"
//                 className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-purple-500/50"
//               />

//               <input
//                 type="text"
//                 value={lastName}
//                 onChange={(e) => setLastName(e.target.value)}
//                 placeholder="Last name"
//                 className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-purple-500/50"
//               />

//               <input
//                 type="number"
//                 min="6"
//                 max="80"
//                 value={age}
//                 onChange={(e) => setAge(e.target.value)}
//                 placeholder="Age"
//                 className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-purple-500/50"
//               />

//               <input
//                 type="email"
//                 value={user?.emailId || ''}
//                 disabled
//                 className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-sm text-white/45 outline-none"
//               />

//               <textarea
//                 value={bio}
//                 onChange={(e) => setBio(e.target.value)}
//                 placeholder="Short bio"
//                 rows={4}
//                 className="md:col-span-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-purple-500/50"
//               />
//             </div>
//           </div>

//           {error && (
//             <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
//               {error}
//             </div>
//           )}

//           <div className="flex justify-end gap-3 pt-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="rounded-xl px-5 py-2.5 text-[13px] text-white/45 transition-colors hover:text-white/75"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={saving || uploading}
//               className="rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity disabled:opacity-50"
//               style={{ background: 'linear-gradient(135deg,#7c5ce9,#4a9cf6)' }}
//             >
//               {saving || uploading ? 'Saving...' : 'Save changes'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // ── User dropdown ─────────────────────────────────────────────────────

// function UserDropdown({ user, onLogout, onEditProfile }) {
//   const [open, setOpen] = useState(false);
//   const ref             = useRef(null);
//   const navigate        = useNavigate();

//   useEffect(() => {
//     const handler = (e) => {
//       if (ref.current && !ref.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, []);

//   return (
//     <div className="relative" ref={ref}>
//       <button
//         onClick={() => setOpen(v => !v)}
//         className="flex items-center gap-2 px-3 py-1.5 rounded-lg
//           bg-white/[0.04] border border-white/[0.08]
//           hover:bg-white/[0.08] hover:border-white/[0.15]
//           transition-all text-[13px] text-white/70"
//       >
//         {user?.avatar ? (
//           <img
//             src={user.avatar}
//             alt={user?.firstName || 'User'}
//             className="h-6 w-6 rounded-full object-cover"
//           />
//         ) : (
//           <div className="w-6 h-6 rounded-full flex items-center justify-center
//             text-[11px] font-semibold text-white"
//             style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
//             {user?.firstName?.[0]?.toUpperCase()}
//           </div>
//         )}
//         {user?.firstName}
//         <svg className={`w-3 h-3 text-white/40 transition-transform ${open ? "rotate-180" : ""}`}
//           fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//           <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
//         </svg>
//       </button>

//       {open && (
//         <div className="absolute right-0 mt-2 w-44 rounded-xl overflow-hidden z-50"
//           style={{
//             background:     "rgba(15,15,25,0.95)",
//             border:         "1px solid rgba(255,255,255,0.08)",
//             backdropFilter: "blur(12px)"
//           }}>

//           {/* Header */}
//           <div className="px-4 py-3 border-b border-white/[0.06]">
//             <p className="text-[13px] font-medium text-white">{user?.firstName}</p>
//             <p className="text-[11px] text-white/35 mt-0.5">{user?.emailId}</p>
//           </div>

//           <div className="py-1">
//             <button
//               onClick={() => { navigate('/profile'); setOpen(false); }}
//               className="w-full text-left px-4 py-2.5 text-[12px] text-white/75
//                 hover:bg-white/5 transition-colors flex items-center gap-2"
//             >
//               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
//                 stroke="currentColor" strokeWidth={2}>
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
//               </svg>
//               My Profile
//             </button>

//             <button
//               onClick={() => { onEditProfile(); setOpen(false); }}
//               className="w-full text-left px-4 py-2.5 text-[12px] text-white/75
//                 hover:bg-white/5 transition-colors flex items-center gap-2"
//             >
//               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
//                 stroke="currentColor" strokeWidth={2}>
//                 <path strokeLinecap="round" strokeLinejoin="round" d="M11 5h2m-1-1v2m6 8a8 8 0 11-16 0 8 8 0 0116 0z" />
//               </svg>
//               Edit profile
//             </button>

//             {/* Admin — only visible to admins */}
//             {user?.role === 'admin' && (
//               <button
//                 onClick={() => { navigate('/admin'); setOpen(false); }}
//                 className="w-full text-left px-4 py-2.5 text-[12px] text-purple-400
//                   hover:bg-purple-500/10 transition-colors flex items-center gap-2"
//               >
//                 <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
//                   stroke="currentColor" strokeWidth={2}>
//                   <path strokeLinecap="round" strokeLinejoin="round"
//                     d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
//                   <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                 </svg>
//                 Admin panel
//               </button>
//             )}

//             {/* Logout */}
//             <button
//               onClick={() => { onLogout(); setOpen(false); }}
//               className="w-full text-left px-4 py-2.5 text-[12px] text-red-400
//                 hover:bg-red-500/10 transition-colors flex items-center gap-2"
//             >
//               <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24"
//                 stroke="currentColor" strokeWidth={2}>
//                 <path strokeLinecap="round" strokeLinejoin="round"
//                   d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
//               </svg>
//               Logout
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ── Main ──────────────────────────────────────────────────────────────

// export default function Homepage() {
//   const dispatch = useDispatch();
//   const { user } = useSelector((s) => s.auth);
//   const [loading, setLoading] = useState(true);
//   const [problems, setProblems] = useState([]);
//   const [solvedProblems, setSolvedProblems] = useState([]);
//   const [showProfileModal, setShowProfileModal] = useState(false);
//   const [filters, setFilters] = useState({
//     difficulty: 'all',
//     tag: 'all',
//     status: 'all'
//   });
//   const [searchName, setSearchName] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [searchLoading, setSearchLoading] = useState(false);
//   const [searchError, setSearchError] = useState('');
//   const [hasSearched, setHasSearched] = useState(false);
//   const [recentSearches, setRecentSearches] = useState([]);

//   useEffect(() => {
//     // ✅ fetch problems and solved together
//     const fetchAll = async () => {
//       setLoading(true);
//       try {
//         const { data } = await axiosClient.get('/problem/getAllProblem');
//         setProblems(Array.isArray(data) ? data : []);
//       } catch (e) {
//         console.error('Failed to fetch problems:', e);
//         setProblems([]);
//       }

//       if (user) {
//         try {
//           const { data } = await axiosClient.get('/problem/problemSolvedByUser');
//           setSolvedProblems(Array.isArray(data) ? data : []);
//         } catch (e) {
//           console.error('Failed to fetch solved problems:', e);
//           setSolvedProblems([]);
//         }
//       } else {
//         setSolvedProblems([]);
//       }

//       setLoading(false);
//     };

//     fetchAll();
//   }, [user]);

//   useEffect(() => {
//     try {
//       const savedSearches = JSON.parse(localStorage.getItem('logicgrid-recent-searches') || '[]');
//       if (Array.isArray(savedSearches)) {
//         setRecentSearches(savedSearches.slice(0, 5));
//       }
//     } catch {
//       setRecentSearches([]);
//     }
//   }, []);

//   useEffect(() => {
//     const trimmedName = searchName.trim();
//     if (!trimmedName) {
//       return;
//     }

//     const timer = setTimeout(() => {
//       runSearch(trimmedName, true);
//     }, 450);

//     return () => clearTimeout(timer);
//   }, [searchName]);

//   const handleLogout = () => {
//     dispatch(logoutUser());
//     setSolvedProblems([]);
//   };

//   const handleProfileSaved = async () => {
//     await dispatch(checkAuth());
//   };

//   const persistRecentSearches = (nextSearches) => {
//     setRecentSearches(nextSearches);
//     localStorage.setItem('logicgrid-recent-searches', JSON.stringify(nextSearches));
//   };

//   const addRecentSearch = (nameValue) => {
//     const nextEntry = { name: nameValue };
//     const deduped = recentSearches.filter((entry) => entry.name !== nextEntry.name);
//     const nextSearches = [nextEntry, ...deduped].slice(0, 5);
//     persistRecentSearches(nextSearches);
//   };

//   const runSearch = async (nameValue = searchName.trim(), isDebounced = false) => {
//     if (!nameValue) {
//       setHasSearched(false);
//       setSearchResults([]);
//       setSearchError('');
//       return;
//     }

//     setSearchLoading(true);
//     setSearchError('');

//     try {
//       const { data } = await axiosClient.get('/problem/search', {
//         params: {
//           name: nameValue || undefined,
//         },
//       });

//       const resultArray = Array.isArray(data) ? data : [];
//       setSearchResults(resultArray);
//       setHasSearched(true);

//       if (!isDebounced) {
//         addRecentSearch(nameValue);
//       }
//     } catch (error) {
//       setHasSearched(true);
//       setSearchResults([]);
//       setSearchError(error?.response?.data?.message || 'Failed to search problems');
//     } finally {
//       setSearchLoading(false);
//     }
//   };

//   const clearSearch = () => {
//     setSearchName('');
//     setSearchResults([]);
//     setSearchError('');
//     setHasSearched(false);
//   };

//   const highlightText = (text = '', keyword = '') => {
//     const trimmedKeyword = keyword.trim();
//     if (!trimmedKeyword) {
//       return text;
//     }

//     const regex = new RegExp(`(${trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'ig');
//     return text.split(regex).map((part, index) => {
//       if (part.toLowerCase() === trimmedKeyword.toLowerCase()) {
//         return (
//           <mark key={`${part}-${index}`} className="rounded bg-amber-400/25 px-1 text-amber-100">
//             {part}
//           </mark>
//         );
//       }

//       return <span key={`${part}-${index}`}>{part}</span>;
//     });
//   };

//   const isSolved = (problemId) => {
//     return solvedProblems.some((sp) => {
//       if (sp?._id === problemId) return true;
//       if (sp?.problemId === problemId) return true;
//       if (sp?.problemId?._id === problemId) return true;
//       if (sp?.problem?._id === problemId) return true;
//       if (sp === problemId) return true;
//       return false;
//     });
//   };

//   // const filtered = problems.filter(p => {
//   //   if (filters.difficulty !== 'all' && p.difficulty !== filters.difficulty) return false;
//   //   if (filters.tag       !== 'all' && p.tags       !== filters.tag)       return false;
//   //   if (filters.status === 'solved' && !isSolved(p._id))                   return false;
//   //   return true;
//   // });

//   const filtered = problems.filter(problem => {
//     const difficultyMatch = filters.difficulty === 'all' || problem.difficulty === filters.difficulty;
//     const tagMatch = filters.tag === 'all' || problem.tags === filters.tag;
//     const statusMatch = filters.status === 'all' || isSolved(problem._id);
//     return difficultyMatch && tagMatch && statusMatch;
//   });

//   const displayedProblems = hasSearched ? searchResults : filtered;
//   const activeQuery = searchName.trim();
//   const hasActiveSearchInput = Boolean(activeQuery);

//   const solvedCount = solvedProblems.length;

//   // ── Render ──────────────────────────────────────────────────────────
//   return (
//     <>
//       <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

//       <div className="min-h-screen bg-[#0a0a0f] font-['DM_Sans'] relative overflow-hidden">
//         <GridBackground />

//         {/* Glow */}
//         <div className="absolute inset-0 pointer-events-none" style={{
//           background: "radial-gradient(ellipse at 50% 0%,rgba(99,60,200,0.15) 0%,transparent 55%),radial-gradient(ellipse at 90% 80%,rgba(56,139,253,0.1) 0%,transparent 50%)"
//         }} />

//         <div className="relative z-10">

//           {/* ── Navbar — brand LEFT, user RIGHT, both always visible ── */}
//           <nav className="flex items-center justify-between px-7 py-4 border-b border-white/[0.06]"
//             style={{ backdropFilter: "blur(12px)", background: "rgba(10,10,15,0.7)" }}>

//             {/* Brand */}
//             <div className="flex items-center gap-2.5">
//               <div className="w-7 h-7 rounded-lg flex items-center justify-center"
//                 style={{ background: "linear-gradient(135deg,#7c5ce9,#4a9cf6)" }}>
//                 <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
//                   <path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z" />
//                 </svg>
//               </div>
//               <NavLink to="/" className="font-['Instrument_Serif'] text-[17px] text-white tracking-tight">
//                 LogicGrid
//               </NavLink>
//               <NavLink
//                 to="/daily-challenge"
//                 className="ml-4 text-[12px] px-2.5 py-1 rounded-md border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 transition-colors"
//               >
//                 Daily Challenge
//               </NavLink>
//             </div>

//             {/* ✅ User dropdown — always renders when user exists */}
//             {user && (
//               <UserDropdown
//                 user={user}
//                 onLogout={handleLogout}
//                 onEditProfile={() => setShowProfileModal(true)}
//               />
//             )}
//           </nav>

//           {/* ── Content ── */}
//           <div className="max-w-4xl mx-auto px-6 py-8">

//             <div className="mb-7 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-lg backdrop-blur-sm transition-all duration-300">
//               <div className="flex flex-col gap-3 md:flex-row md:items-center">
//                 <div className="relative flex-1">
//                   <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/35">
//                     <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
//                     </svg>
//                   </span>
//                   <input
//                     value={searchName}
//                     onChange={(e) => setSearchName(e.target.value)}
//                     placeholder="Search by problem name"
//                     className="w-full rounded-xl border border-white/[0.12] bg-[#141421] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition-all duration-200 focus:border-purple-400/70 focus:shadow-[0_0_0_3px_rgba(124,92,233,0.25)]"
//                   />
//                 </div>

//                 <button
//                   onClick={() => runSearch()}
//                   disabled={searchLoading}
//                   className="btn ml-4 text-[12px] px-2.5 py-1 rounded-md border border-amber-400/30 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 transition-colors disabled:opacity-60"
//                 >
//                   {searchLoading ? 'Searching...' : 'Search'}
//                 </button>

//                 <button
//                   onClick={clearSearch}
//                   className="btn btn-ghost rounded-xl border border-white/[0.15] px-4 text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
//                 >
//                   Clear
//                 </button>
//               </div>

//               {recentSearches.length > 0 && (
//                 <div className="mt-3 flex flex-wrap gap-2">
//                   {recentSearches.map((entry, index) => (
//                     <button
//                       key={`${entry.name}-${index}`}
//                       onClick={() => {
//                         setSearchName(entry.name || '');
//                         runSearch(entry.name || '');
//                       }}
//                       className="rounded-full border border-white/[0.14] bg-white/[0.04] px-3 py-1 text-[11px] text-white/65 transition-colors hover:bg-white/[0.1] hover:text-white"
//                     >
//                       {(entry.name || '').trim()}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>

//             {/* Stats — only when user is logged in */}
//             {user && (
//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
//                 <StatCard num={solvedCount}                                                          label="Problems solved" />
//                 <StatCard num={problems.length}                                                     label="Total problems"  />
//                 <StatCard num={`${Math.round((solvedCount / (problems.length || 1)) * 100)}%`}     label="Completion"      />
//                 <StatCard num={problems.filter(p => p.difficulty === 'hard' && isSolved(p._id)).length} label="Hard solved" />
//               </div>
//             )}

//             {/* Filters */}
//             <div className="flex flex-wrap gap-2 mb-6">
//               {[
//                 { key: "status",     options: [["all","All Problems"],    ["solved","Solved"]]                                                             },
//                 { key: "difficulty", options: [["all","All Difficulties"],["easy","Easy"],["medium","Medium"],["hard","Hard"]]                              },
//                 { key: "tag",        options: [["all","All Tags"],        ["array","Array"],["linked-list","linkedList"],["graph","Graph"],["dp","DP"]]      },
//               ].map(({ key, options }) => (
//                 <select key={key} value={filters[key]}
//                   onChange={(e) => setFilters(f => ({ ...f, [key]: e.target.value }))}
//                   className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg
//                     text-[12px] text-white/60 outline-none cursor-pointer
//                     hover:border-white/[0.15] focus:border-purple-500/50 transition-colors">
//                   {options.map(([val, label]) => (
//                     <option key={val} value={val} className="bg-[#1a1a2e]">{label}</option>
//                   ))}
//                 </select>
//               ))}
//             </div>

//             {/* Count label */}
//             <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-4">
//               {searchLoading
//                 ? 'Searching...'
//                 : `${displayedProblems.length} problem${displayedProblems.length !== 1 ? 's' : ''}${hasSearched ? ' found' : ''}`}
//             </p>

//             {/* ✅ Loading skeleton */}
//             {loading || searchLoading ? (
//               <div className="flex flex-col gap-2">
//                 {[1,2,3,4,5].map(i => (
//                   <div key={i} className="h-16 rounded-xl bg-white/[0.025] border border-white/[0.06]
//                     animate-pulse" />
//                 ))}
//               </div>

//             ) : searchError ? (
//               <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-4 text-[13px] text-red-300">
//                 {searchError}
//               </div>

//             ) : hasSearched && displayedProblems.length === 0 ? (
//               <div className="text-center py-16">
//                 <p className="text-[13px] text-white/25">No results found. Try another problem name.</p>
//               </div>

//             ) : !hasSearched && filtered.length === 0 ? (
//               <div className="text-center py-16">
//                 <p className="text-[13px] text-white/25">No problems match the current filters.</p>
//               </div>

//             ) : hasSearched || hasActiveSearchInput ? (
//               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                 {displayedProblems.map((problem) => (
//                   <div
//                     key={problem._id}
//                     className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-purple-400/40 hover:bg-purple-500/[0.07]"
//                   >
//                     <div className="mb-2 flex items-start justify-between gap-2">
//                       <h3 className="text-[16px] font-semibold text-white">
//                         {highlightText(problem.title, activeQuery)}
//                       </h3>
//                       <DiffBadge difficulty={problem.difficulty} />
//                     </div>

//                     <div className="mb-3 flex gap-1.5">
//                       {problem.tags && <TagBadge tag={problem.tags} />}
//                       {problem.isDailyProblem && (
//                         <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-amber-400/35 bg-amber-400/10 text-amber-200">
//                           Daily
//                         </span>
//                       )}
//                     </div>

//                     <p className="mb-4 text-[12px] leading-relaxed text-white/55 min-h-[52px]">
//                       {problem.description ? highlightText(`${problem.description.slice(0, 120)}${problem.description.length > 120 ? '...' : ''}`, activeQuery) : 'No description preview available.'}
//                     </p>

//                     <div className="flex items-center justify-between">
//                       {isSolved(problem._id) ? (
//                         <span className="text-[11px] text-teal-300">Solved</span>
//                       ) : (
//                         <span className="text-[11px] text-white/35">Unsolved</span>
//                       )}

//                       <NavLink
//                         to={`/problem/${problem._id}`}
//                         className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-white transition-opacity hover:opacity-90"
//                         style={{ background: 'linear-gradient(135deg,#7c5ce9,#4a9cf6)' }}
//                       >
//                         Solve
//                       </NavLink>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//             ) : (
//               <div className="flex flex-col gap-2">
//                 {filtered.map((problem, idx) => (
//                   <NavLink
//                     key={problem._id}
//                     to={`/problem/${problem._id}`}
//                     className="flex items-center justify-between px-5 py-4
//                       bg-white/[0.025] border border-white/[0.06] rounded-xl
//                       hover:bg-purple-500/[0.08] hover:border-purple-500/25
//                       transition-all group"
//                   >
//                     {/* Left */}
//                     <div className="flex items-center gap-4">
//                       <span className="text-[12px] text-white/20 w-6 tabular-nums shrink-0">
//                         {idx + 1}
//                       </span>
//                       <div>
//                         <p className="text-[14px] text-white/85 font-medium group-hover:text-white transition-colors">
//                           {problem.title}
//                         </p>
//                         <div className="flex gap-1.5 mt-1.5">
//                           <DiffBadge difficulty={problem.difficulty} />
//                           {problem.tags && <TagBadge tag={problem.tags} />}
//                         </div>
//                       </div>
//                     </div>

//                     {/* ✅ Right — solved or unsolved */}
//                     <div className="flex items-center gap-3 shrink-0">
//                       {isSolved(problem._id) ? (
//                         <span className="flex items-center gap-1.5 text-[11px] text-teal-300
//                           bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-full">
//                           <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24"
//                             stroke="currentColor" strokeWidth={2.5}>
//                             <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//                           </svg>
//                           Solved
//                         </span>
//                       ) : (
//                         <span className="text-[11px] text-white/15 px-2.5 py-1">
//                           Unsolved
//                         </span>
//                       )}
//                       <span className="text-white/15 group-hover:text-white/40 transition-colors text-lg">›</span>
//                     </div>
//                   </NavLink>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {showProfileModal && user && (
//           <ProfileModal
//             user={user}
//             onClose={() => setShowProfileModal(false)}
//             onSaved={handleProfileSaved}
//           />
//         )}
//       </div>
//     </>
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
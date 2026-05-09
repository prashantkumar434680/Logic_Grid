const problem1 = {
  title: "Maximum Subarray Sum",

  description:
    "Given an array of integers, find the contiguous subarray with the largest sum and return that sum.\n\n" +
    "Example:\nInput: -2 1 -3 4 -1 2 1 -5 4\nOutput: 6\nExplanation: Subarray [4, -1, 2, 1] has the largest sum = 6",

  difficulty: "medium",

  tags: "array",

  visibleTestCases: [
    {
      input: "-2 1 -3 4 -1 2 1 -5 4",
      output: "6"
    },
    {
      input: "1 2 3 4",
      output: "10"
    }
  ],

  hiddenTestCases: [
    {
      input: "-1 -2 -3",
      output: "-1"
    }
  ],

  startCode: [
    {
      language: "C++",
      initialCode:
`#include <iostream>
using namespace std;

int maxSubArray(int arr[], int n) {
    // Write your code here
}

int main() {
    // Input handling
}`
    },
    {
      language: "Java",
      initialCode:
`public class Main {
    public static int maxSubArray(int[] arr) {
        // Write your code here
        return 0;
    }
}`
    },
    {
      language: "Javascript",
      initialCode:
`function maxSubArray(arr) {
    // Write your code here
}`
    }
  ],

  referenceSolution: [
    {
      language: "C++",
      completeCode:
`#include <iostream>
using namespace std;

int maxSubArray(int arr[], int n) {
    int maxSum = arr[0];
    int currSum = arr[0];

    for(int i = 1; i < n; i++) {
        currSum = max(arr[i], currSum + arr[i]);
        maxSum = max(maxSum, currSum);
    }
    return maxSum;
}`
    },
    {
      language: "Java",
      completeCode:
`public class Main {
    public static int maxSubArray(int[] arr) {
        int maxSum = arr[0];
        int currSum = arr[0];

        for(int i = 1; i < arr.length; i++) {
            currSum = Math.max(arr[i], currSum + arr[i]);
            maxSum = Math.max(maxSum, currSum);
        }
        return maxSum;
    }
}`
    },
    {
      language: "Javascript",
      completeCode:
`function maxSubArray(arr) {
    let maxSum = arr[0];
    let currSum = arr[0];

    for (let i = 1; i < arr.length; i++) {
        currSum = Math.max(arr[i], currSum + arr[i]);
        maxSum = Math.max(maxSum, currSum);
    }

    return maxSum;
}`
    }
  ]
};

module.exports.problem1 = problem1;

const problem = {
  title: "Reverse a Linked List",

  description:
    "Given the head of a singly linked list, reverse the list and return the new head.\n\n" +
    "A linked list is a linear data structure where each node contains a value and a pointer to the next node.\n\n" +
    "Example:\nInput: 1 -> 2 -> 3 -> 4 -> NULL\nOutput: 4 -> 3 -> 2 -> 1 -> NULL",

  difficulty: "easy",

  tags: "linked-list",

  visibleTestCases: [
    {
      input: "1 2 3 4",
      output: "4 3 2 1"
    },
    {
      input: "5 6 7",
      output: "7 6 5"
    }
  ],

  hiddenTestCases: [
    {
      input: "10",
      output: "10"
    }
  ],

  startCode: [
    {
      language: "C++",
      initialCode:
`#include <iostream>
using namespace std;

struct Node {
    int val;
    Node* next;
};

Node* reverseList(Node* head) {
    // Write your code here
}

int main() {
    // Input handling
}`
    },
    {
      language: "Java",
      initialCode:
`class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

public class Main {
    public static ListNode reverseList(ListNode head) {
        // Write your code here
        return null;
    }
}`
    },
    {
      language: "Javascript",
      initialCode:
`// Definition for singly-linked list
function ListNode(val) {
    this.val = val;
    this.next = null;
}

function reverseList(head) {
    // Write your code here
}`
    }
  ],

  referenceSolution: [
    {
      language: "C++",
      completeCode:
`#include <iostream>
using namespace std;

struct Node {
    int val;
    Node* next;
};

Node* reverseList(Node* head) {
    Node* prev = NULL;
    Node* curr = head;
    while(curr != NULL) {
        Node* next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    return prev;
}

int main() {
    int x;
    Node* head = NULL;
    Node* tail = NULL;

    while(cin >> x) {
        Node* newNode = new Node{x, NULL};

        if(head == NULL) {
            head = tail = newNode;
        } else {
            tail->next = newNode;
            tail = newNode;
        }
    }

    head = reverseList(head);

    while(head != NULL) {
        cout << head->val << " ";
        head = head->next;
    }
}`
    },
    {
      language: "Java",
      completeCode:
`class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

public class Main {
    public static ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while(curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
}`
    },
    {
      language: "Javascript",
      completeCode:
`// Definition for singly-linked list
function ListNode(val) {
    this.val = val;
    this.next = null;
}

function reverseList(head) {
    let prev = null;
    let curr = head;

    while (curr !== null) {
        let next = curr.next;
        curr.next = prev;
        prev = curr;
        curr = next;
    }

    return prev;
}

// Driver Code (for testing)
function buildList(arr) {
    let head = null, tail = null;
    for (let val of arr) {
        let node = new ListNode(val);
        if (!head) {
            head = tail = node;
        } else {
            tail.next = node;
            tail = node;
        }
    }
    return head;
}

function printList(head) {
    let res = [];
    while (head) {
        res.push(head.val);
        head = head.next;
    }
    console.log(res.join(" "));
}

// Example
let input = [1,2,3,4];
let head = buildList(input);
head = reverseList(head);
printList(head);`
    }
  ]
};

module.exports = problem;















// HomePage

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





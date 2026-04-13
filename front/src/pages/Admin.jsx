import { NavLink } from 'react-router';

// ── Admin options config ──────────────────────────────────────────────

const adminOptions = [
  {
    id:          'create',
    title:       'Create problem',
    description: 'Add a new coding challenge with test cases, solutions and starter code for all languages.',
    route:       '/admin/create',
    accent:      'linear-gradient(90deg,#1D9E75,#5DCAA5)',
    iconBg:      'rgba(29,158,117,0.12)',
    iconColor:   '#5DCAA5',
    btnBg:       'rgba(29,158,117,0.15)',
    btnColor:    '#5DCAA5',
    btnLabel:    'Create now',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
      </svg>
    ),
  },
  {
    id:          'update',
    title:       'Update problem',
    description: 'Edit existing problems, fix test cases, update descriptions or modify reference solutions.',
    route:       '/admin/update',
    accent:      'linear-gradient(90deg,#BA7517,#EF9F27)',
    iconBg:      'rgba(186,117,23,0.12)',
    iconColor:   '#EF9F27',
    btnBg:       'rgba(186,117,23,0.15)',
    btnColor:    '#EF9F27',
    btnLabel:    'Edit problem',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id:          'delete',
    title:       'Delete problem',
    description: 'Permanently remove problems from the platform. This action cannot be undone.',
    route:       '/admin/delete',
    accent:      'linear-gradient(90deg,#A32D2D,#F09595)',
    iconBg:      'rgba(226,75,74,0.12)',
    iconColor:   '#F09595',
    btnBg:       'rgba(226,75,74,0.12)',
    btnColor:    '#F09595',
    btnLabel:    'Delete',
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  },
  // {
  //   id:          'video',
  //   title:       'Video tutorials',
  //   description: 'Upload new video solutions and editorial walkthroughs for problems on the platform.',
  //   route:       '/admin/video',
  //   accent:      'linear-gradient(90deg,#7c5ce9,#4a9cf6)',
  //   iconBg:      'rgba(124,92,233,0.12)',
  //   iconColor:   '#a78bfa',
  //   btnBg:       'rgba(124,92,233,0.15)',
  //   btnColor:    '#a78bfa',
  //   btnLabel:    'Add video',
  //   icon: (
  //     <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-5 h-5">
  //       <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
  //       <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  //     </svg>
  //   ),
  // },
];

// ── Stat card ─────────────────────────────────────────────────────────

function Stat({ num, label }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 text-center">
      <p className="font-['Instrument_Serif'] text-[20px] text-white">{num}</p>
      <p className="text-[10px] text-white/30 mt-0.5">{label}</p>
    </div>
  );
}

// ── Admin card ────────────────────────────────────────────────────────

function AdminCard({ option }) {
  return (
    <NavLink to={option.route} className="block group">
      <div
        className="relative rounded-[18px] p-6 transition-all duration-250 overflow-hidden cursor-pointer"
        style={{
          background: "rgba(255,255,255,0.025)",
          border:     "1px solid rgba(255,255,255,0.07)",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = "rgba(255,255,255,0.045)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
          e.currentTarget.style.transform = "translateY(-3px)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(255,255,255,0.025)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[18px]"
          style={{ background: option.accent }} />

        {/* Icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-3.5"
          style={{ background: option.iconBg, color: option.iconColor }}>
          {option.icon}
        </div>

        {/* Title */}
        <h2 className="font-['Instrument_Serif'] text-[18px] text-white tracking-tight mb-1.5">
          {option.title}
        </h2>

        {/* Description */}
        <p className="text-[12px] text-white/38 leading-relaxed mb-4">
          {option.description}
        </p>

        {/* Button */}
        <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[9px]
          text-[12px] font-semibold transition-opacity"
          style={{ background: option.btnBg, color: option.btnColor }}>
          {option.icon}
          {option.btnLabel}
        </div>
      </div>
    </NavLink>
  );
}

// ── Main component ────────────────────────────────────────────────────

export default function Admin() {
  return (
    <>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      <div className="min-h-screen bg-[#0a0a0f] font-['DM_Sans'] text-white relative overflow-hidden">

        {/* Radial glows */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%,rgba(99,60,200,0.2) 0%,transparent 55%),radial-gradient(ellipse at 90% 80%,rgba(56,139,253,0.1) 0%,transparent 50%)" }}
        />

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-14">

          {/* Header */}
          <div className="text-center mb-12">

            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-4"
              style={{ background: "rgba(124,92,233,0.12)", border: "1px solid rgba(124,92,233,0.25)" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-[11px] text-purple-300 font-medium">Admin panel</span>
            </div>

            <h1 className="font-['Instrument_Serif'] text-[36px] text-white tracking-tight mb-2">
              Manage <em className="text-purple-300 not-italic">LogicGrid</em>
            </h1>
            <p className="text-[13px] text-white/40 leading-relaxed">
              Create, update and delete problems · Add video tutorials
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5 max-w-[420px] mx-auto mt-6">
              <Stat num="1,200+" label="Total problems" />
              <Stat num="48k+"   label="Active users"   />
              <Stat num="320+"   label="Videos"         />
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {adminOptions.map(option => (
              <AdminCard key={option.id} option={option} />
            ))}
          </div>

          {/* Footer */}
          <p className="text-center mt-10 text-[11px] text-white/15">
            LogicGrid Admin · Changes take effect immediately
          </p>
        </div>
      </div>
    </>
  );
}

















// import React, { useState } from 'react';
// import { Plus, Edit, Trash2, Home, RefreshCw, Zap, Play} from 'lucide-react';
// import { NavLink } from 'react-router';

// function Admin() {
//   const [selectedOption, setSelectedOption] = useState(null);

//   const adminOptions = [
//     {
//       id: 'create',
//       title: 'Create Problem',
//       description: 'Add a new coding problem to the platform',
//       icon: Plus,
//       color: 'btn-success',
//       bgColor: 'bg-success/10',
//       route: '/admin/create'
//     },
//     {
//       id: 'update',
//       title: 'Update Problem',
//       description: 'Edit existing problems and their details',
//       icon: Edit,
//       color: 'btn-warning',
//       bgColor: 'bg-warning/10',
//       route: '/admin/update'
//     },
//     {
//       id: 'delete',
//       title: 'Delete Problem',
//       description: 'Remove problems from the platform',
//       icon: Trash2,
//       color: 'btn-error',
//       bgColor: 'bg-error/10',
//       route: '/admin/delete'
//     },
//     {
//       id: 'Video',
//       title: 'Create Video Tutorial',
//       description: 'Add a new video tutorial to the platform',
//       icon: Zap,
//       color: 'btn-success',
//       bgColor: 'bg-success/10',
//       route: '/admin/video'
//     },
//   ];

//   return (
//     <div className="min-h-screen bg-base-200">
//       <div className="container mx-auto px-4 py-8">
//         {/* Header */}
//         <div className="text-center mb-12">
//           <h1 className="text-4xl font-bold text-base-content mb-4">
//             Admin Panel
//           </h1>
//           <p className="text-base-content/70 text-lg">
//             Manage coding problems on your platform
//           </p>
//         </div>

//         {/* Admin Options Grid */}
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
//           {adminOptions.map((option) => {
//             const IconComponent = option.icon;
//             return (
//               <div
//                 key={option.id}
//                 className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
//               >
//                 <div className="card-body items-center text-center p-8">
//                   {/* Icon */}
//                   <div className={`${option.bgColor} p-4 rounded-full mb-4`}>
//                     <IconComponent size={32} className="text-base-content" />
//                   </div>
                  
//                   {/* Title */}
//                   <h2 className="card-title text-xl mb-2">
//                     {option.title}
//                   </h2>
                  
//                   {/* Description */}
//                   <p className="text-base-content/70 mb-6">
//                     {option.description}
//                   </p>
                  
//                   {/* Action Button */}
//                   <div className="card-actions">
//                     <div className="card-actions">
//                     <NavLink 
//                     to={option.route}
//                    className={`btn ${option.color} btn-wide`}
//                    >
//                    {option.title}
//                    </NavLink>
//                    </div>
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//       </div>
//     </div>
//   );
// }

// export default Admin;
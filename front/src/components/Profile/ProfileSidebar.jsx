import { Code, Share2, Mail, Edit2 } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function ProfileSidebar() {
  const { user } = useSelector((state) => state.auth);

  // Mock user data - replace with actual data from backend
  const profileData = {
    name: user?.name || 'John Developer',
    handle: user?.username || '@johndeveloper',
    userId: user?.id || 'USR_001',
    rank: 'Expert',
    rankColor: 'from-amber-400 to-amber-600',
    bio: 'Full-stack developer passionate about solving algorithmic problems and building scalable systems.',
    languages: ['JavaScript', 'Python', 'C++', 'Java'],
    skills: ['React', 'Node.js', 'Database Design', 'Web Scraping', 'APIs', 'System Design'],
    social: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      email: 'john@example.com',
    },
  };

  return (
    <div className="w-full lg:w-80 space-y-6">
      {/* Main Profile Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
              {profileData.name.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-slate-800 rounded-full"></div>
          </div>

          {/* Name and Handle */}
          <h2 className="text-2xl font-bold text-slate-100 text-center">
            {profileData.name}
          </h2>
          <p className="text-cyan-400 font-medium text-sm">{profileData.handle}</p>
          <p className="text-slate-400 text-xs mt-1">ID: {profileData.userId}</p>
        </div>

        {/* Rank Badge */}
        <div className="flex justify-center mb-6">
          <div className={`bg-gradient-to-r ${profileData.rankColor} px-4 py-2 rounded-full text-slate-900 font-bold text-sm`}>
            {profileData.rank}
          </div>
        </div>

        {/* Edit Profile Button */}
        <button className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 mb-4 shadow-lg">
          <Edit2 className="w-4 h-4" />
          Edit Profile
        </button>

        {/* Bio Section */}
        <div className="mb-6 pb-6 border-b border-slate-700">
          <p className="text-slate-300 text-sm leading-relaxed text-center">
            {profileData.bio}
          </p>
        </div>

        {/* Social Links */}
        <div className="flex justify-center gap-3 mb-6">
          <a
            href={profileData.social.github}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-cyan-400 transition-colors duration-200 hover:scale-110 transform"
            title="GitHub"
          >
            <Code className="w-5 h-5" />
          </a>
          <a
            href={profileData.social.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-cyan-400 transition-colors duration-200 hover:scale-110 transform"
            title="LinkedIn"
          >
            <Share2 className="w-5 h-5" />
          </a>
          <a
            href={`mailto:${profileData.social.email}`}
            className="p-3 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-cyan-400 transition-colors duration-200 hover:scale-110 transform"
            title="Email"
          >
            <Mail className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Languages Section */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
        <h3 className="text-lg font-bold text-slate-100 mb-4">Languages</h3>
        <div className="grid grid-cols-2 gap-2">
          {profileData.languages.map((lang, idx) => (
            <div
              key={idx}
              className="bg-gradient-to-r from-slate-700 to-slate-600 px-3 py-2 rounded-lg text-slate-200 text-sm font-medium text-center hover:from-cyan-500/20 hover:to-blue-500/20 hover:text-cyan-300 transition-all duration-200 border border-slate-600 hover:border-cyan-400"
            >
              {lang}
            </div>
          ))}
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
        <h3 className="text-lg font-bold text-slate-100 mb-4">Skills</h3>
        <div className="flex flex-wrap gap-2">
          {profileData.skills.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-cyan-500/10 text-cyan-300 text-xs font-medium rounded-full border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 transition-all duration-200 cursor-default"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

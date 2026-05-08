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

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch profile data
        const profileResponse = await axiosClient.get('/userData/profile');
        setProfileData(profileResponse.data.user);
        
        // Fetch solved problems
        const solvedResponse = await axiosClient.get('/problem/problemSolvedByUser');
        setSolvedProblems(Array.isArray(solvedResponse.data) ? solvedResponse.data : []);
        
        // Fetch submission calendar
        const calendarResponse = await axiosClient.get('/submission/calendar');
        setSubmissionCalendar(calendarResponse.data.counts || []);
        
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAllData();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-cyan-400"></div>
          <p className="text-slate-400 mt-4">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ {error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate max streak
  const calculateMaxStreak = (calendarData) => {
    let maxStreak = 0;
    let currentStreak = 0;
    
    calendarData.forEach(day => {
      if (day.count > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return maxStreak;
  };

  // Generate calendar data
  const generateCalendar = () => {
    const today = new Date();
    const endDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - 363); // 364 days total

    const calendarData = [];
    const submissionMap = new Map();
    
    // Create map of submission counts by date
    submissionCalendar.forEach(item => {
      if (item.date) {
        submissionMap.set(item.date, item.count || 0);
      }
    });

    // Generate 364 days of calendar data
    for (let i = 0; i < 364; i++) {
      const currentDate = new Date(startDate);
      currentDate.setUTCDate(startDate.getUTCDate() + i);
      
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = submissionMap.get(dateStr) || 0;
      
      calendarData.push({
        date: dateStr,
        count: count,
        level: count === 0 ? 0 : Math.min(4, Math.ceil(count / 2)) // 0-4 levels
      });
    }

    return calendarData;
  };

  // Calculate stats from solved problems
  const calculateStats = () => {
    const totalSolved = solvedProblems.length;
    let easy = 0, medium = 0, hard = 0;
    
    solvedProblems.forEach(problem => {
      const difficulty = problem?.difficulty || problem?.problemId?.difficulty;
      if (difficulty === 'easy') easy++;
      else if (difficulty === 'medium') medium++;
      else if (difficulty === 'hard') hard++;
    });

    return { totalSolved, easy, medium, hard };
  };

  const userData = profileData || user;
  const calendar = generateCalendar();
  const stats = calculateStats();
  const totalSubmissions = submissionCalendar.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Simple Navbar */}
      <nav className="bg-slate-900/50 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <button 
            onClick={() => navigate('/')}
            className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
          >
            ← Back to Problems
          </button>
          <h1 className="text-xl font-bold text-white">Profile</h1>
          <div></div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Sidebar - Profile Info */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
              {/* Avatar Section */}
              <div className="flex flex-col items-center mb-6">
                <div className="relative mb-4">
                  {userData?.avatar ? (
                    <img 
                      src={userData.avatar} 
                      alt={userData.firstName}
                      className="w-24 h-24 rounded-full object-cover border-2 border-cyan-400"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                      {userData?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-slate-800 rounded-full"></div>
                </div>

                {/* Name and Info */}
                <h2 className="text-2xl font-bold text-slate-100 text-center">
                  {userData?.firstName} {userData?.lastName || ''}
                </h2>
                <p className="text-cyan-400 font-medium text-sm">@{userData?.firstName?.toLowerCase()}</p>
                <p className="text-slate-400 text-xs mt-1">ID: {userData?._id?.slice(-8)}</p>
              </div>

              {/* Bio */}
              {userData?.bio && (
                <div className="mb-6 pb-6 border-b border-slate-700">
                  <p className="text-slate-300 text-sm leading-relaxed text-center">
                    {userData.bio}
                  </p>
                </div>
              )}

              {/* Stats */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-200 text-sm">{userData?.emailId}</span>
                </div>
                {userData?.age && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Age:</span>
                    <span className="text-slate-200">{userData.age}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Role:</span>
                  <span className="text-cyan-400 capitalize">{userData?.role || 'User'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Stats & Activity */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 backdrop-blur-sm rounded-xl p-6 border border-cyan-500/30">
                <div className="text-cyan-400 text-3xl font-bold">✓</div>
                <div className="text-slate-300 text-sm font-medium mb-1">Total Solved</div>
                <div className="text-4xl font-bold text-cyan-400">{stats.totalSolved}</div>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-xl p-6 border border-green-500/30">
                <div className="text-green-400 text-3xl font-bold">●</div>
                <div className="text-slate-300 text-sm font-medium mb-1">Easy</div>
                <div className="text-4xl font-bold text-green-400">{stats.easy}</div>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
                <div className="text-yellow-400 text-3xl font-bold">●</div>
                <div className="text-slate-300 text-sm font-medium mb-1">Medium</div>
                <div className="text-4xl font-bold text-yellow-400">{stats.medium}</div>
              </div>
              
              <div className="bg-gradient-to-br from-red-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/30">
                <div className="text-red-400 text-3xl font-bold">●</div>
                <div className="text-slate-300 text-sm font-medium mb-1">Hard</div>
                <div className="text-4xl font-bold text-red-400">{stats.hard}</div>
              </div>
            </div>

            {/* Submission Activity Calendar */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100">Submission Activity</h2>
                  <p className="text-slate-400 text-sm">
                    {totalSubmissions} submissions in the past year
                  </p>
                </div>
                <div className="flex gap-4 text-sm text-slate-400">
                  <span>
                    Active days: <span className="text-slate-100 font-semibold">{calendar.filter(day => day.count > 0).length}</span>
                  </span>
                  <span>
                    Max streak: <span className="text-slate-100 font-semibold">{calculateMaxStreak(calendar)}</span>
                  </span>
                </div>
              </div>
              
              {/* Calendar Grid */}
              <div className="overflow-x-auto">
                <div className="grid grid-flow-col grid-rows-7 gap-1 rounded-xl bg-slate-950/40 p-4 border border-slate-700 min-w-[760px]">
                  {calendar.map((day, i) => {
                    const colors = [
                      'bg-slate-700/70',           // 0 submissions
                      'bg-emerald-900/70',         // 1-2 submissions
                      'bg-emerald-700/80',         // 3-4 submissions
                      'bg-emerald-500/85',         // 5-6 submissions
                      'bg-emerald-300'             // 7+ submissions
                    ];
                    
                    const formatDate = (dateStr) => {
                      const date = new Date(dateStr);
                      return date.toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      });
                    };
                    
                    return (
                      <div
                        key={i}
                        className={`h-3.5 w-3.5 rounded-sm ${colors[day.level]} transition-transform hover:scale-110 cursor-pointer`}
                        title={`${formatDate(day.date)}: ${day.count} submission${day.count === 1 ? '' : 's'}`}
                      />
                    );
                  })}
                </div>
                
                {/* Month labels */}
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 min-w-[760px]">
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthDate = new Date();
                    monthDate.setMonth(monthDate.getMonth() - 11 + i);
                    return (
                      <span key={i}>
                        {monthDate.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Problems */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 shadow-xl">
              <h2 className="text-2xl font-bold text-slate-100 mb-4">Recent Activity</h2>
              
              {solvedProblems.length > 0 ? (
                <div className="space-y-3">
                  {solvedProblems.slice(0, 5).map((problem, index) => {
                    const problemData = problem.problemId || problem;
                    const difficultyColors = {
                      easy: 'bg-green-500/10 text-green-400 border-green-500/30',
                      medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                      hard: 'bg-red-500/10 text-red-400 border-red-500/30'
                    };
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-slate-600/50 hover:border-cyan-500/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-slate-100 font-medium">{problemData?.title || 'Problem'}</h3>
                            <p className="text-slate-400 text-sm">Solved recently</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${difficultyColors[problemData?.difficulty] || difficultyColors.easy}`}>
                          {problemData?.difficulty || 'Easy'}
                        </div>
                      </div>
                    );
                  })}
                  
                  {solvedProblems.length > 5 && (
                    <button 
                      onClick={() => navigate('/')}
                      className="w-full mt-4 py-3 rounded-lg border border-slate-600 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition-all duration-200 font-medium"
                    >
                      View All Solved Problems ({solvedProblems.length})
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-slate-400 text-lg mb-2">No recent activity</div>
                  <p className="text-slate-500 text-sm">Start solving problems to see your activity here!</p>
                  <button 
                    onClick={() => navigate('/')}
                    className="mt-4 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all"
                  >
                    Browse Problems
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

      {/* Footer */}
      <footer className="border-t border-slate-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-slate-100 mb-4">LogicGrid</h3>
              <p className="text-slate-400 text-sm">
                A modern coding platform for problem-solving and skill development.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-100 mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Problems</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Contests</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Discuss</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-100 mb-4">Resources</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-100 mb-4">Contact</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-cyan-400 transition-colors">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm mb-4 md:mb-0">
              © 2024 LogicGrid. All rights reserved.
            </p>
            <div className="flex gap-6 text-slate-400 text-sm">
              <a href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-cyan-400 transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>


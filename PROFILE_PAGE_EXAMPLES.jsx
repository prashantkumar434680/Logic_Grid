// Component Examples & Customization Patterns
// This file shows various ways to customize and extend the profile components

// ==========================================
// NAVBAR CUSTOMIZATION EXAMPLES
// ==========================================

// 1. Add More Navigation Links
const customNavLinks = [
  { name: 'Problems', href: '/', icon: '📝' },
  { name: 'Contest', href: '/contest', icon: '🏆' },
  { name: 'Discuss', href: '/discuss', icon: '💬' },
  { name: 'Learn', href: '/learn', icon: '📚' },  // NEW
  { name: 'Tracks', href: '/tracks', icon: '🛤️' },  // NEW
];

// 2. Custom Profile Menu Items
const customProfileMenu = [
  { label: 'My Profile', icon: User, action: () => navigate('/profile') },
  { label: 'Settings', icon: Settings, action: () => navigate('/settings') },
  { label: 'Appearance', icon: Palette, action: () => {} },
  { label: 'Notifications', icon: Bell, action: () => {} },  // NEW
  { label: 'Billing', icon: CreditCard, action: () => {} },  // NEW
  { label: 'Sign Out', icon: LogOut, action: () => logout(), isDanger: true },
];

// 3. Search with Suggestions
// Wrap search input with debounce for performance
const [searchQuery, setSearchQuery] = useState('');
const [suggestions, setSuggestions] = useState([]);

const handleSearch = debounce(async (query) => {
  if (query.length > 2) {
    const results = await axios.get(`/api/problems/search?q=${query}`);
    setSuggestions(results.data);
  }
}, 300);

// ==========================================
// PROFILE SIDEBAR CUSTOMIZATION
// ==========================================

// 1. Dynamic Rank Calculation Based on Points
const calculateRank = (solvedCount) => {
  if (solvedCount < 10) return { rank: 'Beginner', color: 'from-blue-400 to-blue-600' };
  if (solvedCount < 50) return { rank: 'Intermediate', color: 'from-green-400 to-green-600' };
  if (solvedCount < 100) return { rank: 'Advanced', color: 'from-purple-400 to-purple-600' };
  if (solvedCount < 200) return { rank: 'Expert', color: 'from-amber-400 to-amber-600' };
  return { rank: 'Master', color: 'from-red-400 to-red-600' };
};

// 2. Fetch Profile from Backend
const useProfileData = (userId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`/api/user/${userId}/profile`);
        setData(response.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);
  
  return { data, loading };
};

// 3. Edit Profile Modal Component
const EditProfileModal = ({ isOpen, onClose, profileData, onSave }) => {
  const [formData, setFormData] = useState(profileData);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.put('/api/user/profile', formData);
    onSave(formData);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 rounded-lg bg-slate-700 text-slate-100 border border-slate-600 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="block text-slate-300 mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              className="w-full px-4 py-2 rounded-lg bg-slate-700 text-slate-100 border border-slate-600 focus:outline-none focus:border-cyan-400"
              rows="3"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 rounded-lg transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// STATS CARDS CUSTOMIZATION
// ==========================================

// 1. Stats with Time Period Selector
const StatsWithPeriod = () => {
  const [period, setPeriod] = useState('all');
  
  const getStats = (period) => {
    switch(period) {
      case 'week': return { solved: 12, easy: 8, medium: 3, hard: 1 };
      case 'month': return { solved: 48, easy: 28, medium: 15, hard: 5 };
      case 'year': return { solved: 248, easy: 148, medium: 75, hard: 25 };
      default: return { solved: 500, easy: 300, medium: 150, hard: 50 };
    }
  };
  
  const stats = getStats(period);
  
  return (
    <div>
      <div className="flex gap-2 mb-6">
        {['week', 'month', 'year', 'all'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === p
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <StatsCards stats={stats} />
    </div>
  );
};

// 2. Stats with Progress Bar
const StatCard = ({ label, value, max, ...props }) => (
  <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
    <div className="flex justify-between items-center mb-3">
      <span className="text-slate-300">{label}</span>
      <span className="text-2xl font-bold text-cyan-400">{value}</span>
    </div>
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-300"
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
    <div className="text-xs text-slate-400 mt-2">{value} of {max}</div>
  </div>
);

// ==========================================
// RECENT PROBLEMS CUSTOMIZATION
// ==========================================

// 1. Problems with Filtering
const RecentProblemsWithFilter = () => {
  const [filter, setFilter] = useState('all');
  const allProblems = [...];
  
  const filtered = allProblems.filter(p => 
    filter === 'all' || p.difficulty.toLowerCase() === filter
  );
  
  return (
    <div>
      <div className="flex gap-2 mb-4">
        {['all', 'easy', 'medium', 'hard'].map((diff) => (
          <button
            key={diff}
            onClick={() => setFilter(diff)}
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              filter === diff
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-700 text-slate-300'
            }`}
          >
            {diff.charAt(0).toUpperCase() + diff.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.map(problem => (
          <ProblemCard key={problem.id} problem={problem} />
        ))}
      </div>
    </div>
  );
};

// 2. Problems with Pagination
const RecentProblemsWithPagination = () => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const allProblems = [...];
  
  const startIdx = (page - 1) * itemsPerPage;
  const currentProblems = allProblems.slice(startIdx, startIdx + itemsPerPage);
  const totalPages = Math.ceil(allProblems.length / itemsPerPage);
  
  return (
    <div>
      <div className="space-y-3">
        {currentProblems.map(problem => (
          <ProblemCard key={problem.id} problem={problem} />
        ))}
      </div>
      
      <div className="flex justify-center gap-2 mt-6">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-3 py-2 rounded-lg bg-slate-700 disabled:opacity-50"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i + 1}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-2 rounded-lg ${
              page === i + 1 ? 'bg-cyan-500 text-white' : 'bg-slate-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-3 py-2 rounded-lg bg-slate-700 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// 3. Problem Card with Quick Actions
const ProblemCardWithActions = ({ problem }) => {
  const [showActions, setShowActions] = useState(false);
  
  return (
    <div
      className="bg-slate-800 rounded-xl p-4 border border-slate-700 hover:border-cyan-400 transition-all group"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-100">{problem.title}</h3>
          <p className="text-sm text-slate-400">{problem.solvedTime}</p>
        </div>
        
        {showActions && (
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-cyan-500 text-white text-sm rounded-lg hover:bg-cyan-600">
              View
            </button>
            <button className="px-3 py-1 bg-slate-700 text-slate-300 text-sm rounded-lg hover:bg-slate-600">
              Solutions
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// ADVANCED: FULL PAGE VARIANTS
// ==========================================

// 1. Compact Profile (for dashboard widget)
export const CompactProfileCard = ({ user }) => (
  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
        {user.name.charAt(0)}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-slate-100">{user.name}</h3>
        <p className="text-sm text-cyan-400">{user.handle}</p>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-cyan-400">{user.solved}</div>
        <div className="text-xs text-slate-400">Solved</div>
      </div>
    </div>
  </div>
);

// 2. Full Stats Dashboard
export const StatsDashboard = ({ userId }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      const data = await axios.get(`/api/user/${userId}/stats`);
      setStats(data.data);
      setLoading(false);
    };
    fetchStats();
  }, [userId]);
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Add all stat cards with real data */}
    </div>
  );
};

// 3. Profile with Theme Toggle
export const ProfileWithTheme = () => {
  const [theme, setTheme] = useState('dark');
  
  const themeClasses = theme === 'dark' 
    ? 'bg-slate-900'
    : 'bg-white';
  
  return (
    <div className={themeClasses}>
      <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        Toggle Theme
      </button>
      <Profile />
    </div>
  );
};

// ==========================================
// HELPER HOOKS & UTILITIES
// ==========================================

// Custom Hook: Fetch Profile with Caching
export const useProfileWithCache = (userId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const cacheRef = useRef(new Map());
  
  useEffect(() => {
    if (cacheRef.current.has(userId)) {
      setData(cacheRef.current.get(userId));
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      const response = await axios.get(`/api/user/${userId}/profile`);
      cacheRef.current.set(userId, response.data);
      setData(response.data);
      setLoading(false);
    };
    
    fetchData();
  }, [userId]);
  
  return { data, loading };
};

// Utility: Format timestamp
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 60) return `${minutes} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  
  return date.toLocaleDateString();
};

// Utility: Get difficulty color
export const getDifficultyColor = (difficulty) => {
  const colors = {
    Easy: 'bg-green-500/10 text-green-400 border-green-500/30',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    Hard: 'bg-red-500/10 text-red-400 border-red-500/30',
  };
  return colors[difficulty] || colors.Easy;
};

// This file provides patterns and examples for extending the profile components
// Use these patterns when building Phase 2 and beyond!

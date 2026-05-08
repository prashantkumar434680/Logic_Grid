import { useEffect, useRef, useState } from 'react';
import { Search, Menu, X, LogOut, Settings, Palette, User } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router';

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { name: 'Problems', href: '/', icon: '📝' },
    { name: 'Contest', href: '/contest', icon: '🏆' },
    { name: 'Discuss', href: '/discuss', icon: '💬' },
  ];

  const handleSignOut = () => {
    // Clear auth state and redirect to login
    localStorage.removeItem('token');
    navigate('/login');
  };

  const navigateTo = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  };

  const profileMenu = [
    { 
      label: 'My Profile', 
      icon: User, 
      action: () => navigate('/profile'),
      isDanger: false
    },
    { 
      label: 'Settings', 
      icon: Settings, 
      action: () => {
        alert('Settings page coming soon!');
      },
      isDanger: false
    },
    { 
      label: 'Appearance', 
      icon: Palette, 
      action: () => {
        alert('Theme customization coming soon!');
      },
      isDanger: false
    },
    { 
      label: 'Sign Out', 
      icon: LogOut, 
      action: handleSignOut, 
      isDanger: true 
    },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              LogicGrid
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <button
                key={link.name}
                type="button"
                onClick={() => navigateTo(link.href)}
                className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 flex items-center gap-1 font-medium"
              >
                <span>{link.icon}</span>
                {link.name}
              </button>
            ))}
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <input
                type="text"
                placeholder="Search problems..."
                className="px-4 py-2 pl-10 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-cyan-400 transition-colors duration-200 w-56"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Desktop Profile Dropdown */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700 transition-colors duration-200 group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm group-hover:shadow-lg group-hover:shadow-cyan-400/50 transition-shadow duration-200">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-slate-300 font-medium hidden lg:inline">
                  {user?.name || 'User'}
                </span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                  {profileMenu.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                          item.isDanger
                            ? 'text-red-400 hover:bg-red-900/20'
                            : 'text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-slate-400 hover:text-cyan-400 transition-colors duration-200"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-700">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search problems..."
                className="w-full px-4 py-2 pl-10 rounded-lg bg-slate-700 text-slate-100 placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-cyan-400 relative"
              />
            </div>
            {navLinks.map((link) => (
              <button
                key={link.name}
                type="button"
                onClick={() => navigateTo(link.href)}
                className="block px-4 py-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors duration-200"
              >
                {link.icon} {link.name}
              </button>
            ))}
            <hr className="my-3 border-slate-700" />
            {profileMenu.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={idx}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors duration-200 rounded-lg ${
                    item.isDanger
                      ? 'text-red-400 hover:bg-red-900/20'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                  onClick={() => {
                    item.action();
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}

'use client';
import { useState } from 'react';
import { Menu, X, ChevronDown, ArrowRight, User } from 'lucide-react';
import Link from 'next/link';
import ProfileDropdown from './ProfileDropdown';
import useAuthStore from '@/utility/justAuth';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const { isLoggedIn, logout } = useAuthStore();

  const handleLogout = async () => {
    logout();
    localStorage.clear();
    await fetch('/api/logout');
    window.location.href = '/auth';
  };

  const browseOptions = [
    'Book', 'Book Chapters', 'Conference Proceeding', 'Dissertation',
    'Question Papers', 'Research Papers', 'Thesis'
  ];

  return (
    <header className="relative bg-gradient-to-r from-[#4d8acd] from-50% to-[#7462fc] text-white shadow-xl border-b border-white/20 overflow-visible z-[100] backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-[1px]"></div>
      <div className="absolute inset-0 backdrop-blur-[1px] bg-black/10"></div>
      
      <div className="relative z-10">
        <div className="max-w-full mx-auto flex justify-between items-center px-3 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2 md:py-3">
          {/* Left Side - Logo (Mobile Optimized) */}
          <div className="flex-1 flex justify-start">
            <Link href="/" className="group flex items-center transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 bg-white/98 backdrop-blur-sm rounded-md md:rounded-lg px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 shadow-md border border-white/30 group-hover:shadow-lg group-hover:bg-white transition-all duration-300">
                <div className="relative">
                  <img 
                    src="/logo.png" 
                    alt="College Logo" 
                    className="h-5 xs:h-6 sm:h-7 md:h-8 lg:h-9 w-auto drop-shadow-sm transition-all duration-300" 
                  />
                </div>
              </div>
            </Link>
          </div>

          {/* Center Navigation - Desktop Only */}
          <div className="flex-1 flex justify-center">
            <nav className="hidden lg:flex items-center space-x-1 font-medium text-sm text-white">
              <Link href="/" className="relative px-4 py-2 rounded-lg hover:text-white transition-all duration-300 group">
                <span className="relative z-10 tracking-wide font-semibold">HOME</span>
                <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              <div
                className="relative group"
                onMouseEnter={() => setBrowseOpen(true)}
                onMouseLeave={() => setBrowseOpen(false)}
              >
                <button
                  onClick={() => {
                    setBrowseOpen(!browseOpen);
                    // Hide search bar when dropdown is open
                    const searchBar = document.querySelector('.search-bar');
                    if (searchBar) searchBar.style.display = browseOpen ? 'none' : 'block';
                  }}
                  className="relative px-4 py-2 rounded-lg hover:text-white transition-all duration-300 flex items-center gap-2 group"
                >
                  <span className="relative z-10 tracking-wide font-semibold">BROWSE</span>
                  <ChevronDown size={14} className={`transition-all duration-300 ${browseOpen ? 'rotate-180 text-white' : ''}`} />
                  <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
                {browseOpen && (
                  <div className="absolute top-full left-0 pt-2 w-64 z-[70]">
                    <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                      <div className="py-3">
                        {browseOptions.map((option, index) => (
                          <Link
                            key={option}
                            href={`/type/${encodeURIComponent(option.toLowerCase().replace(/\s+/g, '-'))}`}
                            className="block px-4 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 group relative"
                            onClick={() => setBrowseOpen(false)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full transition-all duration-300"></div>
                              <span className="tracking-wide">{option}</span>
                            </div>
                            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Link href="/subjects" className="relative px-4 py-2 rounded-lg hover:text-white transition-all duration-300 group">
                <span className="relative z-10 tracking-wide font-semibold">SUBJECTS</span>
                <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            </nav>
          </div>
          {/* Right Side - Auth/Profile (Tablet & Desktop) */}
          <div className="flex-1 flex justify-end">
            <div className="hidden md:block">
              {isLoggedIn ? (
                <ProfileDropdown onLogout={handleLogout} />
              ) : (
                <Link
                  href="/auth"
                  className="group relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-300 shadow-md hover:shadow-lg border border-white/30 hover:border-white/50"
                >
                  <User size={14} className="sm:w-4 sm:h-4 text-white/90 group-hover:text-white transition-colors duration-300" />
                  <span className="font-semibold tracking-wide hidden sm:inline">Login</span>
                  <div className="absolute inset-0 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button - Enhanced */}
            <div className="md:hidden flex justify-end">
              <button 
                className="p-2 sm:p-2.5 text-white hover:bg-white/20 rounded-lg sm:rounded-xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-white/50" 
                onClick={() => setOpen(!open)}
                aria-label="Toggle navigation menu"
              >
                <div className="relative">
                  {open ? (
                    <X size={20} className="sm:w-6 sm:h-6 drop-shadow-sm transition-transform duration-300 rotate-180" />
                  ) : (
                    <Menu size={20} className="sm:w-6 sm:h-6 drop-shadow-sm transition-transform duration-300" />
                  )}
                  <div className="absolute inset-0 bg-white/10 rounded-lg sm:rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile/Tablet Menu - Fully Responsive */}
      {open && (
        <div className="md:hidden relative z-[999]">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" 
            onClick={() => setOpen(false)}
            aria-hidden="true"
          ></div>
          
          {/* Menu Content */}
          <div className="relative bg-white/98 backdrop-blur-xl border-t border-gray-200 shadow-2xl rounded-b-xl mx-2 sm:mx-4 overflow-hidden">
            <div className="max-h-[70vh] overflow-y-auto py-4 sm:py-6 px-3 sm:px-4 space-y-1 sm:space-y-2">
              
              {/* Home Link */}
              <Link 
                href="/" 
                className="flex items-center text-sm sm:text-base text-gray-700 hover:text-blue-600 transition-all duration-300 group hover:translate-x-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-blue-50 font-medium"
                onClick={() => setOpen(false)}
              >
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-3 sm:mr-4 transition-colors duration-300"></div>
                <span>HOME</span>
              </Link>

              {/* Browse Dropdown */}
              <div className="w-full">
                <button
                  onClick={() => setBrowseOpen(!browseOpen)}
                  className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-700 hover:text-blue-600 transition-all duration-300 rounded-lg sm:rounded-xl hover:bg-blue-50 font-medium"
                  aria-expanded={browseOpen}
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-3 sm:mr-4"></div>
                    <span>BROWSE</span>
                  </div>
                  <ChevronDown size={16} className={`sm:w-5 sm:h-5 transition-transform duration-300 ${browseOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Browse Options */}
                {browseOpen && (
                  <div className="mt-1 sm:mt-2 ml-4 sm:ml-6 space-y-0.5 sm:space-y-1 max-h-48 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                    {browseOptions.map((option) => (
                      <Link
                        key={option}
                        href={`/type/${encodeURIComponent(option.toLowerCase().replace(/\s+/g, '-'))}`}
                        className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-blue-600 transition-all duration-200 group hover:translate-x-1 font-medium rounded-md"
                        onClick={() => {
                          setOpen(false);
                          setBrowseOpen(false);
                        }}
                      >
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400 rounded-full mr-2 sm:mr-3 transition-colors duration-200"></div>
                        <span className="truncate">{option}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Subjects Link */}
              <Link 
                href="/subjects" 
                className="flex items-center text-sm sm:text-base text-gray-700 hover:text-blue-600 transition-all duration-300 group hover:translate-x-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl hover:bg-blue-50 font-medium"
                onClick={() => setOpen(false)}
              >
                <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-3 sm:mr-4 transition-colors duration-300"></div>
                <span>SUBJECTS</span>
              </Link>

              {/* Auth Section */}
              <div className="pt-3 sm:pt-4 border-t border-gray-200">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-blue-600 hover:text-blue-700 transition-all duration-300 mb-1 sm:mb-2 rounded-lg sm:rounded-xl hover:bg-blue-50 font-medium"
                      onClick={() => setOpen(false)}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-3 sm:mr-4"></div>
                        <span>DASHBOARD</span>
                      </div>
                      <ArrowRight size={16} className="sm:w-5 sm:h-5" />
                    </Link>
                    <button
                      onClick={() => {
                        setOpen(false);
                        handleLogout();
                      }}
                      className="w-full flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all duration-300 font-medium"
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full mr-3 sm:mr-4"></div>
                        <span>LOGOUT</span>
                      </div>
                      <ArrowRight size={16} className="sm:w-5 sm:h-5" />
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth"
                    className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-blue-600 hover:text-blue-700 transition-all duration-300 rounded-lg sm:rounded-xl hover:bg-blue-50 font-medium"
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex items-center">
                      <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded-full mr-3 sm:mr-4"></div>
                      <span>LOGIN</span>
                    </div>
                    <ArrowRight size={16} className="sm:w-5 sm:h-5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
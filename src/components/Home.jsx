'use client';
import axios from "axios";
import Navbar from "./Navbar";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from 'lucide-react';
import useAuthStore from '@/utility/justAuth';
import ProfileDropdown from './ProfileDropdown';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    articles: 0,
    books: 0,
    journals: 0,
    loading: true
  });
  const [animatedNumbers, setAnimatedNumbers] = useState({
    articles: 0,
    books: 0,
    journals: 0
  });

  const { isLoggedIn, logout } = useAuthStore();

  // Handle logout functionality
  const handleLogout = async () => {
    logout();
    localStorage.clear();
    await fetch('/api/logout');
    window.location.href = '/auth';
  };

  // Animated counter while loading
  useEffect(() => {
    let interval;
    if (stats.loading) {
      interval = setInterval(() => {
        setAnimatedNumbers(prev => ({
          articles: Math.floor(Math.random() * 999999) + 100000,
          books: Math.floor(Math.random() * 99999) + 10000,
          journals: Math.floor(Math.random() * 9999) + 1000
        }));
      }, 150);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [stats.loading]);

  // Number formatting
  const formatNumber = (num) => {
    if (num >= 100000) return Math.floor(num / 100000) + "L+";
    if (num >= 1000) return Math.floor(num / 1000) + "K+";
    return num + "+";
  };

  // Data fetching functions
  const fetchDOAJCount = async () => {
    try {
      const response = await axios.get('/api/doaj-stats');
      return {
        articles: response.data?.articles || 0,
        journals: response.data?.journals || 0,
        total: response.data?.total || 0
      };
    } catch {
      return { articles: 0, journals: 0, total: 0 };
    }
  };

  const fetchLocalCount = async () => {
    try {
      const response = await axios.get(`/api/journal`);
      const journals = response.data?.journals || [];
      const articleCount = journals.filter(j => j.type && !j.type.toLowerCase().includes('book')).length;
      const bookCount = journals.filter(j => j.type && j.type.toLowerCase().includes('book')).length;
      return { articles: articleCount, books: bookCount, total: journals.length };
    } catch {
      return { articles: 0, books: 0, total: 0 };
    }
  };

  const fetchStats = async () => {
    try {
      const [doajData, localData] = await Promise.all([
        fetchDOAJCount(),
        fetchLocalCount()
      ]);
      setStats({
        articles: localData.articles + doajData.articles,
        books: localData.books,
        journals: doajData.journals,
        loading: false
      });
    } catch {
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  // Initialize data
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <>
      {/* Hero Section with Background */}
      <div
        className="h-[60vh] xs:h-[65vh] sm:h-[70vh] md:h-[75vh] lg:h-[80vh] xl:h-[85vh] bg-[#003366] relative overflow-hidden"
        style={{
          backgroundImage: "url('/library.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          minHeight: "500px"
        }}
      >
        {/* Background Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30 z-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/5 to-indigo-900/15 z-10"></div>
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/60 via-black/30 to-transparent z-15"></div>

        {/* Navbar */}
        <div className="absolute top-0 left-0 right-0 z-[100]">
          <Navbar />
        </div>

        {/* Hero Content - Text at Top */}
        <div className="relative z-20 flex flex-col items-center justify-center pt-16 xs:pt-18 sm:pt-20 md:pt-24 lg:pt-28 xl:pt-32 pb-8 xs:pb-10 sm:pb-12 md:pb-14 lg:pb-16 h-full max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          {/* Hero Text */}
          <div className="text-center w-full max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl mx-auto mb-6 xs:mb-7 sm:mb-8 md:mb-10 lg:mb-12">
            <h1 className="font-bold text-white leading-tight mb-2 xs:mb-3 sm:mb-4 md:mb-5">
              <span 
                className="block text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold"
                style={{
                  textShadow: `
                    0 2px 8px rgba(0, 0, 0, 0.8),
                    0 0 20px rgba(255, 255, 255, 0.3)
                  `,
                  color: '#ffffff'
                }}
              >
                Discover the Future of Learning
              </span>
              <span 
                className="block mt-1 xs:mt-1.5 sm:mt-2 text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold"
                style={{
                  textShadow: `
                    0 2px 10px rgba(0, 0, 0, 0.9),
                    0 0 25px rgba(255, 255, 255, 0.4)
                  `,
                  color: '#ffffff'
                }}
              >
                Welcome to Vidya Bharati International School
              </span>
            </h1>
            <p 
              className="leading-relaxed font-medium mx-auto text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl mb-4 xs:mb-5 sm:mb-6 md:mb-8 max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-3xl px-1 xs:px-2 sm:px-0"
              style={{
                textShadow: `
                  0 2px 6px rgba(0, 0, 0, 0.7),
                  0 0 15px rgba(255, 255, 255, 0.2)
                `,
                color: '#ffffff'
              }}
            >
              Access millions of academic resources, research papers, and digital collections.
            </p>
          </div>

          {/* Search Section */}
          <div className="w-full px-3 xs:px-4 sm:px-6 lg:px-8 mb-4 xs:mb-5 sm:mb-6">
            <div className="max-w-xs xs:max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-3xl mx-auto">
              <div className="bg-white/95 backdrop-blur-lg shadow-2xl rounded-lg xs:rounded-xl lg:rounded-2xl border border-white/60 overflow-hidden ring-1 ring-gray-200/20">
                <div className="p-1 xs:p-1.5 sm:p-2 lg:p-2.5">
                  <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
                    <div className="flex items-center justify-center w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 flex-shrink-0">
                      <svg className="w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        placeholder="Search for journals, papers, articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && searchTerm.trim()) {
                            window.location.href = `/search/${encodeURIComponent(searchTerm.trim())}`;
                          }
                        }}
                        className="w-full px-1 xs:px-1.5 py-1 xs:py-1.5 sm:py-2 text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-0 placeholder-gray-500 text-xs xs:text-sm lg:text-base font-medium"
                        aria-label="Search for academic resources"
                      />
                    </div>
                    <div className="flex items-center flex-shrink-0">
                      <button
                        onClick={() => {
                          if (searchTerm.trim()) {
                            window.location.href = `/search/${encodeURIComponent(searchTerm.trim())}`;
                          }
                        }}
                        className="text-blue-600 hover:text-blue-700 active:text-blue-800 px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 sm:py-2 font-bold text-xs xs:text-sm lg:text-base transition-colors duration-200 whitespace-nowrap hover:bg-blue-50/50 rounded-md xs:rounded-lg"
                        aria-label="Submit search"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Advanced Search Button */}
              <div className="flex justify-center mt-1.5 xs:mt-2">
                <Link
                  href="/advanceSearch"
                  className="bg-white/90 hover:bg-white/95 backdrop-blur-lg text-gray-600 hover:text-gray-800 px-2.5 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2 rounded-md xs:rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 shadow-sm border border-white/40 inline-flex items-center gap-1 xs:gap-1.5"
                >
                  <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Advanced Search
                </Link>
              </div>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center max-w-sm sm:max-w-none mx-auto">
            <Link
              href="/advanceSearch"
              className="bg-white text-blue-600 hover:bg-blue-50 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-center text-sm"
            >
              🔍 Start Exploring
            </Link>
            <Link
              href="/subjects"
              className="bg-blue-600/20 backdrop-blur-sm text-white hover:bg-blue-600/30 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-white/20 text-center text-sm"
            >
              📚 Browse Subjects
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative z-10 bg-gradient-to-r from-cyan-50 to-cyan-100 py-6 xs:py-8 sm:py-10 md:py-12 lg:py-14">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8">
          {/* Mobile Layout - Single Column */}
          <div className="block sm:hidden space-y-3 xs:space-y-4 max-w-xs xs:max-w-sm mx-auto">
            {[
              { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", count: stats.loading ? formatNumber(animatedNumbers.articles) : "115L+", label: "Articles Available", gradient: "from-blue-500 to-blue-600", ring: "ring-blue-200/50" },
              { icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z", count: stats.loading ? formatNumber(animatedNumbers.journals) : "21K+", label: "Journals Available", gradient: "from-indigo-500 to-indigo-600", ring: "ring-indigo-200/50" },
              { icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", count: stats.loading ? formatNumber(animatedNumbers.books) : "0+", label: "Books Available", gradient: "from-emerald-500 to-emerald-600", ring: "ring-emerald-200/50" },
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", count: "24/7", label: "Always Available", gradient: "from-purple-500 to-purple-600", ring: "ring-purple-200/50" }
            ].map((stat, index) => (
              <div key={index} className="bg-white/90 backdrop-blur-md rounded-xl xs:rounded-2xl p-3 xs:p-4 shadow-xl border border-white/60 flex items-center gap-3 xs:gap-4 hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]">
                <div className={`bg-gradient-to-br ${stat.gradient} w-12 h-12 xs:w-14 xs:h-14 rounded-lg xs:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ring-2 ${stat.ring}`}>
                  <svg className="h-6 w-6 xs:h-7 xs:w-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xl xs:text-2xl font-bold text-gray-800 leading-tight">{stat.count}</div>
                  <div className="text-xs xs:text-sm text-gray-600 font-medium leading-relaxed">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet Layout - 2x2 Grid */}
          <div className="hidden sm:grid lg:hidden grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", count: stats.loading ? formatNumber(animatedNumbers.articles) : "115L+", label: "Articles", gradient: "from-blue-500 to-blue-600", ring: "ring-blue-200/50" },
              { icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z", count: stats.loading ? formatNumber(animatedNumbers.journals) : "21K+", label: "Journals", gradient: "from-indigo-500 to-indigo-600", ring: "ring-indigo-200/50" },
              { icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", count: stats.loading ? formatNumber(animatedNumbers.books) : "0+", label: "Books", gradient: "from-emerald-500 to-emerald-600", ring: "ring-emerald-200/50", colSpan: false },
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", count: "24/7", label: "Always Available", gradient: "from-purple-500 to-purple-600", ring: "ring-purple-200/50", colSpan: true }
            ].map((stat, index) => (
              <div key={index} className={`bg-white/90 backdrop-blur-md rounded-2xl p-5 md:p-6 shadow-xl border border-white/60 text-center hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${stat.colSpan ? 'col-span-2' : ''}`}>
                <div className={`bg-gradient-to-br ${stat.gradient} w-16 h-16 md:w-18 md:h-18 rounded-xl flex items-center justify-center shadow-lg mx-auto mb-4 ring-2 ${stat.ring}`}>
                  <svg className="h-8 w-8 md:h-9 md:w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gray-800 leading-tight mb-2">{stat.count}</div>
                <div className="text-base md:text-lg text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Desktop Layout - Horizontal Row */}
          <div className="hidden lg:flex justify-between items-center divide-x divide-gray-300">
            {[
              { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", count: stats.loading ? formatNumber(animatedNumbers.articles) : "115L+", label: "Articles", gradient: "from-blue-500 to-blue-600" },
              { icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z", count: stats.loading ? formatNumber(animatedNumbers.journals) : "21K+", label: "Journals", gradient: "from-indigo-500 to-indigo-600" },
              { icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", count: stats.loading ? formatNumber(animatedNumbers.books) : "0+", label: "Books", gradient: "from-emerald-500 to-emerald-600" },
              { icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", count: "24/7", label: "Always Available", gradient: "from-purple-500 to-purple-600" }
            ].map((stat, index) => (
              <div key={index} className="flex items-center gap-4 flex-1 justify-center px-4 first:pl-0 last:pr-0">
                <div className={`bg-gradient-to-br ${stat.gradient} w-16 h-16 xl:w-18 xl:h-18 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <svg className="h-8 w-8 xl:h-9 xl:w-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="text-3xl xl:text-4xl font-bold text-gray-800 leading-tight">{stat.count}</div>
                  <div className="text-base xl:text-lg text-gray-600 font-medium">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
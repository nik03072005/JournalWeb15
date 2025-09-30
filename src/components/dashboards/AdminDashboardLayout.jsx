'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FiMenu, FiX, FiHome, FiFolder, FiLogOut, FiChevronDown, FiChevronRight, FiBook, FiUsers, FiHelpCircle, FiTrendingUp, FiSettings } from 'react-icons/fi';

export const AdminSidebar = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  // Track expanded menu per level (ensures only one open per level without collapsing parent)
  const [expanded, setExpanded] = useState({ level1: null, level2: null });

  const handlelogout = async () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const menuItems = [
    { 
      path: '/dashboard/admin', 
      label: 'Home', 
      icon: <FiHome className="w-5 h-5" />
    },
    {
      
      label: 'Item',
      icon: <FiBook className="w-5 h-5" />,
      suboptions: [
        { path: '/dashboard/admin/item/additem', label: 'Add Item' },
        { path: '/dashboard/admin/item/manageJournals', label: 'Manage Item' },
        {
          path: '/dashboard/admin/item/setting',
          label: 'Settings',
          icon: <FiSettings className="w-4 h-4" />,
          suboptions: [
            { path: '/dashboard/admin/item/setting/manageSubject', label: 'Manage Subjects' },
            { path: '/dashboard/admin/item/setting/manageDepartment', label: 'Manage Departments' },
          ],
        },
      ],
    },
    {
      path: '/dashboard/admin/blog',
      label: 'News & Highlights',
      icon: <FiBook className="w-5 h-5" />,
      suboptions: [
        { path: '/dashboard/admin/blog/addblog', label: 'Add Highlights' },
        // { path: '/dashboard/admin/blog/manageblog', label: 'Manage Highlights' },
        { path: '/dashboard/admin/blog/editblog', label: 'Edit Highlights' },
      ],
    },
    {
      path: '/dashboard/admin/users',
      label: 'Users',
      icon: <FiUsers className="w-5 h-5" />,
      suboptions: [
        { path: '/dashboard/admin/users/addusers', label: 'Add User' },
        { path: '/dashboard/admin/users/manageusers', label: 'Manage User' },
      ],
    },
    {
      path: '/dashboard/admin/faq',
      label: 'FAQ Management',
      icon: <FiHelpCircle className="w-5 h-5" />,
      suboptions: [
        { path: '/dashboard/admin/faq/manage', label: 'Manage FAQs' },
        // { path: '/dashboard/admin/faq/stats', label: 'FAQ Statistics' },
      ],
    },
    {
      path: '/dashboard/admin/analytics',
      label: 'Analytics',
      icon: <FiTrendingUp className="w-5 h-5" />,
      suboptions: [
        { path: '/dashboard/admin/analytics/visitors', label: 'Visitor Analytics' },
        { path: '/dashboard/admin/analytics/popular', label: 'Popular Papers' },
      ],
    },
    { 
      path: '/dashboard/admin/logout', 
      label: 'Logout', 
      icon: <FiLogOut className="w-5 h-5" />
    },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // Toggle a top-level menu (level 1)
  const toggleLevel1 = (key) => {
    setIsOpen(true);
    setExpanded((prev) => ({
      level1: prev.level1 === key ? null : key,
      level2: null, // close any open child when switching parent
    }));
  };

  // Toggle a second-level submenu (level 2)
  const toggleLevel2 = (key) => {
    setIsOpen(true);
    setExpanded((prev) => ({
      ...prev,
      level2: prev.level2 === key ? null : key,
    }));
  };

  // Check if any suboption (or its children) is active
  const isSuboptionActive = (suboptions) => {
    return suboptions?.some((suboption) => {
      if (pathname === suboption.path) return true;
      if (suboption.suboptions) {
        return suboption.suboptions.some((child) => pathname === child.path);
      }
      return false;
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hamburger menu for mobile and tablet */}
      <button
        className="lg:hidden p-4 text-gray-700 hover:text-blue-600 focus:outline-none z-50 fixed top-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl"
        onClick={toggleSidebar}
      >
        {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-blue-900 to-slate-900 text-white shadow-2xl transform transition-all duration-300 ease-in-out backdrop-blur-xl border-r border-blue-800/30
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:min-h-screen`}
      >
        {/* Logo Header */}
        <div className="flex flex-col items-center justify-center h-32 border-b border-blue-800/30 bg-gradient-to-r from-blue-800/20 to-purple-800/20 relative px-4">
          <Link href="/dashboard/admin" className="group flex items-center transition-all duration-500 hover:scale-[1.02] mb-3">
            {/* Logo Container with Clean Background - Same as Navbar */}
            <div className="flex items-center gap-3 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg border border-white/20 group-hover:shadow-xl group-hover:bg-white transition-all duration-500">
              {/* Logo */}
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="Digital Library Logo" 
                  className="h-10 w-auto drop-shadow-sm transition-all duration-500" 
                />
              </div>
            </div>
          </Link>
          {/* Text below the logo */}
          <span className="text-white text-sm font-semibold tracking-wide">Digital Library</span>
          <button
            className="lg:hidden absolute top-4 right-4 text-white hover:text-blue-300 focus:outline-none transition-colors duration-200"
            onClick={toggleSidebar}
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>
          <nav className="mt-6 px-3">
            <ul className="space-y-2">
              {menuItems.map((item, idx) => {
              const level1Key = item.label || idx;
              return (
              <li key={level1Key}>
                {item.suboptions ? (
                  <div>
                    <button
                      onClick={() => toggleLevel1(level1Key)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-gray-200 hover:bg-gradient-to-r hover:from-blue-800/50 hover:to-purple-800/50 transition-all duration-300 rounded-xl group
                        ${isSuboptionActive(item.suboptions) ? 'bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow-lg' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-300 group-hover:text-white transition-colors duration-300">{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="text-blue-300 group-hover:text-white transition-all duration-300">
                        {expanded.level1 === level1Key ? (
                          <FiChevronDown className="w-5 h-5 transition-transform duration-300" />
                        ) : (
                          <FiChevronRight className="w-5 h-5 transition-transform duration-300" />
                        )}
                      </span>
                    </button>
                    {expanded.level1 === level1Key && (
                      <ul className="ml-6 mt-2 space-y-1">
                        {item.suboptions.map((suboption) => {
                          const level2Key = suboption.path || `${level1Key}-${suboption.label}`;
                          return (
                          <li key={level2Key}>
                            {suboption.suboptions ? (
                              <div>
                                <button
                                  onClick={() => toggleLevel2(level2Key)}
                                  className={`w-full flex items-center justify-between px-4 py-2 text-gray-300 hover:bg-blue-800/30 transition-all duration-200 text-sm rounded-lg group
                                    ${isSuboptionActive(suboption.suboptions) ? 'bg-blue-700/40 text-white' : ''}`}
                                >
                                  <div className="flex items-center space-x-2">
                                    {suboption.icon && <span className="text-blue-300 group-hover:text-white transition-colors duration-200">{suboption.icon}</span>}
                                    <span>{suboption.label}</span>
                                  </div>
                                  <span className="text-blue-300 group-hover:text-white transition-all duration-200">
                                    {expanded.level2 === level2Key ? (
                                      <FiChevronDown className="w-4 h-4 transition-transform duration-300" />
                                    ) : (
                                      <FiChevronRight className="w-4 h-4 transition-transform duration-300" />
                                    )}
                                  </span>
                                </button>
                                {expanded.level2 === level2Key && (
                                  <ul className="ml-6 mt-1 space-y-1">
                                    {suboption.suboptions.map((child) => (
                                      <li key={child.path}>
                                        <Link
                                          href={child.path}
                                          className={`flex items-center px-4 py-2 text-gray-300 hover:bg-blue-800/30 transition-all duration-200 text-sm rounded-lg group
                                            ${pathname === child.path ? 'bg-blue-700/50 text-white shadow-md border-l-4 border-blue-400' : ''}`}
                                          onClick={() => setIsOpen(false)}
                                        >
                                          <span className="w-6 h-6 flex items-center justify-center">
                                            <span className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-blue-300 transition-colors duration-200"></span>
                                          </span>
                                          <span className="ml-2">{child.label}</span>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ) : (
                              <Link
                                href={suboption.path}
                                className={`flex items-center px-4 py-2 text-gray-300 hover:bg-blue-800/30 transition-all duration-200 text-sm rounded-lg group
                                  ${pathname === suboption.path ? 'bg-blue-700/50 text-white shadow-md border-l-4 border-blue-400' : ''}`}
                                onClick={() => setIsOpen(false)}
                              >
                                <span className="w-6 h-6 flex items-center justify-center">
                                  <span className="w-2 h-2 bg-blue-400 rounded-full group-hover:bg-blue-300 transition-colors duration-200"></span>
                                </span>
                                <span className="ml-2">{suboption.label}</span>
                              </Link>
                            )}
                          </li>
                        );})}
                      </ul>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.path}
                    className={`flex items-center px-4 py-3 text-gray-200 hover:bg-gradient-to-r hover:from-blue-800/50 hover:to-purple-800/50 transition-all duration-300 rounded-xl group
                      ${pathname === item.path ? 'bg-gradient-to-r from-blue-700 to-purple-700 text-white shadow-lg' : ''}`}
                    onClick={item.onClick || (() => setIsOpen(false))}
                  >
                    <span className="mr-3 text-blue-300 group-hover:text-white transition-colors duration-300">{item.icon}</span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )}
              </li>
            );})}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 min-h-[calc(100vh-3rem)] border border-gray-200/50">
          {children}
        </div>
      </div>

      {/* Mobile/Tablet Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};
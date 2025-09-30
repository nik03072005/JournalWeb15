'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { User, Settings, Activity, LogOut, ChevronDown } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '@/utility/justAuth';

const ProfileDropdown = ({ onLogout }) => {
    const [isOpen, setIsOpen] = useState(false);
    const {user}=useAuthStore()
    const dropdownRef = useRef(null);

 

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const handleLogout = () => {
        setIsOpen(false);
        onLogout();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className=""
                title="Profile Menu"
            >
                {/* Profile Avatar */}
            
                
                {/* Desktop: Show name and chevron */}
                <div className="hidden md:flex items-center gap-1">
                    <span className="text-sm font-medium text-white">
                        {user?.firstName ? user.firstName : 'User'}
                    </span>
                    <ChevronDown 
                        size={16} 
                        className={`transition-transform text-white ${isOpen ? 'rotate-180' : ''}`} 
                    />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    {/* User Info Header */}
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                                {getInitials(user?.firstName || 'User')}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : 'User Name'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {user?.email || 'user@example.com'}
                                </p>
                                {user?.role && (
                                    <p className="text-xs text-blue-600 font-medium">
                                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                        <Link
                            {...user?.role === 'admin' ? { href: '/dashboard/admin' } : { href: '/dashboard' }}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <User size={16} className="text-gray-400" />
                            Dashboard
                        </Link>
                        
                       
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 py-2">
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                        >
                            <LogOut size={16} className="text-red-500" />
                            Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileDropdown;

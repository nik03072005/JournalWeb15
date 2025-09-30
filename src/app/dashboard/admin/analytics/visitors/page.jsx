'use client';
import React, { useState, useEffect } from 'react';
import MostVisitedPapers from '@/components/MostVisitedPapers';
import { FiTrendingUp, FiEye, FiUsers, FiFilter } from 'react-icons/fi';

const VisitorAnalyticsPage = () => {
    const [stats, setStats] = useState({
        totalViews: 0,
        uniqueVisitors: 0,
        papersTracked: 0,
        loading: true
    });
    const [selectedFilter, setSelectedFilter] = useState('all');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch most visited papers to calculate overall stats
                const response = await fetch(`/api/visitors?action=most-visited&limit=1000&paperType=all`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        const papers = data.data;
                        const totalViews = papers.reduce((sum, paper) => sum + paper.totalVisits, 0);
                        const uniqueVisitors = papers.reduce((sum, paper) => sum + paper.uniqueVisitors, 0);
                        const papersTracked = papers.length;

                        setStats({
                            totalViews,
                            uniqueVisitors,
                            papersTracked,
                            loading: false
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching stats:', error);
                setStats(prev => ({ ...prev, loading: false }));
            }
        };

        fetchStats();
    }, []);

    const handleFilterChange = (filterType) => {
        setSelectedFilter(filterType);
        setStats({
            totalViews: 0,
            uniqueVisitors: 0,
            papersTracked: 0,
            loading: true
        });
        fetchStats(filterType);
    };

    const formatNumber = (num) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    };
    return (
        <div className="h-screen bg-gray-50">
            <div className="h-screen overflow-y-auto">
                <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <FiTrendingUp className="w-6 h-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Visitor Analytics</h1>
                </div>
                <p className="text-gray-600">
                    Track and analyze visitor statistics for all papers and articles in your repository.
                </p>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Views</p>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                                        Loading...
                                    </div>
                                ) : (
                                    formatNumber(stats.totalViews)
                                )}
                            </div>
                        </div>
                        <FiEye className="w-8 h-8 text-blue-600" />
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Unique Visitors</p>
                            <div className="text-2xl font-bold text-green-600">
                                {stats.loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mr-2"></div>
                                        Loading...
                                    </div>
                                ) : (
                                    formatNumber(stats.uniqueVisitors)
                                )}
                            </div>
                        </div>
                        <FiUsers className="w-8 h-8 text-green-600" />
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Papers Tracked</p>
                            <div className="text-2xl font-bold text-purple-600">
                                {stats.loading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
                                        Loading...
                                    </div>
                                ) : (
                                    formatNumber(stats.papersTracked)
                                )}
                            </div>
                        </div>
                        <FiFilter className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Filter Options */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Options</h3>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="all-papers"
                            name="paper-type"
                            value="all"
                            checked={selectedFilter === 'all'}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="text-blue-600"
                        />
                        <label htmlFor="all-papers" className="text-sm font-medium text-gray-700">
                            All Papers
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="local-papers"
                            name="paper-type"
                            value="local"
                            checked={selectedFilter === 'local'}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="text-blue-600"
                        />
                        <label htmlFor="local-papers" className="text-sm font-medium text-gray-700">
                            Local Papers Only
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="doaj-papers"
                            name="paper-type"
                            value="doaj"
                            checked={selectedFilter === 'doaj'}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="text-blue-600"
                        />
                        <label htmlFor="doaj-papers" className="text-sm font-medium text-gray-700">
                            DOAJ Articles Only
                        </label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <input
                            type="radio"
                            id="doab-papers"
                            name="paper-type"
                            value="doab"
                            checked={selectedFilter === 'doab'}
                            onChange={(e) => handleFilterChange(e.target.value)}
                            className="text-blue-600"
                        />
                        <label htmlFor="doab-papers" className="text-sm font-medium text-gray-700">
                            DOAB Books Only
                        </label>
                    </div>
                </div>
            </div>

            {/* Most Visited Papers */}
            <MostVisitedPapers limit={20} paperType={selectedFilter} />

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">How Visitor Tracking Works</h3>
                <ul className="text-sm text-blue-700 space-y-2">
                    <li>• Each time a user visits a paper detail page, it counts as a view</li>
                    <li>• Unique visitors are tracked by IP address to prevent duplicate counting</li>
                    <li>• Local papers, DOAJ articles, and DOAB books are tracked separately</li>
                    <li>• Analytics data is updated in real-time</li>
                    <li>• Use this data to identify popular content and improve your repository</li>
                </ul>
            </div>
        </div>
        </div>
        </div>
    );
};

export default VisitorAnalyticsPage;

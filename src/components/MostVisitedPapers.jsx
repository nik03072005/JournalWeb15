'use client';
import React, { useState, useEffect } from 'react';
import { FiEye, FiUsers, FiTrendingUp, FiExternalLink } from 'react-icons/fi';

const MostVisitedPapers = ({ limit = 10, paperType = 'all' }) => {
    const [mostVisited, setMostVisited] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMostVisited = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/visitors?action=most-visited&limit=${limit}&paperType=${paperType}`);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setMostVisited(data.data);
                    } else {
                        setError(data.message);
                    }
                } else {
                    setError('Failed to fetch data');
                }
            } catch (error) {
                console.error('Error fetching most visited papers:', error);
                setError('Failed to load most visited papers');
            } finally {
                setLoading(false);
            }
        };

        fetchMostVisited();
    }, [limit, paperType]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleViewPaper = (paperId, paperType) => {
        let basePath;
        if (paperType === 'doaj') {
            basePath = '/doaj/';
        } else if (paperType === 'doaj-journal') {
            basePath = '/doaj/journal/';
        } else if (paperType === 'doab') {
            basePath = '/doab/';
        } else {
            basePath = '/paper/';
        }
        window.open(`${basePath}${paperId}`, '_blank');
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <FiTrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Most Visited Papers</h3>
                </div>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <FiTrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">Most Visited Papers</h3>
                </div>
                <div className="text-center py-8">
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
                <FiTrendingUp className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">Most Visited Papers</h3>
            </div>

            {mostVisited.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-gray-600">No visitor data available</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {mostVisited.map((paper, index) => (
                        <div key={`${paper.paperId}-${paper.paperType}`} className="border-l-4 border-blue-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="text-lg font-bold text-blue-600">#{index + 1}</span>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                            paper.paperType === 'doaj' 
                                                ? 'bg-green-100 text-green-800' 
                                                : paper.paperType === 'doaj-journal'
                                                ? 'bg-cyan-100 text-cyan-800'
                                                : paper.paperType === 'doab'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-blue-100 text-blue-800'
                                        }`}>
                                            {paper.paperType === 'doaj' ? 'DOAJ Article' : 
                                             paper.paperType === 'doaj-journal' ? 'DOAJ Journal' :
                                             paper.paperType === 'doab' ? 'DOAB Book' : 
                                             'Local'}
                                        </span>
                                    </div>
                                    
                                    <div className="text-sm text-gray-600 mb-2">
                                        <strong>Paper ID:</strong> {paper.paperId}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <FiEye className="w-4 h-4 text-gray-500" />
                                            <span>
                                                <strong>{paper.totalVisits.toLocaleString()}</strong> views
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <FiUsers className="w-4 h-4 text-gray-500" />
                                            <span>
                                                <strong>{paper.uniqueVisitors.toLocaleString()}</strong> unique
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-xs text-gray-500 mt-2">
                                        Last viewed: {formatDate(paper.lastVisited)}
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleViewPaper(paper.paperId, paper.paperType)}
                                    className="ml-4 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                    title="View Paper"
                                >
                                    <FiExternalLink className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {mostVisited.length > 0 && (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                    <div className="text-sm text-gray-600 space-y-1">
                        <div>Total papers tracked: <strong>{mostVisited.length}</strong></div>
                        <div>Total views: <strong>{mostVisited.reduce((sum, paper) => sum + paper.totalVisits, 0).toLocaleString()}</strong></div>
                        <div>Total unique visitors: <strong>{mostVisited.reduce((sum, paper) => sum + paper.uniqueVisitors, 0).toLocaleString()}</strong></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MostVisitedPapers;

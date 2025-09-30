import React, { useState, useEffect } from 'react';
import { FiEye, FiUsers, FiClock } from 'react-icons/fi';

const VisitorCounter = ({ paperId, paperType = 'local', className = '' }) => {
    const [visitorStats, setVisitorStats] = useState({
        totalVisits: 0,
        uniqueVisitors: 0,
        lastVisited: null,
        loading: true
    });

    useEffect(() => {
        const recordVisitAndGetStats = async () => {
            try {
                // Record the visit
                await fetch('/api/visitors', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        paperId,
                        paperType
                    })
                });

                // Get updated stats
                const response = await fetch(`/api/visitors?paperId=${paperId}&paperType=${paperType}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setVisitorStats({
                            ...data.data,
                            loading: false
                        });
                    }
                }
            } catch (error) {
                console.error('Error tracking visitor:', error);
                setVisitorStats(prev => ({ ...prev, loading: false }));
            }
        };

        if (paperId) {
            recordVisitAndGetStats();
        }
    }, [paperId, paperType]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (visitorStats.loading) {
        return (
            <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
                <FiEye className="w-4 h-4" />
                <span className="text-sm">Loading...</span>
            </div>
        );
    }

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Total Visits */}
            <div className="flex items-center space-x-2 text-gray-600">
                <FiEye className="w-4 h-4" />
                <span className="text-sm font-medium">
                    {visitorStats.totalVisits.toLocaleString()} 
                    {visitorStats.totalVisits === 1 ? ' view' : ' views'}
                </span>
            </div>

            {/* Unique Visitors */}
            <div className="flex items-center space-x-2 text-gray-600">
                <FiUsers className="w-4 h-4" />
                <span className="text-sm">
                    {visitorStats.uniqueVisitors.toLocaleString()} 
                    {visitorStats.uniqueVisitors === 1 ? ' unique visitor' : ' unique visitors'}
                </span>
            </div>

            {/* Last Visited */}
            {visitorStats.lastVisited && (
                <div className="flex items-center space-x-2 text-gray-500">
                    <FiClock className="w-4 h-4" />
                    <span className="text-xs">
                        Last viewed: {formatDate(visitorStats.lastVisited)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default VisitorCounter;

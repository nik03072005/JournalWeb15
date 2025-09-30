import React, { useState, useEffect } from 'react';
import { FiEye } from 'react-icons/fi';

const VisitorBadge = ({ paperId, paperType = 'local', className = '' }) => {
    const [viewCount, setViewCount] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchViewCount = async () => {
            try {
                const response = await fetch(`/api/visitors?paperId=${paperId}&paperType=${paperType}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success) {
                        setViewCount(data.data.totalVisits);
                    }
                }
            } catch (error) {
                console.error('Error fetching view count:', error);
            } finally {
                setLoading(false);
            }
        };

        if (paperId) {
            fetchViewCount();
        }
    }, [paperId, paperType]);

    if (loading) {
        return (
            <div className={`inline-flex items-center space-x-1 text-gray-400 ${className}`}>
                <FiEye className="w-3 h-3" />
                <span className="text-xs">...</span>
            </div>
        );
    }

    if (viewCount === null || viewCount === 0) {
        return null;
    }

    const formatCount = (count) => {
        if (count >= 1000) {
            return `${(count / 1000).toFixed(1)}k`;
        }
        return count.toString();
    };

    return (
        <div className={`inline-flex items-center space-x-1 text-gray-600 bg-gray-100 px-2 py-1 rounded-full ${className}`}>
            <FiEye className="w-3 h-3" />
            <span className="text-xs font-medium">{formatCount(viewCount)}</span>
        </div>
    );
};

export default VisitorBadge;

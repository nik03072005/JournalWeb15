'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar2 from '@/components/Navbar2';
import { 
    Activity, 
    BookOpen, 
    FileText, 
    Book,
    Clock,
    Filter,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Eye
} from 'lucide-react';

const ActivityPage = () => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [filterType, setFilterType] = useState('all');
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await axios.get('/api/auth/token');
                if (!response.data.user) {
                    router.push('/auth');
                }
            } catch (error) {
                router.push('/auth');
            }
        };

        checkAuth();
    }, [router]);

    useEffect(() => {
        fetchActivities();
    }, [currentPage]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/api/user/activity?page=${currentPage}&limit=20`);
            
            if (response.data.success) {
                setActivities(response.data.data.activities);
                setPagination(response.data.data.pagination);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getItemTypeIcon = (itemType) => {
        switch (itemType) {
            case 'doaj':
                return <FileText size={20} className="text-green-600" />;
            case 'doab':
                return <Book size={20} className="text-purple-600" />;
            case 'local':
            case 'journal':
            case 'paper':
                return <BookOpen size={20} className="text-blue-600" />;
            default:
                return <FileText size={20} className="text-gray-600" />;
        }
    };

    const getItemTypeBadge = (itemType) => {
        const badges = {
            doaj: 'bg-green-100 text-green-800 border-green-200',
            doab: 'bg-purple-100 text-purple-800 border-purple-200',
            local: 'bg-blue-100 text-blue-800 border-blue-200',
            journal: 'bg-blue-100 text-blue-800 border-blue-200',
            paper: 'bg-blue-100 text-blue-800 border-blue-200',
            book: 'bg-purple-100 text-purple-800 border-purple-200'
        };
        
        return badges[itemType] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredActivities = activities.filter(activity => {
        if (filterType === 'all') return true;
        return activity.itemType === filterType;
    });

    const uniqueTypes = [...new Set(activities.map(a => a.itemType))];

    return (
        <>
            <Navbar2 />
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                <ChevronLeft size={20} />
                                Back to Dashboard
                            </button>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <Activity className="w-8 h-8 text-blue-600" />
                            Your Activity History
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Track all the articles, books, and papers you've viewed.
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <div className="flex items-center gap-4">
                            <Filter className="w-5 h-5 text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">Filter by type:</span>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setFilterType('all')}
                                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                        filterType === 'all' 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                                    }`}
                                >
                                    All ({activities.length})
                                </button>
                                {uniqueTypes.map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFilterType(type)}
                                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                            filterType === type
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : `${getItemTypeBadge(type)} hover:opacity-80`
                                        }`}
                                    >
                                        {type.toUpperCase()} ({activities.filter(a => a.itemType === type).length})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Activity List */}
                    <div className="bg-white rounded-lg shadow-md">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Activity Timeline ({filteredActivities.length} items)
                            </h3>
                        </div>
                        
                        <div className="p-6">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">Loading activities...</p>
                                </div>
                            ) : filteredActivities.length === 0 ? (
                                <div className="text-center py-12">
                                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600 text-lg">No activities found.</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        {filterType === 'all' 
                                            ? 'Start exploring articles and books to see your activity here.'
                                            : `No ${filterType} activities found. Try a different filter.`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredActivities.map((activity, index) => (
                                        <div key={`${activity._id}-${index}`} className="group border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getItemTypeIcon(activity.itemType)}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getItemTypeBadge(activity.itemType)}`}>
                                                            {activity.itemType.toUpperCase()}
                                                        </span>
                                                        <span className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Clock size={14} />
                                                            {formatDate(activity.timestamp)}
                                                        </span>
                                                        <span className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Eye size={14} />
                                                            Viewed
                                                        </span>
                                                    </div>
                                                    
                                                    <h4 className="text-lg font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                                        {activity.itemTitle}
                                                    </h4>
                                                    
                                                    <div className="flex items-center justify-between mt-4">
                                                        <div className="text-sm text-gray-500">
                                                            ID: {activity.itemId}
                                                        </div>
                                                        <a 
                                                            href={activity.itemUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                                                        >
                                                            View Item
                                                            <ChevronRight size={16} />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="p-6 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing page {pagination.currentPage} of {pagination.totalPages} 
                                        ({pagination.totalActivities} total activities)
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={!pagination.hasPrevPage}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                        >
                                            Previous
                                        </button>
                                        
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                                                const pageNum = i + 1;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => setCurrentPage(pageNum)}
                                                        className={`px-3 py-2 border rounded-md text-sm transition-colors ${
                                                            pageNum === currentPage
                                                                ? 'bg-blue-600 text-white border-blue-600'
                                                                : 'border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        <button
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={!pagination.hasNextPage}
                                            className="px-3 py-2 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ActivityPage;
